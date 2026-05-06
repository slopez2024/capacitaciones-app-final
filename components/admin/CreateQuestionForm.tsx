'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { QuestionType } from '@/lib/supabase/types'

interface Props {
  eventId: string
  orderNum: number
  onCreated: () => void
  onCancel: () => void
}

export default function CreateQuestionForm({ eventId, orderNum, onCreated, onCancel }: Props) {
  const [text, setText] = useState('')
  const [type, setType] = useState<QuestionType>('multiple_choice')
  const [imageUrl, setImageUrl] = useState('')
  const [timeLimit, setTimeLimit] = useState(30)
  const [options, setOptions] = useState([
    { text: '', is_correct: false },
    { text: '', is_correct: false },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: question, error: qErr } = await supabase
      .from('questions')
      .insert({
        event_id: eventId,
        text: text.trim(),
        type,
        image_url: imageUrl.trim() || null,
        order_num: orderNum,
        time_limit_seconds: timeLimit,
      })
      .select()
      .single()

    if (qErr || !question) {
      setError(qErr?.message || 'Error al crear la pregunta')
      setLoading(false)
      return
    }

    if (type === 'multiple_choice') {
      const validOptions = options.filter(o => o.text.trim())
      if (validOptions.length < 2) {
        setError('Añadí al menos 2 opciones.')
        await supabase.from('questions').delete().eq('id', question.id)
        setLoading(false)
        return
      }
      const { error: optErr } = await supabase.from('question_options').insert(
        validOptions.map((o, i) => ({
          question_id: question.id,
          text: o.text.trim(),
          is_correct: o.is_correct,
          order_num: i,
        }))
      )
      if (optErr) {
        setError(optErr.message)
        setLoading(false)
        return
      }
    }

    onCreated()
  }

  const updateOption = (i: number, field: 'text' | 'is_correct', value: string | boolean) => {
    setOptions(prev => prev.map((o, idx) => idx === i ? { ...o, [field]: value } : o))
  }

  return (
    <div className="bg-white border border-indigo-100 rounded-xl p-5 shadow-sm">
      <h3 className="font-semibold text-slate-700 mb-4">Nueva pregunta</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
          <div className="flex gap-3">
            {(['multiple_choice', 'true_false'] as QuestionType[]).map(t => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={type === t} onChange={() => setType(t)} className="text-indigo-600" />
                <span className="text-sm">{t === 'multiple_choice' ? 'Opción múltiple' : 'Verdadero / Falso'}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Pregunta <span className="text-red-500">*</span>
          </label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            rows={2}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            ⏱️ Tiempo límite: <span className="text-indigo-600 font-bold">{timeLimit} segundos</span>
          </label>
          <input
            type="range"
            min={10}
            max={120}
            step={5}
            value={timeLimit}
            onChange={e => setTimeLimit(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>10s</span>
            <span>60s</span>
            <span>120s</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">URL de imagen (opcional)</label>
          <input
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="https://..."
            type="url"
          />
        </div>

        {type === 'multiple_choice' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Opciones</label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={opt.is_correct}
                  onChange={e => updateOption(i, 'is_correct', e.target.checked)}
                  className="text-green-600"
                />
                <input
                  value={opt.text}
                  onChange={e => updateOption(i, 'text', e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={`Opción ${i + 1}`}
                />
                {options.length > 2 && (
                  <button type="button" onClick={() => setOptions(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-slate-300 hover:text-red-500 text-lg leading-none">×</button>
                )}
              </div>
            ))}
            <p className="text-xs text-slate-400">✓ Marcá las opciones correctas</p>
            {options.length < 6 && (
              <button type="button" onClick={() => setOptions(prev => [...prev, { text: '', is_correct: false }])}
                className="text-sm text-indigo-600 hover:text-indigo-800">+ Agregar opción</button>
            )}
          </div>
        )}

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">⚠️ {error}</div>}

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
            {loading ? 'Guardando...' : 'Guardar pregunta'}
          </button>
          <button type="button" onClick={onCancel} className="text-slate-500 hover:text-slate-700 px-4 py-2 text-sm">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}