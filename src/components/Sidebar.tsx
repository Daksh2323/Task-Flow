import { memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutList, CalendarDays, CalendarClock, CheckCircle2,
  LogOut, Moon, Sun, TrendingUp, X, ChevronDown, ChevronUp, BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import type { ViewFilter } from '../types';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onOpenAnalytics: () => void;
}

const Sidebar = memo(function Sidebar({ isOpen, onClose, darkMode, toggleDarkMode, onOpenAnalytics }: SidebarProps) {
  const { user, signOut } = useAuth();
  const { viewFilter, setViewFilter, categoryFilter, setCategoryFilter, categories, stats, tasks } = useTasks();
  const [showStats, setShowStats] = useState(true);

  // Memoize nav counts
  const navItems = useMemo(() => {
    const activeTasks = tasks.filter(t => !t.completed);
    const withDueDate = activeTasks.filter(t => t.dueDate);
    return [
      { id: 'all' as ViewFilter, icon: LayoutList, label: 'All Tasks', count: activeTasks.length },
      { id: 'today' as ViewFilter, icon: CalendarDays, label: 'Today', count: stats.todayCount },
      { id: 'upcoming' as ViewFilter, icon: CalendarClock, label: 'Upcoming', count: withDueDate.length },
      { id: 'completed' as ViewFilter, icon: CheckCircle2, label: 'Completed', count: stats.completed },
    ];
  }, [tasks, stats.todayCount, stats.completed]);

  // Memoize category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) {
      if (!t.completed) {
        counts[t.category] = (counts[t.category] || 0) + 1;
      }
    }
    return counts;
  }, [tasks]);

  const handleNavClick = useCallback((id: ViewFilter) => {
    setViewFilter(id);
    setCategoryFilter('all');
    onClose();
  }, [setViewFilter, setCategoryFilter, onClose]);

  const handleCategoryClick = useCallback((catId: string) => {
    setCategoryFilter(catId === categoryFilter ? 'all' : catId);
    setViewFilter('all');
    onClose();
  }, [categoryFilter, setCategoryFilter, setViewFilter, onClose]);

  const handleSignOut = useCallback(() => signOut(), [signOut]);
  const handleToggleStats = useCallback(() => setShowStats(p => !p), []);

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800">
      {/* User Info */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={user?.photoURL || ''}
              alt={user?.displayName || 'User'}
              className="w-11 h-11 rounded-xl object-cover bg-gradient-to-br from-violet-400 to-pink-400"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'U')}&background=7c3aed&color=fff&rounded=true`;
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 dark:text-white truncate text-sm">{user?.displayName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email}
            </p>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-3 mb-2">Tasks</p>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium
              ${viewFilter === item.id && categoryFilter === 'all'
                ? 'bg-gradient-to-r from-violet-500/10 to-pink-500/10 text-violet-700 dark:text-violet-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
          >
            <item.icon className={`w-5 h-5 ${viewFilter === item.id && categoryFilter === 'all' ? 'text-violet-500' : ''}`} />
            <span className="flex-1 text-left">{item.label}</span>
            {item.count > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold
                ${viewFilter === item.id && categoryFilter === 'all'
                  ? 'bg-violet-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}>
                {item.count}
              </span>
            )}
          </button>
        ))}

        {/* Categories */}
        <div className="pt-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-3 mb-2">Categories</p>
          {categories.map((cat) => {
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium
                  ${categoryFilter === cat.id
                    ? 'bg-gradient-to-r from-violet-500/10 to-pink-500/10 text-violet-700 dark:text-violet-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
              >
                <span className="text-lg">{cat.icon}</span>
                <span className="flex-1 text-left">{cat.name}</span>
                {count > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Stats */}
        <div className="pt-4">
          <button
            onClick={handleToggleStats}
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 px-3 mb-2 w-full"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Stats</span>
            {showStats ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
          </button>
          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <StatsPanel stats={stats} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
        <button
          onClick={() => { onOpenAnalytics(); onClose(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
        >
          <BarChart3 className="w-5 h-5" />
          Analytics
        </button>
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-violet-500" />}
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-72 h-screen sticky top-0 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={onClose}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 z-50 shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
});

// Memoized stats panel
const StatsPanel = memo(function StatsPanel({ stats }: { stats: any }) {
  const dashOffset = useMemo(
    () => 2 * Math.PI * 24 * (1 - stats.completionRate / 100),
    [stats.completionRate]
  );
  const circumference = useMemo(() => 2 * Math.PI * 24, []);

  return (
    <div className="mx-2 p-4 bg-gradient-to-br from-violet-50 to-pink-50 dark:from-violet-900/20 dark:to-pink-900/20 rounded-xl space-y-3">
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-200 dark:text-gray-700" />
            <circle
              cx="28" cy="28" r="24" fill="none"
              stroke="url(#gradient)" strokeWidth="4"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={`${dashOffset}`}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-200">
            {stats.completionRate}%
          </span>
        </div>
        <div>
          <p className="text-2xl font-extrabold text-gray-800 dark:text-white">
            {stats.completed}<span className="text-sm font-medium text-gray-400">/{stats.total}</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Tasks done</p>
        </div>
      </div>

      {stats.overdue > 0 && (
        <div className="flex items-center gap-2 text-xs bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-lg font-medium">
          <span>⚠️</span> {stats.overdue} overdue {stats.overdue === 1 ? 'task' : 'tasks'}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {stats.byPriority.urgent > 0 && (
          <div className="text-xs bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 px-2 py-1 rounded-lg text-center font-medium">
            🔴 {stats.byPriority.urgent} urgent
          </div>
        )}
        {stats.byPriority.high > 0 && (
          <div className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 px-2 py-1 rounded-lg text-center font-medium">
            🟠 {stats.byPriority.high} high
          </div>
        )}
      </div>
    </div>
  );
});

export default Sidebar;
