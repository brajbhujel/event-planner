import { Router } from "express";
import { EventsController } from "../controllers/events.controller";
import { authGuard } from "../middleware/auth";

export const eventRoutes = Router();

eventRoutes.use(authGuard);

eventRoutes.get("/", EventsController.list);
eventRoutes.post("/", EventsController.create);
eventRoutes.get("/:id", EventsController.get);
eventRoutes.patch("/:id", EventsController.update);
eventRoutes.delete("/:id", EventsController.remove);
eventRoutes.put("/:id/rsvp", EventsController.rsvp);
