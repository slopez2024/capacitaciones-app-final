"use client"
import {useEffect,useState} from "react"
import {createClient} from "@/lib/supabase/client"
import type {Question,QuestionOption} from "@/lib/supabase/types"
import CreateQuestionForm from "./CreateQuestionForm"
interface QWO extends Question {question_options:QuestionOption[]}
export default function QuestionPanel({eventId}:{eventId:string}){
  const [questions,setQuestions]=useState<QWO[]>([])
  const [showForm,setShowForm]=useState(false)
  const [editQ,setEditQ]=useState<QWO|null>(null)
  const [editText,setEditText]=useState("")
  const [editTime,setEditTime]=useState(2)
  const [editCorrect,setEditCorrect]=useState<"true"|"false">("true")
  const [editOptions,setEditOptions]=useState<{id?:string;text:string;is_correct:boolean}[]>([])
  const fetch2=async()=>{
    const s=createClient()
    const {data}=await s.from("questions").select("*,question_options(*)").eq("event_id",eventId).order("order_num",{ascending:true})
    if(data)setQuestions(data as QWO[])
  }
  useEffect(()=>{fetch2()},[eventId])
  const openEdit=(q:QWO)=>{
    setEditQ(q)
    setEditText(q.text)
    setEditTime(Math.round(q.time_limit_seconds/60)||2)
    if(q.type==="true_false"){
      const correct=q.question_options.find(o=>o.is_correct)
      setEditCorrect(correct?.text==="Verdadero"?"true":"false")
    }else{
      setEditOptions(q.question_options.sort((a,b)=>a.order_num-b.order_num).map(o=>({id:o.id,text:o.text,is_correct:o.is_correct})))
    }
  }
  const saveEdit=async()=>{
    if(!editQ)return
    const s=createClient()
    await s.from("questions").update({text:editText.trim(),time_limit_seconds:editTime*60}).eq("id",editQ.id)
    if(editQ.type==="true_false"){
      const verd=editQ.question_options.find(o=>o.text==="Verdadero")
      const fals=editQ.question_options.find(o=>o.text==="Falso")
      if(verd)await s.from("question_options").update({is_correct:editCorrect==="true"}).eq("id",verd.id)
      if(fals)await s.from("question_options").update({is_correct:editCorrect==="false"}).eq("id",fals.id)
    }else{
      for(const opt of editOptions){
        if(opt.id){await s.from("question_options").update({text:opt.text,is_correct:opt.is_correct}).eq("id",opt.id)}
        else{await s.from("question_options").insert({question_id:editQ.id,text:opt.text,is_correct:opt.is_correct,order_num:editOptions.indexOf(opt)})}
      }
    }
    setEditQ(null)
    fetch2()
  }
  const del=async(id:string)=>{
    if(!confirm("Eliminar?"))return
    const s=createClient()
    await s.from("question_options").delete().eq("question_id",id)
    await s.from("answers").delete().eq("question_id",id)
    await s.from("questions").delete().eq("id",id)
    fetch2()
  }
  return(
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">Preguntas</h3>
        <button onClick={()=>setShowForm(v=>!v)} className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg">+ Nueva pregunta</button>
      </div>
      {showForm&&<CreateQuestionForm eventId={eventId} orderNum={questions.length} onCreated={()=>{fetch2();setShowForm(false)}} onCancel={()=>setShowForm(false)}/>}
      {questions.length===0&&!showForm&&<div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-slate-200">No hay preguntas.</div>}
      {questions.length>0&&(
        <div className="space-y-2">
          {questions.map(q=>(
            <div key={q.id} className={"bg-white rounded-xl border p-4 "+(q.is_active?"border-green-400 bg-green-50":"border-slate-200")}>
              <div className="flex items-start gap-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">{q.type==="true_false"?"V/F":"Multiple"}</span>
                <div className="flex-1">
                  <p className="font-medium text-slate-800 text-sm">{q.text}</p>
                  <p className="text-xs text-slate-400 mt-1">⏱ {Math.floor(q.time_limit_seconds/60)} min · {q.is_active?"ACTIVA":q.is_closed?"Cerrada":"Pendiente"}</p>
                  <ul className="mt-2 space-y-1">{q.question_options.sort((a,b)=>a.order_num-b.order_num).map(opt=><li key={opt.id} className="text-xs text-slate-500">{opt.is_correct?"✅":"○"} {opt.text}</li>)}</ul>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {!q.is_active&&<button onClick={()=>openEdit(q)} className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-200">Editar</button>}
                  {!q.is_active&&<button onClick={()=>del(q.id)} className="text-xs text-slate-300 hover:text-red-500 px-2 py-1">Eliminar</button>}
                  {q.is_active&&<span className="text-xs text-green-600 font-medium">Activa</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {editQ&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-screen overflow-y-auto">
            <h3 className="font-bold text-slate-800 text-lg mb-4">Editar pregunta</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pregunta</label>
                <textarea value={editText} onChange={e=>setEditText(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" rows={3}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tiempo: {editTime} min</label>
                <input type="range" min={1} max={10} step={1} value={editTime} onChange={e=>setEditTime(Number(e.target.value))} className="w-full accent-indigo-600"/>
              </div>
              {editQ.type==="true_false"&&(
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Respuesta correcta</label>
                  <div className="flex gap-3">
                    <button type="button" onClick={()=>setEditCorrect("true")} className={"flex-1 py-2 rounded-xl font-semibold text-sm border-2 "+(editCorrect==="true"?"bg-green-600 text-white border-green-600":"bg-white text-green-700 border-green-300")}>Verdadero</button>
                    <button type="button" onClick={()=>setEditCorrect("false")} className={"flex-1 py-2 rounded-xl font-semibold text-sm border-2 "+(editCorrect==="false"?"bg-red-500 text-white border-red-500":"bg-white text-red-600 border-red-300")}>Falso</button>
                  </div>
                </div>
              )}
              {editQ.type==="multiple_choice"&&(
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Opciones</label>
                  {editOptions.map((opt,i)=>(
                    <div key={i} className="flex items-center gap-2">
                      <input type="checkbox" checked={opt.is_correct} onChange={e=>setEditOptions(prev=>prev.map((o,idx)=>idx===i?{...o,is_correct:e.target.checked}:o))}/>
                      <input value={opt.text} onChange={e=>setEditOptions(prev=>prev.map((o,idx)=>idx===i?{...o,text:e.target.value}:o))} className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm"/>
                    </div>
                  ))}
                  <button type="button" onClick={()=>setEditOptions(prev=>[...prev,{text:"",is_correct:false}])} className="text-sm text-indigo-600">+ Agregar opcion</button>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={saveEdit} className="flex-1 bg-indigo-600 text-white font-semibold py-2 rounded-lg text-sm">Guardar</button>
              <button onClick={()=>setEditQ(null)} className="flex-1 bg-slate-100 text-slate-700 font-semibold py-2 rounded-lg text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}