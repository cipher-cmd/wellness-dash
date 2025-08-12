import type { Food } from './db';

// Comprehensive Indian Food Database
export const indianFoodDatabase: Omit<Food, 'id'>[] = [
  // ===== BREAKFAST ITEMS =====
  {
    name: 'Pintola Chocolate Oats',
    brand: 'Pintola',
    category: 'breakfast',
    tags: ['oats', 'chocolate', 'breakfast', 'cereal', 'healthy'],
    per100g: { kcal: 380, protein: 12, carbs: 65, fat: 8 },
    servings: [
      { label: '1 cup', grams: 100 },
      { label: '1/2 cup', grams: 50 },
      { label: '1 bowl', grams: 150 }
    ],
    verified: true,
    source: 'external'
  },
  {
    name: 'Pintola Natural Oats',
    brand: 'Pintola',
    category: 'breakfast',
    tags: ['oats', 'natural', 'breakfast', 'cereal', 'healthy'],
    per100g: { kcal: 350, protein: 13, carbs: 60, fat: 6 },
    servings: [
      { label: '1 cup', grams: 100 },
      { label: '1/2 cup', grams: 50 },
      { label: '1 bowl', grams: 150 }
    ],
    verified: true,
    source: 'external'
  },
  {
    name: 'Poha (Flattened Rice)',
    brand: 'Generic',
    category: 'breakfast',
    tags: ['poha', 'rice', 'breakfast', 'indian', 'traditional'],
    per100g: { kcal: 360, protein: 7, carbs: 78, fat: 1 },
    servings: [
      { label: '1 cup', grams: 100 },
      { label: '1 plate', grams: 200 },
      { label: '1 bowl', grams: 150 }
    ],
    verified: true,
    source: 'external'
  },
  {
    name: 'Upma (Semolina)',
    brand: 'Generic',
    category: 'breakfast',
    tags: ['upma', 'semolina', 'breakfast', 'indian', 'traditional'],
    per100g: { kcal: 340, protein: 10, carbs: 70, fat: 2 },
    servings: [
      { label: '1 cup', grams: 100 },
      { label: '1 plate', grams: 200 },
      { label: '1 bowl', grams: 150 }
    ],
    verified: true,
    source: 'external'
  },
  {
    name: 'Idli',
    brand: 'Generic',
    category: 'breakfast',
    tags: ['idli', 'rice', 'lentil', 'breakfast', 'indian', 'traditional'],
    per100g: { kcal: 120, protein: 4, carbs: 25, fat: 0.5 },
    servings: [
      { label: '1 piece', grams: 50 },
      { label: '2 pieces', grams: 100 },
      { label: '3 pieces', grams: 150 }
    ],
    verified: true,
    source: 'external'
  },
  {
    name: 'Dosa',
    brand: 'Generic',
    category: 'breakfast',
    tags: ['dosa', 'rice', 'lentil', 'breakfast', 'indian', 'traditional'],
    per100g: { kcal: 150, protein: 5, carbs: 30, fat: 1 },
    servings: [
      { label: '1 piece', grams: 80 },
      { label: '2 pieces', grams: 160 },
      { label: '1 plate', grams: 200 }
    ],
    verified: true,
    source: 'external'
  },
  {
    name: 'Paratha',
    brand: 'Generic',
    category: 'breakfast',
    tags: ['paratha', 'wheat', 'bread', 'breakfast', 'indian', 'traditional'],
    per100g: { kcal: 280, protein: 8, carbs: 45, fat: 8 },
    servings: [
      { label: '1 piece', grams: 60 },
      { label: '2 pieces', grams: 120 },
      { label: '1 plate', grams: 180 }
    ],
    verified: true,
    source: 'external'
  },
  {
    name: 'Aloo Paratha',
    brand: 'Generic',
    category: 'breakfast',
    tags: ['paratha', 'potato', 'wheat', 'breakfast', 'indian', 'traditional'],
    per100g: { kcal: 320, protein: 9, carbs: 48, fat: 12 },
    servings: [
      { label: '1 piece', grams: 80 },
      { label: '2 pieces', grams: 160 },
      { label: '1 plate', grams: 240 }
    ],
    verified: true,
    source: 'external'
  },

  // ===== GRAINS & CEREALS =====
  {
    name: 'Basmati Rice',
    brand: 'Generic',
    category: 'grains',
    tags: ['rice', 'basmati', 'grain', 'indian', 'traditional'],
    per100g: { kcal: 350, protein: 7, carbs: 78, fat: 1 },
    servings: [
      { label: '1 cup cooked', grams: 150 },
      { label: '1/2 cup cooked', grams: 75 },
      { label: '1 plate', grams: 200 }
    ],
    verified: true,
    source: 'external'
  },
  {
    name: 'Whole Wheat Flour (Atta)',
    brand: 'Generic',
    category: 'grains',
    tags: ['wheat', 'flour', 'atta', 'grain', 'indian', 'traditional'],
    per100g: { kcal: 340, protein: 13, carbs: 72, fat: 2 },
    servings: [
      { label: '1 cup', grams: 120 },
      { label: '1/2 cup', grams: 60 },
      { label: '1 roti', grams: 40 }
    ],
    verified: true,
    source: 'external'
  },
  {
    name: 'Jowar (Sorghum)',
    brand: 'Generic',
    category: 'grains',
    tags: ['jowar', 'sorghum', 'grain', 'indian', 'traditional', 'gluten-free'],
    per100g: { kcal: 330, protein: 11, carbs: 72, fat: 3 },
    servings: [
      { label: '1 cup', grams: 100 },
      { label: '1/2 cup', grams: 50 },
      { label: '1 roti', grams: 60 }
    ],
    verified: true,
    source: 'external'
  },
  {
    name: 'Bajra (Pearl Millet)',
    brand: 'Generic',
    category: 'grains',
    tags: ['bajra', 'millet', 'grain', 'indian', 'traditional', 'gluten-free'],
    per100g: { kcal: 360, protein: 12, carbs: 67, fat: 5 },
    servings: [
      { label: '1 cup', grams: 100 },
      { label: '1/2 cup', grams: 50 },
      { label: '1 roti', grams: 60 }
    ],
    verified: true,
    source: 'external'
  },

  // ===== PULSES & LEGUMES =====
  {
    name: 'Toor Dal (Pigeon Pea)',
    brand: 'Generic',
    category: 'pulses',
    tags: ['toor', 'dal', 'pigeon pea', 'pulse', 'indian', 'traditional'],
    per100g: { kcal: 340, protein: 22, carbs: 62, fat: 1 },
    servings: [
      { label: '1 cup cooked', grams: 150 },
      { label: '1/2 cup cooked', grams: 75 },
      { label: '1 bowl', grams: 200 }
    ],
    verified: true,
    source: 'external'
  },
  {
    name: 'Moong Dal (Green Gram)',
    brand: 'Generic',
    category: 'pulses',
    tags: ['moong', 'dal', 'green gram', 'pulse', 'indian', 'traditional'],
    per100g: { kcal: 350, protein: 24, carbs: 60, fat: 1 },
    servings: [
      { label: '1 cup cooked', grams: 150 },
      { label: '1/2 cup cooked', grams: 75 },
      { label: '1 bowl', grams: 200 }
    ],
    verified: true,
    source: 'external'
  },
  {
    name: 'Chana Dal (Split Chickpea)',
    brand: 'Generic',
    category: 'pulses',
    tags: ['chana', 'dal', 'chickpea', 'pulse', 'indian', 'traditional'],
    per100g: { kcal: 360, protein: 21, carbs: 61, fat: 6 },
    servings: [
      { label: '1 cup cooked', grams: 150 },
      { label: '1/2 cup cooked', grams: 75 },
      { label: '1 bowl', grams: 200 }
    ],
    verified: true,
    source: 'external'
  },
  {
    name: 'Kidney Beans (Rajma)',
    brand: 'Generic',
    category: 'pulses',
    tags: ['rajma', 'kidney beans', 'pulse', 'indian', 'traditional'],
    per100g: { kcal: 330, protein: 23, carbs: 60, fat: 1 },
    servings: [
      { label: '1 cup cooked', grams: 150 },
      { label: '1/2 cup cooked', grams: 75 },
      { label: '1 bowl', grams: 200 }
    ],
    verified: true,
    source: 'external'
  },

  // ===== VEGETABLES =====
  {
    name: 'Tomato',
    brand: 'Generic',
    category: 'vegetables',
    tags: ['tomato', 'vegetable', 'indian', 'seasonal'],
    per100g: { kcal: 18, protein: 1, carbs: 4, fat: 0.2 },
    servings: [
      { label: '1 medium', grams: 120 },
      { label: '1 cup chopped', grams: 150 },
      { label: '1/2 cup', grams: 75 }
    ],
    verified: true,
    source: 'external'
  },
  {
    name: 'Onion',
    brand: 'Generic',
    category: 'vegetables',
    tags: ['onion', 'vegetable', 'indian', 'seasonal'],
    per100g: { kcal: 40, protein: 1, carbs: 9, fat: 0.1 },
    servings: [
      { label: '1 medium', grams: 110 },
      { label: '1 cup chopped', grams: 160 },
      { label: '1/2 cup', grams: 80 }
    ],
    verified: true,
    source: 'external'
  },
  {
    name: 'Potato',
    brand: 'Generic',
    category: 'vegetables',
    tags: ['potato', 'vegetable', 'indian', 'seasonal'],
    per100g: { kcal: 77, protein: 2, carbs: 17, fat: 0.1 },
    servings: [
      { label: '1 medium', grams: 150 },
      { label: '1 cup diced', grams: 150 },
      { label: '1/2 cup', grams: 75 }
    ],
    verified: true,
    source: 'external'
  },
  {
    name: 'Spinach (Palak)',
    brand: 'Generic',
    category: 'vegetables',
    tags: ['spinach', 'palak', 'vegetable', 'indian', 'seasonal', 'leafy'],
    per100g: { kcal: 23, protein: 3, carbs: 4, fat: 0.4 },
    servings: [
      { label: '1 cup raw', grams: 30 },
      { label: '1 cup cooked', grams: 180 },
      { label: '1 bunch', grams: 100 }
    ],
    verified: true,
    source: 'external'
  },
  {
    name: 'Cauliflower (Gobi)',
    brand: 'Generic',
    category: 'vegetables',
    tags: ['cauliflower', 'gobi', 'vegetable', 'indian', 'seasonal'],
    per100g: { kcal: 25, protein: 2, carbs: 5, fat: 0.3 },
    servings: [
      { label: '1 cup florets', grams: 100 },
      { label: '1 medium head', grams: 800 },
      { label: '1/2 cup', grams: 50 }
    ],
    verified: true,
    source: 'external'
  },

  // ===== DAIRY & ALTERNATIVES =====
  {
    name: 'Milk (Full Fat)',
    brand: 'Generic',
    category: 'dairy',
    tags: ['milk', 'dairy', 'indian', 'traditional'],
    per100g: { kcal: 61, protein: 3, carbs: 5, fat: 3.3 },
    servings: [
      { label: '1 cup', grams: 240 },
      { label: '1 glass', grams: 200 },
      { label: '1/2 cup', grams: 120 }
    ],
    verified: true,
    source: 'external'
  },
  {
    name: 'Curd (Yogurt)',
    brand: 'Generic',
    category: 'dairy',
    tags: ['curd', 'yogurt', 'dairy', 'indian', 'traditional'],
    per100g: { kcal: 59, protein: 4, carbs: 4, fat: 3.3 },
    servings: [
      { label: '1 cup', grams: 245 },
      { label: '1 bowl', grams: 150 },
      { label: '1/2 cup', grams: 120 }
    ],
    verified: true,
    source: 'external'
  },
  {
    name: 'Paneer (Cottage Cheese)',
    brand: 'Generic',
    category: 'dairy',
    tags: ['paneer', 'cottage cheese', 'dairy', 'indian', 'traditional'],
    per100g: { kcal: 265, protein: 18, carbs: 2, fat: 20 },
    servings: [
      { label: '1 cup cubed', grams: 100 },
      { label: '1 piece', grams: 50 },
      { label: '1/2 cup', grams: 50 }
    ],
    verified: true,
    source: 'external'
  },

  // ===== SPICES & CONDIMENTS =====
  {
    name: 'Turmeric Powder',
    brand: 'Generic',
    category: 'spices',
    tags: ['turmeric', 'spice', 'indian', 'traditional', 'anti-inflammatory'],
    per100g: { kcal: 354, protein: 8, carbs: 65, fat: 10 },
    servings: [
      { label: '1 tsp', grams: 2 },
      { label: '1/2 tsp', grams: 1 },
      { label: '1 pinch', grams: 0.5 }
    ],
    verified: true,
    source: 'external'
  },
  {
    name: 'Cumin Seeds',
    brand: 'Generic',
    category: 'spices',
    tags: ['cumin', 'jeera', 'spice', 'indian', 'traditional'],
    per100g: { kcal: 375, protein: 18, carbs: 44, fat: 22 },
    servings: [
      { label: '1 tsp', grams: 2 },
      { label: '1/2 tsp', grams: 1 },
      { label: '1 pinch', grams: 0.5 }
    ],
    verified: true,
    source: 'external'
  },

  // ===== TRADITIONAL INDIAN MEALS =====
  {
    name: 'Dal Khichdi',
    brand: 'Generic',
    category: 'meals',
    tags: ['khichdi', 'dal', 'rice', 'indian', 'traditional', 'comfort food'],
    per100g: { kcal: 180, protein: 8, carbs: 32, fat: 3 },
    servings: [
      { label: '1 bowl', grams: 250 },
      { label: '1 plate', grams: 300 },
      { label: '1 cup', grams: 200 }
    ],
    verified: true,
    source: 'external'
  },
  {
    name: 'Rajma Chawal',
    brand: 'Generic',
    category: 'meals',
    tags: ['rajma', 'rice', 'kidney beans', 'indian', 'traditional'],
    per100g: { kcal: 220, protein: 12, carbs: 40, fat: 2 },
    servings: [
      { label: '1 plate', grams: 300 },
      { label: '1 bowl', grams: 250 },
      { label: '1 cup', grams: 200 }
    ],
    verified: true,
    source: 'external'
  },
  {
    name: 'Chole Bhature',
    brand: 'Generic',
    category: 'meals',
    tags: ['chole', 'bhature', 'chickpea', 'bread', 'indian', 'traditional'],
    per100g: { kcal: 320, protein: 10, carbs: 45, fat: 12 },
    servings: [
      { label: '1 plate', grams: 350 },
      { label: '1 serving', grams: 250 },
      { label: '1 piece', grams: 150 }
    ],
    verified: true,
    source: 'external'
  },

  // ===== SNACKS & BEVERAGES =====
  {
    name: 'Masala Chai',
    brand: 'Generic',
    category: 'beverages',
    tags: ['chai', 'tea', 'masala', 'indian', 'traditional', 'beverage'],
    per100g: { kcal: 45, protein: 1, carbs: 8, fat: 1.5 },
    servings: [
      { label: '1 cup', grams: 200 },
      { label: '1 glass', grams: 250 },
      { label: '1 small cup', grams: 150 }
    ],
    verified: true,
    source: 'external'
  },
  {
    name: 'Lassi (Sweet)',
    brand: 'Generic',
    category: 'beverages',
    tags: ['lassi', 'yogurt', 'sweet', 'indian', 'traditional', 'beverage'],
    per100g: { kcal: 85, protein: 3, carbs: 12, fat: 2.5 },
    servings: [
      { label: '1 glass', grams: 250 },
      { label: '1 cup', grams: 200 },
      { label: '1 small glass', grams: 150 }
    ],
    verified: true,
    source: 'external'
  }
];

// Function to seed the database with Indian foods
export async function seedIndianFoods() {
  const { db } = await import('./db');
  
  try {
    // Add all Indian foods to the database
    for (const food of indianFoodDatabase) {
      await db.addFood(food);
    }
    
    console.log(`✅ Successfully seeded ${indianFoodDatabase.length} Indian foods`);
    return true;
  } catch (error) {
    console.error('❌ Error seeding Indian foods:', error);
    return false;
  }
}

// Function to get food suggestions based on category
export function getFoodSuggestions(category: string, limit: number = 10): Omit<Food, 'id'>[] {
  return indianFoodDatabase
    .filter(food => food.category === category)
    .slice(0, limit);
}

// Function to search Indian foods
export function searchIndianFoods(query: string, limit: number = 20): Omit<Food, 'id'>[] {
  const cleanQuery = query.toLowerCase().trim();
  
  return indianFoodDatabase
    .filter(food => 
      food.name.toLowerCase().includes(cleanQuery) ||
      food.tags?.some(tag => tag.toLowerCase().includes(cleanQuery)) ||
      food.brand?.toLowerCase().includes(cleanQuery)
    )
    .slice(0, limit);
}
