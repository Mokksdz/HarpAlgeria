"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded",
                className
            )}
        />
    );
}

export function ProductCardSkeleton() {
    return (
        <div className="block">
            <Skeleton className="aspect-[3/4] mb-4" />
            <div className="text-center space-y-2">
                <Skeleton className="h-3 w-20 mx-auto" />
                <Skeleton className="h-5 w-32 mx-auto" />
                <Skeleton className="h-4 w-16 mx-auto" />
            </div>
        </div>
    );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
}

export function HeroSkeleton() {
    return (
        <div className="relative h-[80vh] w-full bg-gray-100">
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="max-w-2xl bg-white/80 p-8 md:p-12 space-y-4">
                    <Skeleton className="h-12 w-64 mx-auto" />
                    <Skeleton className="h-6 w-80 mx-auto" />
                    <Skeleton className="h-12 w-48 mx-auto mt-8" />
                </div>
            </div>
        </div>
    );
}
