'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Attendee, Winner } from '@/lib/supabase/types';

interface Props {
  eventId: string;
  attendees: Attendee[];
  onClose: () => void;
}

export default function RuletaModal({ eventId, attendees, onClose }: Props) {
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Attendee | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pastWinners, setPastWinners] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Cargar ganadores anteriores para no repetir
    const supabase = createClient();
    supabase
      .from('winners')
      .select('attendee_id')
      .eq('event_id', eventId)
      .then(({ data }) => {
        if (data) setPastWinners(data.map((w) => w.attendee_id));
      });
  }, [eventId]);

  const eligible = attendees.filter((a) => !pastWinners.includes(a.id));

  const spin = () => {
    if (eligible.length === 0) return;
    setWinner(null);
    setSpinning(true);

    let speed = 50;
    let count = 0;
    const totalSpins = 30 + Math.floor(Math.random() * 20);

    intervalRef.current = setInterval(() => {
      setCurrentIndex(Math.floor(Math.random() * eligible.length));
      count++;

      if (count > totalSpins * 0.6) speed = 50 + (count - totalSpins * 0.6) * 8;

      if (count >= totalSpins) {
        clearInterval(intervalRef.current!);
        const winnerPick =
          eligible[Math.floor(Math.random() * eligible.length)];
        setCurrentIndex(eligible.indexOf(winnerPick));
        setSpinning(false);
        setWinner(winnerPick);
      }
    }, speed);
  };

  const saveWinner = async () => {
    if (!winner) return;
    const supabase = createClient();
    const round = pastWinners.length + 1;

    await supabase.from('winners').insert({
      event_id: eventId,
      attendee_id: winner.id,
      round,
    });

    setPastWinners((prev) => [...prev, winner.id]);
    setWinner(null);
  };

  const displayed = eligible[currentIndex] || eligible[0];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">🎲 Ruleta</h2>
        <p className="text-slate-500 text-sm mb-6">
          {eligible.length} participante{eligible.length !== 1 ? 's' : ''}{' '}
          elegible{eligible.length !== 1 ? 's' : ''}
        </p>

        {eligible.length === 0 ? (
          <div className="py-8">
            <p className="text-slate-500">
              🏆 Todos los asistentes ya han ganado.
            </p>
          </div>
        ) : (
          <>
            <div
              className={`rounded-xl p-6 mb-6 transition-all duration-200 ${
                spinning
                  ? 'bg-indigo-50 border-2 border-indigo-300'
                  : winner
                  ? 'bg-green-50 border-2 border-green-400'
                  : 'bg-slate-50 border-2 border-slate-200'
              }`}
            >
              {displayed ? (
                <>
                  <p
                    className={`text-3xl font-bold mb-1 ${
                      spinning ? 'animate-pulse' : ''
                    } ${winner ? 'text-green-700' : 'text-slate-700'}`}
                  >
                    {displayed.nombre} {displayed.apellido}
                  </p>
                  <p className="text-slate-500 text-sm">
                    Legajo: {displayed.legajo} · DNI: {displayed.dni}
                  </p>
                </>
              ) : (
                <p className="text-slate-400">-</p>
              )}
            </div>

            {winner ? (
              <div className="space-y-3">
                <p className="text-green-600 font-semibold">
                  🎉 ¡Ganador/a seleccionado!
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={saveWinner}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
                  >
                    Confirmar ganador
                  </button>
                  <button
                    onClick={spin}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors"
                  >
                    Volver a sortear
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={spin}
                disabled={spinning}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl text-lg transition-all disabled:opacity-60 shadow-lg"
              >
                {spinning ? '🎰 Sorteando...' : '🎲 Sortear'}
              </button>
            )}
          </>
        )}

        <button
          onClick={onClose}
          className="mt-4 text-sm text-slate-400 hover:text-slate-600"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
