import { app } from "./app";
import { db } from "./config/db";
import { env } from "./config/env";

const server = app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => {
    server.close(() => {
      void db.destroy().then(() => process.exit(0));
    });
  });
}
