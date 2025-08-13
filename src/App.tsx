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
  syncUserProfileWithGoogle,
  signOutUser,
  type UserProfile,
} from './lib/supabaseAuth';
import type { Food, DiaryEntry } from './lib/db';
import EnhancedShoppingListGenerator from './components/ui/EnhancedShoppingListGenerator';
import EnhancedProgressCharts from './components/ui/EnhancedProgressCharts';
import { IconTarget, IconBrain } from '@tabler/icons-react';
import {
  generatePersonalizedMealPlan,
  type MealPlanningContext,
} from './lib/ai';
import { seedIndianFoods } from './lib/indianFoodDatabase';
import UserProfileModal from './components/ui/UserProfileModal';
import { LocalStorageService } from './lib/localStorage';

type AppState = 'landing' | 'auth' | 'onboarding' | 'main';

export default function App() {
  // Check if we're in local development mode
  const isLocalDev = import.meta.env.DEV && !import.meta.env.VITE_SUPABASE_URL;

  // Debug logging
  console.log('🔍 App Debug Info:', {
    isDev: import.meta.env.DEV,
    isLocalDev,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    hasSupabaseConfig: !!import.meta.env.VITE_SUPABASE_URL,
    appState: 'landing',
  });

  const [appState, setAppState] = useState<AppState>('landing');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'diary' | 'goals' | 'progress'>(
    'diary'
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([
    // Sample breakfast entry
    {
      id: 1,
      date: new Date().toISOString().split('T')[0],
      meal: 'breakfast',
      foodId: 1,
      customName: 'Oatmeal with Berries',
      grams: 150,
      quantity: 1,
      servingLabel: 'bowl',
    },
    // Sample lunch entry
    {
      id: 2,
      date: new Date().toISOString().split('T')[0],
      meal: 'lunch',
      foodId: 2,
      customName: 'Grilled Chicken Salad',
      grams: 200,
      quantity: 1,
      servingLabel: 'plate',
    },
    // Sample snack entry
    {
      id: 3,
      date: new Date().toISOString().split('T')[0],
      meal: 'snack',
      foodId: 3,
      customName: 'Greek Yogurt with Nuts',
      grams: 100,
      quantity: 1,
      servingLabel: 'cup',
    },
  ]);
  const [dailyTotals, setDailyTotals] = useState({
    kcal: 850,
    protein: 45,
    carbs: 95,
    fat: 28,
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
  const [showAIMealPlan, setShowAIMealPlan] = useState(false);
  const [isGeneratingAIMealPlan, setIsGeneratingAIMealPlan] = useState(false);
  const [aiMealPlan, setAiMealPlan] = useState<string>('');
  const [showProfileModal, setShowProfileModal] = useState(false);

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

  // Initialize app data when user is authenticated
  useEffect(() => {
    if (user && appState === 'main') {
      initializeApp();
    }
  }, [user, appState]);

  const initializeApp = async () => {
    try {
      // Initialize local storage with defaults
      LocalStorageService.initializeDefaults();

      // Don't override user data from Google - keep the real profile
      // Only load goals from local storage if not already set
      if (!goals.kcal) {
        const savedGoals = LocalStorageService.getGoals();
        if (savedGoals) {
          setGoals(savedGoals);
          console.log('✅ Goals loaded from local storage');
        }
      }

      // Seed the Indian food database
      await seedIndianFoods();
      console.log('✅ Indian food database seeded successfully');

      // Load initial data
      await loadData();
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing app:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (appState === 'main') {
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

  const handleOnboardingComplete = (userProfile: UserProfile) => {
    setUser(userProfile);
    setGoals({
      kcal: userProfile.daily_targets.calories,
      protein: userProfile.daily_targets.protein,
      carbs: userProfile.daily_targets.carbs,
      fat: userProfile.daily_targets.fat,
    });
    setAppState('main');
  };

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      await signOutUser();

      // Clear local storage
      LocalStorageService.clearAll();

      // Reset app state
      setUser(null);
      setAppState('landing');
      setDiaryEntries([]);
      setDailyTotals({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
      setGoals({ kcal: 2000, protein: 150, carbs: 250, fat: 65 });

      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    // Update user state
    setUser(updatedProfile);

    // Update goals based on new profile
    setGoals({
      kcal: updatedProfile.daily_targets.calories,
      protein: updatedProfile.daily_targets.protein,
      carbs: updatedProfile.daily_targets.carbs,
      fat: updatedProfile.daily_targets.fat,
    });

    // Don't save user to local storage - keep Google profile data
    // Only save goals to local storage
    LocalStorageService.saveGoals({
      kcal: updatedProfile.daily_targets.calories,
      protein: updatedProfile.daily_targets.protein,
      carbs: updatedProfile.daily_targets.carbs,
      fat: updatedProfile.daily_targets.fat,
    });

    console.log('✅ Profile updated successfully');
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
  };

  // const handleProfileUpdate = (updatedProfile: UserProfile) => {
  //   // COMMENTED OUT FOR LOCAL DEVELOPMENT
  //   // setUser(updatedProfile);
  //   // setGoals({
  //   //   kcal: updatedProfile.daily_targets.calories,
  //   //   protein: updatedProfile.daily_targets.protein,
  //   //   carbs: updatedProfile.daily_targets.carbs,
  //   //   fat: updatedProfile.daily_targets.fat,
  //   // });
  //   console.log(
  //     'Profile update clicked (disabled for local development)',
  //     updatedProfile
  //   );
  // };

  const handleCustomFoodCreated = async () => {
    setShowCustomFoodCreator(false);
    // You can add logic here to sync with Supabase if needed
  };

  const handleAddFood = () => {
    setIsAddModalOpen(true);
  };

  const handleGenerateAIMealPlan = async () => {
    if (!user) {
      setAiMealPlan(
        'User profile not available. Please complete your profile first.'
      );
      setShowAIMealPlan(true);
      return;
    }

    setShowAIMealPlan(true);
    setIsGeneratingAIMealPlan(true);

    try {
      // Create comprehensive meal planning context
      const mealPlanningContext: MealPlanningContext = {
        userProfile: {
          age: user.age,
          gender: user.gender === 'other' ? 'male' : user.gender, // Handle 'other' gender case
          height: user.height,
          weight: user.weight,
          bmi: user.bmi,
          goal: user.goal,
          activityLevel: 'moderately_active', // Default, can be made configurable
        },
        nutritionGoals: {
          kcal: goals.kcal,
          protein: goals.protein,
          carbs: goals.carbs,
          fat: goals.fat,
        },
        preferences: {
          cuisine: 'indian',
          dietaryRestrictions: [],
          favoriteFoods: ['dal', 'roti', 'rice', 'vegetables'],
          dislikedFoods: [],
          mealTiming: {
            breakfast: '8:00 AM',
            lunch: '1:00 PM',
            dinner: '8:00 PM',
            snacks: ['11:00 AM', '4:00 PM'],
          },
        },
        currentMeals: diaryEntries.map((entry) => ({
          meal: entry.meal,
          foods: [entry.customName || 'Unknown Food'],
          calories: entry.grams ? entry.grams * 0.1 : 0, // Rough estimate
        })),
      };

      const aiResponse = await generatePersonalizedMealPlan(
        mealPlanningContext
      );
      setAiMealPlan(aiResponse);
    } catch (error) {
      console.error('Error generating AI meal plan:', error);
      setAiMealPlan('Failed to generate meal plan. Please try again.');
    } finally {
      setIsGeneratingAIMealPlan(false);
    }
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
    console.log('🔍 Auth State Debug:', { isLocalDev, appState });
    console.log('✅ Rendering regular Auth component');
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
        onGenerateMealPlan={handleGenerateAIMealPlan}
        user={user || undefined}
        onLogout={handleProfileClick}
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
              <motion.button
                onClick={handleAddFood}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-base flex items-center justify-center gap-3"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-bold">+</span>
                </div>
                Add Food
              </motion.button>

              <motion.button
                onClick={() => setShowPlanner(true)}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-base flex items-center justify-center gap-3 border border-blue-400/30"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                Meal Planner
              </motion.button>

              <motion.button
                onClick={() => setShowShoppingList(true)}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-base flex items-center justify-center gap-3 border border-emerald-400/30"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                    />
                  </svg>
                </div>
                Shopping List
              </motion.button>
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

        {/* AI Meal Plan Modal */}
        {showAIMealPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-marigold-50/80 via-white/80 to-mint-50/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowAIMealPlan(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <IconBrain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        AI-Generated Meal Plan
                      </h2>
                      <p className="text-gray-600">
                        Personalized nutrition plan based on your goals, BMI,
                        and preferences
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAIMealPlan(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-6 h-6 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {isGeneratingAIMealPlan ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-spin mx-auto mb-4 flex items-center justify-center">
                      <IconBrain className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Generating Your Personalized Meal Plan
                    </h3>
                    <p className="text-gray-600">
                      AI is analyzing your profile, goals, and preferences to
                      create the perfect Indian meal plan...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                      <h3 className="text-lg font-semibold text-purple-800 mb-3">
                        Your Personalized 7-Day Indian Meal Plan
                      </h3>
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap text-purple-700 font-mono text-sm leading-relaxed">
                          {aiMealPlan}
                        </pre>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => {
                          setShowAIMealPlan(false);
                          setShowPlanner(true);
                        }}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all flex items-center justify-center gap-2"
                      >
                        <IconTarget className="w-5 h-5" />
                        Apply to Meal Planner
                      </button>
                      <button
                        onClick={() => setShowAIMealPlan(false)}
                        className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* User Profile Modal */}
        {showProfileModal && user && (
          <UserProfileModal
            user={user}
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            onUpdateProfile={handleUpdateProfile}
            onLogout={handleLogout}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
