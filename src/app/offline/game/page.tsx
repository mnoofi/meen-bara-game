"use client";
import { useState } from "react";

const MIN_PLAYERS = 4;
const MAX_PLAYERS = 8;
const WORDS_DICT = {
  clothes: ["قميص", "بنطلون", "جاكيت", "فستان", "حذاء", "قبعة", "تيشيرت", "بدلة"],
  jobs: ["طبيب", "مهندس", "مدرس", "محامي", "شرطي", "ممرض", "سائق", "مزارع"],
  food: ["بيتزا", "كشري", "فول", "شاورما", "رز", "سمك", "دجاج", "بطاطس"],
  adult: ["سيجارة", "خمر", "حبوب", "ملهى", "راقصة", "كازينو", "مخدرات"],
  things: ["كرسي", "مكتب", "باب", "نافذة", "هاتف", "كمبيوتر", "سيارة", "ساعة"]
};
const ALL_CATEGORIES = Object.keys(WORDS_DICT);

export default function OfflineGame() {
  const [step, setStep] = useState<'setup'|'show'|'done'|'reveal'>('setup');
  const [players, setPlayers] = useState<string[]>(Array(MIN_PLAYERS).fill(""));
  const [playerCount, setPlayerCount] = useState(MIN_PLAYERS);
  const [outCount, setOutCount] = useState(1);
  const [current, setCurrent] = useState(0);
  const [outIndexes, setOutIndexes] = useState<number[]>([]);
  const [secretWord, setSecretWord] = useState("");
  const [revealed, setRevealed] = useState(false);

  // إعداد اللاعبين وعدد برا السالفة
  function handleStart() {
    // جلب التصنيفات المختارة من localStorage أو كل التصنيفات افتراضياً
    let selected = [];
    if (typeof window !== "undefined") {
      try {
        selected = JSON.parse(window.localStorage.getItem("dictionary_selected") || "null") || ALL_CATEGORIES;
      } catch { selected = ALL_CATEGORIES; }
    } else {
      selected = ALL_CATEGORIES;
    }
    // تجميع الكلمات من التصنيفات المختارة
    const allWords = selected.flatMap((key: string) => WORDS_DICT[key as keyof typeof WORDS_DICT]);
    // اختيار كلمة عشوائية
    const word = allWords[Math.floor(Math.random() * allWords.length)] || "كلمة";
    setSecretWord(word);
    // اختيار برا السالفة عشوائي بالكامل (shuffle حقيقي)
    let arr = Array(playerCount).fill(0).map((_,i)=>i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    arr = arr.slice(0, outCount);
    setOutIndexes(arr);
    setStep('show');
    setCurrent(0);
    setRevealed(false);
  }

  // عرض الدور والكلمة لكل لاعب
  function handleReveal() {
    setRevealed(true);
  }
  function handleNext() {
    setRevealed(false);
    if (current < playerCount - 1) {
      setCurrent(current+1);
    } else {
      setStep('done');
    }
  }

  // إعادة اللعبة
  function handleReset() {
    setStep('setup');
    // لا تصفر أسماء اللاعبين
    setCurrent(0);
    setRevealed(false);
    setOutIndexes([]);
    setSecretWord("");
  }

  return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-200 via-green-100 to-blue-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-black relative p-4">
      {/* زخرفة خلفية */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute w-[350px] h-[350px] bg-gradient-to-br from-yellow-300 via-pink-200 to-blue-200 rounded-full blur-3xl opacity-30 left-[-80px] top-[-80px] animate-pulse"></div>
        <div className="absolute w-[250px] h-[250px] bg-gradient-to-tr from-green-200 via-blue-100 to-yellow-100 rounded-full blur-2xl opacity-20 right-[-60px] bottom-[-60px] animate-pulse"></div>
      </div>
      <div className="bg-zinc-900/90 rounded-3xl shadow-2xl p-10 w-full max-w-md text-center border border-yellow-700 relative z-10">
        {step === 'setup' && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-yellow-300">إعداد اللعبة (أوفلاين)</h2>
            <div className="mb-4">
              <label className="block mb-2">عدد اللاعبين:</label>
              <input type="number" min={MIN_PLAYERS} max={MAX_PLAYERS} value={playerCount} onChange={e=>{
                const v = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, Number(e.target.value)));
                setPlayerCount(v);
                setPlayers(Array(v).fill(""));
              }} className="border rounded px-2 py-1 w-20 text-center" />
              <div className="text-xs text-gray-500 mt-1">الحد الأدنى {MIN_PLAYERS} والحد الأقصى {MAX_PLAYERS}</div>
            </div>
            <div className="mb-4">
              <label className="block mb-2">عدد برا السالفة:</label>
              <select value={outCount} onChange={e=>setOutCount(Number(e.target.value))} className="border rounded px-2 py-1 w-24 text-center">
                <option value={1}>1</option>
                <option value={2}>2</option>
              </select>
              <div className="text-xs text-gray-500 mt-1">يمكن اختيار 1 أو 2 فقط</div>
            </div>
            <div className="mb-4">
              <label className="block mb-2">أسماء اللاعبين:</label>
              {players.map((name, i) => (
                <input key={i} type="text" value={name} onChange={e=>{
                  const arr = [...players];
                  arr[i] = e.target.value;
                  setPlayers(arr);
                }} placeholder={`لاعب ${i+1}`} className="border rounded px-2 py-1 m-1 w-32 text-center" />
              ))}
            </div>
            <button onClick={handleStart} className="bg-yellow-600 text-white px-6 py-2 rounded-full font-bold hover:bg-yellow-700 mt-4 shadow-lg">ابدأ توزيع الأدوار</button>
          </>
        )}
        {step === 'show' && (
          <>
            <h2 className="text-xl font-bold mb-4 text-black">دور <span className="text-yellow-700">{players[current] || `لاعب ${current+1}`}</span></h2>
            {!revealed ? (
              <button onClick={handleReveal} className="bg-blue-500 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-600">إظهار الدور</button>
            ) : (
              <div className="my-6">
                {outIndexes.includes(current) ? (
                  <div className="text-2xl font-bold text-red-600">أنت برا السالفة!</div>
                ) : (
                  <div>
                    <div className="text-lg mb-2">الكلمة السرية:</div>
                    <div className="text-2xl font-extrabold text-green-700 bg-green-100 px-6 py-2 rounded-xl shadow-inner border-2 border-green-400 select-all">{secretWord}</div>
                  </div>
                )}
              </div>
            )}
            {revealed && (
              <button onClick={handleNext} className="bg-gray-700 text-white px-6 py-2 rounded-full font-bold hover:bg-gray-800 mt-4">التالي</button>
            )}
          </>
        )}
        {step === 'done' && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-black">تم توزيع الأدوار!</h2>
            <div className="mb-4 text-gray-700">ابدأوا اللعب الآن حسب القواعد 👆</div>
            <button onClick={()=>setStep('reveal')} className="bg-red-600 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700 mt-4">إظهار الامبوستر</button>
          </>
        )}
        {step === 'reveal' && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-red-700">اللاعبون برا السالفة:</h2>
            <ul className="mb-4">
              {outIndexes.map(idx => (
                <li key={idx} className="text-lg font-bold text-red-600">
                  {players[idx] || `لاعب ${idx+1}`}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2 items-center mt-4">
              <button onClick={handleStart} className="bg-yellow-600 text-white px-6 py-2 rounded-full font-bold hover:bg-yellow-700">إعادة توزيع الأدوار</button>
              <button onClick={()=>setStep('setup')} className="bg-gray-700 text-white px-6 py-2 rounded-full font-bold hover:bg-gray-800">تعديل الأسماء/العدد</button>
              <button onClick={()=>window.location.assign('/offline/dictionary')} className="bg-gradient-to-r from-green-600 to-blue-400 text-white font-bold px-6 py-2 rounded-full shadow hover:from-green-700 hover:to-blue-500 mt-2">القاموس</button>
            </div>
          </>
        )}
      </div>
      {/* زر العودة لاختيار الوضع خارج منطقة اللعب */}
      <div className="flex justify-center mt-8">
        <button onClick={()=>window.location.assign('/')} className="bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-900 text-lg shadow-lg">العودة لاختيار الوضع</button>
      </div>
    </div>
  );
}
