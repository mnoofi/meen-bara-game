"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from '@/firebase';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';

export default function LobbyRoomPanel({ user }: { user: any }) {
  const router = useRouter();
  const [mode, setMode] = useState<'none'|'create'|'join'>('none');
  const [roomCode, setRoomCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // توليد كود غرفة مكون من 6 أرقام
  function generateRoomCode() {
    let code = '';
    for (let i = 0; i < 6; i++) code += Math.floor(Math.random() * 10).toString();
    return code;
  }

  const handleCreateRoom = async () => {
    setError('');
    setLoading(true);
    const code = generateRoomCode();
    try {
      await setDoc(doc(db, 'rooms', code), {
        roomId: code,
        hostId: user.uid,
        players: [
          {
            uid: user.uid,
            name: user.displayName,
            photoURL: user.photoURL,
          },
        ],
        status: 'waiting',
        createdAt: serverTimestamp(),
      });
      setCreatedCode(code);
      setMode('create');
    } catch (e) {
      setError('حدث خطأ أثناء إنشاء الغرفة. حاول مجددًا.');
    }
    setLoading(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const code = roomCode.trim();
    if (!code) {
      setError('أدخل كود الغرفة.');
      setLoading(false);
      return;
    }
    try {
      const roomRef = doc(db, 'rooms', code);
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) {
        setError('الغرفة غير موجودة.');
        setLoading(false);
        return;
      }
      const room = roomSnap.data();
      // Check if user already in room
      if (room.players.some((p: any) => p.uid === user.uid)) {
        router.push(`/room/${code}`);
        return;
      }
      await updateDoc(roomRef, {
        players: arrayUnion({
          uid: user.uid,
          name: user.displayName,
          photoURL: user.photoURL,
        }),
      });
      router.push(`/room/${code}`);
    } catch (e) {
      setError('فشل الانضمام للغرفة.');
    }
    setLoading(false);
  };

  // زر العودة
  const handleBack = () => {
    setMode('none');
    setError('');
    setRoomCode('');
    setCreatedCode('');
  };

  if (mode === 'none') {
    // عند الضغط على إنشاء غرفة، أنشئ الغرفة وادخلها فورًا
    return (
      <div className="flex flex-col gap-4 mt-6">
        <button
          className="bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          onClick={async () => {
            setLoading(true);
            setError('');
            const code = generateRoomCode();
            try {
              await setDoc(doc(db, 'rooms', code), {
                roomId: code,
                hostId: user.uid,
                players: [
                  {
                    uid: user.uid,
                    name: user.displayName,
                    photoURL: user.photoURL,
                  },
                ],
                status: 'waiting',
                createdAt: serverTimestamp(),
              });
              router.push(`/room/${code}`);
            } catch (e) {
              setError('حدث خطأ أثناء إنشاء الغرفة. حاول مجددًا.');
            }
            setLoading(false);
          }}
          disabled={loading}
        >
          {loading ? 'جاري الإنشاء...' : 'إنشاء غرفة'}
        </button>
        <button
          className="bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
          onClick={() => setMode('join')}
        >
          الانضمام لغرفة
        </button>
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>
    );
  }

  // أزلنا شاشة create نهائياً

  // join mode
  return (
    <div className="flex flex-col gap-4 mt-6 items-center">
      <form onSubmit={handleJoin} className="flex flex-col gap-4 w-full">
        <input
          className="border rounded-lg px-4 py-2 text-center text-lg tracking-widest"
          maxLength={6}
          placeholder="كود الغرفة"
          value={roomCode}
          onChange={e => setRoomCode(e.target.value.replace(/[^0-9]/g, ''))}
          autoFocus
          disabled={loading}
        />
        {error && <div className="text-red-500">{error}</div>}
        <button
          className="bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          type="submit"
          disabled={loading}
        >
          {loading ? 'جاري الانضمام...' : 'انضمام'}
        </button>
        <button
          className="bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
          type="button"
          onClick={handleBack}
        >
          رجوع
        </button>
      </form>
    </div>
  );
}