'use client';

import { useState, use } from 'react';
import { useAttendees } from '@/lib/hooks/useAttendees';
import { useActiveQuestion } from '@/lib/hooks/useActiveQuestion';
import { useAnswers } from '@/lib/hooks/useAnswers';
import { getEventUrl } from '@/lib/utils/helpers';
import QRDisplay from '@/components/ui/QRDisplay';

type ProjectorView = 'qr' | 'asistentes' | 'pregunta' | 'resultados';

export default function ProjectorPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [view, setView] = useState<ProjectorView>('qr');
  const { attendees } = useAttendees(eventId);
  const { question } = useActiveQuestion(eventId);
  const { answers } = useAnswers(question?.id ?? null);

  const eventUrl = getEventUrl(eventId);
  const total = answers.length;
  const participation =
    attendees.length > 0 ? Math.round((total / attendees.length) * 100) : 0;

  const getCount = (optionId?: string, text?: string) => {
    if (optionId) return answers.filter((a) => a.option_id === optionId).length;
    return answers.filter((a) => a.answer_text === text).length;
  };

  return (
    <div className="min-h-screen bg-indigo-950 text-white flex flex-col">
      {/* Nav proyector */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎓</span>
          <span className="font-bold text-xl">CapacitApp — Proyector</span>
        </div>
        <div className="flex gap-2">
          {[
            { id: 'qr' as ProjectorView, label: '📱 QR' },
            {
              id: 'asistentes' as ProjectorView,
              label: `👥 Asistentes (${attendees.length})`,
            },
            { id: 'pregunta' as ProjectorView, label: '❓ Pregunta' },
            { id: 'resultados' as ProjectorView, label: '📊 Resultados' },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                view === v.id
                  ? 'bg-white text-indigo-900'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        {view === 'qr' && (
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-8">Escaneá para ingresar</h2>
            <QRDisplay url={eventUrl} size={320} />
            <p className="mt-6 text-indigo-300 text-lg">
              {attendees.length} asistentes registrados
            </p>
          </div>
        )}

        {view === 'asistentes' && (
          <div className="w-full max-w-4xl">
            <h2 className="text-3xl font-bold mb-6 text-center">
              👥 Asistentes — {attendees.length}/100
            </h2>
            {attendees.length === 0 ? (
              <p className="text-center text-indigo-300 text-xl">
                Esperando asistentes...
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[70vh] overflow-y-auto">
                {[...attendees].reverse().map((a, i) => (
                  <div
                    key={a.id}
                    className="bg-white/10 rounded-xl px-4 py-3 border border-white/20"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <p className="font-semibold text-white truncate">
                      {a.nombre} {a.apellido}
                    </p>
                    <p className="text-xs text-indigo-300">
                      Legajo: {a.legajo}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'pregunta' && (
          <div className="w-full max-w-3xl text-center">
            {!question ? (
              <div>
                <div className="text-6xl mb-4">⏳</div>
                <p className="text-2xl text-indigo-300">
                  Esperando pregunta activa...
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-indigo-400 uppercase tracking-widest mb-4">
                  {question.type === 'true_false'
                    ? 'Verdadero / Falso'
                    : 'Opción Múltiple'}
                </p>
                {question.image_url && (
                  <img
                    src={question.image_url}
                    alt="Imagen"
                    className="mx-auto rounded-2xl mb-6 max-h-64 object-cover"
                  />
                )}
                <h2 className="text-4xl font-bold mb-8 leading-tight">
                  {question.text}
                </h2>

                {question.type === 'true_false' ? (
                  <div className="flex gap-6 justify-center">
                    <div className="bg-green-500/20 border-2 border-green-400 rounded-2xl px-12 py-6 text-2xl font-bold text-green-300">
                      ✅ Verdadero
                    </div>
                    <div className="bg-red-500/20 border-2 border-red-400 rounded-2xl px-12 py-6 text-2xl font-bold text-red-300">
                      ❌ Falso
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {question.question_options
                      .sort((a, b) => a.order_num - b.order_num)
                      .map((opt, i) => {
                        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
                        return (
                          <div
                            key={opt.id}
                            className="bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-left text-xl font-medium"
                          >
                            <span className="text-indigo-400 font-bold mr-3">
                              {letters[i]}.
                            </span>
                            {opt.text}
                          </div>
                        );
                      })}
                  </div>
                )}

                <div className="mt-6 flex items-center justify-center gap-2 text-indigo-300">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>
                    {total} respuestas · {participation}% participación
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'resultados' && (
          <div className="w-full max-w-3xl">
            {!question ? (
              <p className="text-center text-indigo-300 text-2xl">
                No hay pregunta activa.
              </p>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-2 text-center">
                  {question.text}
                </h2>
                <p className="text-center text-indigo-400 mb-8 text-sm">
                  {total} respuestas · {participation}% participación
                </p>

                <div className="space-y-5">
                  {question.type === 'true_false' ? (
                    <>
                      {[
                        {
                          label: '✅ Verdadero',
                          key: 'true',
                          color: 'bg-green-500',
                        },
                        {
                          label: '❌ Falso',
                          key: 'false',
                          color: 'bg-red-400',
                        },
                      ].map((item) => {
                        const count = getCount(undefined, item.key);
                        const pct =
                          total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={item.key}>
                            <div className="flex justify-between mb-2">
                              <span className="font-semibold text-lg">
                                {item.label}
                              </span>
                              <span className="text-indigo-300">
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className="h-10 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${item.color} rounded-full transition-all duration-700`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    question.question_options
                      .sort((a, b) => a.order_num - b.order_num)
                      .map((opt, i) => {
                        const count = getCount(opt.id);
                        const pct =
                          total > 0 ? Math.round((count / total) * 100) : 0;
                        const colors = [
                          'bg-indigo-500',
                          'bg-purple-500',
                          'bg-blue-500',
                          'bg-teal-500',
                          'bg-orange-500',
                          'bg-pink-500',
                        ];
                        return (
                          <div key={opt.id}>
                            <div className="flex justify-between mb-2">
                              <span className="font-semibold text-lg">
                                {opt.is_correct && '✅ '}
                                {opt.text}
                              </span>
                              <span className="text-indigo-300">
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className="h-10 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  colors[i % colors.length]
                                } rounded-full transition-all duration-700`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
