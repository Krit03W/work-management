export type ProjectCategory = "full_time" | "freelance" | "solopreneur";
export type ProjectStatus = "lead" | "quoted" | "in_progress" | "completed" | "archived";
export type QuotationStatus = "draft" | "sent" | "accepted" | "rejected";

export interface Client {
  id: number;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  tax_id: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  client_id: number | null;
  name: string;
  category: ProjectCategory;
  status: ProjectStatus;
  description: string | null;
  start_date: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  project_id: number | null;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface QuotationItem {
  id: number;
  description: string;
  quantity: string;
  unit_price: string;
  sort_order: number;
}

export interface Quotation {
  id: number;
  project_id: number;
  quotation_number: string;
  status: QuotationStatus;
  issue_date: string | null;
  valid_until: string | null;
  notes: string | null;
  items: QuotationItem[];
  total: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarStatus {
  connected: boolean;
  email: string | null;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  all_day: boolean;
  location: string | null;
  html_link: string | null;
}
