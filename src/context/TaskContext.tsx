import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Task, Category, ViewFilter, SortBy, Priority } from '../types';
import { DEFAULT_CATEGORIES } from '../types';
import { isToday, isFuture, parseISO, isPast } from 'date-fns';

interface Stats {
  total: number;
  completed: number;
  overdue: number;
  todayCount: number;
  completionRate: number;
  byPriority: Record<Priority, number>;
}

interface TaskContextType {
  tasks: Task[];
  categories: Category[];
  viewFilter: ViewFilter;
  sortBy: SortBy;
  searchQuery: string;
  priorityFilter: Priority | 'all';
  categoryFilter: string;
  filteredTasks: Task[];
  stats: Stats;
  setViewFilter: (f: ViewFilter) => void;
  setSortBy: (s: SortBy) => void;
  setSearchQuery: (q: string) => void;
  setPriorityFilter: (p: Priority | 'all') => void;
  setCategoryFilter: (c: string) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'userId' | 'order'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  reorderTasks: (reordered: Task[]) => void;
  addCategory: (cat: Omit<Category, 'id'>) => void;
}

const TaskContext = createContext<TaskContextType | null>(null);

// Convert Supabase row → Task
const rowToTask = (row: any): Task => ({
  id: row.id,
  title: row.title,
  description: row.description || '',
  completed: row.completed || false,
  priority: row.priority || 'medium',
  category: row.category || 'personal',
  dueDate: row.due_date || null,
  subtasks: row.subtasks || [],
  order: row.task_order ?? 0,
  createdAt: row.created_at,
  userId: row.user_id,
});

// Convert Task fields → Supabase row
const taskToRow = (task: Partial<Task>) => {
  const row: any = {};
  if (task.title !== undefined) row.title = task.title;
  if (task.description !== undefined) row.description = task.description;
  if (task.completed !== undefined) row.completed = task.completed;
  if (task.priority !== undefined) row.priority = task.priority;
  if (task.category !== undefined) row.category = task.category;
  if (task.dueDate !== undefined) row.due_date = task.dueDate;
  if (task.subtasks !== undefined) row.subtasks = task.subtasks;
  if (task.order !== undefined) row.task_order = task.order;
  if (task.userId !== undefined) row.user_id = task.userId;
  return row;
};

const PRIORITY_ORDER: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

// Date parsing cache to avoid re-parsing the same dates
const dateCache = new Map<string, Date>();
function getCachedDate(dateStr: string): Date {
  let d = dateCache.get(dateStr);
  if (!d) {
    d = parseISO(dateStr);
    dateCache.set(dateStr, d);
    // Keep cache bounded
    if (dateCache.size > 500) {
      const first = dateCache.keys().next().value;
      if (first) dateCache.delete(first);
    }
  }
  return d;
}

export function TaskProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('created');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Debounced reorder timer
  const reorderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track pending DB ops to skip echoed realtime events
  const pendingOpsRef = useRef<Set<string>>(new Set());

  // Fetch tasks + real-time subscription
  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }

    let cancelled = false;

    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.uid)
        .order('task_order', { ascending: true });

      if (!cancelled && !error && data) {
        setTasks(data.map(rowToTask));
      }
    };

    fetchTasks();

    // Real-time listener
    const channel = supabase
      .channel(`tasks-${user.uid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.uid}`,
        },
        (payload: any) => {
          const id = payload.new?.id || payload.old?.id;

          // Skip if this is an echo of our own optimistic update
          if (pendingOpsRef.current.has(id)) {
            pendingOpsRef.current.delete(id);
            return;
          }

          if (payload.eventType === 'INSERT') {
            setTasks(prev => {
              if (prev.find(t => t.id === id)) return prev;
              return [...prev, rowToTask(payload.new)];
            });
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => t.id === id ? rowToTask(payload.new) : t));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== id));
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Fire-and-forget DB call with optimistic ID tracking
  const dbInsert = useCallback((row: any) => {
    supabase.from('tasks').insert(row).then(({ error }) => {
      if (error) console.error('Insert error:', error);
    });
  }, []);

  const dbUpdate = useCallback((id: string, row: any) => {
    pendingOpsRef.current.add(id);
    supabase.from('tasks').update(row).eq('id', id).then(({ error }) => {
      if (error) {
        console.error('Update error:', error);
        pendingOpsRef.current.delete(id);
      }
    });
  }, []);

  const dbDelete = useCallback((id: string) => {
    pendingOpsRef.current.add(id);
    supabase.from('tasks').delete().eq('id', id).then(({ error }) => {
      if (error) {
        console.error('Delete error:', error);
        pendingOpsRef.current.delete(id);
      }
    });
  }, []);

  // ---- ALL TASK OPERATIONS: instant optimistic update + background DB sync ----

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'userId' | 'order'>) => {
    if (!user) return;

    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Instant UI update
    const optimisticTask: Task = {
      ...taskData,
      id: tempId,
      userId: user.uid,
      order: tasks.length,
      createdAt: now,
    };
    setTasks(prev => [...prev, optimisticTask]);

    // Background DB insert — realtime will handle replacing temp with real
    const row = {
      ...taskToRow(taskData),
      user_id: user.uid,
      task_order: tasks.length,
    };
    dbInsert(row);
  }, [user, tasks.length, dbInsert]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    // Instant UI update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    // Background DB
    dbUpdate(id, taskToRow(updates));
  }, [dbUpdate]);

  const deleteTask = useCallback((id: string) => {
    // Instant UI removal
    setTasks(prev => prev.filter(t => t.id !== id));
    // Background DB
    dbDelete(id);
  }, [dbDelete]);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (!task) return prev;
      const newCompleted = !task.completed;
      // Background DB
      dbUpdate(id, { completed: newCompleted });
      return prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t);
    });
  }, [dbUpdate]);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (!task) return prev;
      const updatedSubtasks = task.subtasks.map(st =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );
      // Background DB
      dbUpdate(taskId, { subtasks: updatedSubtasks });
      return prev.map(t => t.id === taskId ? { ...t, subtasks: updatedSubtasks } : t);
    });
  }, [dbUpdate]);

  const reorderTasks = useCallback((reordered: Task[]) => {
    const withOrder = reordered.map((t, i) => ({ ...t, order: i }));
    setTasks(withOrder);

    // Debounce DB reorder — only send after user stops dragging
    if (reorderTimerRef.current) clearTimeout(reorderTimerRef.current);
    reorderTimerRef.current = setTimeout(() => {
      withOrder.forEach((task, index) => {
        supabase
          .from('tasks')
          .update({ task_order: index })
          .eq('id', task.id)
          .then(() => {});
      });
    }, 500);
  }, []);

  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    const id = `cat_${Date.now()}`;
    setCategories(prev => [...prev, { ...cat, id }]);
  }, []);

  // ---- MEMOIZED filtered tasks (no recalc unless dependencies change) ----
  const filteredTasks = useMemo(() => {
    const lowerSearch = searchQuery.toLowerCase();

    return tasks
      .filter(task => {
        // View filter
        if (viewFilter === 'completed') return task.completed;
        if (viewFilter === 'all' && task.completed) return false;

        if (viewFilter === 'today') {
          if (!task.dueDate) return false;
          return isToday(getCachedDate(task.dueDate)) && !task.completed;
        }
        if (viewFilter === 'upcoming') {
          if (!task.dueDate) return false;
          const d = getCachedDate(task.dueDate);
          return (isFuture(d) || isToday(d)) && !task.completed;
        }

        return true;
      })
      .filter(task => {
        if (!lowerSearch) return true;
        return task.title.toLowerCase().includes(lowerSearch) || task.description.toLowerCase().includes(lowerSearch);
      })
      .filter(task => priorityFilter === 'all' || task.priority === priorityFilter)
      .filter(task => categoryFilter === 'all' || task.category === categoryFilter)
      .sort((a, b) => {
        switch (sortBy) {
          case 'name': return a.title.localeCompare(b.title);
          case 'priority': return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
          case 'dueDate': {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return getCachedDate(a.dueDate).getTime() - getCachedDate(b.dueDate).getTime();
          }
          default: return a.order - b.order;
        }
      });
  }, [tasks, viewFilter, searchQuery, priorityFilter, categoryFilter, sortBy]);

  // ---- MEMOIZED stats ----
  const stats = useMemo<Stats>(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    let overdue = 0;
    let todayCount = 0;
    const byPriority = { urgent: 0, high: 0, medium: 0, low: 0 };

    for (const t of tasks) {
      if (t.dueDate) {
        const d = getCachedDate(t.dueDate);
        if (isToday(d)) todayCount++;
        if (!t.completed && isPast(d) && !isToday(d)) overdue++;
      }
      if (!t.completed) {
        byPriority[t.priority]++;
      }
    }

    return {
      total,
      completed,
      overdue,
      todayCount,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      byPriority,
    };
  }, [tasks]);

  // ---- STABLE context value (only changes when deps change) ----
  const contextValue = useMemo<TaskContextType>(() => ({
    tasks, categories, viewFilter, sortBy, searchQuery, priorityFilter, categoryFilter,
    filteredTasks, stats,
    setViewFilter, setSortBy, setSearchQuery, setPriorityFilter, setCategoryFilter,
    addTask, updateTask, deleteTask, toggleTask, toggleSubtask, reorderTasks, addCategory,
  }), [
    tasks, categories, viewFilter, sortBy, searchQuery, priorityFilter, categoryFilter,
    filteredTasks, stats,
    addTask, updateTask, deleteTask, toggleTask, toggleSubtask, reorderTasks, addCategory,
  ]);

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTasks must be used within TaskProvider');
  return context;
}
