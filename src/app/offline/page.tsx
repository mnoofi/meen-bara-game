"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function OfflinePage() {
  const router = useRouter();
  return (
    <div dir="rtl" className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-yellow-200 via-green-100 to-blue-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-black relative">
      {/* زخرفة خلفية */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute w-[400px] h-[400px] bg-gradient-to-br from-yellow-300 via-pink-200 to-blue-200 rounded-full blur-3xl opacity-40 left-[-100px] top-[-100px] animate-pulse"></div>
        <div className="absolute w-[300px] h-[300px] bg-gradient-to-tr from-green-200 via-blue-100 to-yellow-100 rounded-full blur-2xl opacity-30 right-[-80px] bottom-[-80px] animate-pulse"></div>
      </div>
      <main className="flex flex-col items-center justify-center w-full max-w-xl p-10 bg-white/80 dark:bg-zinc-900/90 rounded-3xl shadow-2xl mt-20 border border-yellow-300 dark:border-zinc-700 relative z-10">
        <Image src="/file.svg" alt="أوفلاين" width={80} height={80} className="mb-4 drop-shadow-lg" />
        <h2 className="text-3xl font-extrabold mb-2 text-yellow-700 dark:text-yellow-300 drop-shadow">وضع أوفلاين</h2>
        <p className="text-lg text-zinc-700 dark:text-zinc-200 mb-8">يمكنك تجربة اللعبة بدون اتصال بالإنترنت.<br/>(ميزة تجريبية)</p>
        <div className="flex flex-col sm:flex-row gap-4 mb-4 w-full justify-center">
          <button
            onClick={() => router.push("/offline/game")}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-yellow-600 to-yellow-400 text-white font-bold shadow-lg hover:from-yellow-700 hover:to-yellow-500 transition"
          >
            ابدأ توزيع الأدوار
          </button>
          <button
            onClick={() => router.push("/offline/dictionary")}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-green-600 to-blue-400 text-white font-bold shadow-lg hover:from-green-700 hover:to-blue-500 transition"
          >
            القاموس
          </button>
        </div>
        <button
          onClick={() => router.push("/")}
          className="px-8 py-3 rounded-full bg-black text-white font-bold shadow hover:bg-gray-900 transition"
        >
          العودة للرئيسية
        </button>
      </main>
    </div>
  );
}
