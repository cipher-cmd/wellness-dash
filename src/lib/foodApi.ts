import type { Food } from './db';

const usdaApiKey = import.meta.env.VITE_USDA_FDC_API_KEY as string | undefined;

type OpenFoodFactsProduct = {
  product_name?: string;
  brands?: string;
  nutriments?: Record<string, number | string | undefined>;
  serving_quantity?: number;
  serving_size?: string;
  categories_tags?: string[];
};

type OpenFoodFactsResponse = {
  products: OpenFoodFactsProduct[];
};

const parseNumber = (value: number | string | undefined): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export async function searchExternalFoods(query: string): Promise<Food[]> {
  if (!query.trim()) return [];

  try {
    console.log('Starting external food search for:', query);

    // Parallelize sources and merge
    const [offFoods, usdaFoods] = await Promise.all([
      searchOpenFoodFacts(query),
      usdaApiKey ? searchUSDA(query) : Promise.resolve([] as Food[]),
    ]);

    console.log('OpenFoodFacts results:', offFoods.length);
    console.log('USDA results:', usdaFoods.length);

    const merged: Food[] = [];
    const seen = new Set<string>();
    for (const src of [offFoods, usdaFoods]) {
      for (const f of src) {
        const key = `${f.name.toLowerCase()}::${(f.brand || '').toLowerCase()}`;
        if (!seen.has(key)) {
          merged.push(f);
          seen.add(key);
        }
      }
    }

    console.log('Final merged external results:', merged.length);
    return merged;
  } catch (err) {
    console.error('OpenFoodFacts search failed', err);
    return [];
  }
}

async function searchOpenFoodFacts(query: string): Promise<Food[]> {
  // OpenFoodFacts does not require an API key and is fully open

  // Clean and improve the search query for better results
  const cleanQuery = query.trim().toLowerCase();

  // For Indian foods, try to use more specific search terms
  let searchTerms = cleanQuery;
  if (cleanQuery === 'dal' || cleanQuery === 'dhal') {
    searchTerms = 'lentil dal indian';
  } else if (cleanQuery === 'roti') {
    searchTerms = 'roti bread indian';
  } else if (cleanQuery === 'rice') {
    searchTerms = 'rice grain';
  }

  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
    searchTerms
  )}&search_simple=1&action=process&json=1&page_size=20&sort_by=popularity_key`;

  console.log('Fetching from OpenFoodFacts:', url);

  const resp = await fetch(url, { headers: { Accept: 'application/json' } });
  console.log('OpenFoodFacts response status:', resp.status);

  if (!resp.ok) {
    console.error(
      'OpenFoodFacts response not ok:',
      resp.status,
      resp.statusText
    );
    return [];
  }

  const data: OpenFoodFactsResponse = await resp.json();
  console.log('OpenFoodFacts raw response:', data);
  console.log('Products found:', data?.products?.length || 0);

  if (!data?.products?.length) return [];

  const foods: Food[] = data.products
    .map((p) => {
      const kcalPer100 = parseNumber(
        p.nutriments?.['energy-kcal_100g'] ?? p.nutriments?.['energy-kcal']
      );
      const proteinPer100 = parseNumber(p.nutriments?.['proteins_100g']);
      const carbsPer100 = parseNumber(p.nutriments?.['carbohydrates_100g']);
      const fatPer100 = parseNumber(p.nutriments?.['fat_100g']);

      const name = p.product_name?.trim();
      if (!name) return null;

      // Filter out products that don't match the original query well
      const productNameLower = name.toLowerCase();
      const originalQuery = query.trim().toLowerCase();

      // Skip products that don't contain the original search term
      if (!productNameLower.includes(originalQuery)) {
        return null;
      }

      // Skip products with very generic names that don't match well
      if (
        productNameLower.includes('sauce') &&
        !originalQuery.includes('sauce')
      ) {
        return null;
      }
      if (
        productNameLower.includes('spread') &&
        !originalQuery.includes('spread')
      ) {
        return null;
      }

      const servingGramsGuess = (() => {
        const size = p.serving_size as string | undefined;
        if (!size) return undefined;
        const match = size.match(/(\d+(?:\.\d+)?)\s*g/i);
        if (match) return parseNumber(match[1]);
        return undefined;
      })();

      const servings = servingGramsGuess
        ? [{ label: p.serving_size || 'serving', grams: servingGramsGuess }]
        : [{ label: '100g', grams: 100 }];

      const tags = (p.categories_tags || []).map((t) => t.replace(/^en:/, ''));

      const food: Food = {
        name,
        brand: p.brands?.split(',')[0]?.trim() || undefined,
        per100g: {
          kcal: Math.round(kcalPer100),
          protein: Math.round(proteinPer100 * 10) / 10,
          carbs: Math.round(carbsPer100 * 10) / 10,
          fat: Math.round(fatPer100 * 10) / 10,
        },
        servings,
        tags,
        verified: true,
      };

      console.log('Processed food item:', food);
      return food;
    })
    .filter(Boolean) as Food[];

  console.log('Final processed foods:', foods.length);
  return foods;
}

type UsdaResponse = {
  foods?: Array<{
    description: string;
    brandOwner?: string;
    foodNutrients?: Array<{
      nutrientName: string;
      unitName: string;
      value: number;
    }>; // per serving; often grams-based unknown
    servingSize?: number;
    servingSizeUnit?: string; // g, oz, etc
  }>;
};

async function searchUSDA(query: string): Promise<Food[]> {
  if (!usdaApiKey) return [];
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(
    query
  )}&pageSize=10&api_key=${encodeURIComponent(usdaApiKey)}`;
  const resp = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!resp.ok) return [];
  const data: UsdaResponse = await resp.json();
  const foods = (data.foods || [])
    .map((f): Food | null => {
      const name = f.description?.trim();
      if (!name) return null;
      const nutrients = f.foodNutrients || [];

      const get = (label: string) =>
        nutrients.find((n) => n.nutrientName?.toLowerCase().includes(label))
          ?.value;

      // USDA values can be per serving; we will attempt to normalize to 100g when serving size present and in grams
      let kcal = parseNumber(get('energy'));
      let protein = parseNumber(get('protein'));
      let carbs = parseNumber(get('carbohydrate'));
      let fat = parseNumber(get('fat'));

      let scale = 1;
      if (f.servingSize && f.servingSizeUnit?.toLowerCase() === 'g') {
        scale = 100 / f.servingSize;
      }
      if (scale !== 1) {
        kcal = Math.round(kcal * scale);
        protein = Math.round(protein * scale * 10) / 10;
        carbs = Math.round(carbs * scale * 10) / 10;
        fat = Math.round(fat * scale * 10) / 10;
      }

      const servings =
        f.servingSize && f.servingSizeUnit
          ? [
              {
                label: `${f.servingSize}${f.servingSizeUnit}`,
                grams:
                  f.servingSizeUnit.toLowerCase() === 'g' ? f.servingSize : 100,
              },
            ]
          : [{ label: '100g', grams: 100 }];

      return {
        name,
        brand: f.brandOwner || undefined,
        per100g: { kcal, protein, carbs, fat },
        servings,
        tags: [],
        verified: true,
      };
    })
    .filter(Boolean) as Food[];
  return foods;
}
