import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { z } from "zod";

// =============================================================================
// GET /api/v3/blog — Public: fetch published blog posts (paginated)
// =============================================================================

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12")));
    const category = searchParams.get("category") || "";
    const adminMode = searchParams.get("admin") === "true";

    const where: Record<string, unknown> = {};

    // Admin mode: show all posts (published + drafts), requires auth
    if (adminMode) {
      try {
        await requireAdmin(req);
      } catch {
        // Not admin — fall back to public mode (published only)
        where.isPublished = true;
      }
    } else {
      where.isPublished = true;
    }

    if (category && category !== "ALL") {
      where.category = category;
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          titleFr: true,
          titleAr: true,
          excerptFr: true,
          excerptAr: true,
          contentFr: true,
          contentAr: true,
          coverImage: true,
          category: true,
          tags: true,
          authorName: true,
          isPublished: true,
          publishedAt: true,
          views: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.blogPost.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      posts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

// =============================================================================
// POST /api/v3/blog — Admin only: create a new blog post
// =============================================================================

const BlogPostCreateSchema = z.object({
  slug: z.string().min(1, "Slug requis"),
  titleFr: z.string().min(1, "Titre FR requis"),
  titleAr: z.string().min(1, "Titre AR requis"),
  excerptFr: z.string().optional(),
  excerptAr: z.string().optional(),
  contentFr: z.string().min(1, "Contenu FR requis"),
  contentAr: z.string().min(1, "Contenu AR requis"),
  coverImage: z.string().optional(),
  category: z.enum(["STYLE", "LOOKBOOK", "TIPS", "NEWS"]).default("STYLE"),
  tags: z.string().optional(),
  authorName: z.string().optional(),
  isPublished: z.boolean().default(false),
  publishedAt: z.string().optional(),
  seoTitleFr: z.string().optional(),
  seoTitleAr: z.string().optional(),
  seoDescFr: z.string().optional(),
  seoDescAr: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const data = BlogPostCreateSchema.parse(body);

    const post = await prisma.blogPost.create({
      data: {
        ...data,
        publishedAt: data.isPublished
          ? data.publishedAt
            ? new Date(data.publishedAt)
            : new Date()
          : null,
      },
    });

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation échouée", details: err.issues },
        { status: 400 },
      );
    }
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
