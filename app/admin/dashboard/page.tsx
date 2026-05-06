'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/lib/supabase/types'
import { formatDate } from '@/lib/utils/helpers'
import CreateEventForm from '@/components/admin/CreateEventForm'
import Spinner from '@/components/ui/Spinner'

export default function DashboardPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/admin'); return }
      setUserId(data.user.id)
      fetchEvents(data.user.id)
    })
  }, [])

  const fetchEvents = async (uid: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('created_by', uid)
      .order('created_at', { ascending: false })
    if (data) setEvents(data)
    setLoading(false)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin')
  }

  const handleEventCreated = (event: Event) => {
    setEvents(prev => [event, ...prev])
    setShowCreate(false)
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm('¿Eliminar esta capacitación? Se borrarán todos los datos.')) return
    const supabase = createClient()
    const { data: qs } = await supabase.from('questions').select('id').eq('event_id', eventId)
    const qIds = (qs || []).map((q: { id: string }) => q.id)
    if (qIds.length > 0) await supabase.from('question_options').delete().in('question_id', qIds)
    await supabase.from('answers').delete().eq('event_id', eventId)
    await supabase.from('winners').delete().eq('event_id', eventId)
    await supabase.from('questions').delete().eq('event_id', eventId)
    await supabase.from('attendees').delete().eq('event_id', eventId)
    await supabase.from('events').delete().eq('id', eventId)
    setEvents(prev => prev.filter(e => e.id !== eventId))
  }

  const handleEdit = async (event: Event) => {
    setEditingEvent(event)
    setEditTitle(event.title)
    setEditDesc(event.description || '')
  }

  const handleSaveEdit = async () => {
    if (!editingEvent) return
    const supabase = createClient()
    const { data } = await supabase
      .from('events')
      .update({ title: editTitle.trim(), description: editDesc.trim() || null })
      .eq('id', editingEvent.id)
      .select()
      .single()
    if (data) {
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? data as Event : e))
    }
    setEditingEvent(null)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Spinner size="lg" /></div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎓</span>
            <h1 className="text-xl font-bold text-slate-800">CapacitApp</h1>
          </div>
          <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-red-600 transition-colors">
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Mis capacitaciones</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            + Nueva capacitación
          </button>
        </div>

        {showCreate && userId && (
          <div className="mb-6">
            <CreateEventForm userId={userId} onCreated={handleEventCreated} onCancel={() => setShowCreate(false)} />
          </div>
        )}

        {events.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg">No tenés capacitaciones creadas aún.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(event => (
              <div key={event.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3
                    className="font-semibold text-slate-800 text-lg leading-tight cursor-pointer hover:text-indigo-600"
                    onClick={() => router.push(`/admin/eventos/${event.id}`)}
                  >
                    {event.title}
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${
                    event.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {event.is_active ? 'Activo' : 'Cerrado'}
                  </span>
                </div>
                {event.description && (
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">{event.description}</p>
                )}
                <p className="text-xs text-slate-400 mb-4">{formatDate(event.created_at)}</p>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/admin/eventos/${event.id}`)}
                    className="flex-1 text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => handleEdit(event)}
                    className="text-xs bg-slate-50 text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="text-xs bg-red-50 text-red-500 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal editar */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-slate-800 text-lg mb-4">Editar capacitación</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg text-sm"
              >
                Guardar
              </button>
              <button
                onClick={() => setEditingEvent(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}