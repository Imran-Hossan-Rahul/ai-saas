import mongoose, { Schema } from "mongoose";

const invoiceSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "ClientProfile",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "cancelled"],
      default: "pending",
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    pdfUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

const Invoice =
  mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema, "invoices");

export default Invoice;