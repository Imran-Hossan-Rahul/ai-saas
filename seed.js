require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Manually define User schema for the seed script
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["client", "admin", "user"], default: "client" },
}, { timestamps: true });

// Pre-save hook to hash password (simplified for seed script)
const bcrypt = require('bcrypt');
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout
    });
    console.log("Connected to MongoDB successfully!");

    const demoEmail = "demo@example.com";
    
    // Check if exists
    let user = await User.findOne({ email: demoEmail });
    if (!user) {
      user = new User({
        name: "Demo User",
        email: demoEmail,
        password: "Password123!", // Will be hashed by pre-save hook
        role: "user" // freelancer role
      });
      await user.save();
      console.log("Demo user created: demo@example.com / Password123!");
    } else {
      console.log("Demo user already exists: demo@example.com / Password123!");
    }

    const demoClientEmail = "client@example.com";
    let client = await User.findOne({ email: demoClientEmail });
    if (!client) {
      client = new User({
        name: "Demo Client",
        email: demoClientEmail,
        password: "Password123!",
        role: "client"
      });
      await client.save();
      console.log("Demo client created: client@example.com / Password123!");
    } else {
      console.log("Demo client already exists: client@example.com / Password123!");
    }

  } catch (error) {
    console.error("Failed to seed database:");
    console.error(error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
