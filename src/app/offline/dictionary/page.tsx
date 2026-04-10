"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const CATEGORIES = [
  { key: "clothes", label: "ملابس" },
  { key: "jobs", label: "وظائف" },
  { key: "food", label: "أكل" },
  { key: "adult", label: "+18" },
  { key: "things", label: "أشياء/جماد" },
];

const WORDS = {
  clothes: ["قميص", "بنطلون", "جاكيت", "فستان", "حذاء", "قبعة", "تيشيرت", "بدلة"],
  jobs: ["طبيب", "مهندس", "مدرس", "محامي", "شرطي", "ممرض", "سائق", "مزارع"],
  food: ["بيتزا", "كشري", "فول", "شاورما", "رز", "سمك", "دجاج", "بطاطس"],
  adult: ["سيجارة", "خمر", "حبوب", "ملهى", "راقصة", "كازينو", "مخدرات"],
  things: ["كرسي", "مكتب", "باب", "نافذة", "هاتف", "كمبيوتر", "سيارة", "ساعة"]
};

export default function DictionaryPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(CATEGORIES.map(c=>c.key));

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("dictionary_selected");
      if (saved) setSelected(JSON.parse(saved));
    }
  }, []);

  function handleToggle(key: string) {
    setSelected(sel => {
      const next = sel.includes(key) ? sel.filter(k=>k!==key) : [...sel, key];
      if (typeof window !== "undefined") {
        window.localStorage.setItem("dictionary_selected", JSON.stringify(next));
      }
      return next;
    });
  }

  // تجميع كل الكلمات المختارة
  const allWords = selected.flatMap(key => WORDS[key as keyof typeof WORDS]);

  return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-200 via-green-100 to-blue-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-black p-4">
      <div className="bg-white/90 dark:bg-zinc-900/90 rounded-3xl shadow-2xl p-10 w-full max-w-md text-center border border-green-300 dark:border-zinc-700 relative z-10">
        <h2 className="text-2xl font-bold mb-6 text-green-700 dark:text-green-300">اختيار تصنيفات الكلمات</h2>
        <div className="flex flex-col gap-3 mb-6">
          {CATEGORIES.map(cat => (
            <label key={cat.key} className="flex items-center gap-3 cursor-pointer justify-end">
              <input
                type="checkbox"
                checked={selected.includes(cat.key)}
                onChange={()=>handleToggle(cat.key)}
                className="accent-green-600 w-5 h-5"
              />
              <span className="text-lg font-medium text-zinc-800 dark:text-zinc-100">{cat.label}</span>
            </label>
          ))}
        </div>
        {/* تم حذف عدد الكلمات المتاحة بناءً على طلب المستخدم */}
        <button
          onClick={()=>router.push("/offline")}
          className="mt-2 px-8 py-3 rounded-full bg-gradient-to-r from-green-600 to-blue-400 text-white font-bold shadow-lg hover:from-green-700 hover:to-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={selected.length === 0}
        >
          العودة
        </button>
      </div>
    </div>
  );
}
