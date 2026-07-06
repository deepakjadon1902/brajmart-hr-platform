import express from "express";
import { env } from "./config/env.js";
import { applySecurity } from "./middleware/security.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { apiRoutes } from "./routes/index.js";

export function createApp() {
  const app = express();

  applySecurity(app);

  app.get("/", (_req, res) => {
    res.json({ success: true, service: "brajmart-hr-api", version: env.API_VERSION });
  });

  app.use(`/api/${env.API_VERSION}`, apiRoutes);
  app.use("/api", apiRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
