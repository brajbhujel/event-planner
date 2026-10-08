import { Router } from "express";
import { EventsController } from "../controllers/events.controller";
import { authGuard } from "../middleware/auth";

export const metaRoutes = Router();

metaRoutes.use(authGuard);

metaRoutes.get("/dashboard", EventsController.dashboard);
metaRoutes.get("/tags", EventsController.tags);
