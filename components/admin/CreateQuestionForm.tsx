"use client"
import {useState} from "react"
import {createClient} from "@/lib/supabase/client"
import type {QuestionType} from "@/lib/supabase/types"
interface Props {eventId:string;orderNum:number;onCreated:()=>void;onCancel:()=>void}
export default function CreateQuestionForm({eventId,orderNum,onCreated,onCancel}:Props){
  const [text,setText]=useState("")
  const [type,setType]=useState<QuestionType>("multiple_choice")
  const [imageUrl,setImageUrl]=useState("")
  const [timeLimit,setTimeLimit]=useState(2)
  const [correctAnswer,setCorrectAnswer]=useState<"true"|"false">("true")
  const [options,setOptions]=useState([{text:"",is_correct:false},{text:"",is_correct:false}])
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState("")
  const handleSubmit=async(e:React.FormEvent)=>{
    e.preventDefault()
    if(!text.trim())return
    setLoading(true);setError("")
    const supabase=createClient()
    const {data:question,error:qErr}=await supabase.from("questions").insert({event_id:eventId,text:text.trim(),type,image_url:imageUrl.trim()||null,order_num:orderNum,time_limit_seconds:timeLimit*60}).select().single()
    if(qErr||!question){setError(qErr?.message||"Error");setLoading(false);return}
    if(type==="true_false"){
      await supabase.from("question_options").insert([{question_id:question.id,text:"Verdadero",is_correct:correctAnswer==="true",order_num:0},{question_id:question.id,text:"Falso",is_correct:correctAnswer==="false",order_num:1}])
    }else{
      const valid=options.filter(o=>o.text.trim())
      if(valid.length<2){setError("Agrega al menos 2 opciones.");await supabase.from("questions").delete().eq("id",question.id);setLoading(false);return}
      await supabase.from("question_options").insert(valid.map((o,i)=>({question_id:question.id,text:o.text.trim(),is_correct:o.is_correct,order_num:i})))
    }
    onCreated()
  }
  const fmt=(m:number)=>m===1?"1 minuto":m+" minutos"
  return(
    <div className="bg-white border border-indigo-100 rounded-xl p-5 shadow-sm">
      <h3 className="font-semibold text-slate-700 mb-4">Nueva pregunta</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
          <div className="flex gap-3">
            {(["multiple_choice","true_false"] as QuestionType[]).map(t=>(
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={type===t} onChange={()=>setType(t)}/>
                <span className="text-sm">{t==="multiple_choice"?"Opcion multiple":"Verdadero / Falso"}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Pregunta *</label>
          <textarea value={text} onChange={e=>setText(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" rows={2} required/>
        </div>
        {type==="true_false"&&(
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Respuesta correcta</label>
            <div className="flex gap-3">
              <button type="button" onClick={()=>setCorrectAnswer("true")} className={"flex-1 py-2.5 rounded-xl font-semibold text-sm border-2 "+(correctAnswer==="true"?"bg-green-600 text-white border-green-600":"bg-white text-green-700 border-green-300")}>Verdadero</button>
              <button type="button" onClick={()=>setCorrectAnswer("false")} className={"flex-1 py-2.5 rounded-xl font-semibold text-sm border-2 "+(correctAnswer==="false"?"bg-red-500 text-white border-red-500":"bg-white text-red-600 border-red-300")}>Falso</button>
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tiempo limite: <span className="text-indigo-600 font-bold">{fmt(timeLimit)}</span></label>
          <input type="range" min={1} max={10} step={1} value={timeLimit} onChange={e=>setTimeLimit(Number(e.target.value))} className="w-full accent-indigo-600"/>
          <div className="flex justify-between text-xs text-slate-400 mt-1"><span>1 min</span><span>5 min</span><span>10 min</span></div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">URL imagen (opcional)</label>
          <input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="https://..." type="url"/>
        </div>
        {type==="multiple_choice"&&(
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Opciones</label>
            {options.map((opt,i)=>(
              <div key={i} className="flex items-center gap-2">
                <input type="checkbox" checked={opt.is_correct} onChange={e=>setOptions(prev=>prev.map((o,idx)=>idx===i?{...o,is_correct:e.target.checked}:o))}/>
                <input value={opt.text} onChange={e=>setOptions(prev=>prev.map((o,idx)=>idx===i?{...o,text:e.target.value}:o))} className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm" placeholder={"Opcion "+(i+1)}/>
                {options.length>2&&<button type="button" onClick={()=>setOptions(prev=>prev.filter((_,idx)=>idx!==i))} className="text-slate-300 hover:text-red-500">x</button>}
              </div>
            ))}
            {options.length<6&&<button type="button" onClick={()=>setOptions(prev=>[...prev,{text:"",is_correct:false}])} className="text-sm text-indigo-600">+ Agregar opcion</button>}
          </div>
        )}
        {error&&<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50">{loading?"Guardando...":"Guardar"}</button>
          <button type="button" onClick={onCancel} className="text-slate-500 px-4 py-2 text-sm">Cancelar</button>
        </div>
      </form>
    </div>
  )
}