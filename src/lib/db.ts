import Dexie, { type Table } from 'dexie';

export type Food = {
  id?: number;
  name: string;
  brand?: string;
  category?: string;
  tags?: string[];
  per100g: { kcal: number; protein: number; carbs: number; fat: number };
  servings?: { label: string; grams: number }[];
  verified?: boolean;
  source?: 'user' | 'external' | 'ai';
  lastUpdated?: string;
  searchCount?: number; // For popularity tracking
};

export type DiaryEntry = {
  id?: number;
  date: string; // YYYY-MM-DD
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodId?: number;
  customName?: string;
  servingLabel?: string;
  grams?: number;
  quantity?: number; // multiplies serving grams
  overrides?: { kcal?: number; protein?: number; carbs?: number; fat?: number };
  price?: number | null; // optional per-entry price in local currency
};

export type Goal = {
  id?: number;
  effectiveFrom: string; // YYYY-MM-DD
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type Recipe = {
  id?: number;
  name: string;
  description: string;
  category: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  instructions: string;
  tags: string[];
  ingredients: {
    foodId: number;
    foodName: string;
    grams: number;
    servingLabel: string;
  }[];
  nutrition: { kcal: number; protein: number; carbs: number; fat: number };
  createdAt: string;
};

export type MealPlan = {
  id?: number;
  date: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipeId?: number;
  customName?: string;
  servings?: number;
  notes?: string;
};

export type FoodCache = {
  id?: number;
  query: string;
  results: Food[];
  timestamp: string;
  expiresAt: string;
};

export class WellnessDB extends Dexie {
  foods!: Table<Food, number>;
  diary!: Table<DiaryEntry, number>;
  goals!: Table<Goal, number>;
  recipes!: Table<Recipe, number>;
  mealPlans!: Table<MealPlan, number>;
  foodCache!: Table<FoodCache, number>;

  constructor() {
    super('wellnessdash');
    this.version(3)
      .stores({
        foods: '++id,name,brand,tags,category,source,lastUpdated,searchCount',
        diary: '++id,date,meal,foodId,price',
        goals: '++id,effectiveFrom',
        recipes: '++id,name,category,tags,createdAt',
        mealPlans: '++id,date,meal,recipeId',
        foodCache: '++id,query,timestamp,expiresAt',
      })
      .upgrade((tx) => {
        return tx
          .table('foods')
          .toCollection()
          .modify((obj) => {
            if (obj.source === undefined) obj.source = 'user';
            if (obj.lastUpdated === undefined)
              obj.lastUpdated = new Date().toISOString();
            if (obj.searchCount === undefined) obj.searchCount = 0;
          });
      });
  }

  // Optimized search method with caching
  async searchFoods(query: string, limit: number = 20): Promise<Food[]> {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return [];

    // First check cache
    const cached = await this.foodCache
      .where('query')
      .equals(cleanQuery)
      .and((cache) => new Date(cache.expiresAt) > new Date())
      .first();

    if (cached) {
      console.log('Using cached food search results for:', cleanQuery);
      return cached.results.slice(0, limit);
    }

    // Search local database with optimized queries
    const results: Food[] = [];

    // Exact name match (highest priority)
    const exactMatches = await this.foods
      .where('name')
      .equals(cleanQuery)
      .toArray();
    results.push(...exactMatches);

    // Partial name matches
    if (results.length < limit) {
      const partialMatches = await this.foods
        .where('name')
        .startsWith(cleanQuery)
        .limit(limit - results.length)
        .toArray();
      results.push(...partialMatches);
    }

    // Tag-based search
    if (results.length < limit) {
      const tagMatches = await this.foods
        .where('tags')
        .anyOf(cleanQuery.split(' '))
        .limit(limit - results.length)
        .toArray();
      results.push(...tagMatches);
    }

    // Fuzzy search for remaining slots
    if (results.length < limit) {
      const remaining = limit - results.length;
      const allFoods = await this.foods.toArray();
      const fuzzyMatches = allFoods
        .filter(
          (food) =>
            !results.some((r) => r.id === food.id) &&
            (food.name.toLowerCase().includes(cleanQuery) ||
              food.tags?.some((tag) => tag.toLowerCase().includes(cleanQuery)))
        )
        .sort((a, b) => (b.searchCount || 0) - (a.searchCount || 0))
        .slice(0, remaining);
      results.push(...fuzzyMatches);
    }

    // Update search count for found items
    for (const food of results) {
      if (food.id) {
        await this.foods.update(food.id, {
          searchCount: (food.searchCount || 0) + 1,
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    return results;
  }

  // Add food with smart deduplication
  async addFood(food: Omit<Food, 'id'>): Promise<number> {
    // Check for existing similar food
    const existing = await this.foods
      .where('name')
      .equals(food.name)
      .and((f) => f.brand === food.brand)
      .first();

    if (existing) {
      // Update existing food with new data
      await this.foods.update(existing.id!, {
        ...food,
        lastUpdated: new Date().toISOString(),
        searchCount: (existing.searchCount || 0) + 1,
      });
      return existing.id!;
    }

    // Add new food
    return await this.foods.add({
      ...food,
      lastUpdated: new Date().toISOString(),
      searchCount: 1,
    });
  }

  // Cache external search results
  async cacheFoodSearch(
    query: string,
    results: Food[],
    ttlMinutes: number = 60
  ): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

    await this.foodCache.put({
      query: query.trim().toLowerCase(),
      results,
      timestamp: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    // Clean up expired cache entries
    await this.foodCache.where('expiresAt').below(now.toISOString()).delete();
  }

  // Get popular foods based on search count
  async getPopularFoods(limit: number = 10): Promise<Food[]> {
    try {
      return await this.foods
        .orderBy('searchCount')
        .reverse()
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error('Failed to get popular foods:', error);
      return [];
    }
  }

  // Get foods by category
  async getFoodsByCategory(
    category: string,
    limit: number = 20
  ): Promise<Food[]> {
    try {
      return await this.foods
        .where('category')
        .equals(category)
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error('Failed to get foods by category:', error);
      return [];
    }
  }

  // Batch add foods for better performance
  async addFoods(foods: Omit<Food, 'id'>[]): Promise<number[]> {
    try {
      const ids = await this.foods.bulkAdd(foods);
      console.log(`✅ Successfully added ${foods.length} foods`);
      return Array.isArray(ids) ? ids : [ids];
    } catch (error) {
      console.error('❌ Error adding foods:', error);
      throw error;
    }
  }
}

// Export database instance
export const db = new WellnessDB();
