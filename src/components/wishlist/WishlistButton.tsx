"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface WishlistButtonProps {
  productId: string;
  initialIsWishlisted?: boolean;
  className?: string;
  onToggle?: (isAdded: boolean) => void;
}

export function WishlistButton({ 
  productId, 
  initialIsWishlisted = false, 
  className,
  onToggle 
}: WishlistButtonProps) {
  const { data: session } = useSession();
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Sync with localStorage if not logged in, or just handle UI state
  // Real sync happens on page load/auth
  
  useEffect(() => {
    if (!session) {
      // Check local storage
      const local = JSON.parse(localStorage.getItem("guest_wishlist") || "[]");
      setIsWishlisted(local.includes(productId));
    }
  }, [productId, session]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    if (!session) {
      // Local storage handling
      const local = JSON.parse(localStorage.getItem("guest_wishlist") || "[]");
      let newLocal = [];
      let newState = false;

      // Ensure guest key exists for future sync
      if (!localStorage.getItem("guest_wishlist_key")) {
          localStorage.setItem("guest_wishlist_key", crypto.randomUUID());
      }

      if (local.includes(productId)) {
        newLocal = local.filter((id: string) => id !== productId);
        newState = false;
      } else {
        newLocal = [...local, productId];
        newState = true;
      }
      
      localStorage.setItem("guest_wishlist", JSON.stringify(newLocal));
      setIsWishlisted(newState);
      if (onToggle) onToggle(newState);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/v3/wishlist/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId })
      });
      
      if (res.ok) {
        const data = await res.json();
        setIsWishlisted(data.added);
        if (onToggle) onToggle(data.added);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "p-2 rounded-full transition-all duration-300 active:scale-95",
        isWishlisted ? "bg-red-50" : "hover:bg-gray-100",
        className
      )}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        size={20}
        className={cn(
          "transition-all duration-300",
          isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"
        )}
      />
    </button>
  );
}
