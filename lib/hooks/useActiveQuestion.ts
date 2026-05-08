"use client"
import {useEffect,useState} from "react"
import {createClient} from "../supabase/client"
import type {Question,QuestionOption} from "../supabase/types"
export interface QuestionWithOptions extends Question {question_options:QuestionOption[]}
export function useActiveQuestion(eventId:string){
  const [question,setQuestion]=useState<QuestionWithOptions|null>(null)
  const [loading,setLoading]=useState(true)
  const [lastClosed,setLastClosed]=useState<QuestionWithOptions|null>(null)
  const fetchActive=async()=>{
    const supabase=createClient()
    const {data:active}=await supabase.from("questions").select("*,question_options(*)").eq("event_id",eventId).eq("is_active",true).maybeSingle()
    if(active){
      setQuestion(active as QuestionWithOptions)
      setLoading(false)
      return
    }
    const {data:closed}=await supabase.from("questions").select("*,question_options(*)").eq("event_id",eventId).eq("is_closed",true).order("created_at",{ascending:false}).limit(1).maybeSingle()
    if(closed){setLastClosed(closed as QuestionWithOptions)}
    setQuestion(null)
    setLoading(false)
  }
  useEffect(()=>{
    fetchActive()
    const supabase=createClient()
    const channel=supabase.channel("questions:"+eventId).on("postgres_changes",{event:"*",schema:"public",table:"questions",filter:"event_id=eq."+eventId},()=>fetchActive()).subscribe()
    return()=>{supabase.removeChannel(channel)}
  },[eventId])
  return {question,loading,lastClosed,refetch:fetchActive}
}