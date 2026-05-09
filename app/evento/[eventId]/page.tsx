'use client'
import {useState, use} from 'react'
import {useRouter} from 'next/navigation'
import {createClient} from '@/lib/supabase/client'

export default function EventoPage({params}: {params: Promise<{eventId: string}>}) {
  const {eventId} = use(params)
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
    setLoading(true)
    const supabase = createClient()
    const {data: ev} = await supabase.from('events').select('id,is_active').eq('id', eventId).limit(1)
    if (!ev || ev.length === 0) {setError('Evento no encontrado.'); setLoading(false); return}
    if (!(ev[0] as {is_active: boolean}).is_active) {setError('Evento no activo.'); setLoading(false); return}
    const {error: e2} = await supabase.from('attendees').insert({event_id: eventId, legajo: legajo.trim(), dni: dni.trim(), nombre: nombre.trim(), apellido: apellido.trim()})
    if (e2) {
      if (e2.code === '23505') setError('Ya estás registrado.')
      else setError(e2.message)
      setLoading(false)
      return
    }
    const {data: a} = await supabase.from('attendees').select('id').eq('event_id', eventId).eq('dni', dni.trim()).limit(1)
    if (a && a[0]) sessionStorage.setItem('attendee_' + eventId, (a[0] as {id: string}).id)
    router.push('/evento/' + eventId + '/juego')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl">🎓</span>
          <h1 className="text-2xl font-bold text-white mt-2">Registrarse</h1>
          <p className="text-indigo-200 text-sm mt-1">Completá tus datos para ingresar</p>
        </div>
        <div className="bg-white rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Legajo</label>
              <input value={legajo} onChange={e => setLegajo(e.target.value)} type="text" className="w-full border rounded-lg px-3 py-3 text-sm" placeholder="Tu número de legajo" required/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">DNI</label>
              <input value={dni} onChange={e => setDni(e.target.value)} type="text" className="w-full border rounded-lg px-3 py-3 text-sm" placeholder="Sin puntos ni espacios" required/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} type="text" className="w-full border rounded-lg px-3 py-3 text-sm" placeholder="Tu nombre" required/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Apellido</label>
              <input value={apellido} onChange={e => setApellido(e.target.value)} type="text" className="w-full border rounded-lg px-3 py-3 text-sm" placeholder="Tu apellido" required/>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">
              {loading ? 'Cargando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}