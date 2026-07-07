import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    fromId: { type: String, required: true, index: true },
    fromName: { type: String, required: true, trim: true },
    toId: { type: String, required: true, index: true },
    toName: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    channel: { type: String, enum: ["hr", "manager", "team", "employee"], default: "employee" },
    read: { type: Boolean, default: false },
    sentOn: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

messageSchema.virtual("id").get(function getId() {
  return this._id.toString();
});

messageSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    if (ret.sentOn?.toISOString) {
      ret.sentOn = ret.sentOn.toISOString();
    }
    return ret;
  },
});

export const Message = mongoose.model("Message", messageSchema);
