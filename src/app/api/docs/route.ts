// app/api/docs/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "docs/openapi.yaml");
    const file = fs.readFileSync(filePath, "utf8");
    return new NextResponse(file, {
      headers: {
        "Content-Type": "text/yaml",
        // CORS is handled by middleware
      },
    });
  } catch {
    return NextResponse.json(
      { error: "OpenAPI spec not found" },
      { status: 404 },
    );
  }
}
