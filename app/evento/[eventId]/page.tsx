"use client"
import {useState,use} from "react"
import {useRouter} from "next/navigation"
import {createClient} from "@/lib/supabase/client"
export default function EventoPage({params}:{params:Promise<{eventId:string}>}){
  const {eventId}=use(params)
  const router=useRouter()
  const [legajo,setLegajo]=useState("")
  const [dni,setDni]=useState("")
  const [nombre,setNombre]=useState("")
  const [apellido,setApellido]=useState("")
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState("")
  const handleSubmit=async(e:React.FormEvent)=>{
    e.preventDefault()
    setError("")
    setLoading(true);setError("Conectando...")
    const supabase=createClient()
    setError("Buscando evento...");const {data:events}=await supabase.from("events").select("id,is_active,max_attendees").eq("id",eventId).limit(1)
    const event=events&&events.length>0?events[0] as {id:string;is_active:boolean;max_attendees:number}:null
    if(!event){setError("Evento no encontrado.");setLoading(false);return}
    if(!event.is_active){setError("Este evento no esta activo.");setLoading(false);return}
    setError("Guardando...");const {error:insertError}=await supabase.from("attendees").insert({event_id:eventId,legajo:legajo.trim(),dni:dni.trim(),nombre:nombre.trim(),apellido:apellido.trim()})
    if(insertError){
      if(insertError.code==="23505"){
        if(insertError.message.includes("dni"))setError("Este DNI ya esta registrado.")
        else if(insertError.message.includes("legajo"))setError("Este legajo ya esta registrado.")
        else setError("Ya estas registrado en este evento.")
      }else setError("Error al registrarse: "+insertError.message)
      setLoading(false);return
    }
    const {data:attData}=await supabase.from("attendees").select("id").eq("event_id",eventId).eq("dni",dni.trim()).limit(1)
    if(attData&&attData.length>0)sessionStorage.setItem("attendee_"+eventId,(attData[0] as {id:string}).id)
    router.push("/evento/"+eventId+"/juego")
  }
  return(<div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 flex items-center justify-center p-4"><div className="w-full max-w-sm"><div className="text-center mb-8"><span className="text-5xl">🎓</span><h1 className="text-2xl font-bold text-white mt-2">Registrarse</h1><p className="text-indigo-200 text-sm mt-1">Completa tus datos para ingresar</p></div><div className="bg-white rounded-2xl shadow-2xl p-6"><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">Legajo</label><input value={legajo} onChange={e=>setLegajo(e.target.value)} type="text" className="w-full border border-slate-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Tu numero de legajo" required/></div><div><label className="block text-sm font-medium text-slate-700 mb-1">DNI</label><input value={dni} onChange={e=>setDni(e.target.value)} type="text" className="w-full border border-slate-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Sin puntos ni espacios" required/></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label><input value={nombre} onChange={e=>setNombre(e.target.value)} type="text" className="w-full border border-slate-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Tu nombre" required/></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Apellido</label><input value={apellido} onChange={e=>setApellido(e.target.value)} type="text" className="w-full border border-slate-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Tu apellido" required/></div>{error&&<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">⚠️ {error}</div>}<button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl disabled:opacity-50">{loading?"Cargando...":"Ingresar a la capacitacion"}</button></form></div></div></div>)
}