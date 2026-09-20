import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { Redis } from "@upstash/redis";

const DATA_DIR = path.join(process.cwd(), "data");
const SCHEDULE_FILE = path.join(DATA_DIR, "school_schedule.json");

// Initialize Upstash Redis if credentials exist in environment
function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (url && token) {
    try {
      return new Redis({ url, token });
    } catch (e) {
      console.warn("[API /api/schedule] Failed to initialize Redis client:", e);
      return null;
    }
  }
  return null;
}

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
    // 1. Try fetching from Cloud Storage (Redis) if configured
    const redis = getRedisClient();
    if (redis) {
      try {
        const data = await redis.get("school_schedule");
        if (data) {
          return NextResponse.json({
            success: true,
            data,
            source: "redis",
          });
        }
      } catch (redisErr) {
        console.warn("[API GET /api/schedule] Redis read failed, falling back to local file:", redisErr);
      }
    }

    // 2. Fallback: Read from local data/school_schedule.json
    try {
      const content = await fs.readFile(SCHEDULE_FILE, "utf-8");
      const data = JSON.parse(content);
      return NextResponse.json({
        success: true,
        data,
        source: "file",
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

    // 1. If Redis is configured, save directly to Cloud Storage
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.set("school_schedule", payloadToSave);
        return NextResponse.json({
          success: true,
          message: "Thời khóa biểu đã được lưu thành công vào Cloud Storage (Upstash Redis)!",
          storage: "redis",
        });
      } catch (redisErr: any) {
        console.error("[API POST /api/schedule] Redis write error:", redisErr);
        return NextResponse.json(
          {
            success: false,
            error: `Lỗi kết nối Cloud Storage (Redis): ${redisErr?.message || "Unknown error"}`,
          },
          { status: 500 }
        );
      }
    }

    // 2. If Redis is not configured, attempt writing to local filesystem (dev / VPS)
    try {
      await ensureDirectoryExists();
      await fs.writeFile(SCHEDULE_FILE, JSON.stringify(payloadToSave, null, 2), "utf-8");

      return NextResponse.json({
        success: true,
        message: "Thời khóa biểu đã được lưu thành công vào máy chủ cục bộ",
        storage: "file",
      });
    } catch (fsErr: any) {
      console.error("[API POST /api/schedule] File write error:", fsErr);

      const isReadOnly =
        fsErr?.code === "EROFS" ||
        fsErr?.message?.includes("read-only") ||
        process.env.VERCEL ||
        process.env.AWS_LAMBDA_FUNCTION_NAME;

      if (isReadOnly) {
        return NextResponse.json(
          {
            success: false,
            needsCloudStorage: true,
            error:
              "Hệ thống đang chạy trên Vercel Serverless (Read-only filesystem) nên không thể ghi file trực tiếp. Vui lòng kết nối Upstash Redis trên Vercel (chỉ mất 1 phút và miễn phí) hoặc dùng nút 'Tải file JSON' để lưu thủ công vào mã nguồn.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: false, error: `Failed to save schedule: ${fsErr?.message || "File error"}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[API POST /api/schedule] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to save schedule" },
      { status: 500 }
    );
  }
}

// DELETE: Clear school schedule
export async function DELETE() {
  try {
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.del("school_schedule");
      } catch (redisErr) {
        console.warn("[API DELETE /api/schedule] Redis delete error:", redisErr);
      }
    }

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
