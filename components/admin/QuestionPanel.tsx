'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Question, QuestionOption } from '@/lib/supabase/types';
import CreateQuestionForm from './CreateQuestionForm';
import ErrorMessage from '@/components/ui/ErrorMessage';

interface QuestionWithOptions extends Question {
  question_options: QuestionOption[];
}

export default function QuestionPanel({ eventId }: { eventId: string }) {
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const fetchQuestions = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('questions')
      .select('*, question_options(*)')
      .eq('event_id', eventId)
      .order('order_num', { ascending: true });

    if (data) setQuestions(data as QuestionWithOptions[]);
  };

  useEffect(() => {
    fetchQuestions();
  }, [eventId]);

  const activate = async (questionId: string) => {
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase
      .from('questions')
      .update({ is_active: true, is_closed: false })
      .eq('id', questionId);

    if (err) setError(err.message);
    else fetchQuestions();
  };

  const close = async (questionId: string) => {
    const supabase = createClient();
    await supabase
      .from('questions')
      .update({ is_active: false, is_closed: true })
      .eq('id', questionId);
    fetchQuestions();
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('¿Eliminar esta pregunta?')) return;
    const supabase = createClient();
    await supabase
      .from('question_options')
      .delete()
      .eq('question_id', questionId);
    await supabase.from('answers').delete().eq('question_id', questionId);
    await supabase.from('questions').delete().eq('id', questionId);
    fetchQuestions();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">Preguntas</h3>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          + Nueva pregunta
        </button>
      </div>

      {showForm && (
        <CreateQuestionForm
          eventId={eventId}
          orderNum={questions.length}
          onCreated={() => {
            fetchQuestions();
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <ErrorMessage message={error} />

      {questions.length === 0 ? (
        <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-slate-200">
          <p>No hay preguntas creadas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div
              key={q.id}
              className={`bg-white rounded-xl border p-4 ${
                q.is_active
                  ? 'border-green-400 shadow-sm'
                  : q.is_closed
                  ? 'border-slate-200 opacity-70'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0 mt-0.5">
                  {q.type === 'true_false' ? 'V/F' : 'Múltiple'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm">{q.text}</p>
                  {q.image_url && (
                    <p className="text-xs text-indigo-500 mt-1">
                      📷 Tiene imagen
                    </p>
                  )}
                  {q.type === 'multiple_choice' &&
                    q.question_options.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {q.question_options
                          .sort((a, b) => a.order_num - b.order_num)
                          .map((opt) => (
                            <li
                              key={opt.id}
                              className="text-xs text-slate-500 flex items-center gap-1.5"
                            >
                              {opt.is_correct ? '✅' : '○'} {opt.text}
                            </li>
                          ))}
                      </ul>
                    )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {q.is_active ? (
                    <button
                      onClick={() => close(q.id)}
                      className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg hover:bg-red-200"
                    >
                      Cerrar
                    </button>
                  ) : !q.is_closed ? (
                    <button
                      onClick={() => activate(q.id)}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200"
                    >
                      Activar
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 px-2 py-1">
                      Cerrada
                    </span>
                  )}
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="text-xs text-slate-300 hover:text-red-500 px-2 py-1"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              {q.is_active && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-600 font-medium">
                    Pregunta activa
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
