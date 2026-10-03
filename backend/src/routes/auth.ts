import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import {
  loginSchema,
  signupSchema,
  profileSchema,
  type User,
} from "../validations";
import { db } from "../config/db";
import { env } from "../config/env";
import { authGuard } from "../middleware/auth";
import { AppError } from "../middleware/error";

export const authRoutes = Router();

async function createSession(user: User) {
  const id = randomUUID();
  const expiresIn = 8 * 60 * 60;
  await db("sessions").where("expires_at", "<", db.fn.now()).delete();
  await db("sessions").insert({
    id,
    user_id: user.id,
    expires_at: new Date(Date.now() + expiresIn * 1000),
  });
  const token = jwt.sign({}, env.JWT_SECRET, {
    algorithm: "HS256",
    subject: user.id,
    jwtid: id,
    expiresIn,
  });
  return { user, token, expiresIn };
}

authRoutes.post("/signup", async (req, res) => {
  const input = signupSchema.parse(req.body);
  const [user] = await db("users")
    .insert({
      id: randomUUID(),
      name: input.name,
      email: input.email,
      password_hash: await bcrypt.hash(input.password, 10),
    })
    .returning(["id", "name", "email"]);
  res.status(201).json({ data: await createSession(user) });
});

authRoutes.post("/login", async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await db("users").where({ email: input.email }).first();
  if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
    throw new AppError(401, "Email or password is incorrect.");
  }
  res.json({
    data: await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
    }),
  });
});

authRoutes.get("/me", authGuard, (req, res) => {
  res.json({ data: req.user });
});

authRoutes.patch("/me", authGuard, async (req, res) => {
  const input = profileSchema.parse(req.body);
  const [user] = await db("users")
    .where({ id: req.user.id })
    .update({ name: input.name })
    .returning(["id", "name", "email"]);
  res.json({ data: user });
});

authRoutes.post("/logout", authGuard, async (req, res) => {
  await db("sessions").where({ id: req.sessionId }).delete();
  res.status(204).end();
});
