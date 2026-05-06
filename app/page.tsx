"use client"
export const dynamic = "force-dynamic"
import {useState} from "react"
import {useRouter} from "next/navigation"
import {createClient} from "@/lib/supabase/client"

export default function AdminLoginPage(){
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const supabase = createClient()
    const {error: authError} = await supabase.auth.signInWithPassword({email, password})
    if(authError){setError("Email o contrasena incorrectos.");setLoading(false);return}
    router.push("/admin/dashboard")
  }

  const handleRegister = async () => {
    if(!email||!password){setError("Completa email y contrasena.");return}
    setError("")
    setLoading(true)
    const supabase = createClient()
    const {error: regError} = await supabase.auth.signUp({email, password})
    if(regError){setError(regError.message);setLoading(false);return}
    alert("Cuenta creada. Revisa tu email.")
    setLoading(false)
  }

  return(
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">🎓</span>
          <h1 className="text-3xl font-bold text-white mt-4">CapacitApp</h1>
          <p className="text-indigo-200 mt-1">Panel de capacitadores</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Iniciar sesion</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="tu@email.com" required/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contrasena</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="password" required/>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">⚠️ {error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50">{loading?"Cargando...":"Ingresar"}</button>
          </form>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button onClick={handleRegister} disabled={loading} className="w-full text-sm text-slate-500 hover:text-indigo-600">No tenes cuenta? Registrarte</button>
          </div>
        </div>
      </div>
    </div>
  )
}