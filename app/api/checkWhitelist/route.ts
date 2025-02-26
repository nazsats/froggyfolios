import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { address } = await req.json();

    if (!address) {
      return NextResponse.json({ success: false, message: "Address is required" }, { status: 400 });
    }

    // Read whitelist data
    const filePath = path.join(process.cwd(), "data", "whitelist.json");
    const fileData = fs.readFileSync(filePath, "utf8");
    const whitelistData = JSON.parse(fileData);

    // Check if address is in whitelist
    if (whitelistData.gtdFreeMint.includes(address)) {
      return NextResponse.json({
        success: true,
        whitelistType: "gtdFreeMint",
        message: "✅ You are eligible for the GTD Free Mint phase!",
      });
    } else if (whitelistData.fcfsWL.includes(address)) {
      return NextResponse.json({
        success: true,
        whitelistType: "fcfsWL",
        message: "✅ You are eligible for the FCFS WL phase!",
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "❌ You are not eligible for any whitelist phase.",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}