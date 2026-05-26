import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import type { Task, Priority, SubTask } from '../types';
import { PRIORITY_CONFIG, DEFAULT_CATEGORIES } from '../types';
import { useTasks } from '../context/TaskContext';
import { toast } from 'sonner';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTask?: Task | null;
}

const emptyTask = {
  title: '',
  description: '',
  completed: false,
  priority: 'medium' as Priority,
  category: 'personal',
  dueDate: null as string | null,
  subtasks: [] as SubTask[],
};

const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];

const TaskModal = memo(function TaskModal({ isOpen, onClose, editTask }: TaskModalProps) {
  const { addTask, updateTask } = useTasks();
  const [form, setForm] = useState(emptyTask);
  const [newSubtask, setNewSubtask] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editTask) {
      setForm({
        title: editTask.title,
        description: editTask.description,
        completed: editTask.completed,
        priority: editTask.priority,
        category: editTask.category,
        dueDate: editTask.dueDate,
        subtasks: editTask.subtasks,
      });
    } else {
      setForm(emptyTask);
    }
    setErrors({});
  }, [editTask, isOpen]);

  const handleSubmit = useCallback(() => {
    if (!form.title.trim()) {
      setErrors({ title: 'Title is required' });
      return;
    }

    // Instant close — operations are optimistic (fire-and-forget)
    if (editTask) {
      updateTask(editTask.id, form);
      toast.success('Task updated! ✏️');
    } else {
      addTask(form);
      toast.success('Task added! 🎉');
    }
    onClose();
  }, [form, editTask, updateTask, addTask, onClose]);

  const addSubtaskItem = useCallback(() => {
    if (!newSubtask.trim()) return;
    const subtask: SubTask = {
      id: `st_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: newSubtask.trim(),
      completed: false,
    };
    setForm(prev => ({ ...prev, subtasks: [...prev.subtasks, subtask] }));
    setNewSubtask('');
  }, [newSubtask]);

  const removeSubtask = useCallback((id: string) => {
    setForm(prev => ({ ...prev, subtasks: prev.subtasks.filter(st => st.id !== id) }));
  }, []);

  const setTitle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, title: e.target.value }));
  }, []);

  const setDescription = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, description: e.target.value }));
  }, []);

  const setPriority = useCallback((p: Priority) => {
    setForm(prev => ({ ...prev, priority: p }));
  }, []);

  const setCategory = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, category: e.target.value }));
  }, []);

  const setDueDate = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, dueDate: e.target.value || null }));
  }, []);

  const handleSubtaskKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubtaskItem();
    }
  }, [addSubtaskItem]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed inset-x-4 top-[5%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-50 max-h-[90vh] overflow-hidden"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editTask ? 'Edit Task' : '✨ New Task'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Form */}
              <div className="overflow-y-auto p-5 space-y-5 flex-1">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={setTitle}
                    placeholder="What needs to be done?"
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 
                      ${errors.title ? 'border-rose-500' : 'border-gray-200 dark:border-gray-700'}
                      focus:border-violet-500 focus:outline-none transition-colors text-gray-800 dark:text-white placeholder:text-gray-400`}
                    autoFocus
                  />
                  {errors.title && (
                    <p className="text-rose-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.title}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={setDescription}
                    placeholder="Add more details..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:outline-none transition-colors text-gray-800 dark:text-white placeholder:text-gray-400 resize-none"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {priorities.map((p) => {
                      const config = PRIORITY_CONFIG[p];
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`py-2.5 rounded-xl text-xs font-bold uppercase transition-all border-2
                            ${form.priority === p
                              ? `${config.bgColor} ${config.color} border-current ${config.darkBg}`
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                            }`}
                        >
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Category & Due Date row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={setCategory}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:outline-none transition-colors text-gray-800 dark:text-white"
                    >
                      {DEFAULT_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={form.dueDate || ''}
                      onChange={setDueDate}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:outline-none transition-colors text-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Subtasks */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Subtasks
                  </label>

                  {form.subtasks.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {form.subtasks.map((st) => (
                        <div key={st.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                          <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{st.title}</span>
                          <button
                            type="button"
                            onClick={() => removeSubtask(st.id)}
                            className="p-1 text-gray-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={handleSubtaskKeyDown}
                      placeholder="Add a subtask..."
                      className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:outline-none transition-colors text-sm text-gray-800 dark:text-white placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={addSubtaskItem}
                      className="p-2.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 rounded-xl hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all"
                >
                  {editTask ? 'Save Changes' : 'Add Task'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default TaskModal;
