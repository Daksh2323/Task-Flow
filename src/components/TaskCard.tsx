import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit3, ChevronDown, ChevronUp, Calendar, GripVertical } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import type { Task } from '../types';
import { PRIORITY_CONFIG, DEFAULT_CATEGORIES } from '../types';
import { format, parseISO, isToday, isPast, isTomorrow } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  dragHandleProps?: any;
}

const categoryMap = new Map(DEFAULT_CATEGORIES.map(c => [c.id, c]));

const formatDueDate = (dateStr: string) => {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'MMM d');
};

const getDueDateColor = (dateStr: string) => {
  const date = parseISO(dateStr);
  if (isPast(date) && !isToday(date)) return 'text-rose-500 bg-rose-50 dark:bg-rose-900/30';
  if (isToday(date)) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/30';
  return 'text-gray-500 bg-gray-100 dark:bg-gray-700';
};

const TaskCard = memo(function TaskCard({ task, onEdit, dragHandleProps }: TaskCardProps) {
  const { toggleTask, deleteTask, toggleSubtask } = useTasks();
  const [showSubtasks, setShowSubtasks] = useState(false);

  const priority = PRIORITY_CONFIG[task.priority];
  const category = categoryMap.get(task.category);

  const completedSubtasks = task.subtasks.filter(st => st.completed).length;
  const totalSubtasks = task.subtasks.length;

  const handleToggle = useCallback(() => toggleTask(task.id), [task.id, toggleTask]);
  const handleDelete = useCallback(() => deleteTask(task.id), [task.id, deleteTask]);
  const handleEdit = useCallback(() => onEdit(task), [task, onEdit]);
  const handleToggleSubtasks = useCallback(() => setShowSubtasks(prev => !prev), []);

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.15 }}
      className={`group bg-white dark:bg-gray-800 rounded-xl border-l-4 ${priority.borderColor} border border-l-4 border-gray-100 dark:border-gray-700 
        hover:shadow-lg hover:shadow-violet-500/5 transition-shadow duration-150 overflow-hidden
        ${task.completed ? 'opacity-60' : ''}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <div {...dragHandleProps} className="pt-0.5 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-40 transition-opacity">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>

          {/* Checkbox */}
          <input
            type="checkbox"
            checked={task.completed}
            onChange={handleToggle}
            className="checkbox-custom mt-0.5"
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`font-semibold text-gray-900 dark:text-white text-sm leading-tight
                ${task.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                {task.title}
              </h3>
              
              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={handleEdit}
                  className="p-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/30 text-gray-400 hover:text-violet-500 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 text-gray-400 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {task.description && (
              <p className={`text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 ${task.completed ? 'line-through' : ''}`}>
                {task.description}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {/* Priority badge */}
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${priority.bgColor} ${priority.color} ${priority.darkBg}`}>
                {priority.label}
              </span>

              {/* Category badge */}
              {category && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center gap-1">
                  {category.icon} {category.name}
                </span>
              )}

              {/* Due date */}
              {task.dueDate && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${getDueDateColor(task.dueDate)}`}>
                  <Calendar className="w-3 h-3" />
                  {formatDueDate(task.dueDate)}
                </span>
              )}

              {/* Subtask count */}
              {totalSubtasks > 0 && (
                <button
                  onClick={handleToggleSubtasks}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 flex items-center gap-1 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors"
                >
                  ✓ {completedSubtasks}/{totalSubtasks}
                  {showSubtasks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>

            {/* Subtask progress bar */}
            {totalSubtasks > 0 && (
              <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-200"
                  style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded subtasks */}
      <AnimatePresence>
        {showSubtasks && totalSubtasks > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pl-14 space-y-1.5">
              {task.subtasks.map((subtask) => (
                <SubtaskItem
                  key={subtask.id}
                  taskId={task.id}
                  subtask={subtask}
                  toggleSubtask={toggleSubtask}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// Memoized subtask item
const SubtaskItem = memo(function SubtaskItem({
  taskId,
  subtask,
  toggleSubtask,
}: {
  taskId: string;
  subtask: { id: string; title: string; completed: boolean };
  toggleSubtask: (taskId: string, subtaskId: string) => void;
}) {
  const handleChange = useCallback(
    () => toggleSubtask(taskId, subtask.id),
    [taskId, subtask.id, toggleSubtask]
  );

  return (
    <label className="flex items-center gap-2.5 cursor-pointer group/sub">
      <input
        type="checkbox"
        checked={subtask.completed}
        onChange={handleChange}
        className="checkbox-custom !w-4 !h-4 !rounded"
      />
      <span className={`text-xs ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
        {subtask.title}
      </span>
    </label>
  );
});

export default TaskCard;
