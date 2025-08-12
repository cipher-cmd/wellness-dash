import { motion } from 'framer-motion';
import {
  IconFlame,
  IconMeat,
  IconBread,
  IconDroplet,
  IconTarget,
  IconTrendingUp,
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
  };
}

const nutritionConfig = {
  kcal: {
    icon: IconFlame,
    label: 'Calories',
    unit: '',
    color: 'from-orange-400 to-red-500',
    bgColor: 'from-orange-50 to-red-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
  },
  protein: {
    icon: IconMeat,
    label: 'Protein',
    unit: 'g',
    color: 'from-blue-400 to-indigo-500',
    bgColor: 'from-blue-50 to-indigo-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
  },
  carbs: {
    icon: IconBread,
    label: 'Carbs',
    unit: 'g',
    color: 'from-yellow-400 to-orange-500',
    bgColor: 'from-yellow-50 to-orange-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700',
  },
  fat: {
    icon: IconDroplet,
    label: 'Fat',
    unit: 'g',
    color: 'from-green-400 to-teal-500',
    bgColor: 'from-green-50 to-teal-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
  },
};

export default function EnhancedDailySummary({
  dailyTotals,
  goals,
}: EnhancedDailySummaryProps) {
  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getProgressWidth = (percentage: number) => {
    return `${Math.min(percentage, 100)}%`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
            <IconTarget className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Daily Summary</h2>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Track your daily nutrition progress and stay on top of your health
          goals
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Object.entries(nutritionConfig).map(([key, config]) => {
          const Icon = config.icon;
          const current = dailyTotals[key as keyof typeof dailyTotals];
          const target = goals[key as keyof typeof goals];
          const percentage = getProgressPercentage(current, target);
          const progressColor = getProgressColor(percentage);

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.1 * Object.keys(nutritionConfig).indexOf(key),
              }}
              className={`bg-gradient-to-br ${config.bgColor} rounded-xl p-4 border ${config.borderColor} hover:shadow-md transition-all duration-300`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 bg-gradient-to-r ${config.color} rounded-xl flex items-center justify-center`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {config.label}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Target: {target}
                    {config.unit}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {current}
                    {config.unit}
                  </span>
                  <span className={`text-sm font-semibold ${config.textColor}`}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: getProgressWidth(percentage) }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={`h-2 ${progressColor} rounded-full transition-all duration-500`}
                  />
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 ${progressColor} rounded-full`} />
                  <span className="text-xs text-gray-600">
                    {percentage >= 80
                      ? 'Great progress!'
                      : percentage >= 60
                      ? 'Good progress'
                      : percentage >= 40
                      ? 'Keep going'
                      : 'Getting started'}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <IconTrendingUp className="w-6 h-6 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            Today's Progress
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {dailyTotals.kcal}
            </div>
            <div className="text-sm text-gray-600">Calories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {dailyTotals.protein}g
            </div>
            <div className="text-sm text-gray-600">Protein</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {dailyTotals.carbs}g
            </div>
            <div className="text-sm text-gray-600">Carbs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {dailyTotals.fat}g
            </div>
            <div className="text-sm text-gray-600">Fat</div>
          </div>
        </div>

        {/* Motivation Message */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            {dailyTotals.kcal === 0
              ? 'Start your day by logging your first meal! 🍽️'
              : dailyTotals.kcal < goals.kcal * 0.5
              ? 'Great start! Keep adding nutritious foods 💪'
              : dailyTotals.kcal < goals.kcal * 0.8
              ? "You're doing great! Almost there 🎯"
              : "Excellent work today! You're crushing your goals 🎉"}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
