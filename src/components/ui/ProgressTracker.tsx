import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconCalendar,
  IconTarget,
} from '@tabler/icons-react';
import { db } from '../../lib/db';

interface ProgressTrackerProps {
  goals: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface WeeklyData {
  date: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function ProgressTracker({ goals }: ProgressTrackerProps) {
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<
    'kcal' | 'protein' | 'carbs' | 'fat'
  >('kcal');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWeeklyData();
  }, []);

  const loadWeeklyData = async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const entries = await db.diary
        .where('date')
        .between(
          weekAgo.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        )
        .toArray();

      // Group entries by date and calculate totals
      const dailyTotals = new Map<
        string,
        { kcal: number; protein: number; carbs: number; fat: number }
      >();

      for (const entry of entries) {
        if (entry.foodId && entry.grams) {
          const food = await db.foods.get(entry.foodId);
          if (food) {
            const multiplier = entry.grams / 100;
            const existing = dailyTotals.get(entry.date) || {
              kcal: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
            };

            dailyTotals.set(entry.date, {
              kcal: existing.kcal + food.per100g.kcal * multiplier,
              protein: existing.protein + food.per100g.protein * multiplier,
              carbs: existing.carbs + food.per100g.carbs * multiplier,
              fat: existing.fat + food.per100g.fat * multiplier,
            });
          }
        }
      }

      // Convert to array and sort by date
      const weeklyDataArray: WeeklyData[] = Array.from(dailyTotals.entries())
        .map(([date, totals]) => ({ date, ...totals }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setWeeklyData(weeklyDataArray);
    } catch (error) {
      console.error('Error loading weekly data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMetricInfo = (metric: string) => {
    switch (metric) {
      case 'kcal':
        return {
          label: 'Calories',
          unit: 'kcal',
          color: 'from-orange-400 to-red-500',
          goal: goals.kcal,
        };
      case 'protein':
        return {
          label: 'Protein',
          unit: 'g',
          color: 'from-mint to-teal-500',
          goal: goals.protein,
        };
      case 'carbs':
        return {
          label: 'Carbohydrates',
          unit: 'g',
          color: 'from-marigold to-orange-500',
          goal: goals.carbs,
        };
      case 'fat':
        return {
          label: 'Fat',
          unit: 'g',
          color: 'from-red-400 to-pink-500',
          goal: goals.fat,
        };
      default:
        return { label: '', unit: '', color: '', goal: 0 };
    }
  };

  const getProgressPercentage = (value: number, goal: number) => {
    return Math.min((value / goal) * 100, 100);
  };

  const getTrend = (metric: string) => {
    if (weeklyData.length < 2) return 'neutral';

    const recent =
      weeklyData
        .slice(-3)
        .reduce(
          (sum, day) => sum + (day[metric as keyof WeeklyData] as number),
          0
        ) / 3;
    const earlier =
      weeklyData
        .slice(0, -3)
        .reduce(
          (sum, day) => sum + (day[metric as keyof WeeklyData] as number),
          0
        ) / Math.max(weeklyData.length - 3, 1);

    if (recent > earlier * 1.1) return 'up';
    if (recent < earlier * 0.9) return 'down';
    return 'neutral';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const metricInfo = getMetricInfo(selectedMetric);
  const trend = getTrend(selectedMetric);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <IconTrendingUp className="w-6 h-6 text-marigold-500" />
            Progress Tracker
          </h3>
          <p className="text-gray-600">
            Track your nutrition progress over time
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
          {(['kcal', 'protein', 'carbs', 'fat'] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedMetric === metric
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {getMetricInfo(metric).label}
            </button>
          ))}
        </div>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-marigold/10 to-orange-500/10 p-6 rounded-xl border border-marigold/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Today's {metricInfo.label}
            </span>
            <div
              className={`flex items-center gap-1 text-sm ${
                trend === 'up'
                  ? 'text-green-600'
                  : trend === 'down'
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}
            >
              {trend === 'up' && <IconTrendingUp className="w-4 h-4" />}
              {trend === 'down' && <IconTrendingDown className="w-4 h-4" />}
              {trend === 'neutral' && <IconCalendar className="w-4 h-4" />}
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {weeklyData.length > 0
              ? weeklyData[weeklyData.length - 1]?.[selectedMetric]?.toFixed(
                  1
                ) || 0
              : 0}{' '}
            {metricInfo.unit}
          </div>
          <div className="text-sm text-gray-500">
            Goal: {metricInfo.goal} {metricInfo.unit}
          </div>
        </div>

        <div className="bg-gradient-to-r from-mint/10 to-teal-500/10 p-6 rounded-xl border border-mint/20">
          <div className="text-sm text-gray-600 mb-2">Weekly Average</div>
          <div className="text-2xl font-bold text-gray-900">
            {weeklyData.length > 0
              ? (
                  weeklyData.reduce(
                    (sum, day) => sum + (day[selectedMetric] as number),
                    0
                  ) / weeklyData.length
                ).toFixed(1)
              : 0}{' '}
            {metricInfo.unit}
          </div>
          <div className="text-sm text-gray-500">
            {weeklyData.length} days tracked
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 p-6 rounded-xl border border-red-500/20">
          <div className="text-sm text-gray-600 mb-2">Goal Progress</div>
          <div className="text-2xl font-bold text-gray-900">
            {weeklyData.length > 0
              ? getProgressPercentage(
                  weeklyData[weeklyData.length - 1]?.[selectedMetric] || 0,
                  metricInfo.goal
                ).toFixed(0)
              : 0}
            %
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className={`bg-gradient-to-r ${metricInfo.color} h-2 rounded-full transition-all duration-500`}
              style={{
                width: `${
                  weeklyData.length > 0
                    ? getProgressPercentage(
                        weeklyData[weeklyData.length - 1]?.[selectedMetric] ||
                          0,
                        metricInfo.goal
                      )
                    : 0
                }%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">
            7-Day Progress
          </h4>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <IconTarget className="w-4 h-4" />
            Target: {metricInfo.goal} {metricInfo.unit}
          </div>
        </div>

        {weeklyData.length > 0 ? (
          <div className="space-y-3">
            {weeklyData.map((day, index) => {
              const value = day[selectedMetric] as number;
              const percentage = getProgressPercentage(value, metricInfo.goal);
              const isToday = index === weeklyData.length - 1;

              return (
                <div key={day.date} className="flex items-center gap-4">
                  <div className="w-20 text-sm text-gray-600">
                    {formatDate(day.date)}
                  </div>

                  <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                    <div
                      className={`bg-gradient-to-r ${
                        metricInfo.color
                      } h-3 rounded-full transition-all duration-500 ${
                        isToday ? 'ring-2 ring-marigold ring-offset-2' : ''
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>

                  <div className="w-16 text-right text-sm font-medium text-gray-900">
                    {value.toFixed(1)}
                  </div>

                  {isToday && (
                    <span className="px-2 py-1 bg-marigold-500 text-white text-xs rounded-full">
                      Today
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <IconCalendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No data available for the past week</p>
            <p className="text-sm">
              Start logging your meals to see your progress
            </p>
          </div>
        )}
      </div>

      {/* Insights */}
      {weeklyData.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-marigold/5 to-orange-500/5 rounded-xl border border-marigold/20">
          <h5 className="font-semibold text-gray-900 mb-2">
            💡 Weekly Insights
          </h5>
          <div className="text-sm text-gray-700 space-y-1">
            {trend === 'up' && (
              <p>
                Great job! Your {metricInfo.label.toLowerCase()} intake has been
                increasing this week.
              </p>
            )}
            {trend === 'down' && (
              <p>
                Your {metricInfo.label.toLowerCase()} intake has decreased.
                Consider adjusting your meals.
              </p>
            )}
            {trend === 'neutral' && (
              <p>
                Your {metricInfo.label.toLowerCase()} intake has been consistent
                this week.
              </p>
            )}
            <p>
              You've tracked {weeklyData.length} out of 7 days. Keep up the
              consistency!
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
