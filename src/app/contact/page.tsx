"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import {
  Mail,
  Instagram,
  MessageCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { siteConfig, getWhatsAppLink } from "@/lib/config";

export default function ContactPage() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
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
      description: t("contact.methods.whatsapp.desc"),
    },
    {
      icon: Mail,
      title: "Email",
      value: "contact@harpalgeria.com",
      link: "mailto:contact@harpalgeria.com",
      description: t("contact.methods.email.desc"),
    },
    {
      icon: Instagram,
      title: "Instagram",
      value: "@harp_algeria",
      link: "https://instagram.com/harp_algeria",
      description: t("contact.methods.instagram.desc"),
    },
  ];

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen bg-gradient-to-b from-harp-cream/30 to-white" dir={isAr ? "rtl" : "ltr"}>
      {/* Hero Section - Minimalist */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 bg-harp-sand/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 block">
              {t("contact.hero.badge")}
            </span>
            <h1 className="text-4xl md:text-6xl font-serif font-medium text-gray-900 mb-6">
              {t("contact.hero.title")}
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed font-light max-w-xl mx-auto">
              {t("contact.hero.desc")}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods Grid */}
      <section className="py-16 md:py-24 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {contactMethods.map((method, index) => (
              <div key={index} className="group text-center">
                <div className="mb-4 mx-auto inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-900 group-hover:bg-gray-900 group-hover:text-white transition-colors">
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
                    dir="ltr"
                  >
                    {method.value}
                  </a>
                ) : (
                  <p className="text-sm font-medium text-gray-900 mt-2" dir="ltr">
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
                  {t("contact.form.sendMessage")}
                </h2>
                <p className="text-gray-500 font-light leading-relaxed">
                  {t("contact.form.sendMessageDesc")}
                </p>
              </div>

              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-3">
                    {t("contact.hours.title")}
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-500 font-light">
                    <li className="flex justify-between max-w-[240px]">
                      <span>{t("contact.hours.sunThu")}</span>
                      <span dir="ltr">9h - 18h</span>
                    </li>
                    <li className="flex justify-between max-w-[240px]">
                      <span>{t("contact.hours.sat")}</span>
                      <span dir="ltr">10h - 16h</span>
                    </li>
                    <li className="flex justify-between max-w-[240px]">
                      <span>{t("contact.hours.fri")}</span>
                      <span>{t("contact.hours.closed")}</span>
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
                    {t("contact.whatsapp.cta")}
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
                    {t("contact.form.successTitle")}
                  </h4>
                  <p className="text-gray-500 font-light">
                    {t("contact.form.successDesc")}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        {t("contact.form.nameLabel")}
                      </label>
                      <input
                        type="text"
                        required
                        value={formState.name}
                        onChange={(e) =>
                          setFormState({ ...formState, name: e.target.value })
                        }
                        className="w-full bg-transparent border-b border-gray-200 py-3 text-gray-900 focus:border-gray-900 outline-none transition-colors placeholder:text-gray-300"
                        placeholder={t("contact.form.namePlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        {t("contact.form.phoneLabel")}
                      </label>
                      <input
                        type="tel"
                        dir="ltr"
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
                      {t("contact.form.emailLabel")}
                    </label>
                    <input
                      type="email"
                      required
                      dir="ltr"
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
                      {t("contact.form.subjectLabel")}
                    </label>
                    <select
                      value={formState.subject}
                      onChange={(e) =>
                        setFormState({ ...formState, subject: e.target.value })
                      }
                      className="w-full bg-transparent border-b border-gray-200 py-3 text-gray-900 focus:border-gray-900 outline-none transition-colors cursor-pointer"
                    >
                      <option value="">{t("contact.form.subjectSelect")}</option>
                      <option value="question">{t("contact.form.subjectProduct")}</option>
                      <option value="order">{t("contact.form.subjectOrder")}</option>
                      <option value="return">{t("contact.form.subjectReturn")}</option>
                      <option value="collaboration">{t("contact.form.subjectPartnership")}</option>
                      <option value="other">{t("contact.form.subjectOther")}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      {t("contact.form.messageLabel")}
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formState.message}
                      onChange={(e) =>
                        setFormState({ ...formState, message: e.target.value })
                      }
                      className="w-full bg-transparent border-b border-gray-200 py-3 text-gray-900 focus:border-gray-900 outline-none transition-colors resize-none placeholder:text-gray-300"
                      placeholder={t("contact.form.messagePlaceholder")}
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
                          {t("contact.form.send")}
                          <ArrowIcon size={18} />
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
