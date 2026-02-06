import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { z } from "zod";

// =============================================================================
// GET /api/v3/blog/[slug] — Public: fetch single post by slug + increment views
// =============================================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const post = await prisma.blogPost.findUnique({
      where: { slug },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Article non trouvé" },
        { status: 404 },
      );
    }

    // Increment views counter (fire and forget)
    prisma.blogPost
      .update({
        where: { id: post.id },
        data: { views: { increment: 1 } },
      })
      .catch(() => {
        // silently ignore view increment errors
      });

    return NextResponse.json({ success: true, post });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

// =============================================================================
// PUT /api/v3/blog/[slug] — Admin only: update a blog post
// =============================================================================

const BlogPostUpdateSchema = z.object({
  slug: z.string().min(1).optional(),
  titleFr: z.string().min(1).optional(),
  titleAr: z.string().min(1).optional(),
  excerptFr: z.string().optional(),
  excerptAr: z.string().optional(),
  contentFr: z.string().min(1).optional(),
  contentAr: z.string().min(1).optional(),
  coverImage: z.string().optional(),
  category: z.enum(["STYLE", "LOOKBOOK", "TIPS", "NEWS"]).optional(),
  tags: z.string().optional(),
  authorName: z.string().optional(),
  isPublished: z.boolean().optional(),
  publishedAt: z.string().nullable().optional(),
  seoTitleFr: z.string().optional(),
  seoTitleAr: z.string().optional(),
  seoDescFr: z.string().optional(),
  seoDescAr: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await requireAdmin(req);
    const { slug } = await params;
    const body = await req.json();
    const data = BlogPostUpdateSchema.parse(body);

    // Find the existing post
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Article non trouvé" },
        { status: 404 },
      );
    }

    // If publishing for the first time, set publishedAt
    const updateData: Record<string, unknown> = { ...data };
    if (data.isPublished && !existing.publishedAt) {
      updateData.publishedAt = data.publishedAt
        ? new Date(data.publishedAt)
        : new Date();
    } else if (data.publishedAt !== undefined) {
      updateData.publishedAt = data.publishedAt
        ? new Date(data.publishedAt)
        : null;
    }

    const post = await prisma.blogPost.update({
      where: { slug },
      data: updateData,
    });

    return NextResponse.json({ success: true, post });
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

// =============================================================================
// DELETE /api/v3/blog/[slug] — Admin only: delete a blog post
// =============================================================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await requireAdmin(req);
    const { slug } = await params;

    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Article non trouvé" },
        { status: 404 },
      );
    }

    await prisma.blogPost.delete({ where: { slug } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
