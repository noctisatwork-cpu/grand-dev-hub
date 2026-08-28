export const BUSINESS_TYPES = [
  "Agency",
  "AI-SaaS",
  "Freelancer",
  "Ecommerce",
  "Content Creator",
] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const SOURCES = [
  "Instagram DM",
  "LinkedIn",
  "Discord partnership",
  "Referral",
  "Cold outreach",
  "Substack",
  "Other",
] as const;
export type Source = (typeof SOURCES)[number];

export const STATUSES = [
  "New Lead",
  "Contacted",
  "Call Booked",
  "Proposal Sent",
  "Negotiating",
  "Won/Client",
  "Lost",
] as const;
export type Status = (typeof STATUSES)[number];

export const PROGRAMS = [
  "The Grand Standard",
  "Consulting retainer",
  "Other",
] as const;
export type Program = (typeof PROGRAMS)[number];

export const PAYMENT_STATUSES = ["Paid", "Partial", "Pending"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PLATFORMS = [
  "Instagram",
  "LinkedIn",
  "X",
  "Substack",
  "Discord",
  "Other",
] as const;
export type Platform = (typeof PLATFORMS)[number];

export interface Lead {
  id: string;
  name: string;
  business: string;
  businessType: BusinessType;
  email: string;
  phone: string;
  handle: string;
  source: Source;
  status: Status;
  notes: string;
  dateAdded: string;
  lastContacted: string;
  contentId?: string | undefined;
}

export interface ProgressNote {
  id: string;
  date: string;
  note: string;
}

export interface Client {
  id: string;
  leadId?: string | undefined;
  name: string;
  business: string;
  program: Program;
  startDate: string;
  months: number;
  paymentStatus: PaymentStatus;
  amount: number;
  guaranteeActive: boolean;
  progress: ProgressNote[];
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  done: boolean;
  linkedId?: string | undefined;
  linkedLabel?: string | undefined;
}

export interface ContentEntry {
  id: string;
  kind: "Content" | "Partnership";
  platform: Platform;
  date: string;
  topic: string;
  link: string;
  notes: string;
}

export interface CrmData {
  leads: Lead[];
  clients: Client[];
  tasks: Task[];
  content: ContentEntry[];
}

export const emptyData: CrmData = { leads: [], clients: [], tasks: [], content: [] };

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function addMonths(iso: string, months: number) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0);
  return d.toISOString().slice(0, 10);
}

export function programEnd(c: Client) {
  return addMonths(c.startDate, c.months || 3);
}

export function daysBetween(fromIso: string, toIso: string) {
  const a = new Date(fromIso).getTime();
  const b = new Date(toIso).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86400000);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function inr(n: number) {
  return "₹" + (n || 0).toLocaleString("en-IN");
}
