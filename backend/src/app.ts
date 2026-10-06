import express, { type Express } from "express";
import cors from "./middleware/cors.middleware";
import helmet from "helmet";
import fs from "node:fs";
import path from "node:path";
import swaggerUi from "swagger-ui-express";
import { authRoutes } from "./routes/auth";
import { eventRoutes } from "./routes/events";
import { metaRoutes } from "./routes/meta";
import { requestMiddleware } from "./middleware/request";
import { notFoundHandler } from "./middleware/notFound";
import { errorHandler } from "./middleware/error";
import { db } from "./config/db";

const openapi = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../openapi.json"), "utf8"),
) as object;

const app: Express = express();

app.disable("x-powered-by");
app.use(cors);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "32kb" }));
app.use(requestMiddleware);

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
app.use("/api/v1", metaRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
