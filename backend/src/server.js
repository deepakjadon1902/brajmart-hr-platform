import { createServer } from "node:http";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import { createApp } from "./app.js";
import { ensurePermanentAccounts } from "./services/bootstrap.service.js";
import { startTaskReminderScheduler } from "./services/task-notifications.service.js";
import { AttendanceRecord } from "./models/PortalData.js";

async function start() {
  await connectDatabase();
  // This constraint is required in production too, where automatic indexing is disabled.
  await AttendanceRecord.createIndexes();
  await ensurePermanentAccounts();

  const app = createApp();
  const server = createServer(app);
  const stopTaskReminders = startTaskReminderScheduler();

  server.listen(env.PORT, () => {
    console.info(`BrajMart HR API listening on port ${env.PORT}`);
  });

  const shutdown = (signal) => {
    console.info(`${signal} received. Closing API server.`);
    stopTaskReminders();
    server.close(() => process.exit(0));
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

start().catch((error) => {
  console.error("Unable to start backend", error);
  process.exit(1);
});
