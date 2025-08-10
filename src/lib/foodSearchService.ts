import { db, type Food } from './db';
import { searchExternalFoods } from './foodApi';
import { generateMealIdeas } from './ai';
import Fuse from 'fuse.js';

// Cache for external search results
const searchCache = new Map<string, { results: Food[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class FoodSearchService {
  private static instance: FoodSearchService;
  private searchDebounceTimer: NodeJS.Timeout | null = null;
  private fuseInstance: Fuse<Food> | null = null;
  private allFoods: Food[] = [];
  private lastSearchQuery: string = '';

  static getInstance(): FoodSearchService {
    if (!FoodSearchService.instance) {
      FoodSearchService.instance = new FoodSearchService();
    }
    return FoodSearchService.instance;
  }

  /**
   * Initialize the search service with local foods
   */
  async initialize(): Promise<void> {
    try {
      this.allFoods = await db.foods.toArray();
      this.fuseInstance = new Fuse(this.allFoods, {
        // Performance-optimized settings
        threshold: 0.4,
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
      console.log(
        'FoodSearchService initialized with',
        this.allFoods.length,
        'foods'
      );
    } catch (error) {
      console.error('Error initializing FoodSearchService:', error);
    }
  }

  /**
   * Smart food search that prioritizes local results and caches external results
   * Enhanced with better performance and caching
   */
  async searchFoods(
    query: string,
    options: {
      limit?: number;
      includeExternal?: boolean;
      includeAI?: boolean;
      useCache?: boolean;
      searchMethod?: 'fuzzy' | 'fallback' | 'hybrid';
    } = {}
  ): Promise<{
    local: Food[];
    external: Food[];
    aiSuggestions?: string[];
    total: number;
    searchQuality: {
      quality: 'High' | 'Medium' | 'Low';
      method: string;
      threshold: number;
      totalFound: number;
      qualityKept: number;
    };
  }> {
    const {
      limit = 20,
      includeExternal = true,
      includeAI = false,
      useCache = true,
      searchMethod = 'hybrid',
    } = options;

    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return {
        local: [],
        external: [],
        total: 0,
        searchQuality: {
          quality: 'Low',
          method: 'None',
          threshold: 0,
          totalFound: 0,
          qualityKept: 0,
        },
      };
    }

    // Prevent duplicate searches
    if (this.lastSearchQuery === cleanQuery) {
      const cached = this.getCachedResults(cleanQuery);
      if (cached) return cached;
    }
    this.lastSearchQuery = cleanQuery;

    console.log(`Searching for: "${cleanQuery}" with method: ${searchMethod}`);
    const startTime = performance.now();

    // 1. Fast local search first
    let localResults: Food[] = [];
    let searchMethodUsed = 'Unknown';

    if (this.fuseInstance && searchMethod !== 'fallback') {
      // Use Fuse.js fuzzy search
      const fuseResults = this.fuseInstance.search(cleanQuery);
      console.log(`Fuse.js found ${fuseResults.length} potential matches`);

      // Get high-quality results quickly
      localResults = fuseResults
        .filter((result) => result.score! < 0.5)
        .slice(0, limit)
        .map((result) => result.item);

      if (localResults.length > 0) {
        searchMethodUsed = 'Fuzzy';
        console.log(`Using ${localResults.length} fuzzy search results`);
      } else {
        // Fallback to text search if fuzzy search yields no results
        localResults = await this.performFallbackSearch(cleanQuery, limit);
        searchMethodUsed = 'Fallback';
        console.log(
          `Fuzzy search failed, using ${localResults.length} fallback results`
        );
      }
    } else {
      // Direct fallback search
      localResults = await this.performFallbackSearch(cleanQuery, limit);
      searchMethodUsed = 'Fallback';
    }

    let externalResults: Food[] = [];
    let aiSuggestions: string[] | undefined;

    // 2. Check cache for external results
    if (includeExternal && localResults.length < limit) {
      const cacheKey = cleanQuery;
      const cached = searchCache.get(cacheKey);

      if (
        cached &&
        Date.now() - cached.timestamp < CACHE_DURATION &&
        useCache
      ) {
        externalResults = cached.results.slice(0, limit - localResults.length);
        searchMethodUsed = 'Cached';
        console.log(`Using ${externalResults.length} cached external results`);
      } else {
        try {
          externalResults = await this.searchExternalWithCache(
            cleanQuery,
            limit - localResults.length
          );
          console.log(`Found ${externalResults.length} external results`);
        } catch (error) {
          console.warn('External search failed:', error);
        }
      }
    }

    // 3. Get AI suggestions if requested and results are insufficient
    if (includeAI && localResults.length + externalResults.length < 5) {
      try {
        const aiPrompt = `Suggest 3-5 healthy food alternatives for: ${cleanQuery}`;
        const aiResponse = await generateMealIdeas(aiPrompt);
        aiSuggestions = this.parseAISuggestions(aiResponse);
        console.log(`Generated ${aiSuggestions.length} AI suggestions`);
      } catch (error) {
        console.warn('AI suggestions failed:', error);
      }
    }

    // 4. Merge and deduplicate results with optimized sorting
    const allResults = this.mergeAndDeduplicate(localResults, externalResults);
    const sortedResults = this.sortByRelevance(allResults, cleanQuery);

    // 5. Cache external results for future use
    if (externalResults.length > 0 && useCache) {
      await db.cacheFoodSearch(cleanQuery, externalResults, 60); // Cache for 1 hour
    }

    const searchTime = performance.now() - startTime;
    console.log(`Search completed in ${searchTime.toFixed(2)}ms`);

    // 6. Calculate search quality metrics
    const searchQuality = this.calculateSearchQuality(
      localResults.length,
      externalResults.length,
      searchMethodUsed,
      0.5
    );

    return {
      local: localResults,
      external: externalResults,
      aiSuggestions,
      total: sortedResults.length,
      searchQuality,
    };
  }

  /**
   * Perform fallback text-based search when fuzzy search fails
   */
  private async performFallbackSearch(
    query: string,
    limit: number
  ): Promise<Food[]> {
    const queryLower = query.toLowerCase().trim();

    return this.allFoods
      .map((food) => {
        const nameLower = food.name.toLowerCase();
        const brandLower = (food.brand || '').toLowerCase();
        const tagsLower = (food.tags || []).map((tag) => tag.toLowerCase());

        // Enhanced relevance scoring
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
        else if (tagsLower.some((tag) => tag.includes(queryLower))) score += 20;
        // No match
        else score = 0;

        return { food, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.food);
  }

  /**
   * Enhanced relevance sorting for search results
   */
  private sortByRelevance(foods: Food[], query: string): Food[] {
    const queryLower = query.toLowerCase();

    return foods.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      // Calculate relevance scores for final sorting
      const getRelevanceScore = (name: string) => {
        let score = 0;

        // Exact match gets highest priority
        if (name === queryLower) score += 1000;
        // Starts with query gets high priority
        else if (name.startsWith(queryLower)) score += 500;
        // Contains query gets medium priority
        else if (name.includes(queryLower)) score += 200;

        // Bonus for shorter names (more specific)
        score += Math.max(0, 50 - name.length);

        return score;
      };

      const aScore = getRelevanceScore(aName);
      const bScore = getRelevanceScore(bName);

      if (aScore !== bScore) {
        return bScore - aScore;
      }

      // Alphabetical order for same relevance
      return aName.localeCompare(bName);
    });
  }

  /**
   * Calculate search quality metrics
   */
  private calculateSearchQuality(
    localCount: number,
    externalCount: number,
    method: string,
    threshold: number
  ) {
    const totalFound = localCount + externalCount;
    const qualityKept = totalFound;

    let quality: 'High' | 'Medium' | 'Low';
    if (totalFound > 10) quality = 'High';
    else if (totalFound > 5) quality = 'Medium';
    else quality = 'Low';

    return {
      quality,
      method,
      threshold,
      totalFound,
      qualityKept,
    };
  }

  /**
   * Search external APIs with intelligent caching
   */
  private async searchExternalWithCache(
    query: string,
    limit: number
  ): Promise<Food[]> {
    // Check cache first
    const cached = await db.foodCache
      .where('query')
      .equals(query.trim().toLowerCase())
      .and((cache) => new Date(cache.expiresAt) > new Date())
      .first();

    if (cached) {
      console.log('Using cached external results for:', query);
      return cached.results.slice(0, limit);
    }

    // Search external APIs
    const results = await searchExternalFoods(query);

    // Filter and limit results
    const filtered = results
      .filter((food) => this.isRelevantFood(food, query))
      .slice(0, limit);

    return filtered;
  }

  /**
   * Check if a food item is relevant to the search query
   */
  private isRelevantFood(food: Food, query: string): boolean {
    const queryLower = query.toLowerCase();
    const foodNameLower = food.name.toLowerCase();

    // Exact match is always relevant
    if (foodNameLower === queryLower) return true;

    // Contains query is relevant
    if (foodNameLower.includes(queryLower)) return true;

    // Tag-based relevance
    if (food.tags?.some((tag) => tag.toLowerCase().includes(queryLower)))
      return true;

    // Category-based relevance for common food types
    const commonFoods = ['rice', 'bread', 'dal', 'curry', 'vegetable', 'fruit'];
    if (
      commonFoods.some(
        (common) =>
          queryLower.includes(common) && foodNameLower.includes(common)
      )
    ) {
      return true;
    }

    return false;
  }

  /**
   * Merge local and external results, removing duplicates
   */
  private mergeAndDeduplicate(local: Food[], external: Food[]): Food[] {
    const merged: Food[] = [];
    const seen = new Set<string>();

    // Add local results first (higher priority)
    for (const food of local) {
      const key = this.getFoodKey(food);
      if (!seen.has(key)) {
        merged.push(food);
        seen.add(key);
      }
    }

    // Add external results, avoiding duplicates
    for (const food of external) {
      const key = this.getFoodKey(food);
      if (!seen.has(key)) {
        merged.push(food);
        seen.add(key);
      }
    }

    return merged;
  }

  /**
   * Generate a unique key for food deduplication
   */
  private getFoodKey(food: Food): string {
    const name = food.name.toLowerCase().trim();
    const brand = (food.brand || '').toLowerCase().trim();
    return `${name}::${brand}`;
  }

  /**
   * Parse AI suggestions into structured format
   */
  private parseAISuggestions(aiResponse: string): string[] {
    // Extract bullet points or numbered items from AI response
    const lines = aiResponse.split('\n');
    const suggestions: string[] = [];

    for (const line of lines) {
      const clean = line
        .replace(/^[-*•\d]+\.?\s*/, '') // Remove bullets/numbers
        .trim();

      if (clean && clean.length > 3 && clean.length < 100) {
        suggestions.push(clean);
      }
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Get popular foods based on search count
   */
  async getPopularFoods(limit: number = 10): Promise<Food[]> {
    return await db.foods
      .orderBy('searchCount')
      .reverse()
      .limit(limit)
      .toArray();
  }

  /**
   * Get recently added foods
   */
  async getRecentFoods(limit: number = 10): Promise<Food[]> {
    return await db.foods
      .orderBy('lastUpdated')
      .reverse()
      .limit(limit)
      .toArray();
  }

  /**
   * Get foods by category
   */
  async getFoodsByCategory(
    category: string,
    limit: number = 20
  ): Promise<Food[]> {
    return await db.foods
      .where('category')
      .equals(category)
      .limit(limit)
      .toArray();
  }

  /**
   * Add a new food item with smart deduplication
   */
  async addFood(food: Omit<Food, 'id'>): Promise<number> {
    const id = await db.addFood({
      ...food,
      source: 'user',
      lastUpdated: new Date().toISOString(),
      searchCount: 1,
    });

    // Refresh the local foods array and Fuse instance
    await this.refreshFoods();

    return id;
  }

  /**
   * Refresh local foods and Fuse instance
   */
  async refreshFoods(): Promise<void> {
    this.allFoods = await db.foods.toArray();
    if (this.fuseInstance) {
      this.fuseInstance = new Fuse(this.allFoods, {
        // Performance-optimized settings
        threshold: 0.4,
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
    }
  }

  /**
   * Debounced search for better performance
   */
  async debouncedSearch(
    query: string,
    callback: (results: Awaited<ReturnType<typeof this.searchFoods>>) => void,
    delay: number = 300
  ): Promise<void> {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.searchDebounceTimer = setTimeout(async () => {
      const results = await this.searchFoods(query);
      callback(results);
    }, delay);
  }

  /**
   * Get cached results for a query
   */
  private getCachedResults(query: string): {
    local: Food[];
    external: Food[];
    aiSuggestions?: string[];
    total: number;
    searchQuality: {
      quality: 'High' | 'Medium' | 'Low';
      method: string;
      threshold: number;
      totalFound: number;
      qualityKept: number;
    };
  } | null {
    const cached = searchCache.get(query);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return {
        local: [],
        external: cached.results,
        aiSuggestions: undefined,
        total: cached.results.length,
        searchQuality: {
          quality: 'Medium',
          method: 'Cached',
          threshold: 0.5,
          totalFound: cached.results.length,
          qualityKept: cached.results.length,
        },
      };
    }
    return null;
  }
}

export const foodSearchService = FoodSearchService.getInstance();
