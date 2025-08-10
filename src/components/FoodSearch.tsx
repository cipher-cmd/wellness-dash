import { useState, useEffect, useCallback, useRef } from 'react';
import { db, type Food } from '../lib/db';
import { searchExternalFoods } from '../lib/foodApi';
import { upsertFood } from '../lib/supabaseSync';
import { sampleIndianFoods } from '../lib/seedData';
import Fuse from 'fuse.js';

// Cache for external search results to avoid repeated API calls
const searchCache = new Map<string, { results: Food[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function FoodSearch({
  onFoodSelect,
}: {
  onFoodSelect: (food: Food) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allLocalFoods, setAllLocalFoods] = useState<Food[]>([]);
  const [searchQuality, setSearchQuality] = useState<{
    quality: 'High' | 'Medium' | 'Low';
    totalFound: number;
    qualityKept: number;
    method: 'Fuzzy' | 'Fallback' | 'External' | 'Cached';
  } | null>(null);

  // Use ref to prevent unnecessary re-renders and optimize Fuse.js
  const fuseRef = useRef<Fuse<Food> | null>(null);
  const lastSearchRef = useRef<string>('');

  // Initialize Fuse.js instance once and optimize it
  const initializeFuse = useCallback(
    (foods: Food[]) => {
      if (fuseRef.current && foods.length === allLocalFoods.length) {
        return; // Already initialized with same data
      }

      console.log('Initializing Fuse.js with', foods.length, 'foods');
      fuseRef.current = new Fuse(foods, {
        // Performance-optimized settings
        threshold: 0.4, // Slightly more lenient for better performance
        keys: [
          { name: 'name', weight: 1.0 },
          { name: 'brand', weight: 0.5 },
          { name: 'tags', weight: 0.3 },
        ],
        // Performance options
        includeScore: true,
        includeMatches: false,
        minMatchCharLength: 2,
        ignoreLocation: true, // Better performance
        findAllMatches: false,
        distance: 50, // Reduced for better performance
        useExtendedSearch: false,
        shouldSort: true,
      });
    },
    [allLocalFoods.length]
  );

  useEffect(() => {
    // Initialize database with sample foods if empty
    const initializeDB = async () => {
      const foodCount = await db.foods.count();
      if (foodCount === 0) {
        await db.foods.bulkAdd(sampleIndianFoods);
        console.log('Database initialized with sample foods');
      }

      // Load all local foods for Fuse.js search
      const allFoods = await db.foods.toArray();
      setAllLocalFoods(allFoods);
      initializeFuse(allFoods);
    };
    initializeDB();
  }, [initializeFuse]);

  // Smart search that prioritizes local results and caches external results
  const handleSearch = useCallback(
    async (query: string) => {
      setSearchTerm(query);
      if (!query.trim()) {
        setSearchResults([]);
        setSearchQuality(null);
        return;
      }

      // Prevent duplicate searches
      if (lastSearchRef.current === query) {
        return;
      }
      lastSearchRef.current = query;

      setIsLoading(true);
      const startTime = performance.now();

      try {
        console.log('Searching for:', query);
        const queryLower = query.toLowerCase().trim();

        // 1. Fast local search first
        let localResults: Food[] = [];
        let searchMethod: 'Fuzzy' | 'Fallback' | 'External' | 'Cached' =
          'Fuzzy';

        if (fuseRef.current) {
          // Use Fuse.js for fuzzy search
          const fuseResults = fuseRef.current.search(query);
          console.log('Fuse.js results:', fuseResults.length);

          // Get high-quality results quickly
          localResults = fuseResults
            .filter((result) => result.score! < 0.5)
            .slice(0, 10)
            .map((result) => result.item);

          if (localResults.length === 0 && query.length >= 2) {
            // Quick fallback search for short queries
            localResults = allLocalFoods
              .filter((food) => {
                const nameLower = food.name.toLowerCase();
                return (
                  nameLower.includes(queryLower) ||
                  nameLower.startsWith(queryLower)
                );
              })
              .slice(0, 8);
            searchMethod = 'Fallback';
          } else {
            searchMethod = 'Fuzzy';
          }
        }

        console.log(
          'Local search results:',
          localResults.length,
          'Method:',
          searchMethod
        );

        // 2. Check cache for external results
        let externalResults: Food[] = [];
        const cacheKey = queryLower;
        const cached = searchCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          externalResults = cached.results;
          searchMethod = 'Cached';
          console.log('Using cached external results:', externalResults.length);
        } else if (localResults.length < 5) {
          // Only fetch external if we have few local results
          console.log('Fetching external foods...');
          externalResults = await searchExternalFoods(query);

          // Cache the results
          searchCache.set(cacheKey, {
            results: externalResults,
            timestamp: Date.now(),
          });
          console.log('External search results:', externalResults.length);
        }

        // 3. Merge and deduplicate results efficiently
        const allResults = [...localResults];
        const existingNames = new Set(
          localResults.map((f) => f.name.toLowerCase())
        );

        externalResults.forEach((food) => {
          if (!existingNames.has(food.name.toLowerCase())) {
            allResults.push(food);
            existingNames.add(food.name.toLowerCase());
          }
        });

        // 4. Simple relevance sorting (optimized)
        const sortedResults = allResults.sort((a, b) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();

          // Simple scoring for performance
          const aScore = aName.startsWith(queryLower)
            ? 2
            : aName.includes(queryLower)
            ? 1
            : 0;
          const bScore = bName.startsWith(queryLower)
            ? 2
            : bName.includes(queryLower)
            ? 1
            : 0;

          if (aScore !== bScore) return bScore - aScore;
          return aName.localeCompare(bName);
        });

        const searchTime = performance.now() - startTime;
        console.log(`Search completed in ${searchTime.toFixed(2)}ms`);

        setSearchResults(sortedResults);

        // Set search quality indicator
        setSearchQuality({
          quality:
            sortedResults.length > 8
              ? 'High'
              : sortedResults.length > 4
              ? 'Medium'
              : 'Low',
          totalFound: localResults.length + externalResults.length,
          qualityKept: sortedResults.length,
          method: searchMethod,
        });
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
        setSearchQuality(null);
      } finally {
        setIsLoading(false);
      }
    },
    [allLocalFoods]
  );

  // Optimized debounced search
  const debouncedSearch = useCallback(
    (query: string) => {
      const timeoutId = setTimeout(() => {
        handleSearch(query);
      }, 150); // Reduced delay for better responsiveness

      return () => clearTimeout(timeoutId);
    },
    [handleSearch]
  );

  const handleFoodSelect = (food: Food) => {
    // If the selected food is from external (no id), persist it locally and sync
    const persistIfNew = async () => {
      if (!food.id) {
        const id = await db.foods.add(food);
        const saved = { ...food, id };
        await upsertFood(saved);
        onFoodSelect(saved);
      } else {
        onFoodSelect(food);
      }
    };
    void persistIfNew();
    setSearchTerm('');
    setSearchResults([]);
    setSearchQuality(null);
  };

  return (
    <div className="relative p-4">
      <div className="mb-4">
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          Search for food
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            debouncedSearch(e.target.value);
          }}
          placeholder="e.g., Roti, Dal, Rice, Chicken Curry..."
          className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 bg-white text-gray-900 placeholder:text-gray-500 shadow-lg hover:shadow-xl"
        />
      </div>

      {/* Enhanced Search Quality Indicator */}
      {searchQuality && searchResults.length > 0 && (
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-blue-700">
              <span className="mr-2">🔍</span>
              <span>
                Found {searchResults.length} high-quality results
                {searchQuality.method !== 'External' &&
                  ` (${searchQuality.method} search)`}
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
                {searchQuality.totalFound} → {searchQuality.qualityKept}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Search Results - Responsive and spacious */}
      {searchResults.length > 0 && (
        <div className="bg-white border-2 border-gray-100 rounded-xl shadow-xl overflow-hidden">
          {/* Results Header */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-gray-700">
                {searchResults.length} food
                {searchResults.length !== 1 ? 's' : ''} found
              </span>
              <span className="text-sm text-gray-500">Click to select</span>
            </div>
          </div>

          {/* Results List - Responsive height */}
          <div
            className={`overflow-y-auto ${
              searchResults.length <= 5
                ? 'max-h-[350px]'
                : searchResults.length <= 10
                ? 'max-h-[450px]'
                : 'max-h-[550px]'
            }`}
          >
            {searchResults.map((food, index) => (
              <div
                key={`${food.id ?? 'ext'}:${food.name}:${food.brand ?? ''}:${
                  food.per100g.kcal
                }:${food.per100g.protein}:${food.per100g.carbs}:${
                  food.per100g.fat
                }`}
                onClick={() => handleFoodSelect(food)}
                className={`p-4 hover:bg-orange-50 cursor-pointer transition-all duration-200 ${
                  index !== searchResults.length - 1
                    ? 'border-b border-gray-100'
                    : ''
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-4">
                      {/* Food Icon */}
                      <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <span className="text-orange-600 text-xl">🍽️</span>
                      </div>

                      {/* Food Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-base leading-tight mb-1">
                          {food.name}
                        </h4>
                        {food.brand && (
                          <p className="text-sm text-gray-600 mb-2">
                            Brand: {food.brand}
                          </p>
                        )}

                        {/* Nutrition Info - Grid Layout */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                          <div className="text-xs">
                            <span className="text-gray-500">Calories:</span>
                            <span className="ml-1 font-medium text-gray-700">
                              {food.per100g.kcal}
                            </span>
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-500">Protein:</span>
                            <span className="ml-1 font-medium text-gray-700">
                              {food.per100g.protein}g
                            </span>
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-500">Carbs:</span>
                            <span className="ml-1 font-medium text-gray-700">
                              {food.per100g.carbs}g
                            </span>
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-500">Fat:</span>
                            <span className="ml-1 font-medium text-gray-700">
                              {food.per100g.fat}g
                            </span>
                          </div>
                        </div>

                        {/* Tags */}
                        {food.tags && food.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {food.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 text-xs bg-marigold-100 text-marigold-800 rounded-full font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                            {food.tags.length > 3 && (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                +{food.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Verification and Action */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {food.verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-mint-100 text-mint-800 rounded-full font-medium">
                        <span className="w-2 h-2 bg-mint-500 rounded-full"></span>
                        Verified
                      </span>
                    )}
                    <button className="px-3 py-1.5 bg-marigold-500 hover:bg-marigold-600 text-white text-xs font-medium rounded-lg transition-colors">
                      Select
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">
            Searching for foods...
          </p>
        </div>
      )}

      {searchTerm && !isLoading && searchResults.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔍</span>
          </div>
          <p className="text-lg text-gray-700 font-medium mb-2">
            No foods found for "{searchTerm}"
          </p>
          <p className="text-base text-gray-500">
            Try a different search term or add a custom food
          </p>
        </div>
      )}
    </div>
  );
}
