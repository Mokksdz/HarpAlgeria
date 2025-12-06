"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import Image from "next/image";
import {
  Mail,
  MapPin,
  Instagram,
  Facebook,
  MessageCircle,
  Clock,
  CheckCircle,
  Send,
  ArrowRight,
} from "lucide-react";
import { siteConfig, getWhatsAppLink } from "@/lib/config";

const TikTokIcon = ({
  size = 24,
  className = "",
}: {
  size?: number | string;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

export default function ContactPage() {
  const { t } = useLanguage();
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormState({ name: "", email: "", phone: "", subject: "", message: "" });

    setTimeout(() => setIsSubmitted(false), 5000);
  };

  const contactMethods = [
    {
      icon: MessageCircle,
      title: "WhatsApp",
      value: siteConfig.whatsapp.display,
      link: getWhatsAppLink(),
      description: "Réponse rapide",
    },
    {
      icon: Mail,
      title: "Email",
      value: "contact@harpalgeria.com",
      link: "mailto:contact@harpalgeria.com",
      description: "Pour toute question",
    },
    {
      icon: Instagram,
      title: "Instagram",
      value: "@harp_algeria",
      link: "https://instagram.com/harp_algeria",
      description: "Suivez nos nouveautés",
    },
    {
      icon: MapPin,
      title: "Atelier",
      value: "Alger, Algérie",
      link: null,
      description: "Siège social",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-harp-cream/30 to-white">
      {/* Hero Section - Minimalist */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 bg-harp-sand/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 block">
              Contact
            </span>
            <h1 className="text-4xl md:text-6xl font-serif font-medium text-gray-900 mb-6">
              Nous sommes à votre écoute.
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed font-light max-w-xl mx-auto">
              Une question, une suggestion ou simplement envie de dire bonjour ?
              Notre équipe est là pour vous accompagner.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods Grid */}
      <section className="py-16 md:py-24 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactMethods.map((method, index) => (
              <div key={index} className="group">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-900 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                  <method.icon size={20} />
                </div>
                <h3 className="font-serif font-medium text-xl text-gray-900 mb-2">
                  {method.title}
                </h3>
                <p className="text-sm text-gray-500 mb-1">
                  {method.description}
                </p>
                {method.link ? (
                  <a
                    href={method.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-0.5 hover:border-gray-900 transition-colors inline-block mt-2"
                  >
                    {method.value}
                  </a>
                ) : (
                  <p className="text-sm font-medium text-gray-900 mt-2">
                    {method.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Form Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Left - Info & Hours */}
            <div className="lg:col-span-4 lg:col-start-2 space-y-12">
              <div>
                <h2 className="text-3xl font-serif font-medium text-gray-900 mb-6">
                  Envoyez-nous un message
                </h2>
                <p className="text-gray-500 font-light leading-relaxed">
                  Remplissez le formulaire ci-contre et nous vous répondrons
                  dans les plus brefs délais. Vous pouvez également nous
                  contacter directement sur WhatsApp pour une réponse immédiate.
                </p>
              </div>

              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-3">
                    Horaires Service Client
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-500 font-light">
                    <li className="flex justify-between max-w-[200px]">
                      <span>Dimanche - Jeudi</span>
                      <span>9h - 18h</span>
                    </li>
                    <li className="flex justify-between max-w-[200px]">
                      <span>Samedi</span>
                      <span>10h - 16h</span>
                    </li>
                    <li className="flex justify-between max-w-[200px]">
                      <span>Vendredi</span>
                      <span>Fermé</span>
                    </li>
                  </ul>
                </div>

                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-[#25D366] text-white px-6 py-4 rounded-full hover:bg-[#20bd5a] transition-colors shadow-lg shadow-[#25D366]/20"
                >
                  <MessageCircle size={20} />
                  <span className="font-medium text-sm tracking-wide">
                    Discuter sur WhatsApp
                  </span>
                </a>
              </div>
            </div>

            {/* Right - Form */}
            <div className="lg:col-span-6">
              {isSubmitted ? (
                <div className="bg-gray-50 p-12 rounded-2xl text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full text-green-600 mb-6">
                    <CheckCircle size={32} />
                  </div>
                  <h4 className="text-2xl font-serif font-medium text-gray-900 mb-2">
                    Message envoyé !
                  </h4>
                  <p className="text-gray-500 font-light">
                    Merci de nous avoir contactés. Nous reviendrons vers vous
                    très vite.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Nom complet
                      </label>
                      <input
                        type="text"
                        required
                        value={formState.name}
                        onChange={(e) =>
                          setFormState({ ...formState, name: e.target.value })
                        }
                        className="w-full bg-transparent border-b border-gray-200 py-3 text-gray-900 focus:border-gray-900 outline-none transition-colors placeholder:text-gray-300"
                        placeholder="Votre nom"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={formState.phone}
                        onChange={(e) =>
                          setFormState({ ...formState, phone: e.target.value })
                        }
                        className="w-full bg-transparent border-b border-gray-200 py-3 text-gray-900 focus:border-gray-900 outline-none transition-colors placeholder:text-gray-300"
                        placeholder="05 XX XX XX XX"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formState.email}
                      onChange={(e) =>
                        setFormState({ ...formState, email: e.target.value })
                      }
                      className="w-full bg-transparent border-b border-gray-200 py-3 text-gray-900 focus:border-gray-900 outline-none transition-colors placeholder:text-gray-300"
                      placeholder="votre@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Sujet
                    </label>
                    <select
                      value={formState.subject}
                      onChange={(e) =>
                        setFormState({ ...formState, subject: e.target.value })
                      }
                      className="w-full bg-transparent border-b border-gray-200 py-3 text-gray-900 focus:border-gray-900 outline-none transition-colors cursor-pointer"
                    >
                      <option value="">Sélectionnez un sujet</option>
                      <option value="question">Question produit</option>
                      <option value="order">Suivi de commande</option>
                      <option value="return">Retour & Échange</option>
                      <option value="collaboration">Partenariat</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Message
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formState.message}
                      onChange={(e) =>
                        setFormState({ ...formState, message: e.target.value })
                      }
                      className="w-full bg-transparent border-b border-gray-200 py-3 text-gray-900 focus:border-gray-900 outline-none transition-colors resize-none placeholder:text-gray-300"
                      placeholder="Comment pouvons-nous vous aider ?"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gray-900 text-white py-4 rounded-full uppercase tracking-widest hover:bg-gray-800 transition-all duration-300 font-medium flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Envoyer
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
