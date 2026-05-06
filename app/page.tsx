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
    if(!code.trim())return
    setLoading(true)
    setError("")
    const supabase = createClient()
    const {data: events} = await supabase.from("events").select("id,is_active,code").eq("code", parseInt(code.trim())).limit(1)
    const event = events && events.length > 0 ? events[0] as {id:string;is_active:boolean;code:number} : null
    if(!event){setError("Codigo incorrecto.");setLoading(false);return}
    if(!event.is_active){setError("No esta activa.");setLoading(false);return}
    router.push("/evento/" + event.id)
  }

  return(
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
            <span className="text-3xl">🎓</span>
          </div>
          <h1 className="text-2xl font-bold text-white">CapacitApp</h1>
          <p className="text-indigo-200 text-sm mt-1">Ingresa el codigo de tu capacitacion</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Codigo de capacitacion</label>
              <input value={code} onChange={e=>setCode(e.target.value.replace(/[^0-9]/g,""))} type="text" inputMode="numeric" maxLength={6} className="w-full border border-slate-200 rounded-lg px-3 py-4 text-4xl font-bold text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="1234" required/>
              <p className="text-xs text-slate-400 mt-1 text-center">El codigo lo ves en la pantalla del proyector</p>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">⚠️ {error}</div>}
            <button type="submit" disabled={loading||code.length<3} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl disabled:opacity-50">{loading?"Buscando...":"Ingresar →"}</button>
          </form>
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <button onClick={()=>router.push("/admin")} className="text-sm text-slate-400 hover:text-indigo-600 transition-colors">Soy capacitador →</button>
          </div>
        </div>
      </div>
    </div>
  )
}