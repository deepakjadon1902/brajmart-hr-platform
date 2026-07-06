import mongoose from "mongoose";
import { success } from "../utils/http.js";

export function health(_req, res) {
  return success(res, {
    service: "brajmart-hr-api",
    status: "ok",
    uptime: process.uptime(),
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
}
