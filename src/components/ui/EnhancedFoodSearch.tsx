import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconSearch, IconPlus, IconCheck } from '@tabler/icons-react';
import Fuse from 'fuse.js';
import { db, type Food } from '../../lib/db';

interface EnhancedFoodSearchProps {
  onFoodSelect: (food: Food, servingLabel: string, grams: number) => void;
  onClose: () => void;
}

export default function EnhancedFoodSearch({
  onFoodSelect,
  onClose,
}: EnhancedFoodSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [selectedServing, setSelectedServing] = useState<string>('');
  const [selectedGrams, setSelectedGrams] = useState<number>(100);
  const [showServingSelector, setShowServingSelector] = useState(false);
  const [popularFoods, setPopularFoods] = useState<Food[]>([]);
  const [recentFoods, setRecentFoods] = useState<Food[]>([]);
  const [allLocalFoods, setAllLocalFoods] = useState<Food[]>([]);
  const [searchQuality, setSearchQuality] = useState<{
    quality: 'High' | 'Medium' | 'Low';
    totalFound: number;
    qualityKept: number;
    threshold: number;
  } | null>(null);

  // Initialize Fuse.js instance with optimized performance settings
  const fuse = useMemo(() => {
    return new Fuse(allLocalFoods, {
      // Optimized threshold for speed and accuracy
      threshold: 0.4, // Slightly stricter for better performance

      // Simplified key configuration for faster searches
      keys: [
        { name: 'name', weight: 1.0 }, // Focus on name for speed
        { name: 'tags', weight: 0.5 }, // Tags as secondary
      ],

      // Performance-focused options
      includeScore: true,
      includeMatches: false, // Disable for speed
      minMatchCharLength: 2,
      ignoreLocation: true, // Better performance
      findAllMatches: false,
      distance: 50, // Reduced for speed
      useExtendedSearch: false,
      shouldSort: true,
    });
  }, [allLocalFoods]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load all local foods for Fuse.js search
      const allFoods = await db.foods.toArray();
      setAllLocalFoods(allFoods);

      // Load popular and recent foods from local database
      const popular = await db.foods
        .where('source')
        .equals('user')
        .limit(8)
        .toArray();
      const recent = await db.foods.orderBy('id').reverse().limit(8).toArray();

      setPopularFoods(popular);
      setRecentFoods(recent);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setSearchQuality(null);
        return;
      }

      setIsLoading(true);
      try {
        // Fast local search only - no external API calls for basic searches
        const fuseResults = fuse.search(query);

        // Simple, fast filtering
        const qualityResults = fuseResults
          .filter((result) => result.score! < 0.5) // Fixed threshold for speed
          .slice(0, 20); // Limit results for performance

        const localResults = qualityResults.map((result) => result.item);

        // Quick fallback for very short queries
        if (localResults.length === 0 && query.length >= 2) {
          const quickResults = allLocalFoods
            .filter((food) =>
              food.name.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 10);

          setSearchResults(quickResults);
          setSearchQuality({
            quality: 'Low',
            totalFound: quickResults.length,
            qualityKept: quickResults.length,
            threshold: 0.5,
          });
        } else {
          setSearchResults(localResults);
          setSearchQuality({
            quality:
              localResults.length > 10
                ? 'High'
                : localResults.length > 5
                ? 'Medium'
                : 'Low',
            totalFound: fuseResults.length,
            qualityKept: localResults.length,
            threshold: 0.5,
          });
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [fuse, allLocalFoods]
  );

  // Debounced search function for better performance
  const debouncedSearch = useCallback(
    (query: string) => {
      const timeoutId = setTimeout(() => {
        performSearch(query);
      }, 150); // 150ms delay for better performance

      return () => clearTimeout(timeoutId);
    },
    [performSearch]
  );

  const handleFoodSelect = (food: Food) => {
    setSelectedFood(food);
    setShowServingSelector(true);

    // Set default serving
    if (food.servings && food.servings.length > 0) {
      setSelectedServing(food.servings[0].label);
      setSelectedGrams(food.servings[0].grams);
    } else {
      setSelectedServing('100g');
      setSelectedGrams(100);
    }
  };

  const handleServingConfirm = () => {
    if (selectedFood) {
      onFoodSelect(selectedFood, selectedServing, selectedGrams);
      onClose();
    }
  };

  const handleCustomServingChange = (value: string) => {
    const grams = parseInt(value) || 100;
    setSelectedGrams(grams);
    setSelectedServing(`${grams}g`);
  };

  const addToFavorites = async (food: Food) => {
    try {
      // Add to local database with user source
      await db.foods.add({
        ...food,
        source: 'user',
        verified: true,
      });

      // Refresh popular foods
      const updatedPopular = await db.foods
        .where('source')
        .equals('user')
        .limit(8)
        .toArray();
      setPopularFoods(updatedPopular);

      console.log('Food added to favorites:', food.name);
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 sm:p-6 text-white">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold">Search Foods</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-4 sm:p-6 border-b">
        <div className="relative">
          <IconSearch
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search for foods, ingredients, or dishes..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              debouncedSearch(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!searchTerm && (
          <div className="p-4 sm:p-6">
            {/* Popular Foods */}
            {popularFoods.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Popular Foods
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {popularFoods.map((food) => (
                    <motion.button
                      key={food.id || food.name}
                      onClick={() => handleFoodSelect(food)}
                      className="p-3 bg-gray-50 rounded-lg text-left hover:bg-gray-100 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="font-medium text-gray-800">
                        {food.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {food.per100g.kcal} kcal/100g
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Foods */}
            {recentFoods.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Recently Added
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recentFoods.map((food) => (
                    <motion.button
                      key={food.id || food.name}
                      onClick={() => handleFoodSelect(food)}
                      className="p-3 bg-gray-50 rounded-lg text-left hover:bg-gray-100 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="font-medium text-gray-800">
                        {food.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {food.per100g.kcal} kcal/100g
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Results */}
        {searchTerm && (
          <div className="p-4 sm:p-6">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Searching...</span>
              </div>
            )}

            {/* Enhanced Search Quality Indicator */}
            {!isLoading && searchResults.length > 0 && searchQuality && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between text-sm text-blue-700">
                  <div className="flex items-center">
                    <IconCheck size={16} className="mr-2" />
                    <span>
                      Showing {searchResults.length} high-quality results
                      {' (filtered for relevance)'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs">
                    <span
                      className={`px-2 py-1 rounded-full ${
                        searchQuality.quality === 'High'
                          ? 'bg-green-200 text-green-800'
                          : searchQuality.quality === 'Medium'
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-red-200 text-red-800'
                      }`}
                    >
                      Quality: {searchQuality.quality}
                    </span>
                    <span className="text-blue-600">
                      Found: {searchQuality.totalFound} → Kept:{' '}
                      {searchQuality.qualityKept}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Fallback Search Indicator */}
            {!isLoading &&
              searchResults.length > 0 &&
              searchQuality &&
              searchQuality.totalFound > 0 &&
              searchQuality.qualityKept === 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center text-sm text-yellow-700">
                    <span className="mr-2">🔄</span>
                    <span>
                      Using enhanced search to find relevant results for "
                      {searchTerm}"
                    </span>
                  </div>
                </div>
              )}

            {/* Results */}
            {!isLoading && searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map((food) => (
                  <motion.div
                    key={food.id || food.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                    onClick={() => handleFoodSelect(food)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">
                          {food.name}
                        </div>
                        {food.brand && (
                          <div className="text-sm text-gray-600">
                            {food.brand}
                          </div>
                        )}
                        <div className="text-sm text-gray-500">
                          {food.per100g.kcal} kcal • {food.per100g.protein}g
                          protein • {food.per100g.carbs}g carbs •{' '}
                          {food.per100g.fat}g fat
                        </div>
                        {food.tags && food.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {food.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToFavorites(food);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <IconPlus size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* No Results */}
            {searchTerm && !isLoading && searchResults.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">🔍</div>
                <div className="text-gray-600">
                  No foods found for "{searchTerm}"
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Try different keywords or add a custom food
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Serving Selector Modal */}
      <AnimatePresence>
        {showServingSelector && selectedFood && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-marigold-50/80 via-white/80 to-mint-50/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowServingSelector(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Select Serving Size
              </h3>

              <div className="mb-4">
                <div className="font-medium text-gray-800 mb-2">
                  {selectedFood.name}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedFood.per100g.kcal} kcal per 100g
                </div>
              </div>

              {/* Predefined Servings */}
              {selectedFood.servings && selectedFood.servings.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose Serving Size
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedFood.servings.map((serving) => (
                      <button
                        key={serving.label}
                        onClick={() => {
                          setSelectedServing(serving.label);
                          setSelectedGrams(serving.grams);
                        }}
                        className={`p-3 border rounded-lg text-center transition-colors ${
                          selectedServing === serving.label
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="font-medium">{serving.label}</div>
                        <div className="text-sm text-gray-600">
                          {serving.grams}g
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Serving */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Amount (grams)
                </label>
                <input
                  type="number"
                  value={selectedGrams}
                  onChange={(e) => handleCustomServingChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="1000"
                />
              </div>

              {/* Nutrition Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Nutrition for {selectedGrams}g:
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Calories:</span>
                    <span className="ml-2 font-medium">
                      {Math.round(
                        (selectedFood.per100g.kcal * selectedGrams) / 100
                      )}{' '}
                      kcal
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Protein:</span>
                    <span className="ml-2 font-medium">
                      {(
                        (selectedFood.per100g.protein * selectedGrams) /
                        100
                      ).toFixed(1)}
                      g
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Carbs:</span>
                    <span className="ml-2 font-medium">
                      {(
                        (selectedFood.per100g.carbs * selectedGrams) /
                        100
                      ).toFixed(1)}
                      g
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Fat:</span>
                    <span className="ml-2 font-medium">
                      {(
                        (selectedFood.per100g.fat * selectedGrams) /
                        100
                      ).toFixed(1)}
                      g
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowServingSelector(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleServingConfirm}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Food
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
