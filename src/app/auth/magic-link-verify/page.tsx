"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState(() => token ? "verifying" : "error");

  useEffect(() => {
    if (!token) {
      return;
    }

    const verify = async () => {
      try {
        // Sign in using the magic-link provider
        const result = await signIn("magic-link", {
          token,
          redirect: false,
        });

        if (result?.ok) {
          // Sync wishlist logic
          const guestKey = localStorage.getItem("guest_wishlist_key");
          try {
            const stored = localStorage.getItem("guest_wishlist");
            const localWishlist = stored ? JSON.parse(stored) : [];

            if (localWishlist.length > 0) {
              const items = localWishlist.map((item: any) => ({
                productId:
                  typeof item === "string" ? item : item.id || item.productId,
              }));

              await fetch("/api/v3/wishlist/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items, guestKey }),
              });

              // Clear local guest data after sync
              localStorage.removeItem("guest_wishlist");
            }
            // We might keep the key or rotate it, but clearing items ensures no double sync
          } catch (e) {
            console.error("Sync failed", e);
          }

          setStatus("success");
          // Redirect to account or home
          setTimeout(() => router.push("/"), 1500);
        } else {
          setStatus("error");
        }
      } catch (e) {
        setStatus("error");
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="bg-white p-8 max-w-md w-full shadow-sm text-center">
      {status === "verifying" && (
        <>
          <h1 className="text-xl font-serif text-[#5C4033] mb-4">
            Vérification en cours...
          </h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5C4033] mx-auto"></div>
        </>
      )}
      {status === "success" && (
        <>
          <h1 className="text-xl font-serif text-[#5C4033] mb-4">
            Connexion réussie !
          </h1>
          <p className="text-gray-600">Redirection vers la boutique...</p>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="text-xl font-serif text-red-800 mb-4">
            Lien invalide ou expiré
          </h1>
          <p className="text-gray-600 mb-6">
            Ce lien de connexion n'est plus valide ou a déjà été utilisé.
          </p>
          <a
            href="/auth/magic-link-request"
            className="text-[#5C4033] underline"
          >
            Demander un nouveau lien
          </a>
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-[#F9F7F2] flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5C4033]"></div>
        }
      >
        <VerifyContent />
      </Suspense>
    </div>
  );
}
