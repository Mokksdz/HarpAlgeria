import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface HealthStatus {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  version: string;
  checks: {
    database: "ok" | "error";
    memory: {
      used: string;
      total: string;
    };
  };
  uptime: number;
}

export async function GET() {
  const startTime = Date.now();

  let dbStatus: "ok" | "error" = "ok";

  // Check database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "error";
  }

  // Memory usage
  const memUsage = process.memoryUsage();
  const formatBytes = (bytes: number) => `${Math.round(bytes / 1024 / 1024)}MB`;

  const health: HealthStatus = {
    status: dbStatus === "ok" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    checks: {
      database: dbStatus,
      memory: {
        used: formatBytes(memUsage.heapUsed),
        total: formatBytes(memUsage.heapTotal),
      },
    },
    uptime: process.uptime(),
  };

  const statusCode = health.status === "ok" ? 200 : 503;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Response-Time": `${Date.now() - startTime}ms`,
    },
  });
}
