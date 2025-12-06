import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateCollection, sanitizeString } from '@/lib/validations';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const collection = await prisma.collection.findUnique({
            where: { id },
            include: { products: true },
        });

        if (!collection) {
            return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
        }

        return NextResponse.json(collection);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching collection' }, { status: 500 });
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
        const validation = validateCollection(body);
        if (!validation.valid) {
            return NextResponse.json({ 
                error: 'Validation failed', 
                details: validation.errors 
            }, { status: 400 });
        }
        
        const collection = await prisma.collection.update({
            where: { id },
            data: {
                nameFr: sanitizeString(body.nameFr),
                nameAr: sanitizeString(body.nameAr),
                image: body.image || null,
            },
        });
        return NextResponse.json(collection);
    } catch (error) {
        console.error('Error updating collection:', error);
        return NextResponse.json({ error: 'Error updating collection' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.collection.delete({
            where: { id },
        });
        return NextResponse.json({ message: 'Collection deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting collection' }, { status: 500 });
    }
}
