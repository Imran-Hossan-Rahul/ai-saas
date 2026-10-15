import mongoose, { Schema } from "mongoose";

const documentSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["proposal", "contract"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["draft", "sent", "viewed", "signed", "declined"],
      default: "draft",
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: "ClientProfile",
      required: true,
      index: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    signatures: [
      {
        signerName: { type: String, required: true },
        ipAddress: { type: String },
        signedAt: { type: Date, default: Date.now },
        signatureDataUrl: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

const Document = mongoose.models.Document || mongoose.model("Document", documentSchema, "documents");
export default Document;
