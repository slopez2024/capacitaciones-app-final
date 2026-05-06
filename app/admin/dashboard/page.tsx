'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Event } from '@/lib/supabase/types';
import { formatDate } from '@/lib/utils/helpers';
import CreateEventForm from '@/components/admin/CreateEventForm';
import Spinner from '@/components/ui/Spinner';

export default function DashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/admin');
        return;
      }
      setUserId(data.user.id);
      fetchEvents(data.user.id);
    });
  }, []);

  const fetchEvents = async (uid: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('created_by', uid)
      .order('created_at', { ascending: false });

    if (data) setEvents(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin');
  };

  const handleEventCreated = (event: Event) => {
    setEvents((prev) => [event, ...prev]);
    setShowCreate(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎓</span>
            <h1 className="text-xl font-bold text-slate-800">CapacitApp</h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-red-600 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            Mis capacitaciones
          </h2>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            + Nueva capacitación
          </button>
        </div>

        {showCreate && userId && (
          <div className="mb-6">
            <CreateEventForm
              userId={userId}
              onCreated={handleEventCreated}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        )}

        {events.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg">No tenés capacitaciones creadas aún.</p>
            <p className="text-sm mt-1">
              Creá tu primera capacitación para empezar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/admin/eventos/${event.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 text-lg leading-tight">
                    {event.title}
                  </h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      event.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {event.is_active ? 'Activo' : 'Cerrado'}
                  </span>
                </div>
                {event.description && (
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                    {event.description}
                  </p>
                )}
                <p className="text-xs text-slate-400">
                  {formatDate(event.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
