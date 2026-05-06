'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Attendee } from '@/lib/supabase/types';
import { exportAttendeesCSV, exportAnswersCSV } from '@/lib/utils/csv';

interface Props {
  eventId: string;
  attendees: Attendee[];
}

export default function ExportButtons({ eventId, attendees }: Props) {
  const [loading, setLoading] = useState(false);

  const handleExportAttendees = () => {
    exportAttendeesCSV(attendees);
  };

  const handleExportAnswers = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: answers } = await supabase
      .from('answers')
      .select('*, attendees(*), question_options(*)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('event_id', eventId);

    if (answers && questions) {
      exportAnswersCSV(
        answers as Parameters<typeof exportAnswersCSV>[0],
        questions
      );
    }
    setLoading(false);
  };

  return (
    <div className="flex gap-3 flex-wrap justify-center">
      <button
        onClick={handleExportAttendees}
        disabled={attendees.length === 0}
        className="bg-white border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-600 font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-40"
      >
        📥 Exportar asistentes CSV
      </button>
      <button
        onClick={handleExportAnswers}
        disabled={loading}
        className="bg-white border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-600 font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-40"
      >
        📥 Exportar respuestas CSV
      </button>
    </div>
  );
}
