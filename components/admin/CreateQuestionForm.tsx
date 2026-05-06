'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Question, QuestionOption } from '@/lib/supabase/types'
import CreateQuestionForm from './CreateQuestionForm'

interface QuestionWithOptions extends Question {
  question_options: QuestionOption[]
}

export default function QuestionPanel({ eventId }: { eventId: string }) {
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([])
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)

  const fetchQuestions = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('questions')
      .select('*, question_options(*)')
      .eq('event_id', eventId)
      .order('order_num', { ascending: true })
    if (data) setQuestions(data as QuestionWithOptions[])
  }

  useEffect(() => { fetchQuestions() }, [eventId])

  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) {
      closeActive()
      setCountdown(null)
      return
    }
    const timer = setTimeout(() => setCountdown(prev => prev !== null ? prev - 1 : null), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const activate = async (question: QuestionWithOptions) => {
    setError('')
    const supabase = createClient()
    await supabase.from('questions').update({ is_active: true, is_closed: false }).eq('id', question.id)
    setActiveQuestionId(question.id)
    setCountdown(question.time_limit_seconds || 30)
    fetchQuestions()
  }

  const closeActive = async () => {
    if (!activeQuestionId) return
    const supabase = createClient()
    await supabase.from('questions').update({ is_active: false, is_closed: true }).eq('id', activeQuestionId)
    setActiveQuestionId(null)
    setCountdown(null)
    fetchQuestions()
  }

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('¿Eliminar esta pregunta?')) return
    const supabase = createClient()
    await supabase.from('question_options').delete().eq('question_id', questionId)
    await supabase.from('answers').delete().eq('question_id', questionId)
    await supabase.from('questions').delete().eq('id', questionId)
    fetchQuestions()
  }

  const activeQuestion = questions.find(q => q.is_active)
  const pendingQuestions = questions.filter(q => !q.is_active && !q.is_closed)
  const closedQuestions = questions.filter(q => q.is_closed)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">Preguntas</h3>
        <button
          onClick={() => setShowForm(v => !v)}
          className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          + Nueva pregunta
        </button>
      </div>

      {showForm && (
        <CreateQuestionForm
          eventId={eventId}
          orderNum={questions.length}
          onCreated={() => { fetchQuestions(); setShowForm(false) }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">⚠️ {error}</div>}

      {activeQuestion && (
        <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-700 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block" />
              Pregunta activa
            </span>
            <div className="flex items-center gap-3">
              {countdown !== null && (
                <span className={`text-2xl font-bold ${countdown <= 10 ? 'text-red-600' : 'text-green-700'}`}>
                  ⏱️ {countdown}s
                </span>
              )}
              <button
                onClick={closeActive}
                className="text-sm bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200"
              >
                Cerrar ahora
              </button>
            </div>
          </div>
          <p className="font-medium text-slate-800">{activeQuestion.text}</p>
          <p className="text-xs text-slate-500 mt-1">
            {activeQuestion.type === 'true_false' ? 'Verdadero / Falso' : 'Opción múltiple'} · {activeQuestion.time_limit_seconds}s
          </p>
        </div>
      )}

      {pendingQuestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pendientes</p>
          {pendingQuestions.map(q => (
            <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start gap-3">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0 mt-0.5">
                  {q.type === 'true_false' ? 'V/F' : 'Múltiple'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm">{q.text}</p>
                  <p className="text-xs text-slate-400 mt-1">⏱️ {q.time_limit_seconds}s</p>
                  {q.type === 'multiple_choice' && q.question_options.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {q.question_options.sort((a, b) => a.order_num - b.order_num).map(opt => (
                        <li key={opt.id} className="text-xs text-slate-500 flex items-center gap-1.5">
                          {opt.is_correct ? '✅' : '○'} {opt.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => activate(q)}
                    disabled={!!activeQuestion}
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 disabled:opacity-40"
                  >
                    ▶ Lanzar
                  </button>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="text-xs text-slate-300 hover:text-red-500 px-2 py-1"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {closedQuestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cerradas</p>
          {closedQuestions.map(q => (
            <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-4 opacity-60">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  {q.type === 'true_false' ? 'V/F' : 'Múltiple'}
                </span>
                <p className="text-sm text-slate-600 flex-1">{q.text}</p>
                <span className="text-xs text-slate-400">✓ Cerrada</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {questions.length === 0 && !showForm && (
        <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-slate-200">
          <p>No hay preguntas creadas.</p>
        </div>
      )}
    </div>
  )
}