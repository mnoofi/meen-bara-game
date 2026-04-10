// src/app/lobby/create/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// توليد كود غرفة مكون من 6 أرقام فقط
function generateRoomCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

export default function CreateRoomPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.replace('/');
        return;
      }
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleCreateRoom = async () => {
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
      setError('Failed to create room. Try again.');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Create Room</h2>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <button
          className="bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700 transition w-full"
          onClick={handleCreateRoom}
        >
          Generate Room
        </button>
      </div>
    </div>
  );
}
