import crypto from "node:crypto";
import mongoose from "mongoose";

const passwordResetOtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otpHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    verifiedAt: Date,
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

passwordResetOtpSchema.statics.hashOtp = function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

export const PasswordResetOtp = mongoose.model("PasswordResetOtp", passwordResetOtpSchema);
