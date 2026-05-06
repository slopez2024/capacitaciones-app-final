"use client"
export const dynamic = "force-dynamic"
import {useState} from "react"
import {useRouter} from "next/navigation"
import {createClient} from "@/lib/supabase/client"
export default function HomePage(){
  const router = useRouter()
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError("")
    const supabase = createClient()
    const {data: events} = await supabase.from("events").select("id,is_active,code").eq("code", parseInt(code.trim())).limit(1)
    const event = events && events.length > 0 ? events[0] : null
    if (!event) { setError("Código incorrecto."); setLoading(false); return }
    if (!event.is_active) { setError("No está activa."); setLoading(false); return }
    router.push("/evento/" + event.id)
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">CapacitApp</h1>
          <p className="text-indigo-200 text-sm mt-1">Ingresa el codigo de tu capacitacion</p>
        </div>
        <div className="bg-white rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input value={code} onChange={e=>setCode(e.target.value.replace(/[^0-9]/g,""))} type="text" inputMode="numeric" className="w-full border rounded-lg px-3 py-4 text-3xl font-bold text-center" placeholder="1234" required/>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={loading||code.length<3} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">{loading?"Buscando...":"Ingresar"}</button>
          </form>
          <button onClick={()=>router.push("/admin")} className="mt-4 w-full text-xs text-slate-400">Soy capacitador</button>
        </div>
      </div>
    </div>
  )
}