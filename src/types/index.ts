export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: Priority;
  category: string;
  dueDate: string | null;
  subtasks: SubTask[];
  order: number;
  createdAt: string;
  userId: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type ViewFilter = 'all' | 'today' | 'upcoming' | 'completed';
export type SortBy = 'dueDate' | 'priority' | 'name' | 'created';

export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bgColor: string; borderColor: string; darkBg: string }> = {
  urgent: { label: 'Urgent', color: 'text-rose-600', bgColor: 'bg-rose-100', borderColor: 'border-l-rose-500', darkBg: 'dark:bg-rose-900/30' },
  high: { label: 'High', color: 'text-orange-600', bgColor: 'bg-orange-100', borderColor: 'border-l-orange-500', darkBg: 'dark:bg-orange-900/30' },
  medium: { label: 'Medium', color: 'text-amber-600', bgColor: 'bg-amber-100', borderColor: 'border-l-amber-500', darkBg: 'dark:bg-amber-900/30' },
  low: { label: 'Low', color: 'text-emerald-600', bgColor: 'bg-emerald-100', borderColor: 'border-l-emerald-500', darkBg: 'dark:bg-emerald-900/30' },
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'work', name: 'Work', color: '#7c3aed', icon: '💼' },
  { id: 'personal', name: 'Personal', color: '#ec4899', icon: '🏠' },
  { id: 'health', name: 'Health', color: '#10b981', icon: '💪' },
  { id: 'learning', name: 'Learning', color: '#f59e0b', icon: '📚' },
  { id: 'shopping', name: 'Shopping', color: '#3b82f6', icon: '🛒' },
];
