import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, CheckCircle2, Clock, AlertTriangle, BarChart3 } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, AreaChart, Area, CartesianGrid, Legend,
  RadialBarChart, RadialBar
} from 'recharts';
import { useTasks } from '../context/TaskContext';
import { DEFAULT_CATEGORIES } from '../types';
import { format, parseISO, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#f43f5e',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#10b981',
};



const AnalyticsModal = memo(function AnalyticsModal({ isOpen, onClose, darkMode }: AnalyticsModalProps) {
  const { tasks, stats } = useTasks();

  const textColor = darkMode ? '#e5e7eb' : '#374151';
  const subTextColor = darkMode ? '#9ca3af' : '#6b7280';
  const gridColor = darkMode ? '#374151' : '#e5e7eb';
  const tooltipBg = darkMode ? '#1f2937' : '#ffffff';
  const tooltipBorder = darkMode ? '#374151' : '#e5e7eb';

  // ---- Chart data computations ----

  // Tasks by category (pie chart)
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) {
      counts[t.category] = (counts[t.category] || 0) + 1;
    }
    return DEFAULT_CATEGORIES
      .map(cat => ({
        name: `${cat.icon} ${cat.name}`,
        value: counts[cat.id] || 0,
        color: cat.color,
      }))
      .filter(d => d.value > 0);
  }, [tasks]);

  // Tasks by priority (bar chart)
  const priorityData = useMemo(() => {
    const active: Record<string, number> = { urgent: 0, high: 0, medium: 0, low: 0 };
    const done: Record<string, number> = { urgent: 0, high: 0, medium: 0, low: 0 };
    for (const t of tasks) {
      if (t.completed) done[t.priority]++;
      else active[t.priority]++;
    }
    return [
      { name: '🔴 Urgent', active: active.urgent, completed: done.urgent, fill: PRIORITY_COLORS.urgent },
      { name: '🟠 High', active: active.high, completed: done.high, fill: PRIORITY_COLORS.high },
      { name: '🟡 Medium', active: active.medium, completed: done.medium, fill: PRIORITY_COLORS.medium },
      { name: '🟢 Low', active: active.low, completed: done.low, fill: PRIORITY_COLORS.low },
    ];
  }, [tasks]);

  // Activity over last 7 days (area chart)
  const weeklyData = useMemo(() => {
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      let created = 0;
      let completed = 0;
      for (const t of tasks) {
        if (t.createdAt) {
          try {
            const cDate = parseISO(t.createdAt);
            if (isWithinInterval(cDate, { start: dayStart, end: dayEnd })) created++;
          } catch {}
        }
        // We count completed tasks that were created on that day as "completed that day"
        // (since we don't have a completedAt field, approximate with createdAt for completed tasks)
        if (t.completed && t.createdAt) {
          try {
            const cDate = parseISO(t.createdAt);
            if (isWithinInterval(cDate, { start: dayStart, end: dayEnd })) completed++;
          } catch {}
        }
      }

      days.push({
        day: format(day, 'EEE'),
        date: format(day, 'MMM d'),
        created,
        completed,
      });
    }
    return days;
  }, [tasks]);

  // Completion radial (gauge)
  const radialData = useMemo(() => [
    { name: 'Completed', value: stats.completionRate, fill: 'url(#radialGrad)' },
  ], [stats.completionRate]);

  // Summary cards data
  const summaryCards = useMemo(() => [
    { icon: BarChart3, label: 'Total Tasks', value: stats.total, color: 'from-violet-500 to-purple-500', iconColor: 'text-violet-500' },
    { icon: CheckCircle2, label: 'Completed', value: stats.completed, color: 'from-emerald-500 to-green-500', iconColor: 'text-emerald-500' },
    { icon: Clock, label: 'In Progress', value: stats.total - stats.completed, color: 'from-amber-500 to-orange-500', iconColor: 'text-amber-500' },
    { icon: AlertTriangle, label: 'Overdue', value: stats.overdue, color: 'from-rose-500 to-pink-500', iconColor: 'text-rose-500' },
  ], [stats]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div
        className="rounded-xl px-3 py-2 shadow-lg text-xs border"
        style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}
      >
        <p className="font-semibold mb-1" style={{ color: textColor }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color || p.fill }}>
            {p.name}: <span className="font-bold">{p.value}</span>
          </p>
        ))}
      </div>
    );
  };

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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed inset-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-[3%] sm:w-full sm:max-w-3xl sm:max-h-[94vh] z-50 overflow-hidden"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col h-full sm:max-h-[94vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Analytics</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Your productivity insights</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 p-5 space-y-6">

                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {summaryCards.map((card, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700"
                    >
                      <card.icon className={`w-5 h-5 ${card.iconColor} mb-2`} />
                      <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{card.value}</p>
                      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{card.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Row: Completion Gauge + Category Pie */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Completion Gauge */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Completion Rate</h3>
                    <div className="flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={180}>
                        <RadialBarChart
                          cx="50%"
                          cy="50%"
                          innerRadius="70%"
                          outerRadius="100%"
                          startAngle={180}
                          endAngle={0}
                          data={radialData}
                          barSize={14}
                        >
                          <defs>
                            <linearGradient id="radialGrad" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#7c3aed" />
                              <stop offset="100%" stopColor="#ec4899" />
                            </linearGradient>
                          </defs>
                          <RadialBar
                            dataKey="value"
                            cornerRadius={10}
                            background={{ fill: darkMode ? '#374151' : '#e5e7eb' }}
                          />
                          <text
                            x="50%"
                            y="45%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-3xl font-extrabold"
                            fill={textColor}
                            fontSize={32}
                            fontWeight={800}
                          >
                            {stats.completionRate}%
                          </text>
                          <text
                            x="50%"
                            y="62%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={subTextColor}
                            fontSize={11}
                          >
                            completed
                          </text>
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Category Distribution */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">By Category</h3>
                    {categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {categoryData.map((entry, idx) => (
                              <Cell key={idx} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={<CustomTooltip />}
                          />
                          <Legend
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '11px', color: subTextColor }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[180px] text-gray-400 dark:text-gray-600 text-sm">
                        No tasks yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority Breakdown */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Tasks by Priority</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={priorityData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: subTextColor, fontSize: 11 }}
                        axisLine={{ stroke: gridColor }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: subTextColor, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '11px', color: subTextColor }}
                      />
                      <Bar dataKey="active" name="Active" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {priorityData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.fill} />
                        ))}
                      </Bar>
                      <Bar dataKey="completed" name="Done" fill={darkMode ? '#4b5563' : '#d1d5db'} radius={[6, 6, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Weekly Activity */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Activity — Last 7 Days</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={weeklyData}>
                      <defs>
                        <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis
                        dataKey="day"
                        tick={{ fill: subTextColor, fontSize: 11 }}
                        axisLine={{ stroke: gridColor }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: subTextColor, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '11px', color: subTextColor }}
                      />
                      <Area
                        type="monotone"
                        dataKey="created"
                        name="Created"
                        stroke="#7c3aed"
                        strokeWidth={2}
                        fill="url(#createdGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="completed"
                        name="Completed"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#completedGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default AnalyticsModal;
