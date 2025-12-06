"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "fr" | "ar";

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    dir: "ltr" | "rtl";
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

import { translations } from "@/lib/translations";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>("fr");

    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    }, [language]);

    const t = (key: string) => {
        const keys = key.split('.');
        let value: any = translations[language];
        
        for (const k of keys) {
            value = value?.[k as keyof typeof value];
        }
        
        return (value as string) || (translations[language] as any)[key] || key;
    };

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
