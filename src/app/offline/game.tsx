"use client";
import { useState } from "react";

const MIN_PLAYERS = 4;
const MAX_PLAYERS = 8;
const WORDS = [
  "تفاحة", "سيارة", "هاتف", "بحر", "كتاب", "قهوة", "قطار", "شمس", "مطار", "موزة"
];

export default function OfflineGame() {
  const [step, setStep] = useState<'setup'|'show'|'done'>('setup');
  const [players, setPlayers] = useState<string[]>(["", "", "", ""]);
  const [playerCount, setPlayerCount] = useState(4);
  const [outCount, setOutCount] = useState(1);
  const [current, setCurrent] = useState(0);
  const [outIndexes, setOutIndexes] = useState<number[]>([]);
  const [secretWord, setSecretWord] = useState("");
  const [revealed, setRevealed] = useState(false);

  // إعداد اللاعبين وعدد برا السالفة
  function handleStart() {
    // اختيار كلمة عشوائية
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    setSecretWord(word);
    // اختيار برا السالفة عشوائياً
    let arr = Array(playerCount).fill(0).map((_,i)=>i);
    arr = arr.sort(()=>Math.random()-0.5).slice(0, outCount);
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
    setPlayers(Array(playerCount).fill(""));
    setCurrent(0);
    setRevealed(false);
    setOutIndexes([]);
    setSecretWord("");
  }

  return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 dark:from-zinc-900 dark:via-zinc-800 dark:to-black p-4">
      <div className="bg-white/90 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center border border-yellow-200">
        {step === 'setup' && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-black">إعداد اللعبة (أوفلاين)</h2>
            <div className="mb-4">
              <label className="block mb-2">عدد اللاعبين:</label>
              <input type="number" min={MIN_PLAYERS} max={MAX_PLAYERS} value={playerCount} onChange={e=>{
                const v = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, Number(e.target.value)));
                setPlayerCount(v);
                setPlayers(Array(v).fill(""));
              }} className="border rounded px-2 py-1 w-20 text-center" />
            </div>
            <div className="mb-4">
              <label className="block mb-2">عدد برا السالفة:</label>
              <select value={outCount} onChange={e=>setOutCount(Number(e.target.value))} className="border rounded px-2 py-1 w-24 text-center">
                <option value={1}>1</option>
                <option value={2}>2</option>
              </select>
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
            <button onClick={handleStart} className="bg-yellow-500 text-white px-6 py-2 rounded-full font-bold hover:bg-yellow-600 mt-4">ابدأ اللعبة</button>
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
            <button onClick={handleReset} className="bg-yellow-500 text-white px-6 py-2 rounded-full font-bold hover:bg-yellow-600 mt-4">إعادة</button>
          </>
        )}
      </div>
    </div>
  );
}
