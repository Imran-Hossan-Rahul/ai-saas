import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    // A conversation thread is scoped to a project
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxLength: 5000,
    },
    // For file attachments (URL from file storage)
    attachmentUrl: {
      type: String,
    },
    attachmentName: {
      type: String,
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      }
    ],
  },
  { timestamps: true }
);

// Index for fast project-scoped queries sorted by time
messageSchema.index({ project: 1, createdAt: 1 });

const Message = mongoose.models.Message || mongoose.model("Message", messageSchema, "messages");
export default Message;
