// src/components/TopBar.tsx
'use client';
import { useLang } from '@/components/LanguageProvider';
import { useEffect, useState } from 'react';
import { auth } from '@/firebase';

export default function TopBar() {
  const { lang, setLang, t, dir } = useLang();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(setUser);
    return () => unsub();
  }, []);

  // Save language preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', lang);
    }
  }, [lang]);

  // Load language preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lang');
      if (saved && saved !== lang) setLang(saved as 'en' | 'ar');
    }
    // eslint-disable-next-line
  }, []);

  return (
    <header className={`w-full flex items-center justify-between px-4 py-2 bg-white shadow-sm z-20 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
      <div className="font-bold text-xl tracking-tight text-blue-700 select-none">من خارج الحلقة<br className="sm:hidden"/>Who's Out of the Loop</div>
      <div className="flex items-center gap-3">
        {user && (
          <img src={user.photoURL} alt={user.displayName} className="w-9 h-9 rounded-full border-2 border-blue-300" />
        )}
      </div>
    </header>
  );
}
