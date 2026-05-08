"use client"
import {useEffect,useState} from "react"
import {createClient} from "../supabase/client"
import type {Question,QuestionOption} from "../supabase/types"
export interface QuestionWithOptions extends Question {question_options:QuestionOption[]}
export function useActiveQuestion(eventId:string){
  const [question,setQuestion]=useState<QuestionWithOptions|null>(null)
  const [closedQuestion,setClosedQuestion]=useState<QuestionWithOptions|null>(null)
  const [allDone,setAllDone]=useState(false)
  const [loading,setLoading]=useState(true)
  const fetchState=async()=>{
    const supabase=createClient()
    const {data}=await supabase.from("questions").select("*,question_options(*)").eq("event_id",eventId).order("order_num",{ascending:true})
    if(!data||data.length===0){setLoading(false);return}
    const active=data.find((q:{is_active:boolean})=>q.is_active)
    if(active){
      setQuestion(active as QuestionWithOptions)
      setClosedQuestion(null)
      setAllDone(false)
      setLoading(false)
      return
    }
    const closed=data.filter((q:{is_closed:boolean})=>q.is_closed)
    const last=closed.length>0?closed[closed.length-1]:null
    setQuestion(null)
    setClosedQuestion(last as QuestionWithOptions|null)
    setAllDone(data.length>0&&data.every((q:{is_closed:boolean})=>q.is_closed))
    setLoading(false)
  }
  useEffect(()=>{
    fetchState()
    const supabase=createClient()
    const channel=supabase.channel("questions-all-"+eventId)
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"questions"},payload=>{
        const updated=payload.new as {event_id:string}
        if(updated.event_id===eventId)fetchState()
      })
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"questions"},payload=>{
        const inserted=payload.new as {event_id:string}
        if(inserted.event_id===eventId)fetchState()
      })
      .subscribe()
    return()=>{supabase.removeChannel(channel)}
  },[eventId])
  return {question,closedQuestion,allDone,loading,refetch:fetchState}
}