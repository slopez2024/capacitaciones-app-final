'use client';

import type { Attendee } from '@/lib/supabase/types';
import { formatDate } from '@/lib/utils/helpers';

interface Props {
  attendees: Attendee[];
}

export default function AttendeeList({ attendees }: Props) {
  if (attendees.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <div className="text-4xl mb-3">👥</div>
        <p>Esperando asistentes...</p>
        <p className="text-sm mt-1">Compartí el QR para que se registren.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <span className="text-sm font-medium text-slate-600">
          {attendees.length} registrados
        </span>
      </div>
      <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
        {attendees.map((a, i) => (
          <div
            key={a.id}
            className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50"
          >
            <span className="text-slate-300 text-sm font-mono w-6 text-right">
              {attendees.length - i}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800">
                {a.apellido}, {a.nombre}
              </p>
              <p className="text-sm text-slate-500">
                Legajo: {a.legajo} · DNI: {a.dni}
              </p>
            </div>
            <span className="text-xs text-slate-400 shrink-0">
              {formatDate(a.created_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
