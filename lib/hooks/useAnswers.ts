'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../supabase/client';
import type { Answer } from '../supabase/types';

export function useAnswers(questionId: string | null) {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!questionId) {
      setAnswers([]);
      return;
    }

    const supabase = createClient();
    setLoading(true);

    supabase
      .from('answers')
      .select('*')
      .eq('question_id', questionId)
      .then(({ data }) => {
        if (data) setAnswers(data);
        setLoading(false);
      });

    const channel = supabase
      .channel(`answers:${questionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'answers',
          filter: `question_id=eq.${questionId}`,
        },
        (payload) => {
          setAnswers((prev) => [...prev, payload.new as Answer]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [questionId]);

  return { answers, loading };
}
