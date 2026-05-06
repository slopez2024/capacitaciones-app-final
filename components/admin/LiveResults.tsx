'use client';

import type { Answer, Attendee } from '@/lib/supabase/types';
import type { QuestionWithOptions } from '@/lib/hooks/useActiveQuestion';

interface Props {
  question: QuestionWithOptions;
  answers: Answer[];
  attendees: Attendee[];
}

export default function LiveResults({ question, answers, attendees }: Props) {
  const total = answers.length;
  const participation =
    attendees.length > 0 ? Math.round((total / attendees.length) * 100) : 0;

  const getCount = (optionId?: string, text?: string) => {
    if (optionId) return answers.filter((a) => a.option_id === optionId).length;
    return answers.filter((a) => a.answer_text === text).length;
  };

  const renderBar = (
    count: number,
    label: string,
    color: string,
    key: string
  ) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
      <div key={key} className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-slate-700 font-medium">{label}</span>
          <span className="text-slate-500">
            {count} ({pct}%)
          </span>
        </div>
        <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${color} rounded-full transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-700">Resultados en vivo</h3>
        <div className="text-sm text-slate-500">
          {total} respuesta{total !== 1 ? 's' : ''} · {participation}%
          participación
        </div>
      </div>

      <p className="text-slate-600 text-sm mb-4 font-medium">{question.text}</p>

      <div className="space-y-3">
        {question.type === 'true_false'
          ? [
              renderBar(
                getCount(undefined, 'true'),
                '✅ Verdadero',
                'bg-green-500',
                'true'
              ),
              renderBar(
                getCount(undefined, 'false'),
                '❌ Falso',
                'bg-red-400',
                'false'
              ),
            ]
          : question.question_options
              .sort((a, b) => a.order_num - b.order_num)
              .map((opt, i) => {
                const colors = [
                  'bg-indigo-500',
                  'bg-purple-500',
                  'bg-blue-500',
                  'bg-teal-500',
                  'bg-orange-500',
                  'bg-pink-500',
                ];
                return renderBar(
                  getCount(opt.id),
                  `${opt.is_correct ? '✅ ' : ''}${opt.text}`,
                  colors[i % colors.length],
                  opt.id
                );
              })}
      </div>
    </div>
  );
}
