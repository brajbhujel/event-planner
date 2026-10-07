import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

export default function cors(req: Request, res: Response, next: NextFunction) {
    const allowedOrigins = env.CORS_ALLOWED_ORIGINS
        .split(",")
        .map((origin) => origin.trim());

    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
    }

    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, Client-ID",
    );
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );

    if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
    }

    next();
}