// src/app/room/[id]/game.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { WORDS } from '@/words';

export default function GameController() {
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

  // Helper: is this user out of the loop?
  const isOut = room.outPlayers?.includes(user.uid);

  // PHASE 1: Role Distribution
  if (room.gameState === 'roles') {
    const [continued, setContinued] = useState(false);
    useEffect(() => {
      if (!continued) return;
      const markContinue = async () => {
        const { arrayUnion, updateDoc, doc } = await import('firebase/firestore');
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
          continued: arrayUnion(user.uid),
        });
      };
      markContinue();
    }, [continued]);
    useEffect(() => {
      if (room.continued?.length === room.players.length) {
        const next = async () => {
          const { updateDoc, doc } = await import('firebase/firestore');
          const roomRef = doc(db, 'rooms', roomId);
          await updateDoc(roomRef, {
            gameState: 'playing',
            continued: [],
          });
        };
        next();
      }
    }, [room.continued, room.players.length, roomId]);
    // عرض صورة اللاعب ودوره
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <img
            src={user.photoURL || '/default-avatar.png'}
            alt={user.displayName || 'player'}
            className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-blue-200"
          />
          <h2 className="text-2xl font-bold mb-2">{user.displayName || 'لاعب'}</h2>
          {isOut ? (
            <div className="text-xl mb-4 text-red-600 font-bold">أنت برا السالفة!</div>
          ) : (
            <div className="text-xl mb-4">الكلمة السرية: <span className="font-bold text-green-600">{room.secretWord}</span></div>
          )}
          <button
            className="bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700 transition mt-4"
            onClick={() => setContinued(true)}
            disabled={continued}
          >
            {continued ? 'بانتظار باقي اللاعبين...' : 'استمرار'}
          </button>
        </div>
      </div>
    );
  }

  // PHASE 2: Turn-Based Word Submission
  if (room.gameState === 'playing') {
    // منطق الدور العشوائي - يجب أن يكون أول شيء
    const [askOrder, setAskOrder] = useState(room.askOrder || []);
    const [currentIndex, setCurrentIndex] = useState(room.askIndex ?? 0);
    const [roundCount, setRoundCount] = useState(room.roundCount ?? 1);
    // باقي المتغيرات
    const [showPopup, setShowPopup] = useState(false);
    const [word, setWord] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const responses = room.responses || [];
    // نافذة منبثقة بعد دورتين
    useEffect(() => {
      if (askOrder.length && currentIndex >= askOrder.length && roundCount >= 2) {
        setShowPopup(true);
      }
    }, [askOrder, currentIndex, roundCount]);

    const handleVoteNow = async () => {
      setShowPopup(false);
      const { updateDoc, doc } = await import('firebase/firestore');
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        gameState: 'voting',
        askOrder: [],
        askIndex: 0,
        roundCount: 1,
      });
    };
    const handleWait = () => {
      setShowPopup(false);
    };
    // إذا لم يوجد ترتيب، أنشئ ترتيب عشوائي
    useEffect(() => {
      if (!askOrder.length && room.players) {
        const shuffled = [...room.players].map(p => p.uid).sort(() => Math.random() - 0.5);
        setAskOrder(shuffled);
        setCurrentIndex(0);
      }
    }, [room.players]);
    // اللاعب الحالي الذي عليه الدور
    const currentUid = askOrder[currentIndex];
    const myTurn = user.uid === currentUid;
    const hasSubmitted = responses.some((r: any) => r.uid === user.uid);
    // عند انتهاء كل اللاعبين، أعد ترتيب جديد وابدأ دورة جديدة
    useEffect(() => {
      if (askOrder.length && currentIndex >= askOrder.length) {
        // إذا أكملنا دورتين، انتقل للتصويت
        if (roundCount >= 2) {
          const moveToVote = async () => {
            const { updateDoc, doc } = await import('firebase/firestore');
            const roomRef = doc(db, 'rooms', roomId);
            await updateDoc(roomRef, {
              gameState: 'voting',
              askOrder: [],
              askIndex: 0,
              roundCount: 1,
            });
          };
          moveToVote();
        } else {
          // دورة جديدة
          const shuffled = [...room.players].map(p => p.uid).sort(() => Math.random() - 0.5);
          setAskOrder(shuffled);
          setCurrentIndex(0);
          setRoundCount(roundCount + 1);
          // حفظ في قاعدة البيانات
          const saveOrder = async () => {
            const { updateDoc, doc } = await import('firebase/firestore');
            const roomRef = doc(db, 'rooms', roomId);
            await updateDoc(roomRef, {
              askOrder: shuffled,
              askIndex: 0,
              roundCount: roundCount + 1,
            });
          };
          saveOrder();
        }
      }
    }, [currentIndex, askOrder, roundCount, room.players, roomId]);
    // عند إرسال الإجابة
    const handleSubmit = async (e: any) => {
      e.preventDefault();
      setErrorMsg('');
      if (!/^[\p{L}0-9]+$/u.test(word.trim()) || word.trim().split(/\s+/).length > 1) {
        setErrorMsg('أدخل كلمة واحدة فقط.');
        return;
      }
      setSubmitting(true);
      const { arrayUnion, updateDoc, doc } = await import('firebase/firestore');
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        responses: arrayUnion({ uid: user.uid, word: word.trim() }),
        askIndex: currentIndex + 1,
      });
      setSubmitting(false);
      setWord('');
    };
    // اسم اللاعب الحالي
    const currentPlayer = room.players?.find((p: any) => p.uid === currentUid);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center relative">
          <h2 className="text-2xl font-bold mb-4">دور الأسئلة</h2>
          <div className="mb-2 text-gray-700">اللاعب الحالي الذي عليه الدور:</div>
          {currentPlayer && (
            <div className="flex flex-col items-center mb-4">
              <img src={currentPlayer.photoURL || '/default-avatar.png'} alt={currentPlayer.name} className="w-16 h-16 rounded-full mb-2 border-2 border-blue-300" />
              <span className="font-bold text-lg text-blue-700">{currentPlayer.name}</span>
            </div>
          )}
          {myTurn ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
              <input
                className="border rounded-lg px-4 py-2 text-center text-lg"
                placeholder="اكتب سؤالك (كلمة واحدة)"
                value={word}
                onChange={e => setWord(e.target.value.replace(/[^\p{L}0-9]/gu, ''))}
                maxLength={20}
                autoFocus
                disabled={submitting}
              />
              {errorMsg && <div className="text-red-500">{errorMsg}</div>}
              <button
                className="bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                type="submit"
                disabled={submitting}
              >
                تم
              </button>
            </form>
          ) : (
            <div className="mt-4 text-gray-500">بانتظار {currentPlayer?.name} ليكتب سؤاله...</div>
          )}
          <div className="mt-6">
            <h3 className="font-semibold mb-2">الأسئلة المكتوبة</h3>
            <ul className="flex flex-col gap-1">
              {responses.map((r: any, i: number) => (
                <li key={i} className="text-gray-700">{room.players.find((p: any) => p.uid === r.uid)?.name}: <span className="font-bold">{r.word}</span></li>
              ))}
            </ul>
          </div>
          {/* نافذة منبثقة بعد دورتين */}
          {showPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl p-8 max-w-xs w-full text-center">
                <h3 className="text-xl font-bold mb-4">انتهت دورتين من الأسئلة!</h3>
                <div className="mb-4">هل تريدون بدء التصويت الآن أم الانتظار قليلاً؟</div>
                <button
                  className="bg-green-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-700 transition mb-2 w-full"
                  onClick={handleVoteNow}
                >
                  يلا نصوت
                </button>
                <button
                  className="bg-gray-300 text-gray-800 py-2 px-6 rounded-lg font-semibold hover:bg-gray-400 transition w-full"
                  onClick={handleWait}
                >
                  لسا شوية
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // PHASE 3: Voting
  if (room.gameState === 'voting') {
    const [voted, setVoted] = useState(false);
    const votes = room.votes || [];
    const hasVoted = votes.some((v: any) => v.voterId === user.uid);
    const handleVote = async (votedId: string) => {
      setVoted(true);
      const { arrayUnion, updateDoc, doc } = await import('firebase/firestore');
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        votes: arrayUnion({ voterId: user.uid, votedId }),
      });
    };
    // قائمة من صوت ومَن لم يصوت
    const votedIds = votes.map((v: any) => v.voterId);
    // Move to results phase
    useEffect(() => {
      if (votes.length === room.players.length) {
        const next = async () => {
          const { updateDoc, doc } = await import('firebase/firestore');
          const roomRef = doc(db, 'rooms', roomId);
          await updateDoc(roomRef, {
            gameState: 'results',
          });
        };
        next();
      }
    }, [votes.length, room.players.length, roomId]);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">التصويت: من برا السالفة؟</h2>
          <div className="mb-2 text-gray-500">كل لاعب يصوت على من يعتقد أنه برا السالفة. لا يمكنك تغيير تصويتك بعد الاختيار.</div>
          {hasVoted ? (
            <div className="mt-4 text-green-600">تم التصويت! في انتظار باقي اللاعبين...</div>
          ) : (
            <div className="flex flex-col gap-2 mt-4">
              {room.players.map((p: any) => (
                <button
                  key={p.uid}
                  className="bg-gray-200 hover:bg-blue-200 text-gray-800 py-2 rounded-lg font-semibold transition flex items-center gap-2 justify-center"
                  onClick={() => handleVote(p.uid)}
                  disabled={voted || hasVoted || p.uid === user.uid}
                >
                  <img src={p.photoURL || '/default-avatar.png'} alt={p.name} className="w-6 h-6 rounded-full" />
                  {p.name}
                </button>
              ))}
            </div>
          )}
          <div className="mt-6 text-right">
            <h3 className="font-semibold mb-2">حالة التصويت:</h3>
            <ul className="flex flex-col gap-1">
              {room.players.map((p: any) => (
                <li key={p.uid} className={votedIds.includes(p.uid) ? "text-green-700" : "text-gray-500"}>
                  {p.name}: {votedIds.includes(p.uid) ? "صوّت" : "لم يصوّت بعد"}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // PHASE 4: Results
  if (room.gameState === 'results') {
    // Tally votes
    const votes = room.votes || [];
    const outPlayers = room.outPlayers || [];
    const votedCounts: Record<string, number> = {};
    votes.forEach((v: any) => {
      votedCounts[v.votedId] = (votedCounts[v.votedId] || 0) + 1;
    });
    // Find who got most votes
    let maxVotes = 0;
    let mostVoted: string[] = [];
    Object.entries(votedCounts).forEach(([uid, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        mostVoted = [uid];
      } else if (count === maxVotes) {
        mostVoted.push(uid);
      }
    });
    // Check if out-of-loop was found
    const outCaught = mostVoted.some(uid => outPlayers.includes(uid));
    const [guess, setGuess] = useState('');
    const [guessing, setGuessing] = useState(false);
    const [guessed, setGuessed] = useState(false);
    const [scoreMsg, setScoreMsg] = useState('');
    // Handle out-of-loop guess
    const handleGuess = async () => {
      setGuessing(true);
      const correct = guess.trim().toLowerCase() === room.secretWord.toLowerCase();
      // Update scores
      const { updateDoc, doc } = await import('firebase/firestore');
      const roomRef = doc(db, 'rooms', roomId);
      let updates: any = { scores: { ...(room.scores || {}) } };
      outPlayers.forEach((uid: string) => {
        updates.scores[uid] = (updates.scores[uid] || 0) + (correct ? 1 : -1);
      });
      votes.forEach((v: any) => {
        if (outPlayers.includes(v.votedId) && outCaught) {
          updates.scores[v.voterId] = (updates.scores[v.voterId] || 0) + 1;
        }
      });
      await updateDoc(roomRef, updates);
      setScoreMsg(correct ? 'إجابة صحيحة! +1 نقطة.' : 'إجابة خاطئة! -1 نقطة.');
      setGuessed(true);
    };
    // Next round
    const handleNextRound = async () => {
      const { WORDS } = await import('@/words');
      // استخدم نفس الفئة المختارة في الغرفة
      const category: keyof typeof WORDS = (room.secretCategory as keyof typeof WORDS) || Object.keys(WORDS)[0] as keyof typeof WORDS;
      const words = WORDS[category] || [];
      const secretWord = words[Math.floor(Math.random() * words.length)] || 'كلمة';
      const outCount = 1;
      const shuffled = [...room.players].sort(() => Math.random() - 0.5);
      const outPlayers = shuffled.slice(0, outCount).map(p => p.uid);
      const { updateDoc, doc } = await import('firebase/firestore');
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        secretWord,
        outPlayers,
        gameState: 'roles',
        responses: [],
        votes: [],
        round: (room.round || 1) + 1,
        continued: [],
      });
    };
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">النتائج</h2>
          <div className="mb-2">الكلمة السرية: <span className="font-bold text-green-600">{room.secretWord}</span></div>
          <div className="mb-2">برا السالفة: {outPlayers.map((uid: string) => room.players.find((p: any) => p.uid === uid)?.name).join(', ')}</div>
          <div className="mb-4">التصويت:
            <ul className="text-right mt-2">
              {room.players.map((p: any) => {
                const vote = votes.find((v: any) => v.voterId === p.uid);
                return (
                  <li key={p.uid} className="mb-1">
                    <span className="font-bold">{p.name}</span>: {vote ? <span>صوّت على <span className="text-blue-700 font-bold">{room.players.find((x: any) => x.uid === vote.votedId)?.name}</span></span> : <span className="text-gray-500">لم يصوّت</span>}
                  </li>
                );
              })}
            </ul>
          </div>
          {outCaught && outPlayers.includes(user.uid) && !guessed && (
            <div className="mb-4">
              <div className="mb-2">تم كشفك! حاول تخمين الكلمة السرية:</div>
              <input
                className="border rounded-lg px-4 py-2 text-center text-lg"
                placeholder="تخمينك"
                value={guess}
                onChange={e => setGuess(e.target.value)}
                maxLength={20}
                autoFocus
                disabled={guessing}
              />
              <button
                className="bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition ml-2"
                onClick={handleGuess}
                disabled={guessing || !guess.trim()}
              >
                إرسال
              </button>
            </div>
          )}
          {scoreMsg && <div className="text-green-600 mb-2">{scoreMsg}</div>}
          <div className="mt-4">
            <h3 className="font-semibold mb-2">النقاط</h3>
            <ul className="flex flex-col gap-1">
              {room.players.map((p: any) => (
                <li key={p.uid}>{p.name}: <span className="font-bold">{room.scores?.[p.uid] || 0}</span></li>
              ))}
            </ul>
          </div>
          <button
            className="bg-green-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-700 transition mt-6"
            onClick={handleNextRound}
          >
            جولة جديدة
          </button>
        </div>
      </div>
    );
  }

  // Fallback
  return <div className="flex items-center justify-center h-screen">Waiting for next phase...</div>;
}
