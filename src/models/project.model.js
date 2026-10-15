import mongoose, {Schema} from "mongoose"

const projectSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minLength: 2,
    maxLength: 50,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minLength: 20,
    maxLength: 1000,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Owner id is required"],
    index: true,
  },
  talent: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },
  workspace: {
    type: Schema.Types.ObjectId,
    ref: "Workspace",
    index: true,
  },
  revenue: {
    type: Number,
    default: 0,
  },
  deadline: {
    type: Date,
  },
  priority: {
    type: String,
    required: true,
    enum: {
      values: ["low", "medium", "high"],
      message: "Invalid Priority Value",
    },
    default: "low",
  },
  status: {
    type: String,
    required: [true, "Status is required"],
    enum: {
      values: ["todo", "in-progress", "review", "done"],
      message: "Invalid Status value"
    },
    default: "todo"
  },
},{timestamps: true});

const Project = mongoose.models.Project || mongoose.model("Project", projectSchema, "projects");
export default Project;