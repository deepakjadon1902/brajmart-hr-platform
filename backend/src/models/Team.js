import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    companyId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);
teamSchema.index({ companyId: 1, managerId: 1 });
teamSchema.virtual("id").get(function () {
  return this._id.toString();
});
teamSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const Team = mongoose.model("Team", teamSchema);
