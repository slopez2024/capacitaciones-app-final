'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Spinner from '@/components/ui/Spinner'

export default function EventoPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
  const router = useRouter()

  const [legajo, setLegajo] = useState('')
  const [dni, setDni] = useState('')
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!legajo.trim() || !dni.trim() || !nombre.trim() || !apellido.trim()) {
      setError('Completá todos los campos.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data: events } = await supabase
      .from('events')
      .select('id, is_active, max_attendees')
      .eq('id', eventId)
      .limit(1)

    const event = events && events.length > 0 ? (events[0] as { id: string; is_active: boolean; max_attendees: number }) : null

    if (!event) {
      setError('Evento no encontrado.')
      setLoading(false)
      return
    }

    if (!event.is_active) {
      setError('Este evento no está activo.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('attendees').insert({
      event_id: eventId,
      legajo: legajo.trim(),
      dni: dni.trim(),
      nombre: nombre.trim(),
      apellido: apellido.trim(),
    })

    if (insertError) {
      if (insertError.code === '23505') {
        if (insertError.message.includes('dni')) {
          setError('Este DNI ya está registrado en este evento.')
        } else if (insertError.message.includes('legajo')) {
          setError('Este legajo ya está registrado en este evento.')
        } else {
          setError('Ya estás registrado en este evento.')
        }
      } else if (insertError.message.includes('límite')) {
        setError('El evento alcanzó el límite de asistentes.')
      } else {
        setError('Error al registrarse: ' + insertError.message)
      }
      setLoading(false)
      return
    }

    const { data: attData } = await supabase
      .from('attendees')
      .select('id')
      .eq('event_id', eventId)
      .eq('dni', dni.trim())
      .limit(1)

    if (attData && attData.length > 0) {
      const att = attData[0] as { id: string }
      sessionStorage.setItem(`attendee_${eventId}`, att.id)
    }

    router.push(`/evento/${eventId}/juego`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
            <span className="text-3xl">🎓</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Registrarse</h1>
          <p className="text-indigo-200 text-sm mt-1">Completá tus datos para ingresar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Legajo', value: legajo, setter: setLegajo, placeholder: 'Tu número de legajo' },
              { label: 'DNI', value: dni, setter: setDni, placeholder: 'Sin puntos ni espacios' },
              { label: 'Nombre', value: nombre, setter: setNombre, placeholder: 'Tu nombre' },
              { label: 'Apellido', value: apellido, setter: setApellido, placeholder: 'Tu apellido' },
            ].map(field => (
              <div key={field.label}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {field.label} <span className="text-red-500">*</span>
                </label>
                <input
                  value={field.value}
                  onChange={e => field.setter(e.target.value)}
                  type="text"
                  className="w-full border border-slate-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={field.placeholder}
                  required
                />
              </div>
            ))}

            <ErrorMessage message={error} />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-base"
            >
              {loading ? <Spinner size="sm" /> : 'Ingresar a la capacitación'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}