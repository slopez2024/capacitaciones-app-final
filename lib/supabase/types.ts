export type EventStatus = 'active' | 'inactive';
export type QuestionType = 'true_false' | 'multiple_choice';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  is_active: boolean;
  max_attendees: number;
  created_at: string;
  updated_at: string;
}

export interface Attendee {
  id: string;
  event_id: string;
  legajo: string;
  dni: string;
  nombre: string;
  apellido: string;
  created_at: string;
}

export interface Question {
  id: string;
  event_id: string;
  text: string;
  type: QuestionType;
  image_url: string | null;
  is_active: boolean;
  is_closed: boolean;
  order_num: number;
  created_at: string;
  question_options?: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
  order_num: number;
  created_at: string;
}

export interface Answer {
  id: string;
  question_id: string;
  attendee_id: string;
  event_id: string;
  option_id: string | null;
  answer_text: string | null;
  created_at: string;
}

export interface Winner {
  id: string;
  event_id: string;
  attendee_id: string;
  round: number;
  created_at: string;
  attendees?: Attendee;
}

export interface Database {
  public: {
    Tables: {
      events: {
        Row: Event;
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Event>;
      };
      attendees: {
        Row: Attendee;
        Insert: Omit<Attendee, 'id' | 'created_at'>;
        Update: Partial<Attendee>;
      };
      questions: {
        Row: Question;
        Insert: Omit<Question, 'id' | 'created_at'>;
        Update: Partial<Question>;
      };
      question_options: {
        Row: QuestionOption;
        Insert: Omit<QuestionOption, 'id' | 'created_at'>;
        Update: Partial<QuestionOption>;
      };
      answers: {
        Row: Answer;
        Insert: Omit<Answer, 'id' | 'created_at'>;
        Update: Partial<Answer>;
      };
      winners: {
        Row: Winner;
        Insert: Omit<Winner, 'id' | 'created_at'>;
        Update: Partial<Winner>;
      };
    };
  };
}
