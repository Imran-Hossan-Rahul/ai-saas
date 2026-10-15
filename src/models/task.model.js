import mongoose, {Schema} from "mongoose";

const taskSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minLength: 2,
    maxLength: 100,
  },
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
  description: {
    type: String,
    required: false,
    trim: true,
    maxLength: 200,
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ["todo", "in-progress", "review", "done"],
    required: true,
    default: "todo",
  },
  order: {
    type: Number,
    required: true,
    default: 0,
  },
  priority: {
    type: String,
    required: true,
    enum: {
      values: ["standard", "urgent", "emergency"],
      message: "Invalid priority value",
    },
    default: "standard",
  },
  dueDate: {
    type: Date,
  },
  subtasks: [
    {
      title: { type: String, required: true },
      isCompleted: { type: Boolean, default: false },
    }
  ],
  comments: [
    {
      text: { type: String, required: true },
      user: { type: Schema.Types.ObjectId, ref: "User", required: true },
      createdAt: { type: Date, default: Date.now },
    }
  ]
},{timestamps: true});

const Task = mongoose.models.Task || mongoose.model("Task", taskSchema, "tasks");
export default Task;