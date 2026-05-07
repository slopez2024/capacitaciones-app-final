"use client"
import {useEffect,useState} from "react"
import {createClient} from "@/lib/supabase/client"
import type {Question,QuestionOption} from "@/lib/supabase/types"
import CreateQuestionForm from "./CreateQuestionForm"
interface QWO extends Question {question_options:QuestionOption[]}
export default function QuestionPanel({eventId}:{eventId:string}){
  const [questions,setQuestions]=useState<QWO[]>([])
  const [showForm,setShowForm]=useState(false)
  const [countdown,setCountdown]=useState<number|null>(null)
  const [activeQuestionId,setActiveQuestionId]=useState<string|null>(null)
  const fetch=async()=>{
    const s=createClient()
    const {data}=await s.from("questions").select("*,question_options(*)").eq("event_id",eventId).order("order_num",{ascending:true})
    if(data)setQuestions(data as QWO[])
  }
  useEffect(()=>{fetch()},[eventId])
  useEffect(()=>{
    if(countdown===null)return
    if(countdown<=0){closeActive();setCountdown(null);return}
    const t=setTimeout(()=>setCountdown(p=>p!==null?p-1:null),1000)
    return()=>clearTimeout(t)
  },[countdown])
  const activate=async(q:QWO)=>{
    const s=createClient()
    await s.from("questions").update({is_active:true,is_closed:false}).eq("id",q.id)
    setActiveQuestionId(q.id)
    setCountdown(q.time_limit_seconds||60)
    fetch()
  }
  const closeActive=async()=>{
    if(!activeQuestionId)return
    const s=createClient()
    await s.from("questions").update({is_active:false,is_closed:true}).eq("id",activeQuestionId)
    setActiveQuestionId(null);setCountdown(null);fetch()
  }
  const reopen=async(id:string)=>{
    const s=createClient()
    await s.from("questions").update({is_active:false,is_closed:false}).eq("id",id)
    fetch()
  }
  const del=async(id:string)=>{
    if(!confirm("Eliminar?"))return
    const s=createClient()
    await s.from("question_options").delete().eq("question_id",id)
    await s.from("answers").delete().eq("question_id",id)
    await s.from("questions").delete().eq("id",id)
    fetch()
  }
  const fmt=(s:number)=>{const m=Math.floor(s/60);const sec=s%60;return m+":"+sec.toString().padStart(2,"0")}
  const active=questions.find(q=>q.is_active)
  const pending=questions.filter(q=>!q.is_active&&!q.is_closed)
  const closed=questions.filter(q=>q.is_closed)
  return(
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">Preguntas</h3>
        <button onClick={()=>setShowForm(v=>!v)} className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg">+ Nueva pregunta</button>
      </div>
      {showForm&&<CreateQuestionForm eventId={eventId} orderNum={questions.length} onCreated={()=>{fetch();setShowForm(false)}} onCancel={()=>setShowForm(false)}/>}
      {active&&(
        <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-700 font-semibold flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block"/>Pregunta activa</span>
            <div className="flex items-center gap-3">
              {countdown!==null&&<span className={"text-2xl font-bold "+(countdown<=30?"text-red-600":"text-green-700")}>⏱ {fmt(countdown)}</span>}
              <button onClick={closeActive} className="text-sm bg-red-100 text-red-600 px-3 py-1.5 rounded-lg">Cerrar</button>
            </div>
          </div>
          <p className="font-medium text-slate-800">{active.text}</p>
          <p className="text-xs text-slate-500 mt-1">{Math.floor(active.time_limit_seconds/60)} min</p>
        </div>
      )}
      {pending.length>0&&(
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase">Pendientes</p>
          {pending.map(q=>(
            <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start gap-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{q.type==="true_false"?"V/F":"Multiple"}</span>
                <div className="flex-1">
                  <p className="font-medium text-slate-800 text-sm">{q.text}</p>
                  <p className="text-xs text-slate-400 mt-1">⏱ {Math.floor(q.time_limit_seconds/60)} min</p>
                  <ul className="mt-2 space-y-1">{q.question_options.sort((a,b)=>a.order_num-b.order_num).map(opt=><li key={opt.id} className="text-xs text-slate-500">{opt.is_correct?"✅":"○"} {opt.text}</li>)}</ul>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={()=>activate(q)} disabled={!!active} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg disabled:opacity-40">▶ Lanzar</button>
                  <button onClick={()=>del(q.id)} className="text-xs text-slate-300 hover:text-red-500 px-2 py-1">Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {closed.length>0&&(
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase">Cerradas</p>
          {closed.map(q=>(
            <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-4 opacity-70">
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{q.type==="true_false"?"V/F":"Multiple"}</span>
                <p className="text-sm text-slate-600 flex-1">{q.text}</p>
                <div className="flex gap-2">
                  <button onClick={()=>reopen(q.id)} className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-lg">Reabrir</button>
                  <button onClick={()=>del(q.id)} className="text-xs text-slate-300 hover:text-red-500 px-2 py-1">Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {questions.length===0&&!showForm&&<div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-slate-200">No hay preguntas.</div>}
    </div>
  )
}