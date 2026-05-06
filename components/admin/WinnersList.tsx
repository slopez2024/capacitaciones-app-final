'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Winner, Attendee } from '@/lib/supabase/types';
import { formatDate } from '@/lib/utils/helpers';

type WinnerWithAttendee = Winner & { attendees: Attendee };

export default function WinnersList({ eventId }: { eventId: string }) {
  const [winners, setWinners] = useState<WinnerWithAttendee[]>([]);

  useEffect(() => {
    const supabase = createClient();

    const fetch = () =>
      supabase
        .from('winners')
        .select('*, attendees(*)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })
        .then(({ data }) => {
          if (data) setWinners(data as WinnerWithAttendee[]);
        });

    fetch();

    const channel = supabase
      .channel(`winners:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'winners',
          filter: `event_id=eq.${eventId}`,
        },
        fetch
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  if (winners.length === 0)
    return (
      <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-slate-200">
        <p>No hay ganadores aún.</p>
      </div>
    );

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <span className="text-sm font-medium text-slate-600">
          🏆 Historial de ganadores
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {winners.map((w) => (
          <div key={w.id} className="flex items-center gap-3 px-4 py-3">
            <span className="text-2xl font-bold text-yellow-400">
              #{w.round}
            </span>
            <div className="flex-1">
              <p className="font-medium text-slate-800">
                {w.attendees?.apellido}, {w.attendees?.nombre}
              </p>
              <p className="text-sm text-slate-500">
                Legajo: {w.attendees?.legajo}
              </p>
            </div>
            <span className="text-xs text-slate-400">
              {formatDate(w.created_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
