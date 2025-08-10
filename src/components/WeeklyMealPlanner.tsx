import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconPlus,
  IconX,
  IconCalendar,
  IconClock,
  IconUsers,
  IconCalculator,
  IconTrash,
  IconBookmark,
} from '@tabler/icons-react';
import { db, type Recipe } from '../lib/db';
import { upsertMealPlan } from '../lib/supabaseSync';
import { generateMealIdeas } from '../lib/ai';

interface MealPlan {
  id?: number;
  date: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipeId?: number;
  recipe?: Recipe;
  customName?: string;
  servings?: number;
  notes?: string;
}

interface WeeklyMealPlannerProps {
  onClose: () => void;
}

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export default function WeeklyMealPlanner({ onClose }: WeeklyMealPlannerProps) {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showRecipeSelector, setShowRecipeSelector] = useState<{
    date: string;
    meal: string;
  } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMeal, setSelectedMeal] = useState<string>('');
  const [customMealName, setCustomMealName] = useState('');
  const [customServings, setCustomServings] = useState('1');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [aiIdeas, setAiIdeas] = useState<string>('');
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load recipes
      const allRecipes = await db.recipes.toArray();
      setRecipes(allRecipes);

      // Load existing meal plans for the current week
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());

      const weekDates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        return date.toISOString().split('T')[0];
      });

      const existingPlans = await db.mealPlans
        .where('date')
        .anyOf(weekDates)
        .toArray();

      setMealPlans(existingPlans);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWeekDates = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return {
        date: date.toISOString().split('T')[0],
        dayName: DAYS[i],
        isToday: date.toDateString() === today.toDateString(),
      };
    });
  };

  const getMealPlan = (date: string, meal: string) => {
    return mealPlans.find((plan) => plan.date === date && plan.meal === meal);
  };

  const addMealPlan = async (
    date: string,
    meal: string,
    recipeId?: number,
    customName?: string,
    servings?: number,
    notes?: string
  ) => {
    try {
      const newMealPlan: MealPlan = {
        date,
        meal: meal as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        recipeId,
        customName,
        servings: servings ? Number(servings) : 1,
        notes,
      };

      const id = await db.mealPlans.add(newMealPlan);
      const createdPlan = { ...newMealPlan, id };
      await upsertMealPlan(createdPlan);
      console.info(
        'Created meal plan locally and attempted Supabase upsert',
        createdPlan
      );

      setMealPlans([...mealPlans, createdPlan]);
      setShowRecipeSelector(null);
      setCustomMealName('');
      setCustomServings('1');
      setNotes('');
    } catch (error) {
      console.error('Error adding meal plan:', error);
    }
  };

  const requestAIMealIdeas = async () => {
    setIsGeneratingIdeas(true);
    try {
      const prompt =
        'Suggest a simple 7-day Indian meal plan with breakfast, lunch, dinner, and one snack per day within 2000 kcal/day. Keep it concise.';
      const text = await generateMealIdeas(prompt);
      setAiIdeas(text);
    } catch {
      setAiIdeas('Could not generate ideas.');
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const removeMealPlan = async (id: number) => {
    try {
      await db.mealPlans.delete(id);
      setMealPlans(mealPlans.filter((plan) => plan.id !== id));
    } catch (error) {
      console.error('Error removing meal plan:', error);
    }
  };

  const openRecipeSelector = (date: string, meal: string) => {
    setSelectedDate(date);
    setSelectedMeal(meal);
    setShowRecipeSelector({ date, meal });
  };

  const selectRecipe = (recipe: Recipe) => {
    addMealPlan(selectedDate, selectedMeal, recipe.id, undefined, 1, notes);
  };

  const addCustomMeal = () => {
    if (customMealName.trim()) {
      addMealPlan(
        selectedDate,
        selectedMeal,
        undefined,
        customMealName.trim(),
        Number(customServings),
        notes
      );
    }
  };

  const calculateWeeklyNutrition = () => {
    const total = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

    for (const plan of mealPlans) {
      if (plan.recipe && plan.servings) {
        const multiplier = plan.servings / plan.recipe.servings;
        total.kcal += plan.recipe.nutrition.kcal * multiplier;
        total.protein += plan.recipe.nutrition.protein * multiplier;
        total.carbs += plan.recipe.nutrition.carbs * multiplier;
        total.fat += plan.recipe.nutrition.fat * multiplier;
      }
    }

    return total;
  };

  const weeklyNutrition = calculateWeeklyNutrition();

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-mint to-teal-500 rounded-full flex items-center justify-center">
              <IconCalendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Weekly Meal Planner
              </h2>
              <p className="text-gray-600">
                Plan your meals for the week ahead
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <IconX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Weekly Nutrition Summary */}
        <div className="p-4 bg-gradient-to-r from-marigold/5 to-orange-500/5 border-b border-marigold/20">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <IconCalculator className="w-5 h-5 text-marigold-500" />
            Weekly Nutrition Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {weeklyNutrition.kcal.toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">Total Calories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {weeklyNutrition.protein.toFixed(1)}g
              </div>
              <div className="text-sm text-gray-600">Total Protein</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {weeklyNutrition.carbs.toFixed(1)}g
              </div>
              <div className="text-sm text-gray-600">Total Carbs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {weeklyNutrition.fat.toFixed(1)}g
              </div>
              <div className="text-sm text-gray-600">Total Fat</div>
            </div>
          </div>
          <div className="mt-3 flex flex-col md:flex-row gap-3">
            <button
              onClick={requestAIMealIdeas}
              className="px-4 py-2 bg-mint-500 text-white rounded-lg hover:bg-mint-600 transition-colors"
              disabled={isGeneratingIdeas}
            >
              {isGeneratingIdeas ? 'Generating ideas...' : 'AI meal plan ideas'}
            </button>
            {aiIdeas && (
              <div className="flex-1 text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border border-gray-200">
                {aiIdeas}
              </div>
            )}
          </div>
        </div>

        {/* Meal Planner Grid */}
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2 font-semibold text-gray-700">
                    Day
                  </th>
                  {MEALS.map((meal) => (
                    <th
                      key={meal}
                      className="text-left p-2 font-semibold text-gray-700 capitalize"
                    >
                      {meal}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getWeekDates().map(({ date, dayName, isToday }) => (
                  <tr key={date} className={isToday ? 'bg-marigold-50' : ''}>
                    <td
                      className={`p-2 font-medium ${
                        isToday ? 'text-marigold-500' : 'text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{dayName}</span>
                        {isToday && (
                          <span className="px-2 py-1 bg-marigold-500 text-white text-xs rounded-full">
                            Today
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(date).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </td>
                    {MEALS.map((meal) => {
                      const mealPlan = getMealPlan(date, meal);
                      return (
                        <td key={meal} className="p-2">
                          {mealPlan ? (
                            <div className="bg-white rounded-lg border border-gray-200 p-2 shadow-sm">
                              {mealPlan.recipe ? (
                                <div>
                                  <div className="font-medium text-gray-900 mb-1">
                                    {mealPlan.recipe.name}
                                  </div>
                                  <div className="text-sm text-gray-600 mb-2">
                                    {mealPlan.recipe.description}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                    <IconClock className="w-3 h-3" />
                                    {mealPlan.recipe.prepTime +
                                      mealPlan.recipe.cookTime}{' '}
                                    min
                                    <IconUsers className="w-3 h-3" />
                                    {mealPlan.servings || 1} serving
                                    {mealPlan.servings !== 1 ? 's' : ''}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {mealPlan.recipe.nutrition.kcal} kcal
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="font-medium text-gray-900 mb-1">
                                    {mealPlan.customName}
                                  </div>
                                  {mealPlan.servings &&
                                    mealPlan.servings > 1 && (
                                      <div className="text-sm text-gray-600 mb-2">
                                        {mealPlan.servings} servings
                                      </div>
                                    )}
                                </div>
                              )}
                              {mealPlan.notes && (
                                <div className="text-xs text-gray-500 mt-2 italic">
                                  "{mealPlan.notes}"
                                </div>
                              )}
                              <button
                                onClick={() => removeMealPlan(mealPlan.id!)}
                                className="mt-2 p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                              >
                                <IconTrash className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => openRecipeSelector(date, meal)}
                              className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-marigold hover:text-marigold transition-colors group"
                            >
                              <IconPlus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recipe Selector Modal */}
        <AnimatePresence>
          {showRecipeSelector && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gradient-to-br from-marigold-50/80 via-white/80 to-mint-50/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              >
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">
                    Add Meal for {selectedMeal} on{' '}
                    {new Date(selectedDate).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                </div>

                <div className="p-6 space-y-6">
                  {/* Recipe Selection */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Choose from your recipes:
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {recipes.length > 0 ? (
                        recipes.map((recipe) => (
                          <button
                            key={recipe.id}
                            onClick={() => selectRecipe(recipe)}
                            className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-marigold-500 hover:text-marigold-500 transition-colors group"
                          >
                            <div className="font-medium text-gray-900">
                              {recipe.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {recipe.description}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                              <span>{recipe.nutrition.kcal} kcal</span>
                              <span>
                                {recipe.prepTime + recipe.cookTime} min
                              </span>
                              <span>{recipe.servings} servings</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <IconBookmark className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No recipes yet</p>
                          <p className="text-sm">
                            Create some recipes first to plan your meals
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">OR</span>
                    </div>
                  </div>

                  {/* Custom Meal */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Add a custom meal:
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Meal Name
                        </label>
                        <input
                          type="text"
                          value={customMealName}
                          onChange={(e) => setCustomMealName(e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-marigold/20 focus:border-marigold transition-all"
                          placeholder="e.g., Homemade Sandwich"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Servings
                        </label>
                        <input
                          type="number"
                          value={customServings}
                          onChange={(e) => setCustomServings(e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-marigold/20 focus:border-marigold transition-all"
                          min="1"
                          step="0.5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes (Optional)
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-marigold/20 focus:border-marigold transition-all"
                          rows={2}
                          placeholder="Any special notes or modifications..."
                        />
                      </div>
                      <button
                        onClick={addCustomMeal}
                        disabled={!customMealName.trim()}
                        className="w-full px-4 py-2 bg-mint-500 text-white rounded-lg hover:bg-mint-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Custom Meal
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowRecipeSelector(null)}
                    className="w-full px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
