'use client'

import { useEffect, useState, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useActiveQuestion } from '@/lib/hooks/useActiveQuestion'

export default function JuegoPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
  const router = useRouter()
  const { question, loading } = useActiveQuestion(eventId)
  const [attendeeId, setAttendeeId] = useState<string | null>(null)
  const [answered, setAnswered] = useState<{ [questionId: string]: { optionId?: string; answerText?: string } }>({})
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const questionStartTime = useRef<number>(Date.now())

  useEffect(() => {
    const id = sessionStorage.getItem(`attendee_${eventId}`)
    if (!id) { router.push(`/evento/${eventId}`); return }
    setAttendeeId(id)
  }, [eventId])

  useEffect(() => {
    setSelected(null)
    setError('')
    questionStartTime.current = Date.now()
  }, [question?.id])

  const myAnswer = question ? answered[question.id] : null
  const alreadyAnswered = !!myAnswer

  const isCorrect = () => {
    if (!question || !myAnswer) return null
    if (question.type === 'true_false') {
      return myAnswer.answerText === 'true'
    } else {
      const correctOptions = question.question_options.filter(o => o.is_correct).map(o => o.id)
      return myAnswer.optionId ? correctOptions.includes(myAnswer.optionId) : false
    }
  }

  const handleAnswer = async (optionId?: string, answerText?: string) => {
    if (!attendeeId || !question || sending || alreadyAnswered) return
    setSending(true)
    setError('')

    const responseTimeMs = Date.now() - questionStartTime.current

    const supabase = createClient()
    const { error: err } = await (supabase as unknown as { from: (t: string) => { insert: (d: object) => Promise<{ error: { code: string } | null }> } }).from('answers').insert({
      question_id: question.id,
      attendee_id: attendeeId,
      event_id: eventId,
      option_id: optionId || null,
      answer_text: answerText || null,
      response_time_ms: responseTimeMs,
    })

    if (err) {
      if (err.code === '23505') {
        setAnswered(prev => ({ ...prev, [question.id]: { optionId, answerText } }))
      } else {
        setError('Error al enviar respuesta.')
      }
    } else {
      setAnswered(prev => ({ ...prev, [question.id]: { optionId, answerText } }))
    }
    setSending(false)
  }

  if (!attendeeId) return null

  const correct = isCorrect()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-indigo-700 text-white px-4 py-3 text-center">
        <p className="text-sm font-medium">🎓 CapacitApp</p>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        {loading ? (
          <div className="text-center">
            <p className="text-slate-500 mt-3 text-sm">Cargando...</p>
          </div>
        ) : !question ? (
          <div className="text-center">
            <div className="text-5xl mb-4">⏳</div>
            <h2 className="text-xl font-bold text-slate-700">Esperando pregunta</h2>
            <p className="text-slate-500 text-sm mt-2">El capacitador no lanzó ninguna pregunta.</p>
          </div>
        ) : alreadyAnswered ? (
          <div className="text-center px-4">
            {question.is_closed ? (
              <div>
                <div className="text-7xl mb-4">{correct ? '🎉' : '😔'}</div>
                <h2 className={`text-3xl font-bold mb-2 ${correct ? 'text-green-600' : 'text-red-500'}`}>
                  {correct ? '¡Correcto!' : 'Incorrecto'}
                </h2>
                {!correct && question.type === 'multiple_choice' && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-sm text-green-700 font-medium">La respuesta correcta era:</p>
                    {question.question_options.filter(o => o.is_correct).map(o => (
                      <p key={o.id} className="text-green-800 font-bold mt-1">{o.text}</p>
                    ))}
                  </div>
                )}
                {!correct && question.type === 'true_false' && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-sm text-green-700 font-medium">La respuesta correcta era:</p>
                    <p className="text-green-800 font-bold mt-1">✅ Verdadero</p>
                  </div>
                )}
                <p className="text-slate-500 text-sm mt-4">Esperá la próxima pregunta.</p>
              </div>
            ) : (
              <div>
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-green-700">¡Respuesta enviada!</h2>
                <p className="text-slate-500 mt-2 text-sm">Esperá a que el capacitador cierre la pregunta.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              {question.image_url && (
                <img src={question.image_url} alt="Imagen" className="w-full rounded-xl mb-4 max-h-48 object-cover" />
              )}
              <p className="text-slate-800 font-semibold text-base mb-5 leading-snug">{question.text}</p>
              <div className="space-y-3">
                {question.type === 'true_false' ? (
                  <>
                    <button onClick={() => { setSelected('true'); handleAnswer(undefined, 'true') }} disabled={sending || !!selected}
                      className={`w-full border-2 rounded-xl py-3 px-4 font-medium text-sm text-left ${selected === 'true' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-700 border-green-300'}`}>
                      ✅ Verdadero
                    </button>
                    <button onClick={() => { setSelected('false'); handleAnswer(undefined, 'false') }} disabled={sending || !!selected}
                      className={`w-full border-2 rounded-xl py-3 px-4 font-medium text-sm text-left ${selected === 'false' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-red-600 border-red-300'}`}>
                      ❌ Falso
                    </button>
                  </>
                ) : (
                  question.question_options.sort((a, b) => a.order_num - b.order_num).map(opt => (
                    <button key={opt.id} onClick={() => { setSelected(opt.id); handleAnswer(opt.id) }} disabled={sending || !!selected}
                      className={`w-full border-2 rounded-xl py-3 px-4 font-medium text-sm text-left ${selected === opt.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200'}`}>
                      {opt.text}
                    </button>
                  ))
                )}
              </div>
              {error && <div className="mt-3 text-red-600 text-sm">⚠️ {error}</div>}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}