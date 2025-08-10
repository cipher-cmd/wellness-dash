import { supabase, isSupabaseConfigured } from './supabase';
import type { Food, DiaryEntry, Recipe, MealPlan } from './db';

// Define table names in Supabase
const TABLES = {
  foods: 'foods',
  diary: 'diary_entries',
  recipes: 'recipes',
  mealPlans: 'meal_plans',
} as const;

export async function upsertFood(food: Food & { id?: number }) {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from(TABLES.foods).upsert({
    id: food.id,
    name: food.name,
    brand: food.brand ?? null,
    tags: food.tags ?? [],
    per100g: food.per100g,
    servings: food.servings ?? [],
    verified: !!food.verified,
  });
  if (error) console.error('Supabase upsertFood error', error);
}

export async function upsertDiary(entry: DiaryEntry & { id?: number }) {
  if (!isSupabaseConfigured()) return;
  // Postgres folds unquoted identifiers to lower-case.
  // Our README SQL created lower-case column names (customname, servinglabel, foodid...).
  const payload = {
    id: entry.id,
    date: entry.date,
    meal: entry.meal,
    foodid: entry.foodId ?? null,
    customname: entry.customName ?? null,
    servinglabel: entry.servingLabel ?? null,
    grams: entry.grams ?? null,
    quantity: entry.quantity ?? null,
    overrides: entry.overrides ?? null,
    price: entry.price ?? null,
  };
  const { error } = await supabase.from(TABLES.diary).upsert(payload);
  if (error) console.error('Supabase upsertDiary error', error);
}

export async function upsertRecipe(recipe: Recipe & { id?: number }) {
  if (!isSupabaseConfigured()) return;
  const payload = {
    id: recipe.id,
    name: recipe.name,
    description: recipe.description,
    category: recipe.category,
    preptime: recipe.prepTime,
    cooktime: recipe.cookTime,
    servings: recipe.servings,
    instructions: recipe.instructions,
    tags: recipe.tags,
    ingredients: recipe.ingredients,
    nutrition: recipe.nutrition,
    createdat: recipe.createdAt,
  };
  const { error } = await supabase.from(TABLES.recipes).upsert(payload);
  if (error) console.error('Supabase upsertRecipe error', error);
}

export async function upsertMealPlan(plan: MealPlan & { id?: number }) {
  if (!isSupabaseConfigured()) return;
  const payload = {
    id: plan.id,
    date: plan.date,
    meal: plan.meal,
    recipeid: plan.recipeId ?? null,
    customname: plan.customName ?? null,
    servings: plan.servings ?? null,
    notes: plan.notes ?? null,
  };
  const { error } = await supabase.from(TABLES.mealPlans).upsert(payload);
  if (error) console.error('Supabase upsertMealPlan error', error);
}

export async function deleteDiaryById(id: number) {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from(TABLES.diary).delete().eq('id', id);
  if (error) console.error('Supabase deleteDiary error', error);
}
