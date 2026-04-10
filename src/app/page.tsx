"use client";

import Image from "next/image";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import type { User } from "firebase/auth";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  // حافظ على تسجيل الدخول
  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      setError("");
    } catch (error) {
      setError("حدث خطأ أثناء تسجيل الدخول");
      console.error("Login Error:", error);
    }
  };

  const handleOnline = () => {
    router.push("/lobby");
  };

  const handleOffline = () => {
    router.push("/offline");
  };

  return (
    <div dir="rtl" className="flex flex-col flex-1 items-center justify-center min-h-screen font-sans bg-gradient-to-br from-green-100 via-blue-100 to-yellow-100 dark:from-zinc-900 dark:via-zinc-800 dark:to-black relative">

      {/* زر sign out أعلى يمين الصفحة إذا كان المستخدم مسجل */}
      {user && (
        <button
          onClick={async () => { await signOut(auth); setUser(null); }}
          className="absolute left-6 top-6 bg-red-600 text-white px-5 py-2 rounded-full font-bold hover:bg-red-700 shadow-lg z-50"
        >
          تسجيل الخروج
        </button>
      )}
      {/* ديكور جمالي للخلفية */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute w-[600px] h-[600px] bg-gradient-to-br from-yellow-200 via-green-200 to-blue-200 rounded-full blur-3xl opacity-60 left-[-200px] top-[-200px] animate-pulse"></div>
        <div className="absolute w-[400px] h-[400px] bg-gradient-to-tr from-pink-200 via-purple-200 to-blue-100 rounded-full blur-2xl opacity-50 right-[-100px] bottom-[-100px] animate-pulse"></div>
      </div>
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-32 px-4 bg-white/70 dark:bg-black/80 rounded-3xl shadow-xl relative z-10 min-h-[60vh]">
        <div className="flex flex-col items-center gap-6 text-center w-full">
          <h1 className="max-w-xs text-4xl font-extrabold leading-10 tracking-tight text-black dark:text-yellow-200 drop-shadow-lg">
            مين برا السالفة
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-700 dark:text-zinc-300">
            لعبة جماعية تعتمد على الذكاء والتخمين 🔥<br/>
            حاول تكتشف مين برا السالفة… أو متتفضحش 😏
          </p>
        </div>

        {/* الأزرار */}
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row w-full mt-8">
          {!user ? (
            <button
              onClick={handleLogin}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black text-white px-5 transition-colors hover:bg-gray-800 md:w-[180px]"
            >
              الدخول بحساب Google
            </button>
          ) : (
            <div className="flex flex-col gap-4 w-full sm:flex-row">
              <button
                onClick={handleOnline}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-green-600 text-white px-5 transition-colors hover:bg-green-700 md:w-[180px]"
              >
                أونلاين (مع الأصدقاء)
              </button>
              <button
                onClick={handleOffline}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gray-400 text-white px-5 transition-colors hover:bg-gray-500 md:w-[180px]"
              >
                أوفلاين (بدون نت)
              </button>
            </div>
          )}
        </div>
        {error && <div className="text-red-600 mt-4">{error}</div>}
      </main>
    </div>
  );
}