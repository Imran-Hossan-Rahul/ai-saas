import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import User from "@/models/user.model";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    await connectDb();

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    // Passwords are automatically hashed via the Mongoose pre-save hook in user.model.js
    // Prevent privilege escalation to admin
    const assignedRole = (role === "user" || role === "client") ? role : "client";

    const newUser = await User.create({
      name,
      email,
      password,
      role: assignedRole,
    });

    return NextResponse.json({ message: "User registered successfully", userId: newUser._id }, { status: 201 });
  } catch (error) {
    console.error("Registration Error:", error);
    
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
