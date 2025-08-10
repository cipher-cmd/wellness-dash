import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, subDays } from 'date-fns';
import {
  IconTarget,
  IconTrendingUp,
  IconScale,
  IconBrain,
} from '@tabler/icons-react';
import { db, type DiaryEntry } from '../../lib/db';

interface ChartData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  weight?: number;
}

interface WeightData {
  date: string;
  weight: number;
  bmi: number;
}

interface GoalProgress {
  name: string;
  current: number;
  target: number;
  percentage: number;
  color: string;
}

export default function EnhancedProgressCharts() {
  const [activeTab, setActiveTab] = useState<
    'nutrition' | 'weight' | 'goals' | 'insights'
  >('nutrition');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | '3months'>(
    'week'
  );
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [weightData, setWeightData] = useState<WeightData[]>([]);
  const [goals, setGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
  });

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      // Load diary entries
      const entries = await db.diary.toArray();
      setDiaryEntries(entries);

      // Load goals from localStorage
      const savedGoals = localStorage.getItem('wellnessdash_goals');
      if (savedGoals) {
        setGoals(JSON.parse(savedGoals));
      }

      // Load weight data from localStorage (mock data for now)
      const savedWeightData = localStorage.getItem('wellnessdash_weight_data');
      if (savedWeightData) {
        setWeightData(JSON.parse(savedWeightData));
      } else {
        // Generate mock weight data
        const mockWeightData = generateMockWeightData();
        setWeightData(mockWeightData);
        localStorage.setItem(
          'wellnessdash_weight_data',
          JSON.stringify(mockWeightData)
        );
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const generateMockWeightData = (): WeightData[] => {
    const data: WeightData[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      // Simulate weight fluctuations
      const baseWeight = 70;
      const fluctuation = Math.sin(i * 0.2) * 2 + Math.random() * 1;
      const weight = baseWeight + fluctuation;
      const height = 175; // cm
      const bmi = weight / Math.pow(height / 100, 2);

      data.push({
        date: format(date, 'yyyy-MM-dd'),
        weight: Math.round(weight * 10) / 10,
        bmi: Math.round(bmi * 10) / 10,
      });
    }
    return data;
  };

  const chartData = useMemo(() => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    const data: ChartData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const dayEntries = diaryEntries.filter((entry) => entry.date === date);

      const dayTotals = dayEntries.reduce(
        (acc, entry) => {
          const grams = entry.grams || 0;
          const quantity = entry.quantity || 1;
          const multiplier = (grams * quantity) / 100;

          // For now, we'll use placeholder values since we need to fetch food data
          // In a real implementation, you'd fetch the food data here
          const calories = 0; // entry.food?.per100g.kcal || 0
          const protein = 0; // entry.food?.per100g.protein || 0
          const carbs = 0; // entry.food?.per100g.carbs || 0
          const fat = 0; // entry.food?.per100g.fat || 0

          return {
            calories: acc.calories + calories * multiplier,
            protein: acc.protein + protein * multiplier,
            carbs: acc.carbs + carbs * multiplier,
            fat: acc.fat + fat * multiplier,
          };
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      data.push({
        date: format(subDays(new Date(), i), 'MMM dd'),
        calories: Math.round(dayTotals.calories),
        protein: Math.round(dayTotals.protein * 10) / 10,
        carbs: Math.round(dayTotals.carbs * 10) / 10,
        fat: Math.round(dayTotals.fat * 10) / 10,
      });
    }

    return data;
  }, [diaryEntries, timeRange]);

  const goalProgressData: GoalProgress[] = [
    {
      name: 'Calories',
      current: chartData[chartData.length - 1]?.calories || 0,
      target: goals.calories,
      percentage: Math.min(
        ((chartData[chartData.length - 1]?.calories || 0) / goals.calories) *
          100,
        100
      ),
      color: '#f97316',
    },
    {
      name: 'Protein',
      current: chartData[chartData.length - 1]?.protein || 0,
      target: goals.protein,
      percentage: Math.min(
        ((chartData[chartData.length - 1]?.protein || 0) / goals.protein) * 100,
        100
      ),
      color: '#10b981',
    },
    {
      name: 'Carbs',
      current: chartData[chartData.length - 1]?.carbs || 0,
      target: goals.carbs,
      percentage: Math.min(
        ((chartData[chartData.length - 1]?.carbs || 0) / goals.carbs) * 100,
        100
      ),
      color: '#f59e0b',
    },
    {
      name: 'Fat',
      current: chartData[chartData.length - 1]?.fat || 0,
      target: goals.fat,
      percentage: Math.min(
        ((chartData[chartData.length - 1]?.fat || 0) / goals.fat) * 100,
        100
      ),
      color: '#ef4444',
    },
  ];

  const nutritionTrends = useMemo(() => {
    const recentData = chartData.slice(-7);
    const avgCalories =
      recentData.reduce((sum, day) => sum + day.calories, 0) /
      recentData.length;
    const avgProtein =
      recentData.reduce((sum, day) => sum + day.protein, 0) / recentData.length;
    const avgCarbs =
      recentData.reduce((sum, day) => sum + day.carbs, 0) / recentData.length;
    const avgFat =
      recentData.reduce((sum, day) => sum + day.fat, 0) / recentData.length;

    return {
      calories: {
        current: avgCalories,
        target: goals.calories,
        trend: 'stable',
      },
      protein: { current: avgProtein, target: goals.protein, trend: 'up' },
      carbs: { current: avgCarbs, target: goals.carbs, trend: 'down' },
      fat: { current: avgFat, target: goals.fat, trend: 'stable' },
    };
  }, [chartData, goals]);

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
              {entry.name === 'Calories' ? ' kcal' : 'g'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderNutritionChart = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Nutrition Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h4 className="text-lg font-bold text-gray-900 mb-4">
            Daily Nutrition Trends
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="calories"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                name="Calories"
              />
              <Line
                type="monotone"
                dataKey="protein"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                name="Protein (g)"
              />
              <Line
                type="monotone"
                dataKey="carbs"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                name="Carbs (g)"
              />
              <Line
                type="monotone"
                dataKey="fat"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                name="Fat (g)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Goal Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h4 className="text-lg font-bold text-gray-900 mb-4">
            Goal Progress
          </h4>
          <div className="space-y-4">
            {goalProgressData.map((goal) => (
              <div key={goal.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {goal.name}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {goal.current} / {goal.target}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${goal.percentage}%`,
                      backgroundColor: goal.color,
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 text-right">
                  {Math.round(goal.percentage)}% complete
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nutrition Insights */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <IconBrain className="w-5 h-5 text-blue-600" />
          AI Nutrition Insights
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(nutritionTrends).map(([nutrient, data]) => (
            <div
              key={nutrient}
              className="bg-white rounded-xl p-4 border border-blue-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {nutrient}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    data.trend === 'up'
                      ? 'bg-green-100 text-green-800'
                      : data.trend === 'down'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {data.trend === 'up'
                    ? '↗'
                    : data.trend === 'down'
                    ? '↘'
                    : '→'}
                </span>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {Math.round(data.current)}
                {nutrient === 'calories' ? ' kcal' : 'g'}
              </div>
              <div className="text-xs text-gray-500">
                Target: {data.target}
                {nutrient === 'calories' ? ' kcal' : 'g'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWeightChart = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight Trend Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h4 className="text-lg font-bold text-gray-900 mb-4">
            Weight & BMI Trends
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis yAxisId="left" stroke="#10b981" fontSize={12} />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#f59e0b"
                fontSize={12}
              />
              <Tooltip />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="weight"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.3}
                name="Weight (kg)"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="bmi"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.3}
                name="BMI"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Weight Stats */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h4 className="text-lg font-bold text-gray-900 mb-4">
            Weight Statistics
          </h4>
          <div className="space-y-4">
            {(() => {
              const latest = weightData[weightData.length - 1];
              const first = weightData[0];
              const change = latest ? latest.weight - first.weight : 0;
              const avgWeight =
                weightData.reduce((sum, d) => sum + d.weight, 0) /
                weightData.length;

              return (
                <>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <div className="text-sm text-green-600 font-medium">
                      Current Weight
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      {latest?.weight || 0} kg
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                    <div className="text-sm text-blue-600 font-medium">
                      Average Weight
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      {Math.round(avgWeight * 10) / 10} kg
                    </div>
                  </div>

                  <div
                    className={`rounded-xl p-4 border ${
                      change > 0
                        ? 'bg-red-50 border-red-200'
                        : change < 0
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div
                      className={`text-sm font-medium ${
                        change > 0
                          ? 'text-red-600'
                          : change < 0
                          ? 'text-green-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {change > 0
                        ? 'Weight Gain'
                        : change < 0
                        ? 'Weight Loss'
                        : 'No Change'}
                    </div>
                    <div
                      className={`text-2xl font-bold ${
                        change > 0
                          ? 'text-red-700'
                          : change < 0
                          ? 'text-green-700'
                          : 'text-gray-700'
                      }`}
                    >
                      {Math.abs(change).toFixed(1)} kg
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );

  const renderGoalsChart = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals Overview */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h4 className="text-lg font-bold text-gray-900 mb-4">
            Weekly Goal Achievement
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="calories" fill="#f97316" name="Calories" />
              <Bar dataKey="protein" fill="#10b981" name="Protein (g)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Goal Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h4 className="text-lg font-bold text-gray-900 mb-4">
            Goal Distribution
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={goalProgressData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="percentage"
              >
                {goalProgressData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Summary */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <IconTrendingUp className="w-5 h-5 text-purple-600" />
            Weekly Summary
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Days Tracked</span>
              <span className="font-bold text-purple-700">
                {chartData.filter((d) => d.calories > 0).length} /{' '}
                {chartData.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Calories</span>
              <span className="font-bold text-purple-700">
                {Math.round(
                  chartData.reduce((sum, d) => sum + d.calories, 0) /
                    chartData.length
                )}{' '}
                kcal
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Goal Met</span>
              <span className="font-bold text-purple-700">
                {Math.round(
                  (goalProgressData.filter((g) => g.percentage >= 90).length /
                    goalProgressData.length) *
                    100
                )}
                %
              </span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <IconBrain className="w-5 h-5 text-green-600" />
            AI Recommendations
          </h4>
          <div className="space-y-3 text-sm">
            {(() => {
              const recommendations = [];
              if (nutritionTrends.protein.current < goals.protein * 0.8) {
                recommendations.push('Consider increasing protein intake');
              }
              if (nutritionTrends.carbs.current > goals.carbs * 1.2) {
                recommendations.push('Try reducing carb consumption');
              }
              if (nutritionTrends.fat.current > goals.fat * 1.1) {
                recommendations.push('Monitor fat intake');
              }
              if (recommendations.length === 0) {
                recommendations.push(
                  'Great job! Keep up the balanced nutrition'
                );
              }
              return recommendations.map((rec, i) => (
                <div key={i} className="text-green-700">
                  • {rec}
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Progress Streak */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <IconTarget className="w-5 h-5 text-orange-600" />
            Progress Streak
          </h4>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {(() => {
                let streak = 0;
                for (let i = chartData.length - 1; i >= 0; i--) {
                  if (chartData[i].calories > 0) streak++;
                  else break;
                }
                return streak;
              })()}
            </div>
            <div className="text-sm text-orange-700">Days in a row</div>
            <div className="text-xs text-orange-600 mt-2">
              Keep the momentum going! 🚀
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Progress Analytics
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Track your nutrition journey with detailed insights and trends
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 rounded-lg p-1">
            {(['week', 'month', '3months'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  timeRange === range
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range === 'week' ? 'Week' : range === 'month' ? 'Month' : '3M'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="border-b border-gray-100">
          <nav className="flex flex-wrap gap-2 sm:gap-4 lg:gap-8 px-4 sm:px-6 overflow-x-auto">
            {(
              [
                {
                  id: 'nutrition',
                  label: 'Nutrition Trends',
                  icon: IconTrendingUp,
                },
                { id: 'weight', label: 'Weight & BMI', icon: IconScale },
                { id: 'goals', label: 'Goal Progress', icon: IconTarget },
                { id: 'insights', label: 'AI Insights', icon: IconBrain },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-marigold-500 text-marigold-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'nutrition' && renderNutritionChart()}
            {activeTab === 'weight' && renderWeightChart()}
            {activeTab === 'goals' && renderGoalsChart()}
            {activeTab === 'insights' && renderInsights()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
