'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useActiveQuestion } from '@/lib/hooks/useActiveQuestion';
import Spinner from '@/components/ui/Spinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

export default function JuegoPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const { question, loading } = useActiveQuestion(eventId);
  const [attendeeId, setAttendeeId] = useState<string | null>(null);
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const id = sessionStorage.getItem(`attendee_${eventId}`);
    if (!id) {
      router.push(`/evento/${eventId}`);
      return;
    }
    setAttendeeId(id);
  }, [eventId]);

  // Resetear selección cuando cambia la pregunta
  useEffect(() => {
    setSelected(null);
    setError('');
  }, [question?.id]);

  const handleAnswer = async (optionId?: string, answerText?: string) => {
    if (!attendeeId || !question || sending) return;
    if (answered.has(question.id)) return;

    setSending(true);
    setError('');

    const supabase = createClient();
    const { error: err } = await supabase.from('answers').insert({
      question_id: question.id,
      attendee_id: attendeeId,
      event_id: eventId,
      option_id: optionId || null,
      answer_text: answerText || null,
    });

    if (err) {
      if (err.code === '23505') {
        setAnswered((prev) => new Set([...prev, question.id]));
      } else {
        setError('Error al enviar respuesta.');
      }
    } else {
      setAnswered((prev) => new Set([...prev, question.id]));
    }

    setSending(false);
  };

  if (!attendeeId) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-indigo-700 text-white px-4 py-3 text-center">
        <p className="text-sm font-medium">🎓 CapacitApp</p>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        {loading ? (
          <div className="text-center">
            <Spinner size="lg" />
            <p className="text-slate-500 mt-3 text-sm">Cargando...</p>
          </div>
        ) : !question ? (
          <div className="text-center">
            <div className="text-5xl mb-4">⏳</div>
            <h2 className="text-xl font-bold text-slate-700">
              Esperando pregunta
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              El capacitador aún no lanzó ninguna pregunta.
            </p>
            <div className="mt-4 flex justify-center">
              <div
                className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce mx-1"
                style={{ animationDelay: '0ms' }}
              />
              <div
                className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce mx-1"
                style={{ animationDelay: '150ms' }}
              />
              <div
                className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce mx-1"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>
        ) : answered.has(question.id) ? (
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-700">
              ¡Respuesta enviada!
            </h2>
            <p className="text-slate-500 mt-2 text-sm">
              Esperá la próxima pregunta.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              {/* Imagen opcional */}
              {question.image_url && (
                <img
                  src={question.image_url}
                  alt="Imagen de pregunta"
                  className="w-full rounded-xl mb-4 max-h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}

              <p className="text-slate-800 font-semibold text-base mb-5 leading-snug">
                {question.text}
              </p>

              <div className="space-y-3">
                {question.type === 'true_false' ? (
                  <>
                    <AnswerButton
                      label="✅ Verdadero"
                      color="green"
                      selected={selected === 'true'}
                      onClick={() => {
                        setSelected('true');
                        handleAnswer(undefined, 'true');
                      }}
                      disabled={sending}
                    />
                    <AnswerButton
                      label="❌ Falso"
                      color="red"
                      selected={selected === 'false'}
                      onClick={() => {
                        setSelected('false');
                        handleAnswer(undefined, 'false');
                      }}
                      disabled={sending}
                    />
                  </>
                ) : (
                  question.question_options
                    .sort((a, b) => a.order_num - b.order_num)
                    .map((opt) => (
                      <AnswerButton
                        key={opt.id}
                        label={opt.text}
                        color="indigo"
                        selected={selected === opt.id}
                        onClick={() => {
                          setSelected(opt.id);
                          handleAnswer(opt.id);
                        }}
                        disabled={sending}
                      />
                    ))
                )}
              </div>

              {sending && (
                <div className="flex justify-center mt-4">
                  <Spinner size="sm" />
                </div>
              )}

              <ErrorMessage message={error} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function AnswerButton({
  label,
  color,
  selected,
  onClick,
  disabled,
}: {
  label: string;
  color: 'green' | 'red' | 'indigo';
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  const colors = {
    green: selected
      ? 'bg-green-600 text-white border-green-600'
      : 'bg-white text-green-700 border-green-300 hover:bg-green-50',
    red: selected
      ? 'bg-red-500 text-white border-red-500'
      : 'bg-white text-red-600 border-red-300 hover:bg-red-50',
    indigo: selected
      ? 'bg-indigo-600 text-white border-indigo-600'
      : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || selected}
      className={`w-full border-2 rounded-xl py-3 px-4 font-medium text-sm transition-all text-left ${colors[color]} disabled:cursor-not-allowed`}
    >
      {label}
    </button>
  );
}
