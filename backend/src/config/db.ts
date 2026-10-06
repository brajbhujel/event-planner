import knex from "knex";
import { env } from "./env";
import { logger } from "../providers/logger";

export const db = knex({
  client: "pg",
  connection: env.DATABASE_URL,
  pool: { min: 0, max: 10 },
});

export async function testDBConnection() {
  await db.raw("select 1");
  logger.info("Database connection OK");
}
