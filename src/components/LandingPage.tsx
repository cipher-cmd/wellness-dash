import { motion } from 'framer-motion';
import {
  IconBrain,
  IconTarget,
  IconFlame,
  IconSearch,
  IconArrowRight,
  IconCheck,
  IconStar,
  IconUsers,
  IconTrendingUp,
  IconDatabase,
  IconChartBar,
  IconReceipt,
  IconShoppingCart,
  IconArrowUp,
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { db, type Food } from '../lib/db';
import { searchExternalFoods } from '../lib/foodApi';
import { upsertFood } from '../lib/supabaseSync';
import { sampleIndianFoods } from '../lib/seedData';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize database with sample foods if empty
    const initializeDB = async () => {
      const foodCount = await db.foods.count();
      if (foodCount === 0) {
        await db.foods.bulkAdd(sampleIndianFoods);
        console.log('Database initialized with sample foods');
      }
    };
    initializeDB();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsLoading(true);
    try {
      console.log('Searching for:', query);
      const allFoods = await db.foods.toArray();
      console.log('Local foods count:', allFoods.length);

      // Improved local search with better relevance scoring
      const queryLower = query.toLowerCase().trim();
      const local = allFoods
        .map((food) => {
          const nameLower = food.name.toLowerCase();
          const brandLower = (food.brand || '').toLowerCase();
          const tagsLower = (food.tags || []).map((tag) => tag.toLowerCase());

          // Calculate relevance score
          let score = 0;

          // Exact name match gets highest score
          if (nameLower === queryLower) score += 100;
          // Starts with query gets high score
          else if (nameLower.startsWith(queryLower)) score += 80;
          // Contains query gets medium score
          else if (nameLower.includes(queryLower)) score += 60;
          // Brand contains query gets lower score
          else if (brandLower.includes(queryLower)) score += 30;
          // Tags contain query gets lower score
          else if (tagsLower.some((tag) => tag.includes(queryLower)))
            score += 20;
          // No match
          else score = 0;

          return { food, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((item) => item.food);

      console.log('Local search results:', local.length);

      // Always fetch external foods to get the best possible results
      console.log('Fetching external foods...');
      const external = await searchExternalFoods(query);
      console.log('External search results:', external.length, external);

      // Merge local and external results, removing duplicates
      const allResults = [...local];
      const existingNames = new Set(local.map((f) => f.name.toLowerCase()));

      external.forEach((food) => {
        if (!existingNames.has(food.name.toLowerCase())) {
          allResults.push(food);
          existingNames.add(food.name.toLowerCase());
        }
      });

      // Sort results by relevance to query
      const sortedResults = allResults.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const queryLower = query.toLowerCase();

        // Exact matches first
        if (aName === queryLower && bName !== queryLower) return -1;
        if (bName === queryLower && aName !== queryLower) return 1;

        // Starts with query
        if (aName.startsWith(queryLower) && !bName.startsWith(queryLower))
          return -1;
        if (bName.startsWith(queryLower) && !aName.startsWith(queryLower))
          return 1;

        // Contains query
        if (aName.includes(queryLower) && !bName.includes(queryLower))
          return -1;
        if (bName.includes(queryLower) && !aName.includes(queryLower)) return 1;

        // Alphabetical order for same relevance
        return aName.localeCompare(bName);
      });

      console.log('Final merged results:', sortedResults.length);
      setSearchResults(sortedResults);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFoodSelect = (food: Food) => {
    // If the selected food is from external (no id), persist it locally and sync
    const persistIfNew = async () => {
      if (!food.id) {
        const id = await db.foods.add(food);
        const saved = { ...food, id };
        await upsertFood(saved);
        // You can add a success message or redirect here
        console.log('Food selected:', saved);
      } else {
        console.log('Food selected:', food);
      }
    };
    void persistIfNew();
    setSearchTerm('');
    setSearchResults([]);
  };

  const features = [
    {
      icon: IconBrain,
      title: 'India-First Database',
      description:
        'From Paratha to Paneer Tikka, our database understands what you eat.',
      image: '/indian-food-database.jpg',
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50',
    },
    {
      icon: IconTarget,
      title: 'AI-Powered Coaching',
      description:
        'Get dynamic calorie and macro adjustments based on your progress.',
      image: '/ai-coaching-brain.jpg',
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50',
    },
    {
      icon: IconFlame,
      title: 'Effortless Logging',
      description:
        'Track food and workouts in seconds with our clean, simple interface.',
      image: '/food-logging-interface.jpg',
      gradient: 'from-orange-500 to-red-600',
      bgGradient: 'from-orange-50 to-red-50',
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Setup Your Goals',
      description: 'A quick 2-minute setup to personalize your targets.',
      image: '/goal-setting.jpg',
      icon: IconTarget,
    },
    {
      number: '2',
      title: 'Log Your Day',
      description: 'Easily log your meals and workouts.',
      image: '/daily-logging.jpg',
      icon: IconFlame,
    },
    {
      number: '3',
      title: 'See Your Progress',
      description:
        'Watch your data turn into real-world results with our progress tracker.',
      image: '/progress-tracking.jpg',
      icon: IconTrendingUp,
    },
  ];

  const stats = [
    { number: '50K+', label: 'Active Users', icon: IconUsers },
    { number: '95%', label: 'Success Rate', icon: IconCheck },
    { number: '4.9★', label: 'User Rating', icon: IconStar },
    { number: '24/7', label: 'Support', icon: IconCheck },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-marigold-200 to-orange-300 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-mint-200 to-emerald-300 rounded-full opacity-10 blur-3xl"></div>
        </div>

        {/* Background decorative elements - now with higher z-index */}
        <div className="absolute inset-0 overflow-hidden z-10">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-marigold-200 to-orange-300 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-mint-200 to-emerald-300 rounded-full opacity-10 blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 z-20">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="mb-12"
            >
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-marigold-400 to-orange-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <img
                  src="/logo.png"
                  alt="WellnessDash Logo"
                  className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full mx-auto shadow-2xl border-4 border-white ring-4 ring-marigold-100 object-cover"
                />
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 mb-8 leading-tight"
            >
              The Smartest
              <span className="block bg-gradient-to-r from-marigold-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
                Nutrition Tracker
              </span>
              <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-gray-700 mt-3 font-medium">
                Built for India
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed font-medium"
            >
              Track Indian foods with precision, get AI-powered coaching, and
              achieve your fitness goals for free. Join thousands of users who
              trust WellnessDash.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <button
                onClick={onGetStarted}
                className="group relative px-12 py-6 bg-gradient-to-r from-marigold-500 to-orange-500 hover:from-marigold-600 hover:to-orange-600 text-white rounded-3xl text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 border-2 border-transparent hover:border-orange-400"
              >
                <span className="flex items-center gap-3">
                  Get Started — It's Free
                  <IconArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-marigold-400 to-orange-400 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              </button>

              <button className="px-10 py-6 text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-3xl text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 hover:border-gray-300 hover:scale-105">
                Watch Demo
              </button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
              className="mt-16 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500"
            >
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                <IconCheck className="w-5 h-5 text-emerald-500" />
                <span className="font-medium">No credit card required</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                <IconCheck className="w-5 h-5 text-emerald-500" />
                <span className="font-medium">Free forever plan</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                <IconCheck className="w-5 h-5 text-emerald-500" />
                <span className="font-medium">Instant access</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-marigold-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="w-8 h-8 text-marigold-600" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Food Search Section - Enhanced */}
      <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-marigold-200 to-orange-200 rounded-3xl blur-xl opacity-50"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-marigold-100 to-orange-100 rounded-3xl flex items-center justify-center">
                <IconSearch className="w-12 h-12 text-marigold-600" />
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Try Our Food Search
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Search through thousands of Indian foods and get instant nutrition
              information. Start typing to see how fast and accurate our search
              is!
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="mb-8">
              <label className="block text-xl font-semibold text-gray-900 mb-4 text-center">
                Search for food
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="e.g., Roti, Dal, Rice, Chicken Curry..."
                  className="w-full px-8 py-6 text-xl border-2 border-gray-200 rounded-3xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 bg-white text-gray-900 placeholder:text-gray-500 shadow-xl hover:shadow-2xl"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <IconSearch className="w-6 h-6 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Search Results - Enhanced */}
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white border-2 border-gray-100 rounded-3xl shadow-2xl overflow-hidden"
              >
                {/* Results Header */}
                <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700">
                      {searchResults.length} food
                      {searchResults.length !== 1 ? 's' : ''} found
                    </span>
                    <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full">
                      Click to select
                    </span>
                  </div>
                </div>

                {/* Results List - Enhanced */}
                <div
                  className={`overflow-y-auto ${
                    searchResults.length <= 5
                      ? 'max-h-[400px]'
                      : searchResults.length <= 10
                      ? 'max-h-[500px]'
                      : 'max-h-[600px]'
                  }`}
                >
                  {searchResults.map((food, index) => (
                    <motion.div
                      key={`${food.id ?? 'ext'}:${food.name}:${
                        food.brand ?? ''
                      }:${food.per100g.kcal}:${food.per100g.protein}:${
                        food.per100g.carbs
                      }:${food.per100g.fat}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      onClick={() => handleFoodSelect(food)}
                      className={`p-8 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 cursor-pointer transition-all duration-300 ${
                        index !== searchResults.length - 1
                          ? 'border-b border-gray-100'
                          : ''
                      }`}
                    >
                      <div className="flex justify-between items-start gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-6">
                            {/* Food Icon - Enhanced */}
                            <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl flex items-center justify-center shadow-lg">
                              <span className="text-orange-600 text-2xl">
                                🍽️
                              </span>
                            </div>

                            {/* Food Details - Enhanced */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-lg leading-tight mb-2">
                                {food.name}
                              </h4>
                              {food.brand && (
                                <p className="text-sm text-gray-600 mb-3 bg-gray-50 px-3 py-1 rounded-full inline-block">
                                  Brand: {food.brand}
                                </p>
                              )}

                              {/* Nutrition Info - Enhanced Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-xl">
                                  <div className="text-xs text-blue-600 font-medium mb-1">
                                    Calories
                                  </div>
                                  <div className="text-lg font-bold text-blue-800">
                                    {food.per100g.kcal}
                                  </div>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-xl">
                                  <div className="text-xs text-green-600 font-medium mb-1">
                                    Protein
                                  </div>
                                  <div className="text-lg font-bold text-green-800">
                                    {food.per100g.protein}g
                                  </div>
                                </div>
                                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-3 rounded-xl">
                                  <div className="text-xs text-yellow-600 font-medium mb-1">
                                    Carbs
                                  </div>
                                  <div className="text-lg font-bold text-yellow-800">
                                    {food.per100g.carbs}g
                                  </div>
                                </div>
                                <div className="bg-gradient-to-br from-red-50 to-pink-50 p-3 rounded-xl">
                                  <div className="text-xs text-red-600 font-medium mb-1">
                                    Fat
                                  </div>
                                  <div className="text-lg font-bold text-red-800">
                                    {food.per100g.fat}g
                                  </div>
                                </div>
                              </div>

                              {/* Tags - Enhanced */}
                              {food.tags && food.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {food.tags.slice(0, 3).map((tag) => (
                                    <span
                                      key={tag}
                                      className="px-3 py-1 text-sm bg-gradient-to-r from-marigold-100 to-orange-100 text-marigold-800 rounded-full font-medium border border-marigold-200"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {food.tags.length > 3 && (
                                    <span className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full border border-gray-200">
                                      +{food.tags.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Side - Enhanced */}
                        <div className="flex flex-col items-end gap-3 flex-shrink-0">
                          {food.verified && (
                            <span className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 rounded-full font-medium border border-emerald-200">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                              Verified
                            </span>
                          )}
                          <button className="px-6 py-3 bg-gradient-to-r from-marigold-500 to-orange-500 hover:from-marigold-600 hover:to-orange-600 text-white text-sm font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                            Select
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-6"></div>
                <p className="text-xl text-gray-700 font-medium">
                  Searching for foods...
                </p>
              </motion.div>
            )}

            {searchTerm && !isLoading && searchResults.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl border-2 border-dashed border-gray-300"
              >
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🔍</span>
                </div>
                <p className="text-xl text-gray-700 font-medium mb-3">
                  No foods found for "{searchTerm}"
                </p>
                <p className="text-lg text-gray-500">
                  Try a different search term or add a custom food
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Key Features Section - Enhanced */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose WellnessDash?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Built specifically for Indian users with features that make
              nutrition tracking effortless and effective.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white rounded-3xl border border-gray-100 shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-105"></div>
                <div className="relative p-8 rounded-3xl">
                  <div className="w-full h-60 rounded-2xl overflow-hidden mb-8 shadow-lg">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div
                    className={`w-20 h-20 bg-gradient-to-br ${feature.bgGradient} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon
                      className={`w-10 h-10 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-center leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section - Enhanced */}
      <section className="py-24 bg-gradient-to-br from-marigold-50 via-orange-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Get started in minutes and see results in weeks. It's that simple.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="text-center relative group"
              >
                <div className="w-full h-52 rounded-2xl overflow-hidden mb-8 shadow-xl">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-r from-marigold-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-8 text-white text-3xl font-bold shadow-2xl group-hover:scale-110 transition-transform duration-300">
                    {step.number}
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-marigold-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <step.icon className="w-8 h-8 text-marigold-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Connector line - Enhanced */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-1 bg-gradient-to-r from-marigold-300 to-orange-300 transform translate-x-1/2 rounded-full"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="w-full h-80 rounded-3xl overflow-hidden mb-12 shadow-2xl">
              <img
                src="/transform-health.jpg"
                alt="Health Transformation"
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
              Ready to Transform Your Health?
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Join thousands of users who are already achieving their fitness
              goals with WellnessDash. Start your journey today and see the
              difference.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={onGetStarted}
                className="group relative px-12 py-6 bg-gradient-to-r from-marigold-500 to-orange-500 hover:from-marigold-600 hover:to-orange-600 text-white rounded-2xl text-xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
              >
                <span className="flex items-center gap-3">
                  Start Your Journey Today
                  <IconArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-marigold-400 to-orange-400 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              </button>

              <button className="px-10 py-6 text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-2xl text-lg font-medium shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 hover:border-gray-300">
                Learn More
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img
                  src="/logo.png"
                  alt="WellnessDash Logo"
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <h3 className="text-xl font-bold">WellnessDash</h3>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Your personal nutrition companion, built for India. Transform
                your health journey with AI-powered insights.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">
                Smart Features
              </h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <span className="flex items-center gap-2">
                    <IconBrain className="w-4 h-4" />
                    AI-Powered Coaching
                  </span>
                </li>
                <li>
                  <span className="flex items-center gap-2">
                    <IconTarget className="w-4 h-4" />
                    Goal Tracking
                  </span>
                </li>
                <li>
                  <span className="flex items-center gap-2">
                    <IconFlame className="w-4 h-4" />
                    Smart Food Logging
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">
                Indian Focus
              </h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <span className="flex items-center gap-2">
                    <IconDatabase className="w-4 h-4" />
                    Indian Food Database
                  </span>
                </li>
                <li>
                  <span className="flex items-center gap-2">
                    <IconUsers className="w-4 h-4" />
                    Local Nutrition
                  </span>
                </li>
                <li>
                  <span className="flex items-center gap-2">
                    <IconTrendingUp className="w-4 h-4" />
                    Cultural Insights
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">
                Tools & Analytics
              </h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <span className="flex items-center gap-2">
                    <IconChartBar className="w-4 h-4" />
                    Progress Analytics
                  </span>
                </li>
                <li>
                  <span className="flex items-center gap-2">
                    <IconReceipt className="w-4 h-4" />
                    Recipe Builder
                  </span>
                </li>
                <li>
                  <span className="flex items-center gap-2">
                    <IconShoppingCart className="w-4 h-4" />
                    Shopping Lists
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Scroll to Top Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-gradient-to-r from-marigold-500 to-orange-500 hover:from-marigold-600 hover:to-orange-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
              aria-label="Scroll to top"
            >
              <IconArrowUp className="w-6 h-6" />
            </button>
          </div>

          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-gray-400">
              &copy; 2025 WellnessDash. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
