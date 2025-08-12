import type { Food } from './db';
import { searchIndianFoods, getFoodSuggestions } from './indianFoodDatabase';
import { FoodSearchCache } from './externalFoodAPIs';

// Simple but effective performance-optimized food search
export class FastFoodSearch {
  private static readonly LOCAL_PRIORITY = 0.8; // 80% local results preferred
  private static readonly SEARCH_TIMEOUT = 3000; // 3 second timeout
  private static readonly MAX_LOCAL_RESULTS = 20;
  private static readonly MAX_EXTERNAL_RESULTS = 10;

  // Main search method with smart prioritization
  static async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    const startTime = Date.now();
    const {
      prioritizeLocal = true,
      includeExternal = true,
      maxResults = 25,
    } = options;

    try {
      // Phase 1: Fast local search (Indian foods)
      const localResults = await this.searchLocalFast(
        query,
        Math.min(maxResults, this.MAX_LOCAL_RESULTS)
      );

      // If we have enough local results and user prefers local, return early
      if (
        prioritizeLocal &&
        localResults.length >= maxResults * this.LOCAL_PRIORITY
      ) {
        return {
          foods: localResults.slice(0, maxResults),
          sources: ['local'],
          searchTime: Date.now() - startTime,
          totalFound: localResults.length,
          performance: 'fast-local-only',
        };
      }

      // Phase 2: External search (if enabled and needed)
      let externalResults: Food[] = [];
      if (includeExternal && localResults.length < maxResults) {
        externalResults = await this.searchExternalWithTimeout(
          query,
          maxResults - localResults.length
        );
      }

      // Phase 3: Merge results
      const mergedResults = this.mergeResults(
        localResults,
        externalResults,
        maxResults
      );

      return {
        foods: mergedResults,
        sources: this.getSources(localResults.length, externalResults.length),
        searchTime: Date.now() - startTime,
        totalFound: mergedResults.length,
        performance: 'hybrid',
      };
    } catch (error) {
      console.error('Fast search failed:', error);

      // Fallback to local search only
      const localResults = await this.searchLocalFast(query, maxResults);
      return {
        foods: localResults,
        sources: ['local'],
        searchTime: Date.now() - startTime,
        totalFound: localResults.length,
        performance: 'fallback-local',
        error: 'External search failed',
      };
    }
  }

  // Fast local search using Indian food database
  private static async searchLocalFast(
    query: string,
    limit: number
  ): Promise<Food[]> {
    const cleanQuery = query.toLowerCase().trim();

    if (cleanQuery.length < 2) return [];

    // Use the optimized Indian food search
    const indianResults = searchIndianFoods(cleanQuery, limit);

    // If query is very short, add category suggestions
    if (cleanQuery.length <= 3) {
      const categorySuggestions = this.getCategorySuggestions(
        cleanQuery,
        Math.floor(limit / 2)
      );
      return this.mergeResultsSimple(indianResults, categorySuggestions, limit);
    }

    return indianResults;
  }

  // External search with timeout protection
  private static async searchExternalWithTimeout(
    query: string,
    limit: number
  ): Promise<Food[]> {
    try {
      const timeoutPromise = new Promise<Food[]>((_, reject) => {
        setTimeout(
          () => reject(new Error('Search timeout')),
          this.SEARCH_TIMEOUT
        );
      });

      const searchPromise = FoodSearchCache.getCachedOrSearch(query, limit);

      const results = await Promise.race([searchPromise, timeoutPromise]);

      // Convert external results to internal format
      return results.map((result) => ({
        id: undefined,
        name: result.name,
        brand: result.brand,
        category: result.category || 'other',
        tags: result.tags || [],
        per100g: result.per100g,
        servings: result.servings || [{ label: '100g', grams: 100 }],
        verified: false,
        source: 'external' as const,
      }));
    } catch (error) {
      console.warn('External search failed or timed out:', error);
      return [];
    }
  }

  // Simple result merging
  private static mergeResults(
    localResults: Food[],
    externalResults: Food[],
    maxResults: number
  ): Food[] {
    const merged = [...localResults];
    const seen = new Set(
      localResults.map((f) => `${f.name}-${f.brand || 'no-brand'}`)
    );

    // Add external results that aren't duplicates
    for (const external of externalResults) {
      if (merged.length >= maxResults) break;

      const key = `${external.name}-${external.brand || 'no-brand'}`;
      if (!seen.has(key)) {
        merged.push(external);
        seen.add(key);
      }
    }

    return merged.slice(0, maxResults);
  }

  // Simple merge for local results
  private static mergeResultsSimple(
    results1: Food[],
    results2: Food[],
    limit: number
  ): Food[] {
    const merged = [...results1, ...results2];
    const seen = new Set();
    const unique: Food[] = [];

    for (const food of merged) {
      if (unique.length >= limit) break;

      const key = `${food.name}-${food.brand || 'no-brand'}`;
      if (!seen.has(key)) {
        unique.push(food);
        seen.add(key);
      }
    }

    return unique;
  }

  // Get category-based suggestions
  private static getCategorySuggestions(query: string, limit: number): Food[] {
    const categories = [
      'breakfast',
      'lunch',
      'dinner',
      'snack',
      'grains',
      'pulses',
      'vegetables',
      'dairy',
    ];
    const matchingCategories = categories.filter((cat) => cat.includes(query));

    if (matchingCategories.length === 0) return [];

    const suggestions: Food[] = [];
    for (const category of matchingCategories) {
      const categoryFoods = getFoodSuggestions(
        category,
        Math.ceil(limit / matchingCategories.length)
      );
      suggestions.push(...categoryFoods);
    }

    return suggestions.slice(0, limit);
  }

  // Get search sources
  private static getSources(
    localCount: number,
    externalCount: number
  ): string[] {
    const sources: string[] = [];
    if (localCount > 0) sources.push('local');
    if (externalCount > 0) sources.push('external');
    return sources;
  }

  // Get search suggestions for autocomplete
  static async getSearchSuggestions(
    query: string,
    limit: number = 8
  ): Promise<string[]> {
    if (query.length < 2) return [];

    try {
      // Fast local suggestions
      const localFoods = searchIndianFoods(query, limit);
      const suggestions = localFoods.map((food) => food.name);

      // Add category suggestions
      const categories = [
        'breakfast',
        'lunch',
        'dinner',
        'snack',
        'grains',
        'pulses',
        'vegetables',
        'dairy',
      ];
      const matchingCategories = categories.filter((cat) =>
        cat.includes(query.toLowerCase())
      );

      for (const category of matchingCategories) {
        if (suggestions.length >= limit) break;
        suggestions.push(`${category} foods`);
      }

      return suggestions.slice(0, limit);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  // Clear all caches
  static clearAllCaches(): void {
    FoodSearchCache.clearCache();
  }

  // Get performance summary
  static getPerformanceSummary(): PerformanceSummary {
    return {
      localPriority: this.LOCAL_PRIORITY,
      searchTimeout: this.SEARCH_TIMEOUT,
      maxLocalResults: this.MAX_LOCAL_RESULTS,
      maxExternalResults: this.MAX_EXTERNAL_RESULTS,
      strategy: 'fast-local-first',
    };
  }
}

// Types for the fast search system
export interface SearchOptions {
  prioritizeLocal?: boolean;
  includeExternal?: boolean;
  maxResults?: number;
}

export interface SearchResult {
  foods: Food[];
  sources: string[];
  searchTime: number;
  totalFound: number;
  performance: 'fast-local-only' | 'hybrid' | 'fallback-local';
  error?: string;
}

export interface PerformanceSummary {
  localPriority: number;
  searchTimeout: number;
  maxLocalResults: number;
  maxExternalResults: number;
  strategy: string;
}
