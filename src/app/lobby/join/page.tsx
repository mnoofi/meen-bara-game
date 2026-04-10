// src/app/lobby/join/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

export default function JoinRoomPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        router.replace('/');
        return;
      }
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const code = roomCode.trim().toUpperCase();
    if (!code) return setError('أدخل كود الغرفة.');
    try {
      const roomRef = doc(db, 'rooms', code);
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) {
        setError('Room not found.');
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
      setError('Failed to join room.');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Join Room</h2>
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <input
            className="border rounded-lg px-4 py-2 text-center text-lg tracking-widest uppercase"
            maxLength={6}
            placeholder="كود الغرفة"
            value={roomCode}
            onChange={e => setRoomCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
            autoFocus
          />
          {error && <div className="text-red-500">{error}</div>}
          <button
            className="bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            type="submit"
          >
            Join
          </button>
        </form>
      </div>
    </div>
  );
}
