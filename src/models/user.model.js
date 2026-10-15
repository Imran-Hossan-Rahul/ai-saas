import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt";


const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minLength: 2,
        maxLength: 50
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minLength: 6,
        select: false
    },
    role: {
        type: String,
        require: true,
        enum: ["client", "user", "admin"],
        default: "user",
    },
    workspaces: [{
        type: Schema.Types.ObjectId,
        ref: "Workspace"
    }],
    currentWorkspace: {
        type: Schema.Types.ObjectId,
        ref: "Workspace"
    }
},{timestamps: true});


//mongoose validation goes here
userSchema.path("password").validate(function (value){
    const complexity = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W]).{8,}$/;
    return complexity.test(value);
}, "Password must be at least 8 characters long and include uppercase, lowercase, number and special character");


//hooks goes here
userSchema.pre("save", async function (){
    if(!this.isModified("password")) return;
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
})


//methods goes here
userSchema.methods.comparePassword = async function(candidatePassword){
    return await bcrypt.compare(candidatePassword, this.password);
}


const User = mongoose.models.User || mongoose.model("User", userSchema, "users");
export default User;