import { Metadata } from "next";
import { LoyaltyDashboard } from "@/components/loyalty/LoyaltyDashboard";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Mes Récompenses | HARP",
  description:
    "Gérez vos points de fidélité et débloquez des récompenses exclusives.",
};

export default async function LoyaltyPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login?callbackUrl=/loyalty"); // Using admin login for now as it's the only auth configured
  }

  return (
    <div className="min-h-screen bg-white pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl text-harp-brown mb-4">
            Harp Rewards
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Plus qu'un programme de fidélité, une invitation à l'exclusivité.
            Cumulez des points à chaque achat et accédez au cercle privilégié.
          </p>
        </div>

        <LoyaltyDashboard />
      </div>
    </div>
  );
}
