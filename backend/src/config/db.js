import mongoose from "mongoose";
import { env } from "./env.js";
import { AppError } from "../utils/AppError.js";

mongoose.set("strictQuery", true);

function describeMongoAuthFix(error) {
  if (error?.code !== 8000 && !String(error?.message || "").includes("bad auth")) return null;

  return [
    "MongoDB Atlas authentication failed.",
    "Check backend/.env MONGODB_URI:",
    "1. Use a Database Access user, not your Atlas login email/password.",
    "2. URL-encode special characters in the password. For example @ becomes %40 and # becomes %23.",
    "3. Confirm the user has readWrite access to the database in the URI.",
    "4. Confirm Network Access allows your current IP address.",
    "5. If you changed the password in Atlas, update MONGODB_URI and restart npm run dev.",
  ].join(" ");
}

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  mongoose.connection.on("connected", () => {
    console.info("MongoDB connected");
  });

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error", error);
  });

  try {
    return await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: env.NODE_ENV !== "production",
    });
  } catch (error) {
    const authHelp = describeMongoAuthFix(error);
    if (authHelp) throw new AppError(authHelp, 500);
    throw error;
  }
}
