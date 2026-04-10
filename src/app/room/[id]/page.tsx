// src/app/room/[id]/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params?.id as string;
  const [user, setUser] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        router.replace('/');
        return;
      }
      setUser(firebaseUser);
    });
    return () => unsubAuth();
  }, [router]);

  useEffect(() => {
    if (!roomId) return;
    const roomRef = doc(db, 'rooms', roomId);
    const unsubRoom = onSnapshot(roomRef, (snap) => {
      if (!snap.exists()) {
        setError('Room not found.');
        setLoading(false);
        return;
      }
      setRoom(snap.data());
      setLoading(false);
    });
    return () => unsubRoom();
  }, [roomId]);

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (error) return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
  if (!room) return null;

  return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 via-blue-100 to-yellow-100 dark:from-zinc-900 dark:via-zinc-800 dark:to-black relative p-4">
      {/* زخرفة خلفية */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute w-[350px] h-[350px] bg-gradient-to-br from-yellow-300 via-pink-200 to-blue-200 rounded-full blur-3xl opacity-30 left-[-80px] top-[-80px] animate-pulse"></div>
        <div className="absolute w-[250px] h-[250px] bg-gradient-to-tr from-green-200 via-blue-100 to-yellow-100 rounded-full blur-2xl opacity-20 right-[-60px] bottom-[-60px] animate-pulse"></div>
      </div>
      <div className="bg-white/90 dark:bg-zinc-900/90 rounded-3xl shadow-2xl p-10 w-full max-w-md text-center border border-green-300 dark:border-zinc-700 relative z-10">
        <button
          className="absolute right-4 top-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-1 rounded-full font-bold shadow"
          onClick={() => router.push('/lobby')}
        >
          رجوع
        </button>
        <h2 className="text-2xl font-bold mb-2 text-black">كود الغرفة:</h2>
        <div className="flex justify-center mb-4">
          <span className="tracking-widest text-3xl font-extrabold text-green-700 bg-green-100 px-6 py-2 rounded-xl shadow-inner border-2 border-green-400 select-all" style={{letterSpacing: '0.2em'}}>{room.roomId}</span>
        </div>
        <div className="mb-4 text-gray-600">شارك الكود مع أصدقائك لدخول الغرفة!</div>
        <div className="mb-6">
          <div className="mb-1 text-green-700 font-bold text-lg">عدد اللاعبين في الغرفة: <span className="text-black dark:text-white">{room.players.length}</span></div>
          <h3 className="font-semibold mb-2 text-green-800">اللاعبون</h3>
          <ul className="flex flex-col gap-2">
            {room.players.map((p: any) => (
              <li key={p.uid} className={`flex items-center gap-2 justify-center ${room.hostId === p.uid ? 'font-bold text-blue-700' : ''}`}>
                <img src={p.photoURL} alt={p.name} className="w-8 h-8 rounded-full border-2 border-green-300" />
                {p.name}
                {room.hostId === p.uid && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">المضيف</span>}
              </li>
            ))}
          </ul>
        </div>
        {user && user.uid === room.hostId && room.status === 'waiting' && (
          <button
            className="bg-gradient-to-r from-green-600 to-blue-500 text-white py-2 px-6 rounded-full font-bold hover:from-green-700 hover:to-blue-600 transition w-full shadow-lg text-lg"
            onClick={async () => {
              // Only allow if enough players
              if (room.players.length < 4) {
                alert('يجب أن يكون هناك 4 لاعبين على الأقل.');
                return;
              }
              // Select secret word and out-of-loop players
              const { WORDS } = await import('@/words');
              const secretWord = WORDS[Math.floor(Math.random() * WORDS.length)];
              const outCount = 1; // You can make this configurable
              const shuffled = [...room.players].sort(() => Math.random() - 0.5);
              const outPlayers = shuffled.slice(0, outCount).map(p => p.uid);
              // Update Firestore
              const { doc, updateDoc } = await import('firebase/firestore');
              const roomRef = doc(db, 'rooms', room.roomId);
              await updateDoc(roomRef, {
                secretWord,
                outPlayers,
                gameState: 'roles',
                responses: [],
                votes: [],
                round: (room.round || 1),
                status: 'started',
              });
              router.push(`/room/${room.roomId}/game`);
            }}
          >
            Start Game
          </button>
        )}
        {room.status === 'started' && (
          <button
            className="bg-blue-500 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-600 transition w-full mt-4"
            onClick={() => router.push(`/room/${room.roomId}/game`)}
          >
            Go to Game
          </button>
        )}
      </div>
    </div>
  );
}
