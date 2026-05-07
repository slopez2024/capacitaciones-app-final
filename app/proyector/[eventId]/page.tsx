'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAttendees } from '@/lib/hooks/useAttendees'
import { getEventUrl } from '@/lib/utils/helpers'
import QRDisplay from '@/components/ui/QRDisplay'

interface Question {
  id: string
  text: string
  type: string
  image_url: string | null
  is_active: boolean
  is_closed: boolean
  order_num: number
  time_limit_seconds: number
  question_options: { id: string; text: string; is_correct: boolean; order_num: number }[]
}

interface Answer {
  id: string
  question_id: string
  option_id: string | null
  answer_text: string | null
  attendee_id: string
}

interface RankingItem {
  nombre: string
  apellido: string
  legajo: string
  points: number
  correct: number
}

type ProjectorView = 'waiting' | 'question' | 'results' | 'podium'

export default function ProjectorPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
  const { attendees } = useAttendees(eventId)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [view, setView] = useState<ProjectorView>('waiting')
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [eventCode, setEventCode] = useState<number | null>(null)

  const eventUrl = getEventUrl(eventId)

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('events')
      .select('code')
      .eq('id', eventId)
      .single()
      .then(({ data }) => { if (data) setEventCode((data as { code: number }).code) })

    supabase
      .from('questions')
      .select('*, question_options(*)')
      .eq('event_id', eventId)
      .order('order_num', { ascending: true })
      .then(({ data }) => { if (data) setQuestions(data as Question[]) })
  }, [eventId])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`answers:${eventId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'answers', filter: `event_id=eq.${eventId}` },
        (payload) => setAnswers(prev => [...prev, payload.new as Answer])
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [eventId])

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) {
      if (timeLeft === 0) showResults()
      return
    }
    const timer = setTimeout(() => setTimeLeft(prev => prev !== null ? prev - 1 : null), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft])

  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswers = answers.filter(a => a.question_id === currentQuestion?.id)
  const allAnswered = attendees.length > 0 && currentAnswers.length >= attendees.length

  useEffect(() => {
    if (allAnswered && view === 'question') showResults()
  }, [allAnswered, view])

  const launchQuestion = async (index: number) => {
    const q = questions[index]
    if (!q) return
    const supabase = createClient()
    await supabase.from('questions').update({ is_active: false, is_closed: true }).eq('event_id', eventId).neq('id', q.id)
    await supabase.from('questions').update({ is_active: true, is_closed: false }).eq('id', q.id)
    setCurrentQuestionIndex(index)
    setView('question')
    setTimeLeft(q.time_limit_seconds)
  }

  const showResults = async () => {
    if (!currentQuestion) return
    const supabase = createClient()
    await supabase.from('questions').update({ is_active: false, is_closed: true }).eq('id', currentQuestion.id)
    setTimeLeft(null)
    setView('results')
  }

  const nextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1
    if (nextIndex >= questions.length) {
      buildPodium()
      setView('podium')
    } else {
      launchQuestion(nextIndex)
    }
  }

  const buildPodium = async () => {
    const supabase = createClient()
    const { data: allAnswers } = await supabase
      .from('answers')
      .select('*, attendees(*), question_options(*)')
      .eq('event_id', eventId)

    if (!allAnswers) return

    const scores: { [attendeeId: string]: RankingItem } = {}

    for (const answer of allAnswers) {
      const att = (answer as unknown as { attendees: { id: string; nombre: string; apellido: string; legajo: string } }).attendees
      if (!att) continue

      if (!scores[att.id]) {
        scores[att.id] = { nombre: att.nombre, apellido: att.apellido, legajo: att.legajo, points: 0, correct: 0 }
      }

      const question = questions.find(q => q.id === answer.question_id)
      if (!question) continue

      let correct = false
      if (question.type === 'true_false') {
        const correctOpt = question.question_options.find(o => o.is_correct)
        correct = answer.answer_text === (correctOpt?.text === 'Verdadero' ? 'true' : 'false')
      } else {
        const correctOptions = question.question_options.filter(o => o.is_correct).map(o => o.id)
        correct = answer.option_id ? correctOptions.includes(answer.option_id) : false
      }

      if (correct) {
        const time = (answer as unknown as { response_time_ms: number }).response_time_ms || 99999
        scores[att.id].points += Math.max(100, 1000 - Math.floor(time / 100))
        scores[att.id].correct += 1
      }
    }

    const sorted = Object.values(scores).sort((a, b) => b.points - a.points).slice(0, 5)
    setRanking(sorted)
  }

  const timePercent = currentQuestion ? ((timeLeft || 0) / currentQuestion.time_limit_seconds) * 100 : 0
  const timeColor = timeLeft !== null && timeLeft <= 10 ? '#ef4444' : timeLeft !== null && timeLeft <= 20 ? '#f59e0b' : '#10b981'

  // Ordenar asistentes por legajo
  const sortedAttendees = [...attendees].sort((a, b) => a.legajo.localeCompare(b.legajo, undefined, { numeric: true }))

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col overflow-hidden">
      <header className="flex items-center justify-between px-8 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎓</span>
          <span className="font-bold text-lg text-gradient">CapacitApp</span>
        </div>
        <div className="flex items-center gap-4">
          {eventCode && (
            <div className="text-center">
              <p className="text-xs text-white/40 uppercase tracking-widest">Código</p>
              <p className="text-2xl font-bold text-white tracking-widest">{eventCode}</p>
            </div>
          )}
          <span className="text-sm text-white/50">{attendees.length} asistentes</span>
          {view === 'waiting' && (
            <button
              onClick={() => launchQuestion(0)}
              disabled={questions.length === 0}
              className="gradient-primary px-6 py-2 rounded-xl font-semibold text-sm disabled:opacity-40"
            >
              ▶ Iniciar capacitación
            </button>
          )}
          {view === 'question' && (
            <button onClick={showResults} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-medium">
              Cerrar pregunta
            </button>
          )}
          {view === 'results' && (
            <button onClick={nextQuestion} className="gradient-primary px-6 py-2 rounded-xl font-semibold text-sm">
              {currentQuestionIndex + 1 >= questions.length ? '🏆 Ver podio' : 'Siguiente →'}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">

        {/* WAITING */}
        {view === 'waiting' && (
          <div className="w-full max-w-6xl">
            <div className="grid grid-cols-2 gap-12 items-center">
              {/* QR y código */}
              <div className="text-center">
                <QRDisplay url={eventUrl} size={260} />
                <div className="mt-6">
                  <p className="text-white/50 text-sm mb-1">O ingresá el código en</p>
                  <p className="text-white font-bold text-lg">capacitaciones-app-final.vercel.app</p>
                  {eventCode && (
                    <div className="mt-3 inline-block bg-white/10 rounded-2xl px-8 py-3">
                      <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Código</p>
                      <p className="text-5xl font-black text-white tracking-widest">{eventCode}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Asistentes */}
              <div>
                <h3 className="text-white/50 text-sm uppercase tracking-widest mb-4">
                  {attendees.length} asistentes registrados · {questions.length} preguntas
                </h3>
                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-2">
                  {sortedAttendees.map(a => (
                    <div key={a.id} className="glass rounded-xl px-3 py-2 flex items-center gap-2">
                      <span className="text-indigo-300 text-xs font-mono font-bold shrink-0">{a.legajo}</span>
                      <span className="text-white text-sm truncate">{a.nombre} {a.apellido}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QUESTION */}
        {view === 'question' && currentQuestion && (
          <div className="w-full max-w-5xl">
            <div className="flex items-center justify-between mb-6">
              <span className="text-white/50 text-sm">
                Pregunta {currentQuestionIndex + 1} de {questions.length}
              </span>
              <span className="text-white/50 text-sm">
                {currentAnswers.length}/{attendees.length} respondieron
              </span>
            </div>

            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-white/50">Tiempo restante</span>
                <span className="font-bold text-xl" style={{ color: timeColor }}>{timeLeft}s</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${timePercent}%`, backgroundColor: timeColor }}
                />
              </div>
            </div>

            {currentQuestion.image_url && (
              <img src={currentQuestion.image_url} alt="" className="w-full max-h-96 object-contain rounded-2xl mb-6" />
            )}
            <h2 className="text-4xl font-bold text-center mb-8 leading-tight">{currentQuestion.text}</h2>

            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.type === 'true_false' ? (
                <>
                  <div className="glass rounded-2xl p-6 text-center text-2xl font-bold text-green-400 border border-green-500/30">✅ Verdadero</div>
                  <div className="glass rounded-2xl p-6 text-center text-2xl font-bold text-red-400 border border-red-500/30">❌ Falso</div>
                </>
              ) : (
                currentQuestion.question_options
                  .sort((a, b) => a.order_num - b.order_num)
                  .map((opt, i) => {
                    const letters = ['A', 'B', 'C', 'D', 'E', 'F']
                    const colors = ['border-indigo-500/30 text-indigo-300', 'border-purple-500/30 text-purple-300', 'border-cyan-500/30 text-cyan-300', 'border-pink-500/30 text-pink-300']
                    return (
                      <div key={opt.id} className={`glass rounded-2xl p-5 border ${colors[i % colors.length]}`}>
                        <span className="font-bold text-xl mr-3">{letters[i]}.</span>
                        <span className="text-lg font-medium">{opt.text}</span>
                      </div>
                    )
                  })
              )}
            </div>
          </div>
        )}

        {/* RESULTS */}
        {view === 'results' && currentQuestion && (
          <div className="w-full max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-2">{currentQuestion.text}</h2>
            <p className="text-center text-white/50 mb-8">{currentAnswers.length} respuestas</p>

            <div className="space-y-4">
              {currentQuestion.type === 'true_false' ? (
                <>
                  {[
                    { label: '✅ Verdadero', key: 'true', correct: currentQuestion.question_options.find(o => o.text === 'Verdadero')?.is_correct },
                    { label: '❌ Falso', key: 'false', correct: currentQuestion.question_options.find(o => o.text === 'Falso')?.is_correct },
                  ].map(item => {
                    const count = currentAnswers.filter(a => a.answer_text === item.key).length
                    const pct = currentAnswers.length > 0 ? Math.round((count / currentAnswers.length) * 100) : 0
                    return (
                      <div key={item.key} className={`glass rounded-2xl p-5 border ${item.correct ? 'border-green-500/50' : 'border-white/10'}`}>
                        <div className="flex justify-between mb-3">
                          <span className="font-semibold text-lg flex items-center gap-2">
                            {item.correct && <span className="text-green-400 text-sm bg-green-500/20 px-2 py-0.5 rounded-full">✓ Correcta</span>}
                            {item.label}
                          </span>
                          <span className="text-white/70 text-xl font-bold">{count} ({pct}%)</span>
                        </div>
                        <div className="h-6 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${item.correct ? 'bg-green-500' : 'bg-white/30'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </>
              ) : (
                currentQuestion.question_options
                  .sort((a, b) => a.order_num - b.order_num)
                  .map(opt => {
                    const count = currentAnswers.filter(a => a.option_id === opt.id).length
                    const pct = currentAnswers.length > 0 ? Math.round((count / currentAnswers.length) * 100) : 0
                    return (
                      <div key={opt.id} className={`glass rounded-2xl p-5 border ${opt.is_correct ? 'border-green-500/50' : 'border-white/10'}`}>
                        <div className="flex justify-between mb-3">
                          <span className="font-semibold text-lg flex items-center gap-2">
                            {opt.is_correct && <span className="text-green-400 text-sm bg-green-500/20 px-2 py-0.5 rounded-full">✓ Correcta</span>}
                            {opt.text}
                          </span>
                          <span className="text-white/70 text-xl font-bold">{count} ({pct}%)</span>
                        </div>
                        <div className="h-6 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${opt.is_correct ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })
              )}
            </div>
          </div>
        )}

        {/* PODIUM */}
        {view === 'podium' && (
          <div className="w-full max-w-3xl text-center">
            <h2 className="text-5xl font-bold mb-2 text-gradient">🏆 Podio Final</h2>
            <p className="text-white/50 mb-12">Los mejores de la capacitación</p>

            {ranking.length === 0 ? (
              <p className="text-white/50">No hay datos suficientes.</p>
            ) : (
              <div className="space-y-4">
                {ranking.map((item, i) => (
                  <div key={i} className={`glass rounded-2xl p-5 flex items-center gap-4 border ${
                    i === 0 ? 'border-yellow-500/50 bg-yellow-500/10' :
                    i === 1 ? 'border-slate-400/50 bg-slate-400/10' :
                    i === 2 ? 'border-orange-500/50 bg-orange-500/10' :
                    'border-white/10'
                  }`}>
                    <span className="text-4xl w-12 text-center">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                    </span>
                    <div className="flex-1 text-left">
                      <p className="text-xl font-bold">{item.apellido}, {item.nombre}</p>
                      <p className="text-white/50 text-sm">Legajo: {item.legajo} · {item.correct} correctas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gradient">{item.points}</p>
                      <p className="text-white/50 text-sm">puntos</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => { setView('waiting'); setCurrentQuestionIndex(0); setAnswers([]) }}
              className="mt-8 glass px-6 py-3 rounded-xl text-sm font-medium hover:bg-white/10"
            >
              Reiniciar capacitación
            </button>
          </div>
        )}
      </main>
    </div>
  )
}