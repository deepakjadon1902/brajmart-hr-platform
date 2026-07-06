import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import mongoose from "mongoose";

export const ROLES = ["employee", "hr", "team-manager", "super-admin", "digital-marketing"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
      index: true,
    },
    passwordHash: { type: String, select: false },
    role: { type: String, enum: ROLES, required: true, default: "employee", index: true },
    companyId: { type: String, default: "c1", index: true },
    department: { type: String, trim: true, maxlength: 100 },
    designation: { type: String, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 32 },
    location: { type: String, trim: true, maxlength: 120 },
    manager: { type: String, trim: true, maxlength: 120 },
    salary: { type: Number, min: 0, default: 0 },
    baseSalary: { type: Number, min: 0, default: 0 },
    monthlyCtc: { type: Number, min: 0, default: 0 },
    annualCtc: { type: Number, min: 0, default: 0 },
    bankAccount: { type: String, trim: true, maxlength: 80 },
    avatar: { type: String, trim: true },
    googleId: { type: String, sparse: true, index: true },
    status: { type: String, enum: ["active", "inactive", "on-leave"], default: "active" },
    joinDate: { type: Date, default: Date.now },
    refreshTokenHash: { type: String, select: false },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

userSchema.virtual("id").get(function getId() {
  return this._id.toString();
});

userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.passwordHash;
    delete ret.refreshTokenHash;
    return ret;
  },
});

userSchema.methods.setPassword = async function setPassword(password) {
  this.passwordHash = await bcrypt.hash(password, 10);
};

userSchema.methods.verifyPassword = async function verifyPassword(password) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.setRefreshToken = async function setRefreshToken(refreshToken) {
  this.refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
};

userSchema.methods.verifyRefreshToken = async function verifyRefreshToken(refreshToken) {
  if (!this.refreshTokenHash) return false;
  return crypto.createHash("sha256").update(refreshToken).digest("hex") === this.refreshTokenHash;
};

export const User = mongoose.model("User", userSchema);
