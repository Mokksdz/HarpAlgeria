import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateProduct, sanitizeString } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { collection: true, variants: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Compute real stock from variants
    if (product.variants && product.variants.length > 0) {
      const realStock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
      // Sync product-level stock if out of date
      if (product.stock !== realStock) {
        await prisma.product.update({
          where: { id },
          data: { stock: realStock },
        });
      }
      return NextResponse.json({ ...product, stock: realStock });
    }

    // Product has sizes/colors but NO variants in DB → stock = 0
    try {
      const sizes = typeof product.sizes === "string" ? JSON.parse(product.sizes) : product.sizes;
      const colors = typeof product.colors === "string" ? JSON.parse(product.colors) : product.colors;
      if (
        Array.isArray(sizes) && sizes.length > 0 &&
        Array.isArray(colors) && colors.length > 0
      ) {
        if (product.stock !== 0) {
          await prisma.product.update({ where: { id }, data: { stock: 0 } });
        }
        return NextResponse.json({ ...product, stock: 0 });
      }
    } catch {
      // ignore parse errors
    }

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching product" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validation = validateProduct(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.errors,
        },
        { status: 400 },
      );
    }

    // Compute real stock from variants if provided
    let finalStock = parseInt(body.stock) || 0;
    if (body.variants && Array.isArray(body.variants) && body.variants.length > 0) {
      finalStock = body.variants.reduce(
        (sum: number, v: { stock: number }) => sum + (v.stock || 0),
        0,
      );
    }

    // Single transaction: update product + recreate variants atomically
    const product = await prisma.$transaction(async (tx) => {
      // Delete old variants
      if (body.variants && Array.isArray(body.variants)) {
        await tx.productVariant.deleteMany({ where: { productId: id } });

        if (body.variants.length > 0) {
          await tx.productVariant.createMany({
            data: body.variants.map(
              (v: { size: string; color: string; stock: number }) => ({
                productId: id,
                size: v.size,
                color: v.color,
                stock: v.stock || 0,
              }),
            ),
          });
        }
      }

      // Update product with correct final stock
      const updated = await tx.product.update({
        where: { id },
        data: {
          nameFr: sanitizeString(body.nameFr),
          nameAr: sanitizeString(body.nameAr),
          descriptionFr: sanitizeString(body.descriptionFr),
          descriptionAr: sanitizeString(body.descriptionAr),
          price: parseFloat(body.price),
          promoPrice: body.promoPrice ? parseFloat(body.promoPrice) : null,
          promoStart: body.promoStart ? new Date(body.promoStart) : null,
          promoEnd: body.promoEnd ? new Date(body.promoEnd) : null,
          images: JSON.stringify(body.images),
          sizes: JSON.stringify(body.sizes),
          colors: JSON.stringify(body.colors),
          stock: finalStock,
          isActive: body.isActive !== false,
          showSizeGuide: body.showSizeGuide !== false,
          freeShipping: body.freeShipping === true,
          freeShippingThreshold: parseFloat(body.freeShippingThreshold) || 0,
          collectionId: body.collectionId || null,
        },
        include: { variants: true },
      });

      return updated;
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Error updating product" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.product.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Product deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Error deleting product" },
      { status: 500 },
    );
  }
}
