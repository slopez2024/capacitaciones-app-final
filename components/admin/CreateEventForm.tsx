'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Event } from '@/lib/supabase/types';
import ErrorMessage from '@/components/ui/ErrorMessage';
import Spinner from '@/components/ui/Spinner';

interface Props {
  userId: string;
  onCreated: (event: Event) => void;
  onCancel: () => void;
}

export default function CreateEventForm({
  userId,
  onCreated,
  onCancel,
}: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data, error: err } = await supabase
      .from('events')
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        created_by: userId,
      })
      .select()
      .single();

    if (err) {
      setError('Error al crear el evento: ' + err.message);
      setLoading(false);
      return;
    }

    onCreated(data as Event);
  };

  return (
    <div className="bg-white border border-indigo-100 rounded-xl p-6 shadow-sm">
      <h3 className="font-semibold text-slate-800 mb-4">Nueva capacitación</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ej: Capacitación de Seguridad Vial"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Descripción opcional"
            rows={2}
          />
        </div>
        <ErrorMessage message={error} />
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Spinner size="sm" /> : 'Crear capacitación'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-700 px-4 py-2 text-sm"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
