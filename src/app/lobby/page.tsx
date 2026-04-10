
'use client';
import LobbyRoomPanel from './LobbyRoomPanel';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function LobbyPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.replace('/');
        return;
      }
      setUser(firebaseUser);
      // Store user in Firestore
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 via-blue-100 to-yellow-100 dark:from-zinc-900 dark:via-zinc-800 dark:to-black relative p-4">
      {/* زخرفة خلفية */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute w-[350px] h-[350px] bg-gradient-to-br from-yellow-300 via-pink-200 to-blue-200 rounded-full blur-3xl opacity-30 left-[-80px] top-[-80px] animate-pulse"></div>
        <div className="absolute w-[250px] h-[250px] bg-gradient-to-tr from-green-200 via-blue-100 to-yellow-100 rounded-full blur-2xl opacity-20 right-[-60px] bottom-[-60px] animate-pulse"></div>
      </div>
      <div className="bg-white/90 dark:bg-zinc-900/90 rounded-3xl shadow-2xl p-10 w-full max-w-md text-center border border-green-300 dark:border-zinc-700 relative z-10">
        <img src={user.photoURL} alt="avatar" className="w-16 h-16 rounded-full mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Welcome, {user.displayName}!</h2>
        <p className="mb-6 text-gray-500">Ready to play Who's Out of the Loop?</p>
        <LobbyRoomPanel user={user} />
      </div>
    </div>
  );
}
