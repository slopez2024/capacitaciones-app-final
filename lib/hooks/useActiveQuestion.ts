"use client"
import {useEffect,useState} from "react"
import {createClient} from "../supabase/client"
import type {Question,QuestionOption} from "../supabase/types"
export interface QuestionWithOptions extends Question {question_options:QuestionOption[]}
export function useActiveQuestion(eventId:string){
  const [question,setQuestion]=useState<QuestionWithOptions|null>(null)
  const [closedQuestion,setClosedQuestion]=useState<QuestionWithOptions|null>(null)
  const [loading,setLoading]=useState(true)
  const [allDone,setAllDone]=useState(false)
  const fetchState=async()=>{
    const supabase=createClient()
    const {data:all}=await supabase.from("questions").select("*,question_options(*)").eq("event_id",eventId).order("order_num",{ascending:true})
    if(!all||all.length===0){setLoading(false);return}
    const active=all.find((q:{is_active:boolean})=>q.is_active)
    if(active){
      setQuestion(active as QuestionWithOptions)
      setClosedQuestion(null)
      setAllDone(false)
      setLoading(false)
      return
    }
    const lastClosed=all.filter((q:{is_closed:boolean})=>q.is_closed).pop()
    const allClosed=all.every((q:{is_closed:boolean})=>q.is_closed)
    setQuestion(null)
    setClosedQuestion(lastClosed as QuestionWithOptions||null)
    setAllDone(allClosed)
    setLoading(false)
  }
  useEffect(()=>{
    fetchState()
    const supabase=createClient()
    const channel=supabase.channel("q:"+eventId).on("postgres_changes",{event:"*",schema:"public",table:"questions",filter:"event_id=eq."+eventId},()=>fetchState()).subscribe()
    return()=>{supabase.removeChannel(channel)}
  },[eventId])
  return {question,closedQuestion,allDone,loading,refetch:fetchState}
}