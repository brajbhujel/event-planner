import type { Request, Response } from "express";
import { z } from "zod";
import {
  eventSchema,
  eventPatchSchema,
  listSchema,
  rsvpSchema,
} from "../validations";
import * as eventsService from "../services/events";

export class EventsController {
  static async list(req: Request, res: Response) {
    res.json(
      await eventsService.listEvents(
        listSchema.parse(req.query),
        req.user.id,
      ),
    );
  }

  static async create(req: Request, res: Response) {
    const event = await eventsService.createEvent(
      eventSchema.parse(req.body),
      req.user.id,
    );
    res.status(201).json({ data: event });
  }

  static async get(req: Request, res: Response) {
    res.json({
      data: await eventsService.getEvent(
        z.uuid().parse(req.params.id),
        req.user.id,
      ),
    });
  }

  static async update(req: Request, res: Response) {
    res.json({
      data: await eventsService.updateEvent(
        z.uuid().parse(req.params.id),
        eventPatchSchema.parse(req.body),
        req.user.id,
      ),
    });
  }

  static async remove(req: Request, res: Response) {
    await eventsService.deleteEvent(
      z.uuid().parse(req.params.id),
      req.user.id,
    );
    res.status(204).end();
  }

  static async rsvp(req: Request, res: Response) {
    const id = z.uuid().parse(req.params.id);
    const { status } = rsvpSchema.parse(req.body);
    res.json({
      data: await eventsService.setRsvp(id, req.user.id, status),
    });
  }

  static async dashboard(req: Request, res: Response) {
    res.json({ data: await eventsService.dashboard(req.user.id) });
  }

  static async tags(req: Request, res: Response) {
    res.json({ data: await eventsService.listTags(req.user.id) });
  }
}
