import { motion } from 'framer-motion';
import {
  IconFlame,
  IconMeat,
  IconBread,
  IconDroplet,
} from '@tabler/icons-react';

interface EnhancedDailySummaryProps {
  dailyTotals: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  goals: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null;
}

export default function EnhancedDailySummary({
  dailyTotals,
  goals,
}: EnhancedDailySummaryProps) {
  const defaultGoals = {
    kcal: 2000,
    protein: 150,
    carbs: 200,
    fat: 67,
  };

  const currentGoals = goals || defaultGoals;

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 100) return 'from-green-400 to-green-600';
    if (percentage >= 80) return 'from-yellow-400 to-yellow-600';
    if (percentage >= 60) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  const metrics = [
    {
      label: 'Calories',
      value: dailyTotals.kcal,
      target: currentGoals.kcal,
      icon: IconFlame,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      label: 'Protein',
      value: dailyTotals.protein,
      target: currentGoals.protein,
      icon: IconMeat,
      color: 'text-mint-500',
      bgColor: 'bg-mint-50',
    },
    {
      label: 'Carbs',
      value: dailyTotals.carbs,
      target: currentGoals.carbs,
      icon: IconBread,
      color: 'text-marigold-500',
      bgColor: 'bg-marigold-50',
    },
    {
      label: 'Fat',
      value: dailyTotals.fat,
      target: currentGoals.fat,
      icon: IconDroplet,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
  ];

  const formatMetricValue = (label: string, value: number): string => {
    if (!Number.isFinite(value)) return '0';
    if (label === 'Calories') return Math.round(value).toLocaleString();
    return value.toFixed(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-2xl shadow-xl p-3 sm:p-4 md:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 border border-gray-100 w-full max-w-none overflow-hidden"
    >
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 text-center"
      >
        Daily Summary
      </motion.h3>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 xl:gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const progress = getProgressPercentage(metric.value, metric.target);
          const progressColor = getProgressColor(metric.value, metric.target);

          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
              className="text-center group min-w-0 flex flex-col items-center"
            >
              <div
                className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full ${metric.bgColor} mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 ${metric.color}`} />
              </div>

              <div className="mb-3 w-full px-1">
                <div
                  className={`text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold ${metric.color} mb-1 leading-tight tabular-nums min-h-[1.5em] flex items-center justify-center`}
                >
                  {formatMetricValue(metric.label, metric.value)}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mb-1 text-center">{metric.label}</div>
                <div className="text-xs text-gray-500 text-center">
                  Target: {metric.target}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <motion.div
                  className={`h-2 rounded-full bg-gradient-to-r ${progressColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{
                    delay: 0.2 + index * 0.1,
                    duration: 1,
                    ease: 'easeOut',
                  }}
                />
              </div>

              <div className="text-xs text-gray-500 text-center">
                {progress.toFixed(0)}% of goal
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Total Progress */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="mt-4 sm:mt-6 md:mt-8 pt-3 sm:pt-4 md:pt-6 border-t border-gray-100"
      >
        <div className="text-center px-2">
          <div className="text-sm sm:text-base md:text-lg font-semibold text-gray-700 mb-2">
            Overall Progress
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
            <motion.div
              className="h-2 sm:h-3 rounded-full bg-gradient-to-r from-marigold to-orange-500"
              initial={{ width: 0 }}
              animate={{
                width: `${getProgressPercentage(
                  dailyTotals.kcal +
                    dailyTotals.protein +
                    dailyTotals.carbs +
                    dailyTotals.fat,
                  currentGoals.kcal +
                    currentGoals.protein +
                    currentGoals.carbs +
                    currentGoals.fat
                )}%`,
              }}
              transition={{ delay: 0.8, duration: 1.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
