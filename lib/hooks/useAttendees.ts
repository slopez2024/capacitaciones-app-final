'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../supabase/client';
import type { Attendee } from '../supabase/types';

export function useAttendees(eventId: string) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Carga inicial
    supabase
      .from('attendees')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setAttendees(data);
        setLoading(false);
      });

    // Suscripción Realtime
    const channel = supabase
      .channel(`attendees:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendees',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          setAttendees((prev) => [payload.new as Attendee, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'attendees',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          setAttendees((prev) => prev.filter((a) => a.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  return { attendees, loading };
}
