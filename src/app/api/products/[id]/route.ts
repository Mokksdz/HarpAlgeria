import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateProduct, sanitizeString } from '@/lib/validations';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id },
            include: { collection: true },
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching product' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        
        // Validate input
        const validation = validateProduct(body);
        if (!validation.valid) {
            return NextResponse.json({ 
                error: 'Validation failed', 
                details: validation.errors 
            }, { status: 400 });
        }
        
        const product = await prisma.product.update({
            where: { id },
            data: {
                nameFr: sanitizeString(body.nameFr),
                nameAr: sanitizeString(body.nameAr),
                descriptionFr: sanitizeString(body.descriptionFr),
                descriptionAr: sanitizeString(body.descriptionAr),
                price: parseFloat(body.price),
                images: JSON.stringify(body.images),
                sizes: JSON.stringify(body.sizes),
                colors: JSON.stringify(body.colors),
                stock: parseInt(body.stock) || 0,
                isActive: body.isActive !== false,
                showSizeGuide: body.showSizeGuide !== false,
                freeShipping: body.freeShipping === true,
                freeShippingThreshold: parseFloat(body.freeShippingThreshold) || 0,
                collectionId: body.collectionId || null,
            },
        });
        return NextResponse.json(product);
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: 'Error updating product' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.product.delete({
            where: { id },
        });
        return NextResponse.json({ message: 'Product deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting product' }, { status: 500 });
    }
}
