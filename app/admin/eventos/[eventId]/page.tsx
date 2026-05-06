'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/lib/supabase/types'
import { getEventUrl, getProjectorUrl } from '@/lib/utils/helpers'
import { useAttendees } from '@/lib/hooks/useAttendees'
import { useActiveQuestion } from '@/lib/hooks/useActiveQuestion'
import { useAnswers } from '@/lib/hooks/useAnswers'
import QRDisplay from '@/components/ui/QRDisplay'
import AttendeeList from '@/components/admin/AttendeeList'
import QuestionPanel from '@/components/admin/QuestionPanel'
import LiveResults from '@/components/admin/LiveResults'
import RuletaModal from '@/components/admin/RuletaModal'
import WinnersList from '@/components/admin/WinnersList'
import ExportButtons from '@/components/admin/ExportButtons'
import Spinner from '@/components/ui/Spinner'

type Tab = 'qr' | 'asistentes' | 'preguntas' | 'sorteo'

export default function EventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('qr')
  const [showRuleta, setShowRuleta] = useState(false)

  const { attendees } = useAttendees(eventId)
  const { question } = useActiveQuestion(eventId)
  const { answers } = useAnswers(question?.id ?? null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/admin'); return }
      supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .limit(1)
        .then(({ data: evs }) => {
          if (!evs || evs.length === 0) { router.push('/admin/dashboard'); return }
          setEvent(evs[0] as unknown as Event)
          setLoading(false)
        })
    })
  }, [eventId])

  const handleReset = async () => {
    if (!confirm('¿Resetear el evento? Se eliminarán TODOS los datos: asistentes, preguntas, respuestas y ganadores.')) return

    const supabase = createClient()

    // 1. Obtener IDs de preguntas
    const { data: qs } = await supabase.from('questions').select('id').eq('event_id', eventId)
    const qIds = (qs || []).map((q: { id: string }) => q.id)

    // 2. Borrar opciones de preguntas
    if (qIds.length > 0) {
      await supabase.from('question_options').delete().in('question_id', qIds)
    }

    // 3. Borrar respuestas
    await supabase.from('answers').delete().eq('event_id', eventId)

    // 4. Borrar ganadores
    await supabase.from('winners').delete().eq('event_id', eventId)

    // 5. Borrar preguntas
    await supabase.from('questions').delete().eq('event_id', eventId)

    // 6. Borrar asistentes
    await supabase.from('attendees').delete().eq('event_id', eventId)

    alert('Evento reseteado correctamente. Todos los datos fueron eliminados.')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>
  if (!event) return null

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: 'qr', label: 'QR', emoji: '📱' },
    { id: 'asistentes', label: `Asistentes (${attendees.length})`, emoji: '👥' },
    { id: 'preguntas', label: 'Preguntas', emoji: '❓' },
    { id: 'sorteo', label: 'Sorteo', emoji: '🎲' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button onClick={() => router.push('/admin/dashboard')} className="text-slate-400 hover:text-slate-600">
            ← Volver
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-slate-800 truncate">{event.title}</h1>
            <p className="text-xs text-slate-400">{attendees.length}/100 asistentes</p>
          </div>
          <a href={getProjectorUrl(eventId)} target="_blank" className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-medium hover:bg-purple-200 transition-colors">
            🖥️ Proyector
          </a>
          <button onClick={handleReset} className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-medium hover:bg-red-200 transition-colors">
            🔄 Resetear
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'qr' && (
          <div className="flex flex-col items-center gap-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
              <h2 className="text-lg font-semibold text-slate-700 mb-2">{event.title}</h2>
              <p className="text-sm text-slate-400 mb-6">Escaneá para registrarte</p>
              <QRDisplay url={getEventUrl(eventId)} size={250} />
            </div>
            <ExportButtons eventId={eventId} attendees={attendees} />
          </div>
        )}
        {tab === 'asistentes' && <AttendeeList attendees={attendees} />}
        {tab === 'preguntas' && (
          <div className="space-y-6">
            <QuestionPanel eventId={eventId} />
            {question && <LiveResults question={question} answers={answers} attendees={attendees} />}
          </div>
        )}
        {tab === 'sorteo' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
              <p className="text-slate-600 mb-4">
                {attendees.length === 0 ? 'No hay asistentes registrados aún.' : `${attendees.length} asistente${attendees.length !== 1 ? 's' : ''} disponibles.`}
              </p>
              <button
                onClick={() => setShowRuleta(true)}
                disabled={attendees.length === 0}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold px-8 py-3 rounded-xl text-lg disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
              >
                🎲 Lanzar sorteo
              </button>
            </div>
            <WinnersList eventId={eventId} />
          </div>
        )}
      </main>

      {showRuleta && <RuletaModal eventId={eventId} attendees={attendees} onClose={() => setShowRuleta(false)} />}
    </div>
  )
}