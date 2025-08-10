import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ModernNavigation from './components/ui/ModernNavigation';
import AnimatedGradientHeader from './components/ui/AnimatedGradientHeader';
import EnhancedMealSection from './components/ui/EnhancedMealSection';
import EnhancedFoodSearch from './components/ui/EnhancedFoodSearch';
import EnhancedDailySummary from './components/ui/EnhancedDailySummary';
import FoodLogger from './components/FoodLogger';
import CustomFoodCreator from './components/CustomFoodCreator';
import EnhancedMealPlanner from './components/ui/EnhancedMealPlanner';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import { db } from './lib/db';
import {
  onAuthStateChange,
  getUserProfile,
  getCurrentUser,
  syncUserProfileWithGoogle,
  type UserProfile,
} from './lib/supabaseAuth';
import type { Food, DiaryEntry } from './lib/db';
import EnhancedShoppingListGenerator from './components/ui/EnhancedShoppingListGenerator';
import EnhancedProgressCharts from './components/ui/EnhancedProgressCharts';
import { IconTarget, IconBrain } from '@tabler/icons-react';

type AppState = 'landing' | 'auth' | 'onboarding' | 'main';

export default function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'diary' | 'goals' | 'progress'>(
    'diary'
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [dailyTotals, setDailyTotals] = useState({
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [goals, setGoals] = useState({
    kcal: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
  });
  const [showCustomFoodCreator, setShowCustomFoodCreator] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);

  useEffect(() => {
    // Check authentication state
    const {
      data: { subscription },
    } = onAuthStateChange(async (supabaseUser) => {
      if (supabaseUser) {
        // User is signed in - sync their Google profile data first
        await syncUserProfileWithGoogle(supabaseUser);

        // Then get the updated profile
        const userProfile = await getUserProfile(supabaseUser.id);
        if (userProfile) {
          setUser(userProfile);
          setGoals({
            kcal: userProfile.daily_targets.calories,
            protein: userProfile.daily_targets.protein,
            carbs: userProfile.daily_targets.carbs,
            fat: userProfile.daily_targets.fat,
          });
          setAppState('main');
        } else {
          // User exists but no profile - needs onboarding
          setAppState('onboarding');
        }
      } else {
        // User is signed out
        setUser(null);
        setAppState('landing');
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (appState === 'main') {
      loadData();
      const handler = () => {
        loadData();
      };
      const navHandler = (
        e: CustomEvent<{ tab: 'diary' | 'goals' | 'progress' }>
      ) => {
        const tab = e?.detail?.tab;
        if (tab) {
          setActiveTab(tab === 'diary' ? 'diary' : tab);
          setTimeout(() => {
            document
              .getElementById(tab)
              ?.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }
      };
      window.addEventListener('diary:changed', handler);
      window.addEventListener('nav:change', navHandler as EventListener);
      return () => {
        window.removeEventListener('diary:changed', handler);
        window.removeEventListener('nav:change', navHandler as EventListener);
      };
    }
  }, [appState]);

  const loadData = async () => {
    try {
      // Load diary entries for today
      const today = new Date().toISOString().split('T')[0];
      const entries = await db.diary.where('date').equals(today).toArray();
      setDiaryEntries(entries);

      // Calculate daily totals
      const totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

      for (const entry of entries) {
        if (entry.foodId) {
          const food = await db.foods.get(entry.foodId);
          if (food && entry.grams) {
            const multiplier = entry.grams / 100;
            totals.kcal += food.per100g.kcal * multiplier;
            totals.protein += food.per100g.protein * multiplier;
            totals.carbs += food.per100g.carbs * multiplier;
            totals.fat += food.per100g.fat * multiplier;
          }
        }
      }

      setDailyTotals(totals);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleGetStarted = () => {
    setAppState('auth');
  };

  const handleAuthSuccess = () => {
    // Auth success will trigger the auth state change listener
    // which will then determine if onboarding is needed
  };

  const handleOnboardingComplete = () => {
    setAppState('main');
    // Reload user data - we'll need to get the current user from Supabase
    getCurrentUser().then((currentUser) => {
      if (currentUser) {
        getUserProfile(currentUser.id).then((userProfile) => {
          if (userProfile) {
            setUser(userProfile);
            setGoals({
              kcal: userProfile.daily_targets.calories,
              protein: userProfile.daily_targets.protein,
              carbs: userProfile.daily_targets.carbs,
              fat: userProfile.daily_targets.fat,
            });
          }
        });
      }
    });
  };

  const handleLogout = () => {
    setUser(null);
    setAppState('landing');
    setDiaryEntries([]);
    setDailyTotals({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
    setGoals({ kcal: 2000, protein: 150, carbs: 250, fat: 65 });
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUser(updatedProfile);
    setGoals({
      kcal: updatedProfile.daily_targets.calories,
      protein: updatedProfile.daily_targets.protein,
      carbs: updatedProfile.daily_targets.carbs,
      fat: updatedProfile.daily_targets.fat,
    });
  };

  const handleCustomFoodCreated = async () => {
    setShowCustomFoodCreator(false);
    // You can add logic here to sync with Supabase if needed
  };

  const handleAddFood = () => {
    setIsAddModalOpen(true);
  };

  const handleFoodLogged = () => {
    setIsAddModalOpen(false);
    setSelectedFood(null);
    loadData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-marigold-50 via-white to-mint-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-marigold-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading WellnessDash...</p>
        </div>
      </div>
    );
  }

  // Render different app states
  if (appState === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  if (appState === 'auth') {
    return <Auth onSignInSuccess={handleAuthSuccess} />;
  }

  if (appState === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Main app
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AnimatedGradientHeader />

      <ModernNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAdd={handleAddFood}
        isAddOpen={isAddModalOpen}
        user={user || undefined}
        onLogout={handleLogout}
        onProfileUpdate={handleProfileUpdate}
      />

      <main className="flex-1 w-full container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl">
        {/* Diary Tab */}
        {activeTab === 'diary' && (
          <div id="diary" className="w-full max-w-6xl mx-auto">
            <div className="mb-6 lg:mb-8">
              <EnhancedDailySummary dailyTotals={dailyTotals} goals={goals} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
              <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <EnhancedMealSection
                  meal="breakfast"
                  entries={diaryEntries.filter(
                    (entry) => entry.meal === 'breakfast'
                  )}
                  onAddFood={handleAddFood}
                />
              </div>
              <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <EnhancedMealSection
                  meal="lunch"
                  entries={diaryEntries.filter(
                    (entry) => entry.meal === 'lunch'
                  )}
                  onAddFood={handleAddFood}
                />
              </div>
              <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <EnhancedMealSection
                  meal="dinner"
                  entries={diaryEntries.filter(
                    (entry) => entry.meal === 'dinner'
                  )}
                  onAddFood={handleAddFood}
                />
              </div>
              <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <EnhancedMealSection
                  meal="snack"
                  entries={diaryEntries.filter(
                    (entry) => entry.meal === 'snack'
                  )}
                  onAddFood={handleAddFood}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={handleAddFood}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-colors shadow-sm hover:shadow-md text-sm sm:text-base"
              >
                + Add Food
              </button>
              <button
                onClick={() => setShowPlanner(true)}
                className="flex-1 bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-colors shadow-sm hover:shadow-md text-sm sm:text-base"
              >
                Meal Planner
              </button>
              <button
                onClick={() => setShowShoppingList(true)}
                className="flex-1 bg-white border-2 border-mint-500 text-mint-600 hover:bg-mint-50 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-colors shadow-sm hover:shadow-md text-sm sm:text-base"
              >
                Shopping List
              </button>
            </div>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div id="goals" className="max-w-6xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                Your Goals
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
                Track your nutrition targets and personal health metrics to
                achieve your wellness goals
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Daily Nutrition Targets - Enhanced */}
              <div className="bg-gradient-to-br from-white to-marigold-50 rounded-2xl p-8 shadow-lg border border-marigold-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-marigold-500 to-orange-500 rounded-2xl flex items-center justify-center">
                    <IconTarget className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Daily Nutrition Targets
                    </h3>
                    <p className="text-gray-600">
                      Your personalized daily goals
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Calories */}
                  <div className="bg-white rounded-xl p-4 border border-marigold-100">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-700 font-medium flex items-center gap-2">
                        <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                        Calories
                      </span>
                      <span className="text-2xl font-bold text-marigold-600">
                        {goals.kcal}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-orange-400 to-marigold-500 h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            (dailyTotals.kcal / goals.kcal) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      {dailyTotals.kcal} / {goals.kcal} kcal consumed
                    </div>
                  </div>

                  {/* Protein */}
                  <div className="bg-white rounded-xl p-4 border border-mint-100">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-700 font-medium flex items-center gap-2">
                        <span className="w-3 h-3 bg-mint-500 rounded-full"></span>
                        Protein
                      </span>
                      <span className="text-2xl font-bold text-mint-600">
                        {goals.protein}g
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-mint-400 to-mint-600 h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            (dailyTotals.protein / goals.protein) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      {dailyTotals.protein}g / {goals.protein}g consumed
                    </div>
                  </div>

                  {/* Carbs */}
                  <div className="bg-white rounded-xl p-4 border border-marigold-100">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-700 font-medium flex items-center gap-2">
                        <span className="w-3 h-3 bg-marigold-500 rounded-full"></span>
                        Carbohydrates
                      </span>
                      <span className="text-2xl font-bold text-marigold-600">
                        {goals.carbs}g
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-marigold-400 to-orange-500 h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            (dailyTotals.carbs / goals.carbs) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      {dailyTotals.carbs}g / {goals.carbs}g consumed
                    </div>
                  </div>

                  {/* Fat */}
                  <div className="bg-white rounded-xl p-4 border border-orange-100">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-700 font-medium flex items-center gap-2">
                        <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                        Fat
                      </span>
                      <span className="text-2xl font-bold text-orange-600">
                        {goals.fat}g
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-orange-400 to-red-500 h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            (dailyTotals.fat / goals.fat) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      {dailyTotals.fat}g / {goals.fat}g consumed
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Info - Enhanced */}
              {user && (
                <div className="bg-gradient-to-br from-white to-mint-50 rounded-2xl p-8 shadow-lg border border-mint-100 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-mint-500 to-blue-500 rounded-2xl flex items-center justify-center">
                      <IconBrain className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        Personal Info
                      </h3>
                      <p className="text-gray-600">Your health profile</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-4 border border-mint-100">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Age</span>
                        <span className="text-xl font-bold text-mint-600">
                          {user.age} years
                        </span>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-mint-100">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">
                          Height
                        </span>
                        <span className="text-xl font-bold text-mint-600">
                          {user.height} cm
                        </span>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-mint-100">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">
                          Weight
                        </span>
                        <span className="text-xl font-bold text-mint-600">
                          {user.weight} kg
                        </span>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-mint-100">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">BMI</span>
                        <span className="text-xl font-bold text-marigold-600">
                          {user.bmi}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-marigold-100 to-orange-100 rounded-xl p-4 border border-marigold-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Goal</span>
                        <span className="text-xl font-bold capitalize text-marigold-700">
                          {user.goal} weight
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div id="progress" className="max-w-6xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                Weekly Progress
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
                Track your progress over time and see how you're doing against
                your goals
              </p>
            </div>

            {/* Main Progress Chart Area */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                  <IconTarget className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Progress Charts
                  </h3>
                  <p className="text-gray-600">
                    Visual representation of your nutrition journey
                  </p>
                </div>
              </div>

              <EnhancedProgressCharts />
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-marigold-50/80 via-white/80 to-mint-50/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setIsAddModalOpen(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <EnhancedFoodSearch
                onFoodSelect={(food) => {
                  setSelectedFood(food);
                }}
                onClose={() => setIsAddModalOpen(false)}
              />
            </div>
          </motion.div>
        )}

        {selectedFood && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-marigold-50/80 via-white/80 to-mint-50/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedFood(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <FoodLogger
                selectedFood={selectedFood}
                onClose={() => setSelectedFood(null)}
                onFoodLogged={handleFoodLogged}
                embedded={true}
              />
            </div>
          </motion.div>
        )}

        {showCustomFoodCreator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-marigold-50/80 via-white/80 to-mint-50/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowCustomFoodCreator(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <CustomFoodCreator
                onFoodCreated={handleCustomFoodCreated}
                onClose={() => setShowCustomFoodCreator(false)}
              />
            </div>
          </motion.div>
        )}

        {showPlanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-marigold-50/80 via-white/80 to-mint-50/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowPlanner(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <EnhancedMealPlanner onClose={() => setShowPlanner(false)} />
            </div>
          </motion.div>
        )}

        {showShoppingList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-marigold-50/80 via-white/80 to-mint-50/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowShoppingList(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <EnhancedShoppingListGenerator
                onClose={() => setShowShoppingList(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
