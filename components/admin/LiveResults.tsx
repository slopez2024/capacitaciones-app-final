'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Answer, Attendee } from '@/lib/supabase/types'
import type { QuestionWithOptions } from '@/lib/hooks/useActiveQuestion'

interface Props {
  question: QuestionWithOptions
  answers: Answer[]
  attendees: Attendee[]
}

interface RankingItem {
  nombre: string
  apellido: string
  legajo: string
  correct: boolean
  time: number
  points: number
}

export default function LiveResults({ question, answers, attendees }: Props) {
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const total = answers.length
  const participation = attendees.length > 0 ? Math.round((total / attendees.length) * 100) : 0

  const getCount = (optionId?: string, text?: string) => {
    if (optionId) return answers.filter(a => a.option_id === optionId).length
    return answers.filter(a => a.answer_text === text).length
  }

  useEffect(() => {
    if (answers.length === 0) { setRanking([]); return }

    const supabase = createClient()

    const attendeeIds = answers.map(a => a.attendee_id)

    supabase
      .from('attendees')
      .select('id, nombre, apellido, legajo')
      .in('id', attendeeIds)
      .then(({ data: atts }) => {
        if (!atts) return

        const correctOptionIds = question.question_options
          .filter(o => o.is_correct)
          .map(o => o.id)

        const items: RankingItem[] = answers.map(answer => {
          const att = (atts as { id: string; nombre: string; apellido: string; legajo: string }[]).find(a => a.id === answer.attendee_id)
          
          let correct = false
          if (question.type === 'true_false') {
            correct = answer.answer_text === 'true'
          } else {
            correct = answer.option_id ? correctOptionIds.includes(answer.option_id) : false
          }

          const time = answer.response_time_ms || 99999
          const points = correct ? Math.max(100, 1000 - Math.floor(time / 100)) : 0

          return {
            nombre: att?.nombre || '',
            apellido: att?.apellido || '',
            legajo: att?.legajo || '',
            correct,
            time,
            points,
          }
        })

        items.sort((a, b) => b.points - a.points || a.time - b.time)
        setRanking(items.slice(0, 5))
      })
  }, [answers, question])

  const renderBar = (count: number, label: string, color: string, key: string) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0
    return (
      <div key={key} className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-slate-700 font-medium">{label}</span>
          <span className="text-slate-500">{count} ({pct}%)</span>
        </div>
        <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-700">Resultados en vivo</h3>
          <div className="text-sm text-slate-500">
            {total} respuesta{total !== 1 ? 's' : ''} · {participation}% participación
          </div>
        </div>

        <p className="text-slate-600 text-sm mb-4 font-medium">{question.text}</p>

        <div className="space-y-3">
          {question.type === 'true_false'
            ? [
                renderBar(getCount(undefined, 'true'), '✅ Verdadero', 'bg-green-500', 'true'),
                renderBar(getCount(undefined, 'false'), '❌ Falso', 'bg-red-400', 'false'),
              ]
            : question.question_options
                .sort((a, b) => a.order_num - b.order_num)
                .map((opt, i) => {
                  const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 'bg-teal-500', 'bg-orange-500', 'bg-pink-500']
                  return renderBar(getCount(opt.id), `${opt.is_correct ? '✅ ' : ''}${opt.text}`, colors[i % colors.length], opt.id)
                })}
        </div>
      </div>

      {ranking.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">🏆 Top 5 ranking</h3>
          <div className="space-y-2">
            {ranking.map((item, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${i === 0 ? 'bg-yellow-50 border border-yellow-200' : i === 1 ? 'bg-slate-50 border border-slate-200' : i === 2 ? 'bg-orange-50 border border-orange-200' : 'bg-white border border-slate-100'}`}>
                <span className="text-2xl font-bold w-8 text-center">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{item.apellido}, {item.nombre}</p>
                  <p className="text-xs text-slate-500">Legajo: {item.legajo}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${item.correct ? 'text-green-600' : 'text-red-400'}`}>
                    {item.points} pts
                  </p>
                  <p className="text-xs text-slate-400">{(item.time / 1000).toFixed(1)}s</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}