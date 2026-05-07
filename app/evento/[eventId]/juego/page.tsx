"use client"
import {useEffect,useState,use,useRef} from "react"
import {useRouter} from "next/navigation"
import {createClient} from "@/lib/supabase/client"
import {useActiveQuestion} from "@/lib/hooks/useActiveQuestion"
interface RankingItem{nombre:string;apellido:string;legajo:string;points:number;correct:number}
export default function JuegoPage({params}:{params:Promise<{eventId:string}>}){
  const {eventId}=use(params)
  const router=useRouter()
  const {question,loading}=useActiveQuestion(eventId)
  const [attendeeId,setAttendeeId]=useState<string|null>(null)
  const [answered,setAnswered]=useState<{[id:string]:{optionId?:string;answerText?:string}}>({})
  const [sending,setSending]=useState(false)
  const [error,setError]=useState("")
  const [selected,setSelected]=useState<string|null>(null)
  const [timeLeft,setTimeLeft]=useState<number|null>(null)
  const [allClosed,setAllClosed]=useState(false)
  const [ranking,setRanking]=useState<RankingItem[]>([])
  const startTime=useRef<number>(Date.now())
  const timerRef=useRef<ReturnType<typeof setInterval>|null>(null)
  useEffect(()=>{
    const id=sessionStorage.getItem("attendee_"+eventId)
    if(!id){router.push("/evento/"+eventId);return}
    setAttendeeId(id)
  },[eventId])
  useEffect(()=>{
    setSelected(null);setError("")
    startTime.current=Date.now()
    if(timerRef.current)clearInterval(timerRef.current)
    if(question&&!question.is_closed&&!question.is_active===false){
      setTimeLeft(question.time_limit_seconds||60)
      timerRef.current=setInterval(()=>{
        setTimeLeft(prev=>{
          if(prev===null||prev<=1){clearInterval(timerRef.current!);return 0}
          return prev-1
        })
      },1000)
    }else{setTimeLeft(null)}
    return()=>{if(timerRef.current)clearInterval(timerRef.current)}
  },[question?.id,question?.is_closed])
  useEffect(()=>{
    if(!question&&!loading&&attendeeId){
      const s=createClient()
      s.from("questions").select("id,is_closed").eq("event_id",eventId).then(({data})=>{
        if(data&&data.length>0&&data.every((q:{is_closed:boolean})=>q.is_closed)){
          setAllClosed(true)
          buildRanking()
        }
      })
    }
  },[question,loading,attendeeId])
  const buildRanking=async()=>{
    const s=createClient()
    const {data:allAnswers}=await s.from("answers").select("*,attendees(*),question_options(*)").eq("event_id",eventId)
    const {data:allQuestions}=await s.from("questions").select("*,question_options(*)").eq("event_id",eventId)
    if(!allAnswers||!allQuestions)return
    const scores:{[id:string]:RankingItem}={}
    for(const answer of allAnswers){
      const att=(answer as {attendees:{id:string;nombre:string;apellido:string;legajo:string}}).attendees
      if(!att)continue
      if(!scores[att.id])scores[att.id]={nombre:att.nombre,apellido:att.apellido,legajo:att.legajo,points:0,correct:0}
      const q=allQuestions.find((q:{id:string})=>q.id===answer.question_id) as {type:string;question_options:{id:string;text:string;is_correct:boolean}[]}|undefined
      if(!q)continue
      let correct=false
      if(q.type==="true_false"){const co=q.question_options.find((o:{is_correct:boolean})=>o.is_correct);correct=answer.answer_text===(co?.text==="Verdadero"?"true":"false")}
      else{const co=q.question_options.filter((o:{is_correct:boolean})=>o.is_correct).map((o:{id:string})=>o.id);correct=answer.option_id?co.includes(answer.option_id):false}
      if(correct){const t=(answer as {response_time_ms:number}).response_time_ms||99999;scores[att.id].points+=Math.max(100,1000-Math.floor(t/100));scores[att.id].correct+=1}
    }
    setRanking(Object.values(scores).sort((a,b)=>b.points-a.points).slice(0,5))
  }
  const myAnswer=question?answered[question.id]:null
  const alreadyAnswered=!!myAnswer
  const isCorrect=()=>{
    if(!question||!myAnswer)return null
    if(question.type==="true_false"){const co=question.question_options?.find(o=>o.is_correct);return myAnswer.answerText===(co?.text==="Verdadero"?"true":"false")}
    const co=question.question_options?.filter(o=>o.is_correct).map(o=>o.id)||[]
    return myAnswer.optionId?co.includes(myAnswer.optionId):false
  }
  const handleAnswer=async(optionId?:string,answerText?:string)=>{
    if(!attendeeId||!question||sending||alreadyAnswered||timeLeft===0)return
    setSending(true);setError("")
    const responseTimeMs=Date.now()-startTime.current
    const s=createClient()
    const {error:err}=await (s as unknown as {from:(t:string)=>{insert:(d:object)=>Promise<{error:{code:string}|null}>}}).from("answers").insert({question_id:question.id,attendee_id:attendeeId,event_id:eventId,option_id:optionId||null,answer_text:answerText||null,response_time_ms:responseTimeMs})
    if(err){if(err.code==="23505")setAnswered(prev=>({...prev,[question.id]:{optionId,answerText}}));else setError("Error al enviar.")}
    else setAnswered(prev=>({...prev,[question.id]:{optionId,answerText}}))
    setSending(false)
  }
  if(!attendeeId)return null
  const correct=isCorrect()
  const timePercent=question?((timeLeft||0)/(question.time_limit_seconds||60))*100:0
  const timeColor=timeLeft!==null&&timeLeft<=10?"text-red-600":timeLeft!==null&&timeLeft<=30?"text-yellow-500":"text-indigo-600"
  const barColor=timeLeft!==null&&timeLeft<=10?"bg-red-500":timeLeft!==null&&timeLeft<=30?"bg-yellow-500":"bg-green-500"
  if(allClosed){return(
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col">
      <header className="bg-indigo-700 px-4 py-3 text-center"><p className="text-sm font-medium">🎓 CapacitApp</p></header>
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <h2 className="text-3xl font-bold mb-1 text-center">🏆 Podio Final</h2>
        <p className="text-white/50 text-sm mb-8">Resultados de la capacitacion</p>
        {ranking.length===0?<p className="text-white/50">Calculando...</p>:(
          <div className="w-full max-w-sm space-y-3">
            {ranking.map((item,i)=>(
              <div key={i} className={"rounded-2xl p-4 flex items-center gap-3 border "+(i===0?"border-yellow-500/50 bg-yellow-500/10":i===1?"border-slate-400/50 bg-slate-400/10":i===2?"border-orange-500/50 bg-orange-500/10":"border-white/10 bg-white/5")}>
                <span className="text-3xl w-10 text-center">{i===0?"🥇":i===1?"🥈":i===2?"🥉":(i+1)}</span>
                <div className="flex-1"><p className="font-bold text-white">{item.apellido}, {item.nombre}</p><p className="text-white/50 text-xs">{item.correct} correctas</p></div>
                <div className="text-right"><p className="text-xl font-bold text-indigo-300">{item.points}</p><p className="text-white/50 text-xs">pts</p></div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )}
  return(
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-indigo-700 text-white px-4 py-3 text-center"><p className="text-sm font-medium">🎓 CapacitApp</p></header>
      <main className="flex-1 flex items-center justify-center p-4">
        {loading?<p className="text-slate-500">Cargando...</p>
        :!question?<div className="text-center"><div className="text-5xl mb-4">⏳</div><h2 className="text-xl font-bold text-slate-700">Esperando pregunta</h2></div>
        :question.is_closed||timeLeft===0?(
          <div className="text-center px-4 w-full max-w-sm">
            {alreadyAnswered?(
              <div>
                <div className="text-7xl mb-4">{correct?"🎉":"😔"}</div>
                <h2 className={"text-3xl font-bold mb-2 "+(correct?"text-green-600":"text-red-500")}>{correct?"Correcto!":"Incorrecto"}</h2>
                {!correct&&<div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4"><p className="text-sm text-green-700">La respuesta correcta era:</p>{question.question_options?.filter(o=>o.is_correct).map(o=><p key={o.id} className="text-green-800 font-bold mt-1">{o.text}</p>)}</div>}
              </div>
            ):<div><div className="text-7xl mb-4">⏰</div><h2 className="text-2xl font-bold text-red-500">Tiempo!</h2></div>}
            <p className="text-slate-400 text-sm mt-6">Espera la proxima pregunta...</p>
          </div>
        ):alreadyAnswered?(
          <div className="text-center px-4">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-700">Respuesta enviada!</h2>
            {timeLeft!==null&&<p className={"text-4xl font-black mt-4 "+timeColor}>{timeLeft}s</p>}
          </div>
        ):(
          <div className="w-full max-w-sm">
            {timeLeft!==null&&(
              <div className="mb-4 text-center">
                <p className={"text-5xl font-black mb-2 "+timeColor}>{timeLeft}s</p>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div className={"h-full "+barColor+" rounded-full transition-all duration-1000"} style={{width:timePercent+"%"}}/>
                </div>
              </div>
            )}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              {question.image_url&&<img src={question.image_url} alt="" className="w-full rounded-xl mb-4 max-h-48 object-cover"/>}
              <p className="text-slate-800 font-semibold text-base mb-5 leading-snug">{question.text}</p>
              <div className="space-y-3">
                {question.type==="true_false"?(
                  <>
                    <button onClick={()=>{setSelected("true");handleAnswer(undefined,"true")}} disabled={sending||!!selected} className={"w-full border-2 rounded-xl py-3 px-4 font-medium text-sm text-left "+(selected==="true"?"bg-green-600 text-white border-green-600":"bg-white text-green-700 border-green-300")}>✅ Verdadero</button>
                    <button onClick={()=>{setSelected("false");handleAnswer(undefined,"false")}} disabled={sending||!!selected} className={"w-full border-2 rounded-xl py-3 px-4 font-medium text-sm text-left "+(selected==="false"?"bg-red-500 text-white border-red-500":"bg-white text-red-600 border-red-300")}>❌ Falso</button>
                  </>
                ):question.question_options?.sort((a,b)=>a.order_num-b.order_num).map(opt=>(
                  <button key={opt.id} onClick={()=>{setSelected(opt.id);handleAnswer(opt.id)}} disabled={sending||!!selected} className={"w-full border-2 rounded-xl py-3 px-4 font-medium text-sm text-left "+(selected===opt.id?"bg-indigo-600 text-white border-indigo-600":"bg-white text-slate-700 border-slate-200")}>{opt.text}</button>
                ))}
              </div>
              {error&&<div className="mt-3 text-red-600 text-sm">{error}</div>}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}