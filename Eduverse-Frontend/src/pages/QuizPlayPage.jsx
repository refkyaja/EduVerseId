import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Heart, Zap, Clock, Lightbulb, Target, Shield, Snowflake, CheckCircle2,
  XCircle, RotateCcw, Home, Eye, X, RefreshCcw, ScanSearch, FastForward, Dice6,
  Package, ChevronRight, ChevronLeft, Check, Square, CheckSquare, Sparkles,
  Trophy, FileText, AlertTriangle, LayoutGrid, Loader2
} from 'lucide-react';
import { ALL_EXAMS_QUESTIONS, SUBJECTS_DATA } from '../data/quizData';
import { useAppState } from '../context/AppStateContext';
import { apiService } from '../services/apiService';
import Button from '../components/Button';

const POWERUPS_DEFINITIONS = [
  { id: 'hint', name: 'Hint', Icon: Lightbulb, color: 'border-warning/40 bg-warning/10 text-warning hover:bg-warning/20', defaultCharges: 3 },
  { id: 'fifty', name: '50:50', Icon: Target, color: 'border-brand-blue/40 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20', defaultCharges: 1 },
  { id: 'shield', name: 'Shield', Icon: Shield, color: 'border-success/40 bg-success/10 text-success hover:bg-success/20', defaultCharges: 1 },
  { id: 'freeze', name: 'Freeze', Icon: Snowflake, color: 'border-sky-500/40 bg-sky-500/10 text-sky-500 hover:bg-sky-500/20', defaultCharges: 1 },
  { id: 'second-chance', name: '2nd Chance', Icon: RefreshCcw, color: 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20', defaultCharges: 1 },
  { id: 'scanner', name: 'Scanner', Icon: ScanSearch, color: 'border-violet-500/40 bg-violet-500/10 text-violet-500 hover:bg-violet-500/20', defaultCharges: 1 },
  { id: 'skip', name: 'Skip', Icon: FastForward, color: 'border-orange-500/40 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20', defaultCharges: 1 },
  { id: 'lucky', name: 'Lucky', Icon: Dice6, color: 'border-xp-gold/40 bg-xp-gold/10 text-xp-gold hover:bg-xp-gold/20', defaultCharges: 1 },
  { id: 'mystery', name: 'Mystery', Icon: Package, color: 'border-pink-500/40 bg-pink-500/10 text-pink-500 hover:bg-pink-500/20', defaultCharges: 1 },
];

const resolveExamMeta = (id) => {
  for (const [key, subj] of Object.entries(SUBJECTS_DATA)) {
    const foundCh = subj.chapters.find(ch => ch.id === id);
    if (foundCh) {
      return {
        subject: subj.name,
        chapter: `${foundCh.label} — ${foundCh.title}`
      };
    }
  }
  return { subject: "PABP", chapter: "Bab 6 — Mari Belajar" };
};

export default function QuizPlayPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { recordExamResult, showToast, quizList } = useAppState();

  const quizId = searchParams.get('quizId') || searchParams.get('exam') || searchParams.get('quiz');
  const classId = searchParams.get('classId');
  const customQuiz = (quizList || []).find(q => String(q.id) === String(quizId));

  const [apiQuestions, setApiQuestions] = useState([]);
  const [apiMeta, setApiMeta] = useState(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  useEffect(() => {
    if (classId && quizId && (!customQuiz || !customQuiz.questions || customQuiz.questions.length === 0)) {
      setIsLoadingApi(true);
      apiService.getKuisDetail(classId, quizId)
        .then(res => {
          if (res) {
            if (res.judul || res.deskripsi) {
              setApiMeta({
                subject: res.judul || 'Kuis Kelas',
                chapter: res.deskripsi || 'Kuis'
              });
            }
            if (Array.isArray(res.soal)) {
              const mapped = res.soal.map((s, sIdx) => {
                const opsiArr = s.opsi || [];
                const correctIdx = opsiArr.findIndex(o => Boolean(o.benar));
                return {
                  id: s.id || sIdx,
                  q: s.pertanyaan,
                  hint: s.pembahasan || '',
                  explanation: s.pembahasan || '',
                  options: opsiArr.map(o => o.teks_opsi),
                  correct: correctIdx >= 0 ? correctIdx : 0,
                  rawOpsiIds: opsiArr.map(o => o.id)
                };
              });
              setApiQuestions(mapped);
            }
          }
        })
        .catch(err => console.warn("Notice: Failed to load API quiz details:", err))
        .finally(() => setIsLoadingApi(false));
    }
  }, [classId, quizId, customQuiz]);

  const rawQuestions = (customQuiz?.questions && customQuiz.questions.length > 0)
    ? customQuiz.questions
    : (apiQuestions.length > 0 ? apiQuestions : (ALL_EXAMS_QUESTIONS[quizId] || []));

  const meta = customQuiz
    ? { subject: customQuiz.title || 'Kuis Kelas', chapter: customQuiz.description || 'Kuis Baru' }
    : (apiMeta || resolveExamMeta(quizId));

  const isBossBattle = Boolean(quizId && (String(quizId).includes('matriks') || String(quizId).includes('bab1')));

  // Quiz phase: 'start' | 'rolling' | 'playing' | 'finished'
  const [quizPhase, setQuizPhase] = useState('start');
  const [isStartingQuiz, setIsStartingQuiz] = useState(false);
  const [unlockedPowerups, setUnlockedPowerups] = useState([]);
  const [rollItems, setRollItems] = useState(['hint', 'fifty', 'shield']);
  const [powerUpCharges, setPowerUpCharges] = useState({});

  // Active prepared questions & options (handles acak_soal & acak_opsi once per session)
  const [activeQuestions, setActiveQuestions] = useState([]);

  // Playing states per question
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [questionLocked, setQuestionLocked] = useState({});
  const [questionResults, setQuestionResults] = useState({}); // 'correct' | 'wrong' | 'lucky' | 'shield_protected' | 'skipped'
  const [secondChancePrompt, setSecondChancePrompt] = useState({});
  const [markedDoubt, setMarkedDoubt] = useState({});

  // Pre-answer power-up states
  const [hintShownForQuestion, setHintShownForQuestion] = useState({});
  const [eliminatedOptionsForQuestion, setEliminatedOptionsForQuestion] = useState({});
  const [scannerForQuestion, setScannerForQuestion] = useState({});
  const [mysteryBonusXp, setMysteryBonusXp] = useState(0);

  // Boss HP
  const [bossHp, setBossHp] = useState(500);

  // Modals
  const [isConfirmExitOpen, setIsConfirmExitOpen] = useState(false);
  const [isReviewOverlayOpen, setIsReviewOverlayOpen] = useState(false);

  const handleGoHome = () => {
    if (classId) {
      navigate(`/class/${classId}/kuis`);
    } else {
      navigate('/quiz');
    }
  };

  const handlePlayAgain = () => {
    setUserAnswers({});
    setQuestionLocked({});
    setQuestionResults({});
    setCurrentQuestionIdx(0);
    setSecondChancePrompt({});
    setMarkedDoubt({});
    setHintShownForQuestion({});
    setEliminatedOptionsForQuestion({});
    setScannerForQuestion({});
    setMysteryBonusXp(0);
    setUnlockedPowerups([]);
    setPowerUpCharges({});
    setActiveQuestions([]);
    setBossHp(500);
    setQuizPhase('start');
  };

  useEffect(() => {
    if (isConfirmExitOpen || isReviewOverlayOpen) {
      document.documentElement.classList.add('overflow-hidden');
      document.body.classList.add('overflow-hidden', 'touch-none');
      return () => {
        document.documentElement.classList.remove('overflow-hidden');
        document.body.classList.remove('overflow-hidden', 'touch-none');
      };
    }
  }, [isConfirmExitOpen, isReviewOverlayOpen]);

  if (isLoadingApi) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-4 animate-fade-in max-w-md mx-auto py-12">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <h2 className="text-lg font-extrabold text-foreground">Memuat Pertanyaan Kuis...</h2>
        <p className="text-xs text-muted-foreground">Sedang mengambil data kuis dari server, mohon tunggu sebentar.</p>
      </div>
    );
  }

  if (!rawQuestions || rawQuestions.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-4 animate-fade-in max-w-md mx-auto py-12">
        <div className="w-16 h-16 rounded-3xl bg-warning/10 text-warning flex items-center justify-center shadow-inner">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold italic text-foreground">Soal Kuis Belum Tersedia</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Kuis ini belum memiliki daftar pertanyaan yang valid.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-extrabold text-xs rounded-xl shadow-glow hover:scale-105 transition-all cursor-pointer"
          >
            <span>Kembali</span>
          </button>
        </div>
      </div>
    );
  }

  const startPowerupRaffle = () => {
    if (isStartingQuiz) return;
    setIsStartingQuiz(true);

    let prepared = rawQuestions.map((q, qIdx) => {
      const opts = (q.options || []).map((text, idx) => ({
        id: (q.rawOpsiIds && q.rawOpsiIds[idx]) !== undefined ? q.rawOpsiIds[idx] : idx,
        text,
        isCorrect: idx === q.correct
      }));
      return {
        id: q.id || qIdx,
        q: q.q || q.pertanyaan,
        hint: q.hint || q.pembahasan || '',
        explanation: q.explanation || q.pembahasan || '',
        originalCorrect: q.correct,
        preparedOptions: opts
      };
    });

    if (customQuiz?.acak_soal) {
      prepared = [...prepared].sort(() => Math.random() - 0.5);
    }
    if (customQuiz?.acak_opsi) {
      prepared = prepared.map(q => ({
        ...q,
        preparedOptions: [...q.preparedOptions].sort(() => Math.random() - 0.5)
      }));
    }
    setActiveQuestions(prepared);

    setQuizPhase('rolling');
    setUnlockedPowerups([]);

    const powerupIds = POWERUPS_DEFINITIONS.map(p => p.id);
    const raffleInterval = setInterval(() => {
      setRollItems([
        powerupIds[Math.floor(Math.random() * powerupIds.length)],
        powerupIds[Math.floor(Math.random() * powerupIds.length)],
        powerupIds[Math.floor(Math.random() * powerupIds.length)],
      ]);
    }, 80);

    setTimeout(() => {
      clearInterval(raffleInterval);
      const shuffled = [...powerupIds].sort(() => Math.random() - 0.5);
      const chosen = shuffled.slice(0, 3);
      setUnlockedPowerups(chosen);
      setRollItems(chosen);

      const initialCharges = {};
      chosen.forEach(id => {
        const def = POWERUPS_DEFINITIONS.find(p => p.id === id);
        initialCharges[id] = def ? def.defaultCharges : 1;
      });
      setPowerUpCharges(initialCharges);

      setTimeout(() => {
        setQuizPhase('playing');
        setIsStartingQuiz(false);
      }, 1400);
    }, 2200);
  };

  const currentQ = activeQuestions[currentQuestionIdx] || activeQuestions[0] || { preparedOptions: [] };

  // ─── AUTO ADVANCE HELPER ──────────────────────────────────────────
  const autoAdvance = (forcedNextIdx) => {
    const targetIdx = forcedNextIdx !== undefined ? forcedNextIdx : currentQuestionIdx + 1;
    if (targetIdx < activeQuestions.length) {
      setCurrentQuestionIdx(targetIdx);
    } else {
      submitQuizFinished();
    }
  };

  // ─── INSTANT LOCK ANSWER SELECTION LOGIC ─────────────────────────
  const selectQuizOption = (optIdx) => {
    if (questionLocked[currentQuestionIdx]) return;

    const selectedOpt = currentQ.preparedOptions[optIdx];
    const isCorrect = selectedOpt.isCorrect;

    // Lock question immediately
    setQuestionLocked(prev => ({ ...prev, [currentQuestionIdx]: true }));
    setUserAnswers(prev => ({ ...prev, [currentQuestionIdx]: optIdx }));
    setSecondChancePrompt(prev => ({ ...prev, [currentQuestionIdx]: false }));

    if (isCorrect) {
      setQuestionResults(prev => ({ ...prev, [currentQuestionIdx]: 'correct' }));
      if (isBossBattle) setBossHp(hp => Math.max(0, hp - 50));
      setTimeout(() => {
        autoAdvance(currentQuestionIdx + 1);
      }, 1600);
      return;
    }

    // ─── ANSWER IS WRONG — EVALUATE POWER-UPS IN EXACT ORDER ──────
    // 1. Lucky Guess (25-30% chance)
    if (unlockedPowerups.includes('lucky') && (powerUpCharges['lucky'] || 0) > 0) {
      const isLuckyHit = Math.random() < 0.28;
      if (isLuckyHit) {
        setPowerUpCharges(prev => ({ ...prev, lucky: 0 }));
        setQuestionResults(prev => ({ ...prev, [currentQuestionIdx]: 'lucky' }));
        showToast("🎲 LUCKY GUESS! Jawaban dianggap benar!");
        setTimeout(() => {
          autoAdvance(currentQuestionIdx + 1);
        }, 1600);
        return;
      }
    }

    // 2. Second Chance (Kesempatan Kedua)
    if (unlockedPowerups.includes('second-chance') && (powerUpCharges['second-chance'] || 0) > 0) {
      setPowerUpCharges(prev => ({ ...prev, 'second-chance': 0 }));
      setQuestionLocked(prev => ({ ...prev, [currentQuestionIdx]: false }));
      setSecondChancePrompt(prev => ({ ...prev, [currentQuestionIdx]: true }));
      showToast("🔄 Kesempatan Kedua! Silakan coba 1x lagi.");
      return;
    }

    // 3. Shield
    if (unlockedPowerups.includes('shield') && (powerUpCharges['shield'] || 0) > 0) {
      setPowerUpCharges(prev => ({ ...prev, shield: 0 }));
      setQuestionResults(prev => ({ ...prev, [currentQuestionIdx]: 'shield_protected' }));
      showToast("🛡️ Perisai melindungi skor kamu!");
      setTimeout(() => {
        autoAdvance(currentQuestionIdx + 1);
      }, 1600);
      return;
    }

    // 4. Normal Wrong
    setQuestionResults(prev => ({ ...prev, [currentQuestionIdx]: 'wrong' }));
    setTimeout(() => {
      autoAdvance(currentQuestionIdx + 1);
    }, 1600);
  };

  const toggleQuizQuestionDoubt = () => {
    setMarkedDoubt(prev => ({ ...prev, [currentQuestionIdx]: !prev[currentQuestionIdx] }));
  };

  // ─── PRE-ANSWER POWER-UP ACTIVATION ──────────────────────────────
  const usePreAnswerPowerup = (powerupId) => {
    if (questionLocked[currentQuestionIdx]) {
      showToast("Soal sudah dikunci, power-up tidak dapat digunakan!");
      return;
    }
    const currentCharge = powerUpCharges[powerupId] || 0;
    if (currentCharge <= 0) return;

    if (powerupId === 'hint') {
      setPowerUpCharges(prev => ({ ...prev, hint: prev.hint - 1 }));
      setHintShownForQuestion(prev => ({ ...prev, [currentQuestionIdx]: true }));
      showToast(`Petunjuk ditampilkan! (Sisa Hint: ${currentCharge - 1})`);
    } else if (powerupId === 'fifty') {
      setPowerUpCharges(prev => ({ ...prev, fifty: 0 }));
      const wrongOptsIdxs = currentQ.preparedOptions
        .map((o, idx) => ({ idx, isCorrect: o.isCorrect }))
        .filter(o => !o.isCorrect)
        .map(o => o.idx)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);
      setEliminatedOptionsForQuestion(prev => ({ ...prev, [currentQuestionIdx]: wrongOptsIdxs }));
      showToast("50:50 diaktifkan! 2 opsi dieliminasi.");
    } else if (powerupId === 'scanner') {
      setPowerUpCharges(prev => ({ ...prev, scanner: 0 }));
      setScannerForQuestion(prev => ({ ...prev, [currentQuestionIdx]: true }));
      showToast("Answer Scanner aktif!");
    } else if (powerupId === 'skip') {
      setPowerUpCharges(prev => ({ ...prev, skip: 0 }));
      setQuestionLocked(prev => ({ ...prev, [currentQuestionIdx]: true }));
      setQuestionResults(prev => ({ ...prev, [currentQuestionIdx]: 'skipped' }));
      showToast("Soal dilewati tanpa minus!");
      setTimeout(() => {
        autoAdvance(currentQuestionIdx + 1);
      }, 1400);
    } else if (powerupId === 'mystery') {
      setPowerUpCharges(prev => ({ ...prev, mystery: 0 }));
      const effects = ['hint', 'fifty', 'skip', 'xp'];
      const chosenEffect = effects[Math.floor(Math.random() * effects.length)];
      if (chosenEffect === 'hint') {
        setHintShownForQuestion(prev => ({ ...prev, [currentQuestionIdx]: true }));
        showToast("Kotak Misteri! Mendapatkan Petunjuk Soal!");
      } else if (chosenEffect === 'fifty') {
        const wrongOptsIdxs = currentQ.preparedOptions
          .map((o, idx) => ({ idx, isCorrect: o.isCorrect }))
          .filter(o => !o.isCorrect)
          .map(o => o.idx)
          .sort(() => Math.random() - 0.5)
          .slice(0, 2);
        setEliminatedOptionsForQuestion(prev => ({ ...prev, [currentQuestionIdx]: wrongOptsIdxs }));
        showToast("Kotak Misteri! Efek 50:50 aktif!");
      } else if (chosenEffect === 'skip') {
        setQuestionLocked(prev => ({ ...prev, [currentQuestionIdx]: true }));
        setQuestionResults(prev => ({ ...prev, [currentQuestionIdx]: 'skipped' }));
        showToast("Kotak Misteri! Soal dilewati!");
        setTimeout(() => {
          autoAdvance(currentQuestionIdx + 1);
        }, 1400);
      } else {
        setMysteryBonusXp(prev => prev + 5);
        showToast("Kotak Misteri! Bonus Instant +5 XP!");
      }
    }
  };

  // ─── SUBMIT QUIZ & SAVE STATE TO BACKEND ─────────────────────────
  const submitQuizFinished = () => {
    setIsReviewOverlayOpen(false);
    let correctCount = 0;
    let earnedXp = 0;

    activeQuestions.forEach((q, idx) => {
      const res = questionResults[idx];
      if (res === 'correct' || res === 'lucky' || res === 'skipped') {
        correctCount++;
        earnedXp += 2;
      }
    });

    earnedXp += mysteryBonusXp;
    recordExamResult(earnedXp, correctCount, activeQuestions.length, meta.subject || 'UMUM', classId);

    // Save power_up_terpakai payload if API class
    if (classId && quizId) {
      const payloadPowerups = {};
      unlockedPowerups.forEach(id => {
        payloadPowerups[id] = powerUpCharges[id] ?? 0;
      });
      const formattedJawaban = activeQuestions.map((q, idx) => {
        const selectedOptIdx = userAnswers[idx];
        const selectedOpt = q.preparedOptions[selectedOptIdx];
        return {
          soal_id: q.id,
          opsi_dipilih_id: selectedOpt?.id || null
        };
      });

      apiService.submitQuizAttempt(classId, quizId, {
        jawaban: formattedJawaban,
        power_up_terpakai: payloadPowerups
      }).catch(() => {});
    }

    setQuizPhase('finished');
  };

  // ─── 1. START INTRO SCREEN ─────────────────────────────────────
  if (quizPhase === 'start') {
    return (
      <div id="quiz-wrapper" className="min-h-screen w-full bg-background relative flex flex-col overflow-x-hidden">
        <header className="px-4 py-3 flex items-center">
          <button
            onClick={handleGoHome}
            className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        </header>

        <main className="flex-1 px-6 flex flex-col justify-center text-center animate-fade-in my-auto">
          <div className="w-40 h-40 mx-auto grid place-items-center">
            <img src="/assets/companion.png" alt="EduVerse" className="w-full h-full object-contain" />
          </div>

          <p className="text-[11px] font-extrabold uppercase tracking-widest text-primary mt-6">
            {meta.subject}
          </p>

          <h1 className="text-3xl font-extrabold italic mt-1 text-balance">
            {meta.chapter}
          </h1>

          <p className="text-sm text-muted-foreground mt-3 max-w-xs mx-auto">
            Saat masuk arena, 3 power-up akan diundi secara acak. Hanya 3 itu yang bisa kamu pakai!
          </p>

          <div className="grid grid-cols-2 gap-2 mt-8 max-w-xs mx-auto w-full">
            <div className="bg-card border border-border rounded-2xl p-3 text-center">
              <p className="text-xl font-extrabold italic tabular-nums">{rawQuestions.length}</p>
              <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">SOAL</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-3 text-center">
              <p className="text-xl font-extrabold italic tabular-nums">3</p>
              <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">POWER</p>
            </div>
          </div>

          <Button
            onClick={startPowerupRaffle}
            loading={isStartingQuiz}
            loadingText="Memulai Kuis..."
            className="mt-10 w-full max-w-xs mx-auto py-4 rounded-2xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-extrabold shadow-glow active:scale-95 transition-all cursor-pointer"
          >
            Mulai Ujian →
          </Button>

          <button
            onClick={handleGoHome}
            className="mt-2 text-sm font-bold text-muted-foreground py-3 block w-full text-center hover:text-foreground cursor-pointer"
          >
            Batal
          </button>
        </main>
      </div>
    );
  }

  // ─── 2. ROLLING SLOT MACHINE ANIMATION SCREEN ─────────────────
  if (quizPhase === 'rolling') {
    const isDone = unlockedPowerups.length > 0;
    return (
      <div className="min-h-screen w-full bg-[#0b0914] text-white flex flex-col items-center justify-center p-6 overflow-hidden relative selection:bg-primary/30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-gradient-to-tr from-purple-900/20 via-primary/20 to-blue-900/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#0b0914_90%)] pointer-events-none" />

        <div className="relative text-center z-10 max-w-lg w-full flex flex-col items-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold italic text-white drop-shadow-md">
            {isDone ? 'Power-Up Terpilih!' : 'Memilih Power-Up...'}
          </h1>

          <div className="flex gap-4 sm:gap-6 mt-10 justify-center">
            {rollItems.map((id, idx) => {
              const pu = POWERUPS_DEFINITIONS.find(p => p.id === id) || POWERUPS_DEFINITIONS[0];
              const IconComp = pu.Icon;
              return (
                <div
                  key={idx}
                  className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl backdrop-blur-2xl border transition-all duration-500 flex flex-col items-center justify-center gap-2 ${
                    isDone
                      ? 'bg-gradient-to-b from-amber-500/10 to-white/[0.02] border-amber-400/60 shadow-[0_0_35px_rgba(251,191,36,0.3)] ring-1 ring-amber-400/30 animate-scale-in'
                      : 'bg-white/[0.04] border-white/10 shadow-lg'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    isDone ? 'bg-amber-400/15 border border-amber-400/30' : 'bg-white/5 border border-white/10'
                  }`}>
                    <IconComp className={`w-5 h-5 sm:w-6 sm:h-6 ${isDone ? 'text-amber-300' : 'text-white'}`} strokeWidth={2.4} />
                  </div>
                  <span className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider ${
                    isDone ? 'text-amber-200' : 'text-white/80'
                  }`}>
                    {pu.name}
                  </span>
                </div>
              );
            })}
          </div>

          {isDone && (
            <div className="mt-10 flex items-center justify-center gap-2.5 text-xs font-semibold text-white/60 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Memasuki arena...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── 3. PLAYING QUESTION ARENA PHASE ───────────────────────────
  if (quizPhase === 'playing') {
    const isLocked = Boolean(questionLocked[currentQuestionIdx]);
    const resState = questionResults[currentQuestionIdx];
    const isDoubt = markedDoubt[currentQuestionIdx];
    const isHintShown = hintShownForQuestion[currentQuestionIdx];
    const isScanned = scannerForQuestion[currentQuestionIdx];
    const hasSecondChanceActive = secondChancePrompt[currentQuestionIdx];
    const elim = eliminatedOptionsForQuestion[currentQuestionIdx] || [];
    const progressPercent = ((currentQuestionIdx + 1) / activeQuestions.length) * 100;
    const answeredCount = Object.keys(userAnswers).length;

    const correctOptIdx = currentQ.preparedOptions.findIndex(o => o.isCorrect);

    return (
      <div id="quiz-wrapper" className="min-h-screen w-full bg-background relative flex flex-col justify-between overflow-x-hidden">
        {/* Sticky Quiz Header Bar */}
        <header className="sticky top-0 bg-background/90 backdrop-blur-xl border-b border-border px-4 md:px-8 py-3 z-30">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setIsConfirmExitOpen(true)}
              className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>

            <div className="text-center flex items-center gap-2">
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">
                {meta.subject || 'UJIAN'}
              </p>
            </div>

            <button
              onClick={() => setIsReviewOverlayOpen(true)}
              className="bg-card border border-border/80 hover:border-primary/30 transition-all rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
            >
              <LayoutGrid className="w-4 h-4 text-foreground" />
              <span className="text-xs font-bold text-foreground font-mono leading-none">{currentQuestionIdx + 1}/{activeQuestions.length}</span>
            </button>
          </div>
        </header>

        {/* Full-width Progress Bar */}
        <div className="h-1.5 w-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Boss HP Bar if Boss Battle */}
        {isBossBattle && (
          <div className="max-w-4xl mx-auto w-full px-4 pt-4">
            <div className="bg-dark-surface border border-brand-blue/30 rounded-2xl p-3 text-white flex items-center justify-between gap-3 shadow-blue-glow">
              <div className="flex items-center gap-2">
                <img src="/assets/boss-matrices.png" alt="Boss" className="w-10 h-10 object-contain animate-float" />
                <div>
                  <p className="text-xs font-extrabold text-danger uppercase tracking-wider">Boss Battle</p>
                  <p className="text-sm font-extrabold italic">Dreadlord Matriks</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full bg-danger rounded-full transition-all duration-300" style={{ width: `${(bossHp / 500) * 100}%` }}></div>
                </div>
                <span className="text-xs font-mono font-bold">{bossHp}/500</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Arena */}
        <main className="flex-1 px-4 md:px-8 py-6 flex flex-col justify-between max-w-4xl mx-auto w-full">
          <div className="space-y-5 animate-fade-in w-full">


            <h1 className="text-xl md:text-2xl font-extrabold leading-snug text-balance text-foreground whitespace-pre-wrap">
              {currentQ.q}
            </h1>

            {/* Hint Box */}
            {isHintShown && currentQ.hint && (
              <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
                <Lightbulb className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <p className="text-xs md:text-sm text-foreground/90 font-medium">{currentQ.hint}</p>
              </div>
            )}

            {/* Scanner Box */}
            {isScanned && (
              <div className="bg-violet-500/10 border border-violet-500/30 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
                <ScanSearch className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                <p className="text-xs md:text-sm text-foreground/90 font-medium">
                  Kemungkinan jawaban: <span className="font-extrabold">{String.fromCharCode(65 + Math.max(0, correctOptIdx))}. {currentQ.preparedOptions[correctOptIdx]?.text}</span>
                </p>
              </div>
            )}

            {/* Options List Stacked Vertically */}
            <div className="flex flex-col gap-3 w-full pt-1">
              {currentQ.preparedOptions.map((opt, idx) => {
                const isEliminated = elim.includes(idx);
                const isUserSelected = userAnswers[currentQuestionIdx] === idx;
                const isCorrectOpt = opt.isCorrect;

                let btnClass = "bg-card border-border hover:border-primary/40";
                let badgeClass = "bg-muted text-muted-foreground";
                let textClass = "text-foreground";
                let indicatorBadge = null;

                if (isEliminated) {
                  btnClass = "opacity-20 line-through bg-muted border-border cursor-not-allowed";
                } else if (isLocked) {
                  if (isUserSelected) {
                    if (resState === 'correct') {
                      btnClass = "border-emerald-500 bg-emerald-500/10 shadow-glow shadow-emerald-500/20";
                      badgeClass = "bg-emerald-500 text-white";
                      textClass = "text-emerald-500 font-extrabold";
                      indicatorBadge = <span className="ml-auto px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold flex items-center gap-1"><Check className="w-3 h-3" /> Benar</span>;
                    } else if (resState === 'lucky') {
                      btnClass = "border-xp-gold bg-xp-gold/15 shadow-glow shadow-xp-gold/30";
                      badgeClass = "bg-xp-gold text-dark-surface font-black";
                      textClass = "text-xp-gold font-extrabold";
                      indicatorBadge = <span className="ml-auto px-2.5 py-0.5 rounded-full bg-xp-gold text-dark-surface text-[10px] font-extrabold flex items-center gap-1">🎲 Lucky Guess</span>;
                    } else {
                      btnClass = "border-danger bg-danger/10";
                      badgeClass = "bg-danger text-white";
                      textClass = "text-danger font-extrabold";
                      indicatorBadge = <span className="ml-auto px-2.5 py-0.5 rounded-full bg-danger text-white text-[10px] font-extrabold flex items-center gap-1"><X className="w-3 h-3" /> Pilihanmu</span>;
                    }
                  } else if (isCorrectOpt && (resState === 'wrong' || resState === 'shield_protected')) {
                    btnClass = "border-emerald-500/70 bg-emerald-500/10 animate-pulse";
                    badgeClass = "bg-emerald-500 text-white";
                    textClass = "text-emerald-500 font-extrabold";
                    indicatorBadge = <span className="ml-auto px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold flex items-center gap-1"><Check className="w-3 h-3" /> Kunci Jawaban</span>;
                  } else {
                    btnClass = "opacity-50 bg-card border-border cursor-not-allowed";
                  }
                } else if (isUserSelected) {
                  btnClass = "border-primary bg-primary/5 shadow-glow";
                  badgeClass = "bg-primary text-primary-foreground";
                  textClass = "text-primary font-bold";
                }

                return (
                  <button
                    key={idx}
                    disabled={isEliminated || isLocked}
                    onClick={() => selectQuizOption(idx)}
                    className={`w-full p-4 text-left rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer ${btnClass}`}
                  >
                    <span className={`w-8 h-8 rounded-lg grid place-items-center text-xs font-extrabold shrink-0 ${badgeClass}`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className={`text-sm md:text-base font-bold leading-snug ${textClass}`}>{opt.text}</span>
                    {indicatorBadge}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer: Power-Ups Dock & Navigation Controls */}
          <div className="mt-8 space-y-4 w-full">
            {/* Unlocked Power-Ups Dock */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">POWER-UP</p>
                {isLocked && <span className="text-[10px] font-bold text-muted-foreground italic">Soal dikunci — Power-up nonaktif</span>}
              </div>
              <div className="flex gap-3 overflow-x-auto pt-2.5 pb-1.5 -mx-1 px-2.5 items-center">
                {POWERUPS_DEFINITIONS.filter(pu => unlockedPowerups.includes(pu.id)).map(pu => {
                  const charges = powerUpCharges[pu.id] || 0;
                  const isUsedUp = charges <= 0;
                  const isDisabled = isLocked || isUsedUp;
                  const IconComp = pu.Icon;

                  return (
                    <button
                      key={pu.id}
                      disabled={isDisabled}
                      onClick={() => usePreAnswerPowerup(pu.id)}
                      className={`relative shrink-0 w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${pu.color} ${
                        isDisabled ? 'opacity-25 grayscale cursor-not-allowed' : 'active:scale-90 cursor-pointer shadow-sm hover:scale-105'
                      }`}
                    >
                      <IconComp className="w-5 h-5" strokeWidth={2.4} />
                      <span className="text-[9px] font-extrabold uppercase">{pu.name}</span>
                      <span className={`absolute -top-2 -right-2 w-5.5 h-5.5 min-w-[22px] min-h-[22px] rounded-full text-[10px] font-extrabold grid place-items-center border-2 border-background shadow-md z-10 ${
                        charges > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {charges}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Row: [Prev] [Ragu-ragu] [Next / Selesai] */}
            <div className="flex gap-3 pt-2 items-center">
              <button
                disabled={currentQuestionIdx === 0}
                onClick={() => setCurrentQuestionIdx(idx => Math.max(0, idx - 1))}
                className="w-12 h-12 rounded-2xl bg-card border border-border text-foreground flex items-center justify-center shrink-0 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:border-primary/20 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>

              <button
                onClick={toggleQuizQuestionDoubt}
                className={`flex-1 h-12 rounded-2xl border-2 font-bold text-xs active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                  isDoubt ? 'bg-warning text-warning-foreground border-warning' : 'border-warning bg-card text-warning'
                }`}
              >
                {isDoubt ? <CheckSquare className="w-4 h-4 text-warning" /> : <Square className="w-4 h-4 text-warning" />}
                Ragu-ragu
              </button>

              {currentQuestionIdx === activeQuestions.length - 1 ? (
                <button
                  onClick={submitQuizFinished}
                  className="flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 font-bold text-xs active:scale-95 transition-all shadow-glow shadow-emerald-500/20 cursor-pointer"
                >
                  Selesai <ChevronRight className="w-4 h-4 text-white" />
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIdx(idx => Math.min(activeQuestions.length - 1, idx + 1))}
                  className="flex-1 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-center gap-1.5 font-bold text-xs active:scale-95 transition-all hover:bg-emerald-200/80 cursor-pointer"
                >
                  Selanjutnya <ChevronRight className="w-4 h-4 text-emerald-800 dark:text-emerald-300" />
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Review Grid Overlay Modal */}
        {isReviewOverlayOpen && createPortal(
          <div className="fixed inset-0 z-[55] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 md:p-4">
            <div onClick={() => setIsReviewOverlayOpen(false)} className="absolute inset-0" />
            <div className="relative w-full max-w-full md:max-w-xl bg-card rounded-t-3xl md:rounded-3xl z-[60] flex flex-col max-h-[85vh] overflow-hidden shadow-2xl border border-border animate-scale-in text-left">
              <div className="px-5 py-4 flex items-center justify-between border-b border-border shrink-0">
                <h2 className="font-extrabold text-lg">Navigasi Soal</h2>
                <button onClick={() => setIsReviewOverlayOpen(false)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-5 gap-2.5">
                  {activeQuestions.map((_, idx) => {
                    const hasAns = userAnswers[idx] !== undefined;
                    const isDbt = markedDoubt[idx];
                    let btnClass = isDbt
                      ? "bg-warning/20 border-warning text-warning"
                      : hasAns
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground";

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentQuestionIdx(idx);
                          setIsReviewOverlayOpen(false);
                        }}
                        className={`aspect-square rounded-xl font-extrabold text-sm border-2 transition-all grid place-items-center cursor-pointer ${btnClass}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
                <div className="space-y-2 text-xs text-muted-foreground pt-2">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-primary"></div><span>Dijawab</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-warning"></div><span>Ragu-ragu</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-card border border-border"></div><span>Belum dijawab</span></div>
                </div>
                <p className="text-center text-sm text-muted-foreground pt-2">
                  Sudah menjawab <span className="font-extrabold text-foreground">{answeredCount}/{activeQuestions.length}</span> soal
                </p>
                <button
                  onClick={submitQuizFinished}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm shadow-glow active:scale-95 hover:scale-[1.01] transition-all cursor-pointer"
                >
                  Kumpulkan Ujian
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Confirm Exit Modal */}
        {isConfirmExitOpen && createPortal(
          <div className="fixed inset-0 z-[55] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 md:p-4">
            <div onClick={() => setIsConfirmExitOpen(false)} className="absolute inset-0" />
            <div className="relative w-full max-w-full md:max-w-md bg-card rounded-t-3xl md:rounded-3xl z-[60] p-6 space-y-4 text-center border border-border shadow-2xl animate-scale-in">
              <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 text-danger" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg">Keluar Ujian?</h3>
                <p className="text-xs text-muted-foreground mt-1">Progres ujian ini tidak akan disimpan.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsConfirmExitOpen(false)}
                  className="flex-1 py-3.5 rounded-2xl bg-card border border-border font-bold text-sm hover:bg-muted transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleGoHome}
                  className="flex-1 py-3.5 rounded-2xl bg-danger text-white font-extrabold text-sm shadow-lg cursor-pointer"
                >
                  Ya, Keluar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  // ─── 4. FINISHED & PEMBAHASAN SOAL PHASE ───────────────────────
  let correctCount = 0;
  let earnedXp = 0;
  activeQuestions.forEach((q, idx) => {
    const res = questionResults[idx];
    if (res === 'correct' || res === 'lucky' || res === 'skipped') {
      correctCount++;
      earnedXp += 2;
    }
  });
  const wrongCount = activeQuestions.length - correctCount;
  const accuracy = Math.round((correctCount / activeQuestions.length) * 100);
  earnedXp += mysteryBonusXp;

  const labelLetters = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className="px-4 md:px-8 py-8 space-y-8 max-w-2xl mx-auto w-full animate-fade-in pb-24">
      {/* Top Header Card */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-card border border-border p-3 mx-auto shadow-inner grid place-items-center">
          <img src="/assets/companion.png" alt="EduVerse" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold italic text-foreground">EduVerse</h1>
          <p className="text-xs font-bold text-muted-foreground mt-0.5">
            Ujian — {meta.chapter || meta.subject || 'Selesai'}
          </p>
        </div>
      </div>

      {/* Accuracy Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-extrabold">
          <span className="text-muted-foreground">Akurasi</span>
          <span className={accuracy >= 80 ? 'text-emerald-500' : accuracy >= 50 ? 'text-amber-500' : 'text-rose-500'}>
            {accuracy}%
          </span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              accuracy >= 80 ? 'bg-emerald-500' : accuracy >= 50 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${accuracy}%` }}
          />
        </div>
      </div>

      {/* 3 Stats Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-950/20 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 text-center">
          <p className="text-2xl font-extrabold italic tabular-nums text-emerald-500 dark:text-emerald-400">{correctCount}</p>
          <p className="text-[10px] font-extrabold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-widest mt-1">BENAR</p>
        </div>
        <div className="bg-rose-950/20 dark:bg-rose-950/40 border border-rose-500/30 rounded-2xl p-4 text-center">
          <p className="text-2xl font-extrabold italic tabular-nums text-rose-500 dark:text-rose-400">{wrongCount}</p>
          <p className="text-[10px] font-extrabold text-rose-600/80 dark:text-rose-400/80 uppercase tracking-widest mt-1">SALAH</p>
        </div>
        <div className="bg-amber-950/20 dark:bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 text-center">
          <p className="text-2xl font-extrabold italic tabular-nums text-amber-500 dark:text-amber-400">+{earnedXp}</p>
          <p className="text-[10px] font-extrabold text-amber-600/80 dark:text-amber-400/80 uppercase tracking-widest mt-1">XP</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handlePlayAgain}
          className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-extrabold text-sm shadow-glow active:scale-95 transition-all cursor-pointer text-center"
        >
          Main Lagi
        </button>
        <button
          onClick={handleGoHome}
          className="flex-1 py-3.5 rounded-2xl bg-card border border-border text-foreground font-extrabold text-sm hover:bg-muted active:scale-95 transition-all cursor-pointer text-center"
        >
          Beranda
        </button>
      </div>

      {/* PEMBAHASAN SOAL SECTION */}
      <div className="space-y-4 pt-4">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          PEMBAHASAN SOAL
        </h3>

        <div className="space-y-4">
          {activeQuestions.map((q, idx) => {
            const userOptIdx = userAnswers[idx];
            const explanationText = q.explanation || q.hint || q.pembahasan;

            return (
              <div
                key={idx}
                className="bg-card border border-border rounded-3xl p-5 space-y-4 shadow-sm text-left"
              >
                {/* Question Header */}
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-muted text-foreground text-xs font-bold shrink-0 grid place-items-center mt-0.5">
                    {idx + 1}
                  </span>
                  <h4 className="text-sm font-extrabold leading-snug text-foreground flex-1">
                    {q.q}
                  </h4>
                </div>

                {/* Options List */}
                <div className="space-y-2.5">
                  {q.preparedOptions.map((opt, oi) => {
                    const isUserAnswer = userOptIdx === oi;
                    const isCorrectAnswer = opt.isCorrect;

                    let optStyle = 'bg-card border border-border/70 text-muted-foreground';
                    let iconRight = null;

                    if (isCorrectAnswer) {
                      optStyle = 'border-2 border-emerald-500/80 bg-emerald-500/10 text-emerald-400 font-bold';
                      iconRight = <Check className="w-4 h-4 text-emerald-400 shrink-0" />;
                    } else if (isUserAnswer && !isCorrectAnswer) {
                      optStyle = 'border-2 border-rose-500/80 bg-rose-500/10 text-rose-400 font-bold';
                      iconRight = <X className="w-4 h-4 text-rose-400 shrink-0" />;
                    }

                    return (
                      <div
                        key={oi}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all text-xs ${optStyle}`}
                      >
                        <span className="w-6 h-6 rounded-lg bg-muted/80 grid place-items-center text-[10px] font-extrabold shrink-0">
                          {labelLetters[oi]}
                        </span>
                        <span className="flex-1 font-bold text-xs leading-relaxed">{opt.text}</span>
                        {iconRight}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation / Pembahasan Box */}
                {explanationText ? (
                  <div className="mt-3 p-4 bg-warning/10 border border-warning/30 rounded-2xl space-y-1.5 animate-fade-in">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-warning">
                      <Lightbulb className="w-4 h-4 shrink-0" />
                      <span>Pembahasan / Penjelasan Jawaban:</span>
                    </div>
                    <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                      {explanationText}
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-muted/30 border border-border/40 rounded-xl text-xs text-muted-foreground italic flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>Kunci jawaban yang benar adalah Opsi {labelLetters[q.preparedOptions.findIndex(o => o.isCorrect) >= 0 ? q.preparedOptions.findIndex(o => o.isCorrect) : 0]}.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
