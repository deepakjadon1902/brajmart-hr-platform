import { createServer } from "node:http";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import { createApp } from "./app.js";
import { seedDemoUsers } from "./services/bootstrap.service.js";

async function start() {
  await connectDatabase();
  await seedDemoUsers();

  const app = createApp();
  const server = createServer(app);

  server.listen(env.PORT, () => {
    console.info(`BrajMart HR API listening on port ${env.PORT}`);
  });

  const shutdown = (signal) => {
    console.info(`${signal} received. Closing API server.`);
    server.close(() => process.exit(0));
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

start().catch((error) => {
  console.error("Unable to start backend", error);
  process.exit(1);
});
