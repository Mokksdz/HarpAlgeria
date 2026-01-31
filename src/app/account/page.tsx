"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/magic-link-request");
    }
    // Redirect admins to the admin dashboard
    if (
      status === "authenticated" &&
      (session?.user as { role?: string })?.role === "admin"
    ) {
      router.push("/admin");
    }
  }, [status, session, router]);

  const loading = status === "loading" || status === "unauthenticated";

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5C4033]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif text-[#5C4033]">Mon Compte</h1>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Se déconnecter
          </button>
        </div>

        <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-medium mb-4">
                Informations personnelles
              </h2>
              <div className="space-y-2 text-gray-600">
                <p>
                  <span className="font-medium text-gray-900">Email:</span>{" "}
                  {session?.user?.email}
                </p>
                <p>
                  <span className="font-medium text-gray-900">Statut:</span>{" "}
                  {session?.user?.image === "black" ? "Membre Black" : "Membre"}
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-4">Mes avantages</h2>
              <div className="bg-[#F9F7F2] p-6 rounded-lg">
                <p className="text-gray-600 mb-2">Programme de fidélité</p>
                <Link
                  href="/loyalty"
                  className="text-[#5C4033] underline text-sm"
                >
                  Voir mes points et récompenses
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-gray-100 pt-8">
            <h2 className="text-lg font-medium mb-6">Mes commandes récentes</h2>
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              Aucune commande récente.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
