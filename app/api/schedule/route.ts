import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const SCHEDULE_FILE = path.join(DATA_DIR, "school_schedule.json");

// Ensure data directory exists
async function ensureDirectoryExists() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

// GET: Retrieve the active school schedule
export async function GET() {
  try {
    await ensureDirectoryExists();
    try {
      const content = await fs.readFile(SCHEDULE_FILE, "utf-8");
      const data = JSON.parse(content);
      return NextResponse.json({
        success: true,
        data,
      });
    } catch {
      // File doesn't exist yet
      return NextResponse.json({
        success: false,
        data: null,
      });
    }
  } catch (error) {
    console.error("[API GET /api/schedule] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to read schedule" },
      { status: 500 }
    );
  }
}

// POST: Save or update the school-wide schedule
export async function POST(req: NextRequest) {
  try {
    await ensureDirectoryExists();
    const body = await req.json();

    if (!body || !body.classes || !body.scheduleByClass) {
      return NextResponse.json(
        { success: false, error: "Invalid schedule payload" },
        { status: 400 }
      );
    }

    const payloadToSave = {
      ...body,
      uploadedAt: body.uploadedAt || new Date().toISOString(),
    };

    await fs.writeFile(SCHEDULE_FILE, JSON.stringify(payloadToSave, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      message: "School schedule published successfully",
    });
  } catch (error) {
    console.error("[API POST /api/schedule] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save schedule" },
      { status: 500 }
    );
  }
}

// DELETE: Clear school schedule
export async function DELETE() {
  try {
    try {
      await fs.unlink(SCHEDULE_FILE);
    } catch {
      // ignore if doesn't exist
    }
    return NextResponse.json({
      success: true,
      message: "School schedule deleted",
    });
  } catch (error) {
    console.error("[API DELETE /api/schedule] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
