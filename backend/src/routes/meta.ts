import { Router } from "express";
import { db } from "../config/db";
import { authGuard } from "../middleware/auth";
import { dashboard, visibleEvents } from "../services/events";

export const metaRoutes = Router();
metaRoutes.use(authGuard);

metaRoutes.get("/dashboard", async (req, res) => {
  res.json({ data: await dashboard(req.user.id) });
});

metaRoutes.get("/tags", async (req, res) => {
  const tags = await db("tags as t")
    .join("event_tags as et", "et.tag_id", "t.id")
    .whereIn("et.event_id", visibleEvents(req.user.id).select("e.id"))
    .distinct("t.name")
    .orderBy("t.name");
  res.json({ data: tags.map((t) => t.name) });
});
