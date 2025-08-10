import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  IconPlus,
  IconTrash,
  IconBrain,
  IconTarget,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import { db, type Food } from '../../lib/db';
import { generateMealIdeas } from '../../lib/ai';
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns';

interface MealPlan {
  id: string;
  date: string;
  meals: {
    breakfast: MealPlanItem[];
    lunch: MealPlanItem[];
    dinner: MealPlanItem[];
    snack: MealPlanItem[];
  };
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface MealPlanItem {
  id: string;
  foodId: number;
  foodName: string;
  grams: number;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export default function EnhancedMealPlanner({
  onClose,
}: {
  onClose: () => void;
}) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string>('');
  const [availableFoods, setAvailableFoods] = useState<Food[]>([]);
  const [goals, setGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
  });

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentWeek, { weekStartsOn: 1 }),
    end: endOfWeek(currentWeek, { weekStartsOn: 1 }),
  });

  useEffect(() => {
    loadMealPlans();
    loadAvailableFoods();
    loadGoals();
  }, [currentWeek]);

  const loadMealPlans = async () => {
    try {
      const savedPlans = localStorage.getItem('wellnessdash_mealplans');
      if (savedPlans) {
        setMealPlans(JSON.parse(savedPlans));
      }
    } catch (error) {
      console.error('Error loading meal plans:', error);
    }
  };

  const loadAvailableFoods = async () => {
    try {
      const foods = await db.foods.toArray();
      setAvailableFoods(foods);
    } catch (error) {
      console.error('Error loading foods:', error);
    }
  };

  const loadGoals = async () => {
    try {
      const savedGoals = localStorage.getItem('wellnessdash_goals');
      if (savedGoals) {
        setGoals(JSON.parse(savedGoals));
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const saveMealPlans = (newPlans: MealPlan[]) => {
    localStorage.setItem('wellnessdash_mealplans', JSON.stringify(newPlans));
    setMealPlans(newPlans);
  };

  const getMealPlanForDate = (date: Date): MealPlan | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return mealPlans.find((plan) => plan.date === dateStr) || null;
  };

  const createMealPlanForDate = (date: Date): MealPlan => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return {
      id: Date.now().toString(),
      date: dateStr,
      meals: {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
      },
      totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      goals,
    };
  };

  const addFoodToMeal = (
    date: Date,
    meal: keyof MealPlan['meals'],
    food: Food,
    grams: number
  ) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    let plan = getMealPlanForDate(date);

    if (!plan) {
      plan = createMealPlanForDate(date);
    }

    const mealItem: MealPlanItem = {
      id: Date.now().toString(),
      foodId: food.id || 0,
      foodName: food.name,
      grams,
      meal,
      nutritionalInfo: {
        calories: Math.round((food.per100g.kcal * grams) / 100),
        protein: Math.round((food.per100g.protein * grams) / 100),
        carbs: Math.round((food.per100g.carbs * grams) / 100),
        fat: Math.round((food.per100g.fat * grams) / 100),
      },
    };

    const updatedPlan = {
      ...plan,
      meals: {
        ...plan.meals,
        [meal]: [...plan.meals[meal], mealItem],
      },
    };

    // Recalculate total nutrition
    const allMeals = [
      ...updatedPlan.meals.breakfast,
      ...updatedPlan.meals.lunch,
      ...updatedPlan.meals.dinner,
      ...updatedPlan.meals.snack,
    ];

    updatedPlan.totalNutrition = allMeals.reduce(
      (acc, item) => ({
        calories: acc.calories + item.nutritionalInfo.calories,
        protein: acc.protein + item.nutritionalInfo.protein,
        carbs: acc.carbs + item.nutritionalInfo.carbs,
        fat: acc.fat + item.nutritionalInfo.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const existingIndex = mealPlans.findIndex((p) => p.date === dateStr);
    let newPlans: MealPlan[];

    if (existingIndex >= 0) {
      newPlans = [...mealPlans];
      newPlans[existingIndex] = updatedPlan;
    } else {
      newPlans = [...mealPlans, updatedPlan];
    }

    saveMealPlans(newPlans);
  };

  const removeFoodFromMeal = (
    date: Date,
    meal: keyof MealPlan['meals'],
    itemId: string
  ) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const plan = getMealPlanForDate(date);

    if (!plan) return;

    const updatedPlan = {
      ...plan,
      meals: {
        ...plan.meals,
        [meal]: plan.meals[meal].filter((item) => item.id !== itemId),
      },
    };

    // Recalculate total nutrition
    const allMeals = [
      ...updatedPlan.meals.breakfast,
      ...updatedPlan.meals.lunch,
      ...updatedPlan.meals.dinner,
      ...updatedPlan.meals.snack,
    ];

    updatedPlan.totalNutrition = allMeals.reduce(
      (acc, item) => ({
        calories: acc.calories + item.nutritionalInfo.calories,
        protein: acc.protein + item.nutritionalInfo.protein,
        carbs: acc.carbs + item.nutritionalInfo.carbs,
        fat: acc.fat + item.nutritionalInfo.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const existingIndex = mealPlans.findIndex((p) => p.date === dateStr);
    const newPlans = [...mealPlans];
    newPlans[existingIndex] = updatedPlan;
    saveMealPlans(newPlans);
  };

  const generateAIMealSuggestions = async (
    _date: Date,
    meal: keyof MealPlan['meals']
  ) => {
    setIsGeneratingAI(true);
    try {
      const prompt = `Suggest 3 healthy food options for ${meal} that provide good nutrition and fit within a balanced diet. Include variety and consider different food groups.`;
      const aiResponse = await generateMealIdeas(prompt);

      // Set AI suggestions for display
      setAiSuggestions(aiResponse || 'No suggestions available');
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const getNutritionProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const getProgressColor = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    if (percentage >= 90 && percentage <= 110) return 'bg-green-500';
    if (percentage > 110) return 'bg-red-500';
    return 'bg-marigold-500';
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Weekly Meal Planner
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            Plan your meals for the week and stay on track with your nutrition
            goals
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors text-sm sm:text-base"
        >
          Close
        </button>
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-6 sm:mb-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <IconChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
          </button>

          <div className="text-center">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
              {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM dd')}{' '}
              -{' '}
              {format(
                endOfWeek(currentWeek, { weekStartsOn: 1 }),
                'MMM dd, yyyy'
              )}
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Week {format(currentWeek, 'w')} of {format(currentWeek, 'yyyy')}
            </p>
          </div>

          <button
            onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <IconChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Weekly Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-6 mb-8">
        {weekDays.map((day) => {
          const plan = getMealPlanForDate(day);
          const isToday = isSameDay(day, new Date());

          return (
            <motion.div
              key={day.toISOString()}
              layout
              className={`bg-white rounded-2xl p-4 shadow-sm border-2 transition-all cursor-pointer ${
                isToday
                  ? 'border-marigold-500 shadow-lg'
                  : 'border-gray-100 hover:border-marigold-200'
              }`}
              onClick={() => setSelectedDate(day)}
            >
              <div className="text-center mb-3">
                <div
                  className={`text-sm font-medium ${
                    isToday ? 'text-marigold-600' : 'text-gray-500'
                  }`}
                >
                  {format(day, 'EEE')}
                </div>
                <div
                  className={`text-xl font-bold ${
                    isToday ? 'text-marigold-600' : 'text-gray-900'
                  }`}
                >
                  {format(day, 'd')}
                </div>
              </div>

              {plan && (
                <div className="space-y-2">
                  <div className="text-center">
                    <div className="text-lg font-bold text-marigold-600">
                      {plan.totalNutrition.calories}
                    </div>
                    <div className="text-xs text-gray-500">kcal</div>
                  </div>

                  <div className="space-y-1">
                    {Object.entries(plan.meals).map(
                      ([mealType, items]) =>
                        items.length > 0 && (
                          <div key={mealType} className="text-xs text-gray-600">
                            {mealType}: {items.length} items
                          </div>
                        )
                    )}
                  </div>
                </div>
              )}

              {!plan && (
                <div className="text-center text-gray-400">
                  <IconPlus className="w-6 h-6 mx-auto mb-1" />
                  <div className="text-xs">No meals</div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Daily Detail View */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          {isSameDay(selectedDate, new Date()) && (
            <span className="inline-block px-2 sm:px-3 py-1 bg-marigold-100 text-marigold-800 text-xs sm:text-sm font-medium rounded-full ml-2 sm:ml-3">
              Today
            </span>
          )}
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Meals Section */}
            <div className="space-y-6">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(
                (mealType) => {
                  const plan = getMealPlanForDate(selectedDate);
                  const mealItems = plan?.meals[mealType] || [];

                  return (
                    <div key={mealType} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-900 capitalize">
                          {mealType}
                        </h4>
                        <button
                          onClick={() =>
                            generateAIMealSuggestions(selectedDate, mealType)
                          }
                          disabled={isGeneratingAI}
                          className="px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 flex items-center gap-1"
                        >
                          <IconBrain className="w-4 h-4" />
                          AI
                        </button>
                      </div>

                      {/* AI Suggestions Display */}
                      {aiSuggestions && (
                        <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                          <div className="flex items-center gap-2 mb-2">
                            <IconBrain className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-800">
                              AI Suggestions for {mealType}
                            </span>
                          </div>
                          <p className="text-sm text-purple-700">
                            {aiSuggestions}
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        {mealItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between bg-white rounded-lg p-3"
                          >
                            <div>
                              <div className="font-medium text-gray-900">
                                {item.foodName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {item.grams}g • {item.nutritionalInfo.calories}{' '}
                                kcal
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                removeFoodFromMeal(
                                  selectedDate,
                                  mealType,
                                  item.id
                                )
                              }
                              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <IconTrash className="w-4 h-4" />
                            </button>
                          </div>
                        ))}

                        {mealItems.length === 0 && (
                          <div className="text-center text-gray-400 py-4">
                            <IconPlus className="w-8 h-8 mx-auto mb-2" />
                            <div className="text-sm">
                              Add foods to this meal
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {/* Nutrition Summary */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-marigold-50 to-orange-50 rounded-xl p-6 border border-marigold-100">
                <h4 className="text-xl font-bold text-gray-900 mb-4">
                  Daily Nutrition
                </h4>

                {(() => {
                  const plan = getMealPlanForDate(selectedDate);
                  if (!plan) {
                    return (
                      <div className="text-center text-gray-500 py-8">
                        <IconTarget className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p>No meals planned for this day</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {/* Calories */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-700 font-medium">
                            Calories
                          </span>
                          <span className="text-lg font-bold text-marigold-600">
                            {plan.totalNutrition.calories} / {goals.calories}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(
                              plan.totalNutrition.calories,
                              goals.calories
                            )}`}
                            style={{
                              width: `${getNutritionProgress(
                                plan.totalNutrition.calories,
                                goals.calories
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Protein */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-700 font-medium">
                            Protein
                          </span>
                          <span className="text-lg font-bold text-mint-600">
                            {plan.totalNutrition.protein}g / {goals.protein}g
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(
                              plan.totalNutrition.protein,
                              goals.protein
                            )}`}
                            style={{
                              width: `${getNutritionProgress(
                                plan.totalNutrition.protein,
                                goals.protein
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Carbs */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-700 font-medium">
                            Carbs
                          </span>
                          <span className="text-lg font-bold text-marigold-600">
                            {plan.totalNutrition.carbs}g / {goals.carbs}g
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(
                              plan.totalNutrition.carbs,
                              goals.carbs
                            )}`}
                            style={{
                              width: `${getNutritionProgress(
                                plan.totalNutrition.carbs,
                                goals.carbs
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Fat */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-700 font-medium">Fat</span>
                          <span className="text-lg font-bold text-orange-600">
                            {plan.totalNutrition.fat}g / {goals.fat}g
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(
                              plan.totalNutrition.fat,
                              goals.fat
                            )}`}
                            style={{
                              width: `${getNutritionProgress(
                                plan.totalNutrition.fat,
                                goals.fat
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Quick Add Foods */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Add Foods
                </h4>
                <div className="space-y-3">
                  {availableFoods.slice(0, 5).map((food) => (
                    <div
                      key={food.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {food.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {food.per100g.kcal} kcal per 100g
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          addFoodToMeal(selectedDate, 'snack', food, 100)
                        }
                        className="px-3 py-1 bg-marigold-500 text-white text-sm rounded-lg hover:bg-marigold-600 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
