import React, { useState, useEffect } from 'react';
import { Swords, Plus, Sparkles, HelpCircle, Loader2 } from 'lucide-react';
import QuizCard from '../components/QuizCard';
import { useAppState } from '../context/AppStateContext';
import { apiService } from '../services/apiService';

export default function ClassKuisPage({ cls, quizzes, currentRole, onCreateQuiz }) {
  const { showToast } = useAppState();
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [apiQuizzes, setApiQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);

  const canCreate = currentRole === 'owner' || currentRole === 'admin';

  const fetchQuizzes = async () => {
    if (cls?.id) {
      try {
        setLoading(true);
        const data = await apiService.getKuis(cls.id);
        if (Array.isArray(data)) {
          setApiQuizzes(data);
        }
      } catch (err) {
        console.warn("Failed to fetch kuis from API:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [cls?.id]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const quizData = {
      title: title.trim(),
      timeLimit: Number(timeLimit) || 30,
      questionsCount: 5,
      attemptsCount: 0,
      questions: [
        {
          q: `Soal sampel 1 untuk ${title}?`,
          options: ["Pilihan A", "Pilihan B (Benar)", "Pilihan C", "Pilihan D"],
          correct: 1,
          hint: "Jawaban adalah pilihan B.",
        },
        {
          q: `Soal sampel 2 untuk ${title}?`,
          options: ["Opsi A", "Opsi B", "Opsi C (Benar)", "Opsi D"],
          correct: 2,
          hint: "Jawaban adalah opsi C.",
        },
      ],
    };

    try {
      if (cls?.id) {
        await apiService.createKuis(cls.id, {
          judul: title.trim(),
          deskripsi: `Kuis ${title.trim()}`,
          batas_waktu: Number(timeLimit) || 30,
        });
        await fetchQuizzes();
      }
    } catch (err) {
      console.warn("API createKuis fallback:", err);
    }

    if (onCreateQuiz) {
      onCreateQuiz(quizData);
    }

    showToast(`Kuis "${title}" berhasil diterbitkan!`);
    setTitle('');
    setIsCreating(false);
  };

  const formattedApiQuizzes = apiQuizzes.map(q => ({
    id: q.id,
    classId: cls?.id,
    title: q.judul || q.title,
    timeLimit: q.batas_waktu || 30,
    questionsCount: q.soal_count || q.jumlah_soal || 5,
    attemptsCount: 0,
  }));

  const localQuizzes = quizzes?.filter(q => String(q.classId) === String(cls?.id)) || [];
  
  const classQuizzes = [...formattedApiQuizzes];
  localQuizzes.forEach(lq => {
    if (!classQuizzes.some(aq => String(aq.id) === String(lq.id))) {
      classQuizzes.push(lq);
    }
  });

  return (
    <div className="space-y-6">
      {/* Create Quiz Header for Owner/Admin */}
      {canCreate && (
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-extrabold text-sm">
              <Swords className="w-4 h-4" />
              <span>Manajemen Kuis Kelas</span>
            </div>

            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="bg-primary text-primary-foreground font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Buat Kuis Baru
              </button>
            )}
          </div>

          {isCreating && (
            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Judul Kuis <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ulangan Harian Laravel"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Batas Waktu (Menit)
                </label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="bg-muted text-muted-foreground font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-primary to-primary-glow text-white font-extrabold px-5 py-2 rounded-xl text-xs shadow-glow flex items-center gap-1"
                >
                  Terbitkan Kuis
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Quizzes List */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-lg italic flex items-center gap-2">
          <Swords className="w-5 h-5 text-primary" /> Daftar Kuis &amp; Ujian Kelas
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 bg-card border border-border rounded-3xl">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground font-bold">Memuat kuis...</span>
          </div>
        ) : classQuizzes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classQuizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} classId={cls.id} />
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-3xl p-8 text-center text-muted-foreground text-xs font-bold">
            Belum ada kuis di kelas ini.
          </div>
        )}
      </div>
    </div>
  );
}

