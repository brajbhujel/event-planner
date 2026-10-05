import express from "express";
import helmet from "helmet";
import fs from "node:fs";
import path from "node:path";
import swaggerUi from "swagger-ui-express";
import { db } from "./config/db";
import { authRoutes } from "./routes/auth";
import { eventRoutes } from "./routes/events";
import { authGuard } from "./middleware/auth";
import { errorHandler } from "./middleware/error";
import { dashboard, visibleEvents } from "./services/events";

const openapi = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../openapi.json"), "utf8"),
) as object;

export const app = express();
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "32kb" }));

app.get("/health", async (_req, res) => {
  await db.raw("select 1");
  res.json({ status: "ok" });
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi));
app.get("/api/openapi.json", (_req, res) => {
  res.type("json").send(openapi);
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/events", eventRoutes);

app.get("/api/v1/dashboard", authGuard, async (req, res) => {
  res.json({ data: await dashboard(req.user.id) });
});

app.get("/api/v1/tags", authGuard, async (req, res) => {
  const tags = await db("tags as t")
    .join("event_tags as et", "et.tag_id", "t.id")
    .whereIn("et.event_id", visibleEvents(req.user.id).select("e.id"))
    .distinct("t.name")
    .orderBy("t.name");
  res.json({ data: tags.map((t) => t.name) });
});

app.use((_req, res) => {
  res.status(404).json({ error: { message: "Route not found." } });
});
app.use(errorHandler);
