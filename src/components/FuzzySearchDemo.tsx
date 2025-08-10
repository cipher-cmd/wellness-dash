import React, { useState, useEffect } from 'react';
import { foodSearchService } from '../lib/foodSearchService';
import { db, type Food } from '../lib/db';
import { sampleIndianFoods } from '../lib/seedData';

export default function FuzzySearchDemo() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [searchQuality, setSearchQuality] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMethod, setSearchMethod] = useState<
    'fuzzy' | 'fallback' | 'hybrid'
  >('hybrid');
  const [stats, setStats] = useState({
    totalFoods: 0,
    searchCount: 0,
  });

  useEffect(() => {
    initializeDemo();
  }, []);

  const initializeDemo = async () => {
    try {
      // Initialize the search service
      await foodSearchService.initialize();

      // Initialize database with sample foods if empty
      const foodCount = await db.foods.count();
      if (foodCount === 0) {
        await db.foods.bulkAdd(sampleIndianFoods);
        console.log('Database initialized with sample foods');
      }

      // Get stats
      const allFoods = await db.foods.toArray();
      setStats({
        totalFoods: allFoods.length,
        searchCount: allFoods.reduce(
          (sum, food) => sum + (food.searchCount || 0),
          0
        ),
      });
    } catch (error) {
      console.error('Error initializing demo:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchQuality(null);
      return;
    }

    setIsLoading(true);
    try {
      const results = await foodSearchService.searchFoods(query, {
        limit: 20,
        includeExternal: false, // Focus on local search for demo
        searchMethod,
      });

      setSearchResults(results.local);
      setSearchQuality(results.searchQuality);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setSearchQuality(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim()) {
      // Debounced search
      const timeoutId = setTimeout(() => {
        handleSearch(query);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setSearchQuality(null);
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'High':
        return 'text-green-600 bg-green-100';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'Low':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'Fuzzy':
        return 'text-blue-600 bg-blue-100';
      case 'Fallback':
        return 'text-purple-600 bg-purple-100';
      case 'External':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🍽️ Fuzzy Search Demo
        </h1>
        <p className="text-gray-600 mb-6">
          Test the improved fuzzy search with different search methods and see
          search quality indicators
        </p>

        {/* Stats */}
        <div className="flex justify-center gap-6 mb-6">
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalFoods}
            </div>
            <div className="text-sm text-blue-500">Total Foods</div>
          </div>
          <div className="bg-green-50 px-4 py-2 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stats.searchCount}
            </div>
            <div className="text-sm text-green-500">Total Searches</div>
          </div>
        </div>
      </div>

      {/* Search Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Query
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              placeholder="Try: 'roti', 'chicken', 'rice', 'paneer', 'curry'..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Method
            </label>
            <select
              value={searchMethod}
              onChange={(e) => setSearchMethod(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="hybrid">Hybrid (Recommended)</option>
              <option value="fuzzy">Fuzzy Only</option>
              <option value="fallback">Fallback Only</option>
            </select>
          </div>
        </div>

        {/* Search Quality Indicator */}
        {searchQuality && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Search Quality Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getQualityColor(
                    searchQuality.quality
                  )}`}
                >
                  {searchQuality.quality}
                </div>
                <div className="text-xs text-gray-500 mt-1">Quality</div>
              </div>

              <div className="text-center">
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getMethodColor(
                    searchQuality.method
                  )}`}
                >
                  {searchQuality.method}
                </div>
                <div className="text-xs text-gray-500 mt-1">Method</div>
              </div>

              <div className="text-center">
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                  {searchQuality.threshold.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Threshold</div>
              </div>

              <div className="text-center">
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-600">
                  {searchQuality.totalFound}
                </div>
                <div className="text-xs text-gray-500 mt-1">Total Found</div>
              </div>

              <div className="text-center">
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-600">
                  {searchQuality.qualityKept}
                </div>
                <div className="text-xs text-gray-500 mt-1">Quality Kept</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Search Results
          </h2>
          {isLoading && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Searching...
            </div>
          )}
        </div>

        {searchResults.length > 0 ? (
          <div className="grid gap-3">
            {searchResults.map((food) => (
              <div
                key={food.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{food.name}</h3>
                    <div className="flex gap-4 text-sm text-gray-600 mt-1">
                      {food.brand && <span>Brand: {food.brand}</span>}
                      <span>Category: {food.category}</span>
                      <span>Calories: {food.per100g.kcal} kcal/100g</span>
                    </div>
                    {food.tags && food.tags.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {food.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-right text-sm text-gray-500">
                    <div>Protein: {food.per100g.protein}g</div>
                    <div>Carbs: {food.per100g.carbs}g</div>
                    <div>Fat: {food.per100g.fat}g</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery && !isLoading ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔍</div>
            <div>No results found for "{searchQuery}"</div>
            <div className="text-sm mt-1">
              Try a different search term or search method
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">🍽️</div>
            <div>Enter a search query to see results</div>
          </div>
        )}
      </div>

      {/* Search Tips */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">💡 Search Tips</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">Try these searches:</h4>
            <ul className="space-y-1">
              <li>• "roti" - exact match</li>
              <li>• "chicken" - multiple results</li>
              <li>• "rice" - category search</li>
              <li>• "paneer" - ingredient search</li>
              <li>• "curry" - tag-based search</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Search Methods:</h4>
            <ul className="space-y-1">
              <li>
                • <strong>Hybrid:</strong> Best of both worlds
              </li>
              <li>
                • <strong>Fuzzy:</strong> Typo-tolerant search
              </li>
              <li>
                • <strong>Fallback:</strong> Simple text matching
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
