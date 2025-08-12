import type { Food } from './db';

// External Food API Integration
export interface ExternalFoodResult {
  name: string;
  brand?: string;
  category?: string;
  tags?: string[];
  per100g: { kcal: number; protein: number; carbs: number; fat: number };
  servings?: { label: string; grams: number }[];
  source: 'usda' | 'openfoodfacts';
  externalId?: string;
}

// USDA Food Database API
export class USDAFoodAPI {
  private static readonly BASE_URL = 'https://api.nal.usda.gov/fdc/v1';
  private static readonly API_KEY = import.meta.env.VITE_USDA_API_KEY;

  static async searchFoods(query: string, limit: number = 20): Promise<ExternalFoodResult[]> {
    try {
      const url = `${this.BASE_URL}/foods/search?api_key=${this.API_KEY}&query=${encodeURIComponent(query)}&pageSize=${limit}&dataType=Foundation,SR Legacy`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseUSDAResults(data.foods || []);
    } catch (error) {
      console.error('USDA API search failed:', error);
      return [];
    }
  }

  private static parseUSDAResults(foods: any[]): ExternalFoodResult[] {
    return foods.map(food => {
      const nutrients = food.foodNutrients || [];
      
      // Extract nutrition data
      const kcal = this.findNutrient(nutrients, 'Energy') || 0;
      const protein = this.findNutrient(nutrients, 'Protein') || 0;
      const carbs = this.findNutrient(nutrients, 'Carbohydrate, by difference') || 0;
      const fat = this.findNutrient(nutrients, 'Total lipid (fat)') || 0;

      return {
        name: food.description || 'Unknown Food',
        brand: food.brandOwner || undefined,
        category: this.categorizeFood(food.description || ''),
        tags: this.generateTags(food.description || '', food.foodCategory || ''),
        per100g: { kcal, protein, carbs, fat },
        servings: [
          { label: '100g', grams: 100 },
          { label: '1 cup', grams: 100 },
          { label: '1 serving', grams: 100 }
        ],
        source: 'usda',
        externalId: food.fdcId?.toString()
      };
    });
  }

  private static findNutrient(nutrients: any[], name: string): number {
    const nutrient = nutrients.find(n => n.nutrientName === name);
    return nutrient ? nutrient.value : 0;
  }

  private static categorizeFood(description: string): string {
    const desc = description.toLowerCase();
    if (desc.includes('milk') || desc.includes('cheese') || desc.includes('yogurt')) return 'dairy';
    if (desc.includes('apple') || desc.includes('banana') || desc.includes('orange')) return 'fruits';
    if (desc.includes('chicken') || desc.includes('beef') || desc.includes('fish')) return 'meat';
    if (desc.includes('rice') || desc.includes('bread') || desc.includes('pasta')) return 'grains';
    if (desc.includes('bean') || desc.includes('pea') || desc.includes('lentil')) return 'pulses';
    return 'other';
  }

  private static generateTags(description: string, category: string): string[] {
    const tags = [category.toLowerCase()];
    const desc = description.toLowerCase();
    
    if (desc.includes('organic')) tags.push('organic');
    if (desc.includes('whole')) tags.push('whole grain');
    if (desc.includes('fresh')) tags.push('fresh');
    if (desc.includes('frozen')) tags.push('frozen');
    
    return tags;
  }
}

// Open Food Facts API
export class OpenFoodFactsAPI {
  private static readonly BASE_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

  static async searchFoods(query: string, limit: number = 20): Promise<ExternalFoodResult[]> {
    try {
      const url = `${this.BASE_URL}?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Open Food Facts API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseOpenFoodFactsResults(data.products || []);
    } catch (error) {
      console.error('Open Food Facts API search failed:', error);
      return [];
    }
  }

  private static parseOpenFoodFactsResults(products: any[]): ExternalFoodResult[] {
    return products
      .filter(product => product.nutriments && product.product_name)
      .map(product => {
        const nutriments = product.nutriments;
        
        return {
          name: product.product_name || 'Unknown Food',
          brand: product.brands || undefined,
          category: this.categorizeOpenFoodFacts(product),
          tags: this.generateOpenFoodFactsTags(product),
          per100g: {
            kcal: nutriments.energy_100g || nutriments['energy-kcal_100g'] || 0,
            protein: nutriments.proteins_100g || 0,
            carbs: nutriments.carbohydrates_100g || 0,
            fat: nutriments.fat_100g || 0
          },
          servings: [
            { label: '100g', grams: 100 },
            { label: '1 serving', grams: product.serving_size ? this.parseServingSize(product.serving_size) : 100 }
          ],
          source: 'openfoodfacts',
          externalId: product.code
        };
      });
  }

  private static categorizeOpenFoodFacts(product: any): string {
    const categories = product.categories_tags || [];
    const categoryStr = categories.join(' ').toLowerCase();
    
    if (categoryStr.includes('dairy')) return 'dairy';
    if (categoryStr.includes('fruits')) return 'fruits';
    if (categoryStr.includes('meat')) return 'meat';
    if (categoryStr.includes('grains')) return 'grains';
    if (categoryStr.includes('pulses')) return 'pulses';
    if (categoryStr.includes('vegetables')) return 'vegetables';
    
    return 'other';
  }

  private static generateOpenFoodFactsTags(product: any): string[] {
    const tags = [];
    
    if (product.organic) tags.push('organic');
    if (product.vegan) tags.push('vegan');
    if (product.vegetarian) tags.push('vegetarian');
    if (product.gluten_free) tags.push('gluten-free');
    
    return tags;
  }

  private static parseServingSize(servingSize: string): number {
    // Try to extract grams from serving size string
    const match = servingSize.match(/(\d+)\s*g/);
    return match ? parseInt(match[1]) : 100;
  }
}

// Unified Food Search API
export class UnifiedFoodSearch {
  static async searchAllSources(query: string, limit: number = 20): Promise<ExternalFoodResult[]> {
    try {
      // Search multiple sources in parallel
      const [usdaResults, openFoodResults] = await Promise.allSettled([
        USDAFoodAPI.searchFoods(query, Math.ceil(limit / 2)),
        OpenFoodFactsAPI.searchFoods(query, Math.ceil(limit / 2))
      ]);

      const results: ExternalFoodResult[] = [];
      
      // Add USDA results
      if (usdaResults.status === 'fulfilled') {
        results.push(...usdaResults.value);
      }
      
      // Add Open Food Facts results
      if (openFoodResults.status === 'fulfilled') {
        results.push(...openFoodResults.value);
      }

      // Remove duplicates and limit results
      const uniqueResults = this.removeDuplicates(results);
      return uniqueResults.slice(0, limit);
    } catch (error) {
      console.error('Unified food search failed:', error);
      return [];
    }
  }

  private static removeDuplicates(results: ExternalFoodResult[]): ExternalFoodResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = `${result.name}-${result.brand || 'no-brand'}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Convert external result to internal Food format
  static convertToFood(externalResult: ExternalFoodResult): Omit<Food, 'id'> {
    return {
      name: externalResult.name,
      brand: externalResult.brand,
      category: externalResult.category || 'other',
      tags: externalResult.tags || [],
      per100g: externalResult.per100g,
      servings: externalResult.servings || [{ label: '100g', grams: 100 }],
      verified: false,
      source: 'external'
    };
  }
}

// Food search cache for better performance
export class FoodSearchCache {
  private static cache = new Map<string, { results: ExternalFoodResult[]; timestamp: number }>();
  private static readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  static async getCachedOrSearch(query: string, limit: number = 20): Promise<ExternalFoodResult[]> {
    const cacheKey = `${query}-${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('Using cached food search results for:', query);
      return cached.results;
    }

    // Perform fresh search
    const results = await UnifiedFoodSearch.searchAllSources(query, limit);
    
    // Cache results
    this.cache.set(cacheKey, {
      results,
      timestamp: Date.now()
    });

    return results;
  }

  static clearCache(): void {
    this.cache.clear();
  }
}
