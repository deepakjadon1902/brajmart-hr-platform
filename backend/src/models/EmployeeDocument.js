import mongoose from "mongoose";

const employeeDocumentSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    employeeName: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 180 },
    type: { type: String, required: true, trim: true, maxlength: 80 },
    mimeType: { type: String, trim: true, maxlength: 120 },
    category: { type: String, enum: ["document", "image"], default: "document", index: true },
    size: { type: String, default: "Uploaded" },
    originalSize: { type: String, default: "Uploaded" },
    originalBytes: { type: Number, min: 0, default: 0 },
    optimizedBytes: { type: Number, min: 0, default: 0 },
    optimized: { type: Boolean, default: false },
    optimization: {
      convertedTo: { type: String, default: null },
      originalBytes: { type: Number, min: 0, default: 0 },
      optimizedBytes: { type: Number, min: 0, default: 0 },
      savedBytes: { type: Number, min: 0, default: 0 },
      savedPercent: { type: Number, min: 0, max: 100, default: 0 },
      width: Number,
      height: Number,
    },
    fileUrl: { type: String, trim: true },
    imagekitFileId: { type: String, trim: true },
    uploadedOn: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["submitted", "verified", "needs-update"],
      default: "submitted",
      index: true,
    },
  },
  { timestamps: true },
);

employeeDocumentSchema.virtual("id").get(function getId() {
  return this._id.toString();
});

employeeDocumentSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    ret.uploadedOn = ret.uploadedOn?.toISOString?.().slice(0, 10) ?? ret.uploadedOn;
    return ret;
  },
});

export const EmployeeDocument = mongoose.model("EmployeeDocument", employeeDocumentSchema);
