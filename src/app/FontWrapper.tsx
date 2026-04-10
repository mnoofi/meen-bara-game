"use client";
import { ReactNode } from "react";
import { useLang } from "@/components/LanguageProvider";
import { Noto_Naskh_Arabic } from "next/font/google";

const notoArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400"],
  variable: "--font-arabic",
});

export default function FontWrapper({ children }: { children: ReactNode }) {
  const { lang } = useLang();
  return (
    <div className={lang === "ar" ? notoArabic.className : undefined}>{children}</div>
  );
}