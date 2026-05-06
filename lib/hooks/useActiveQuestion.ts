'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../supabase/client';
import type { Question, QuestionOption } from '../supabase/types';

export interface QuestionWithOptions extends Question {
  question_options: QuestionOption[];
}

export function useActiveQuestion(eventId: string) {
  const [question, setQuestion] = useState<QuestionWithOptions | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActive = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('questions')
      .select('*, question_options(*)')
      .eq('event_id', eventId)
      .eq('is_active', true)
      .maybeSingle();

    setQuestion(data as QuestionWithOptions | null);
    setLoading(false);
  };

  useEffect(() => {
    fetchActive();
    const supabase = createClient();

    const channel = supabase
      .channel(`questions:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'questions',
          filter: `event_id=eq.${eventId}`,
        },
        () => fetchActive()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  return { question, loading, refetch: fetchActive };
}
