import type {
  Attendee,
  Answer,
  Question,
  QuestionOption,
} from '../supabase/types';

export function exportAttendeesCSV(attendees: Attendee[]): void {
  const headers = ['Legajo', 'DNI', 'Nombre', 'Apellido', 'Registrado'];
  const rows = attendees.map((a) => [
    a.legajo,
    a.dni,
    a.nombre,
    a.apellido,
    new Date(a.created_at).toLocaleString('es-AR'),
  ]);

  downloadCSV('asistentes', headers, rows);
}

export function exportAnswersCSV(
  answers: (Answer & {
    attendees?: Attendee;
    question_options?: QuestionOption;
  })[],
  questions: Question[]
): void {
  const headers = [
    'Pregunta',
    'Legajo',
    'DNI',
    'Nombre',
    'Apellido',
    'Respuesta',
    'Fecha',
  ];
  const rows = answers.map((a) => {
    const question = questions.find((q) => q.id === a.question_id);
    return [
      question?.text || '',
      a.attendees?.legajo || '',
      a.attendees?.dni || '',
      a.attendees?.nombre || '',
      a.attendees?.apellido || '',
      a.answer_text || a.question_options?.text || '',
      new Date(a.created_at).toLocaleString('es-AR'),
    ];
  });

  downloadCSV('respuestas', headers, rows);
}

function downloadCSV(
  filename: string,
  headers: string[],
  rows: string[][]
): void {
  const BOM = '\uFEFF';
  const csvContent =
    BOM +
    [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
