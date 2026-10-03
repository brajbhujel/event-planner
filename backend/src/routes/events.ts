import { Router } from "express";
import { z } from "zod";
import {
  eventSchema,
  eventPatchSchema,
  listSchema,
  rsvpSchema,
} from "../validations";
import { authGuard } from "../middleware/auth";
import * as events from "../services/events";

export const eventRoutes = Router();
eventRoutes.use(authGuard);

eventRoutes.get("/", async (req, res) => {
  res.json(await events.listEvents(listSchema.parse(req.query), req.user.id));
});

eventRoutes.post("/", async (req, res) => {
  const event = await events.createEvent(
    eventSchema.parse(req.body),
    req.user.id,
  );
  res.status(201).json({ data: event });
});

eventRoutes.get("/:id", async (req, res) => {
  res.json({
    data: await events.getEvent(z.uuid().parse(req.params.id), req.user.id),
  });
});

eventRoutes.patch("/:id", async (req, res) => {
  res.json({
    data: await events.updateEvent(
      z.uuid().parse(req.params.id),
      eventPatchSchema.parse(req.body),
      req.user.id,
    ),
  });
});

eventRoutes.delete("/:id", async (req, res) => {
  await events.deleteEvent(z.uuid().parse(req.params.id), req.user.id);
  res.status(204).end();
});

eventRoutes.put("/:id/rsvp", async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const { status } = rsvpSchema.parse(req.body);
  res.json({
    data: await events.setRsvp(id, req.user.id, status),
  });
});
