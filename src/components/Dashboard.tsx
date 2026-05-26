import { useState, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Menu, Search, Plus, SlidersHorizontal, ArrowUpDown,
  ListFilter, Inbox, Sparkles, CheckSquare
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import AnalyticsModal from './AnalyticsModal';
import type { Task, SortBy, Priority } from '../types';

interface DashboardProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const VIEW_TITLES: Record<string, string> = {
  today: '📅 Today',
  upcoming: '📆 Upcoming',
  completed: '✅ Completed',
  all: '📋 All Tasks',
};

export default function Dashboard({ darkMode, toggleDarkMode }: DashboardProps) {
  const { user } = useAuth();
  const {
    filteredTasks, viewFilter, sortBy, setSortBy,
    searchQuery, setSearchQuery, priorityFilter, setPriorityFilter,
    stats, reorderTasks
  } = useTasks();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleEdit = useCallback((task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  }, []);

  const handleNewTask = useCallback(() => {
    setEditingTask(null);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingTask(null);
  }, []);

  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);
  const handleOpenSidebar = useCallback(() => setSidebarOpen(true), []);
  const handleToggleFilters = useCallback(() => setShowFilters(p => !p), []);
  const handleOpenAnalytics = useCallback(() => setAnalyticsOpen(true), []);
  const handleCloseAnalytics = useCallback(() => setAnalyticsOpen(false), []);

  const greeting = useMemo(() => getGreeting(), []);
  const firstName = useMemo(() => user?.displayName?.split(' ')[0], [user?.displayName]);
  const viewTitle = VIEW_TITLES[viewFilter] || '📋 All Tasks';
  const remaining = stats.total - stats.completed;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onOpenAnalytics={handleOpenAnalytics}
      />

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-4">
            <button
              onClick={handleOpenSidebar}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* App name on mobile */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold gradient-text">TaskFlow</span>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md ml-auto lg:ml-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all text-gray-800 dark:text-white placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Filter toggle */}
            <button
              onClick={handleToggleFilters}
              className={`p-2.5 rounded-xl transition-colors ${
                showFilters ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Filter bar */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="px-4 sm:px-6 pb-4 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortBy)}
                      className="bg-transparent text-sm text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
                    >
                      <option value="created">Default</option>
                      <option value="dueDate">Due Date</option>
                      <option value="priority">Priority</option>
                      <option value="name">Name</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2">
                    <ListFilter className="w-4 h-4 text-gray-400" />
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}
                      className="bg-transparent text-sm text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Priorities</option>
                      <option value="urgent">🔴 Urgent</option>
                      <option value="high">🟠 High</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="low">🟢 Low</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-6"
          >
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              {greeting}, {firstName}! 👋
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {stats.total === 0
                ? "Ready to start organizing? Add your first task!"
                : `You have ${remaining} tasks remaining`
              }
            </p>

            {/* Progress bar */}
            {stats.total > 0 && (
              <div className="mt-4 bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            )}
          </motion.div>

          {/* View title */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
              {viewTitle}
            </h2>
            <span className="text-sm text-gray-400 font-medium">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          {/* Task List */}
          {filteredTasks.length > 0 ? (
            <Reorder.Group
              axis="y"
              values={filteredTasks}
              onReorder={(reordered) => reorderTasks(reordered as Task[])}
              className="space-y-3"
            >
              {filteredTasks.map((task) => (
                <Reorder.Item key={task.id} value={task} className="list-none">
                  <TaskCard task={task} onEdit={handleEdit} />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          ) : (
            <EmptyState
              viewFilter={viewFilter}
              searchQuery={searchQuery}
              onAddTask={handleNewTask}
            />
          )}
        </div>

        {/* Floating Add Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleNewTask}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-violet-600 to-pink-600 text-white rounded-2xl shadow-lg shadow-violet-500/30 flex items-center justify-center hover:shadow-xl hover:shadow-violet-500/40 transition-shadow z-20"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </main>

      {/* Task Modal */}
      <TaskModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        editTask={editingTask}
      />

      {/* Analytics Modal */}
      <AnalyticsModal
        isOpen={analyticsOpen}
        onClose={handleCloseAnalytics}
        darkMode={darkMode}
      />
    </div>
  );
}

// Memoized empty state
const EmptyState = memo(function EmptyState({
  viewFilter,
  searchQuery,
  onAddTask,
}: {
  viewFilter: string;
  searchQuery: string;
  onAddTask: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="text-center py-16"
    >
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-pink-100 dark:from-violet-900/30 dark:to-pink-900/30 mb-4">
        {viewFilter === 'completed' ? (
          <Sparkles className="w-10 h-10 text-violet-500" />
        ) : (
          <Inbox className="w-10 h-10 text-violet-400" />
        )}
      </div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
        {viewFilter === 'completed' ? 'No completed tasks yet' : 'All clear! 🎉'}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        {viewFilter === 'completed'
          ? "Complete some tasks and they'll show up here"
          : searchQuery
            ? 'No tasks match your search'
            : 'Add a task to get started'
        }
      </p>
      {!searchQuery && viewFilter !== 'completed' && (
        <button
          onClick={onAddTask}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Your First Task
        </button>
      )}
    </motion.div>
  );
});
