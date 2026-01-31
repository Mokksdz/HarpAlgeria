"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

type Language = "fr" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: "ltr" | "rtl";
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

import { translations } from "@/lib/translations";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("harp-lang") as Language | null;
      if (saved === "fr" || saved === "ar") return saved;
      const browserLang = navigator.language || "";
      if (browserLang.startsWith("ar")) return "ar";
    }
    return "fr";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("harp-lang", lang);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const t = useCallback(
    (key: string): string => {
      const langTranslations = translations[language] as Record<string, string>;
      return langTranslations[key] || key;
    },
    [language],
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        dir: language === "ar" ? "rtl" : "ltr",
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
