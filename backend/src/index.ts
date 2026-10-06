import { createServer } from "node:http";
import { app } from "./app";
import { env } from "./config/env";
import { db, testDBConnection } from "./config/db";
import { logger } from "./providers/logger";

const server = createServer(app);

(async () => {
  try {
    await testDBConnection();
    server.listen(env.PORT, () => {
      logger.info("Starting server …");
      logger.info(`API listening on http://localhost:${env.PORT}`);
      logger.info(`Swagger docs at http://localhost:${env.PORT}/api/docs`);
    });
  } catch (err) {
    logger.error("Failed to start server", {
      message: err instanceof Error ? err.message : "Unexpected startup error",
      stack: err instanceof Error ? err.stack : err,
    });
    process.exit(1);
  }
})();

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => {
    logger.info(`Shutting down (${signal})`);
    server.close(() => {
      void db.destroy().then(() => process.exit(0));
    });
  });
}
