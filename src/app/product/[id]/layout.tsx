import { prisma } from "@/lib/prisma";
import { Metadata } from "next";

interface Props {
    params: Promise<{ id: string }>;
    children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    
    try {
        const product = await prisma.product.findUnique({
            where: { id },
            include: { collection: true },
        });

        if (!product) {
            return {
                title: "Produit non trouvé",
            };
        }

        const images = JSON.parse(product.images);
        const firstImage = images[0] || "";

        return {
            title: product.nameFr,
            description: product.descriptionFr.slice(0, 160),
            openGraph: {
                title: `${product.nameFr} | Harp`,
                description: product.descriptionFr.slice(0, 160),
                images: firstImage ? [{ url: firstImage, width: 600, height: 800 }] : [],
                type: "website",
                locale: "fr_FR",
            },
            twitter: {
                card: "summary_large_image",
                title: `${product.nameFr} | Harp`,
                description: product.descriptionFr.slice(0, 160),
                images: firstImage ? [firstImage] : [],
            },
            other: {
                "product:price:amount": product.price.toString(),
                "product:price:currency": "DZD",
            },
        };
    } catch (error) {
        return {
            title: "Harp - Produit",
        };
    }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
