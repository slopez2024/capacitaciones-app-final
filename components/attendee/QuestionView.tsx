'use client';

import type { QuestionWithOptions } from '@/lib/hooks/useActiveQuestion';
import type { Answer } from '@/lib/supabase/types';

interface Props {
  question: QuestionWithOptions;
  onAnswer: (optionId?: string, answerText?: string) => void;
  answered: boolean;
  sending: boolean;
}

export default function QuestionView({
  question,
  onAnswer,
  answered,
  sending,
}: Props) {
  if (answered) {
    return (
      <div className="text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-green-700">
          ¡Respuesta enviada!
        </h2>
        <p className="text-slate-500 mt-2 text-sm">
          Esperá la próxima pregunta.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
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
              <button
                onClick={() => onAnswer(undefined, 'true')}
                disabled={sending}
                className="w-full border-2 border-green-300 text-green-700 rounded-xl py-3 px-4 font-medium text-sm hover:bg-green-50 transition-all disabled:opacity-50 text-left"
              >
                ✅ Verdadero
              </button>
              <button
                onClick={() => onAnswer(undefined, 'false')}
                disabled={sending}
                className="w-full border-2 border-red-300 text-red-600 rounded-xl py-3 px-4 font-medium text-sm hover:bg-red-50 transition-all disabled:opacity-50 text-left"
              >
                ❌ Falso
              </button>
            </>
          ) : (
            question.question_options
              .sort((a, b) => a.order_num - b.order_num)
              .map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onAnswer(opt.id)}
                  disabled={sending}
                  className="w-full border-2 border-slate-200 text-slate-700 rounded-xl py-3 px-4 font-medium text-sm hover:bg-indigo-50 hover:border-indigo-300 transition-all disabled:opacity-50 text-left"
                >
                  {opt.text}
                </button>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
