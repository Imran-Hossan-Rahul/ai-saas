import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import bcrypt from "bcrypt";

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, currentPassword, newPassword } = body;

    if (!name?.trim() || name.trim().length < 2) {
      return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
    }

    await connectDb();

    // Fetch user with password field (select: false bypassed via explicit select)
    const user = await User.findById(session.user.id).select("+password");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    user.name = name.trim();

    // Password change — only if both fields are provided
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to set a new password." }, { status: 400 });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
      }
      // The pre-save hook will hash the new password
      user.password = newPassword;
    }

    await user.save();

    return NextResponse.json({ message: "Profile updated successfully." }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/users/me Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
