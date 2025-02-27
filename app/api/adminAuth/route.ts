import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();
  console.log("Admin Auth - Env Password:", process.env.ADMIN_PASSWORD);
  console.log("Admin Auth - Entered Password:", password);
  if (password === process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ success: false }, { status: 401 });
}