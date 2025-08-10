import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconPlus,
  IconX,
  IconCheck,
  IconCalculator,
  IconTrash,
  IconBookmark,
} from '@tabler/icons-react';
import { db, type Food, type Recipe } from '../lib/db';
import { upsertRecipe } from '../lib/supabaseSync';

interface RecipeBuilderProps {
  onRecipeCreated: (recipe: Recipe) => void;
  onClose: () => void;
}

interface IngredientInput {
  foodId: number | null;
  food: Food | null;
  grams: string;
  servingLabel: string;
}

interface RecipeFormData {
  name: string;
  description: string;
  category: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  instructions: string;
  tags: string;
}

export default function RecipeBuilder({
  onRecipeCreated,
  onClose,
}: RecipeBuilderProps) {
  const [formData, setFormData] = useState<RecipeFormData>({
    name: '',
    description: '',
    category: '',
    prepTime: '',
    cookTime: '',
    servings: '',
    instructions: '',
    tags: '',
  });

  const [ingredients, setIngredients] = useState<IngredientInput[]>([
    { foodId: null, food: null, grams: '', servingLabel: '' },
  ]);

  const [availableFoods, setAvailableFoods] = useState<Food[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showIngredientSearch, setShowIngredientSearch] = useState<
    number | null
  >(null);

  useEffect(() => {
    loadAvailableFoods();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = availableFoods.filter(
        (food) =>
          food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (food.brand &&
            food.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (food.tags &&
            food.tags.some((tag) =>
              tag.toLowerCase().includes(searchQuery.toLowerCase())
            ))
      );
      setFilteredFoods(filtered.slice(0, 10));
    } else {
      setFilteredFoods([]);
    }
  }, [searchQuery, availableFoods]);

  const loadAvailableFoods = async () => {
    try {
      const foods = await db.foods.toArray();
      setAvailableFoods(foods);
    } catch (error) {
      console.error('Error loading foods:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Recipe name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (
      !formData.servings ||
      isNaN(Number(formData.servings)) ||
      Number(formData.servings) <= 0
    ) {
      newErrors.servings = 'Valid number of servings is required';
    }

    if (!formData.instructions.trim()) {
      newErrors.instructions = 'Instructions are required';
    }

    // Validate ingredients
    let hasValidIngredients = false;
    for (let i = 0; i < ingredients.length; i++) {
      const ingredient = ingredients[i];
      if (
        ingredient.food &&
        ingredient.grams &&
        !isNaN(Number(ingredient.grams))
      ) {
        hasValidIngredients = true;
        break;
      }
    }

    if (!hasValidIngredients) {
      newErrors.ingredients = 'At least one ingredient is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate total nutrition for the recipe
      const totalNutrition = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
      const recipeIngredients: Recipe['ingredients'] = [];

      for (const ingredient of ingredients) {
        if (
          ingredient.food &&
          ingredient.grams &&
          !isNaN(Number(ingredient.grams))
        ) {
          const grams = Number(ingredient.grams);
          const multiplier = grams / 100;

          totalNutrition.kcal += ingredient.food.per100g.kcal * multiplier;
          totalNutrition.protein +=
            ingredient.food.per100g.protein * multiplier;
          totalNutrition.carbs += ingredient.food.per100g.carbs * multiplier;
          totalNutrition.fat += ingredient.food.per100g.fat * multiplier;

          recipeIngredients.push({
            foodId: ingredient.food.id || 0,
            foodName: ingredient.food.name,
            grams,
            servingLabel: ingredient.servingLabel || `${grams}g`,
          });
        }
      }

      const newRecipe: Recipe = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        prepTime: Number(formData.prepTime) || 0,
        cookTime: Number(formData.cookTime) || 0,
        servings: Number(formData.servings),
        instructions: formData.instructions.trim(),
        tags: formData.tags.trim()
          ? formData.tags.split(',').map((tag) => tag.trim())
          : [],
        ingredients: recipeIngredients,
        nutrition: totalNutrition,
        createdAt: new Date().toISOString(),
      };

      const id = await db.recipes.add(newRecipe);
      const createdRecipe = { ...newRecipe, id };
      await upsertRecipe(createdRecipe);
      console.info(
        'Created recipe locally and attempted Supabase upsert',
        createdRecipe
      );

      onRecipeCreated(createdRecipe);
      onClose();
    } catch (error) {
      console.error('Error creating recipe:', error);
      setErrors({ submit: 'Failed to create recipe. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { foodId: null, food: null, grams: '', servingLabel: '' },
    ]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (
    index: number,
    field: keyof IngredientInput,
    value: string | number | Food | null
  ) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);
  };

  const selectFood = (index: number, food: Food) => {
    updateIngredient(index, 'food', food);
    updateIngredient(index, 'foodId', food.id || 0);
    setShowIngredientSearch(null);
    setSearchQuery('');
  };

  const calculateRecipeNutrition = () => {
    const total = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

    for (const ingredient of ingredients) {
      if (
        ingredient.food &&
        ingredient.grams &&
        !isNaN(Number(ingredient.grams))
      ) {
        const grams = Number(ingredient.grams);
        const multiplier = grams / 100;

        total.kcal += ingredient.food.per100g.kcal * multiplier;
        total.protein += ingredient.food.per100g.protein * multiplier;
        total.carbs += ingredient.food.per100g.carbs * multiplier;
        total.fat += ingredient.food.per100g.fat * multiplier;
      }
    }

    return total;
  };

  const nutrition = calculateRecipeNutrition();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-gradient-to-br from-marigold-50/80 via-white/80 to-mint-50/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-marigold to-orange-500 rounded-full flex items-center justify-center">
              <IconBookmark className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Create Recipe
              </h2>
              <p className="text-gray-600">
                Build your own recipes with nutrition calculation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <IconX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipe Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-marigold/20 focus:border-marigold transition-all bg-white text-gray-900 placeholder:text-gray-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="e.g., Homemade Butter Chicken"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-marigold/20 focus:border-marigold transition-all bg-white text-gray-900 ${
                  errors.category ? 'border-red-300' : 'border-gray-200'
                }`}
              >
                <option value="">Select category</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
                <option value="dessert">Dessert</option>
                <option value="beverage">Beverage</option>
              </select>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-marigold/20 focus:border-marigold transition-all bg-white text-gray-900 placeholder:text-gray-500 ${
                errors.description ? 'border-red-300' : 'border-gray-200'
              }`}
              rows={3}
              placeholder="Describe your recipe..."
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Time and Servings */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prep Time (min)
              </label>
              <input
                type="number"
                value={formData.prepTime}
                onChange={(e) =>
                  setFormData({ ...formData, prepTime: e.target.value })
                }
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-marigold/20 focus:border-marigold transition-all bg-white text-gray-900 placeholder:text-gray-500"
                placeholder="15"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cook Time (min)
              </label>
              <input
                type="number"
                value={formData.cookTime}
                onChange={(e) =>
                  setFormData({ ...formData, cookTime: e.target.value })
                }
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-marigold/20 focus:border-marigold transition-all bg-white text-gray-900 placeholder:text-gray-500"
                placeholder="30"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Servings *
              </label>
              <input
                type="number"
                value={formData.servings}
                onChange={(e) =>
                  setFormData({ ...formData, servings: e.target.value })
                }
                className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-marigold/20 focus:border-marigold transition-all bg-white text-gray-900 placeholder:text-gray-500 ${
                  errors.servings ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="4"
                min="1"
              />
              {errors.servings && (
                <p className="text-red-500 text-sm mt-1">{errors.servings}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-marigold/20 focus:border-marigold transition-all bg-white text-gray-900 placeholder:text-gray-500"
                placeholder="indian, spicy, homemade"
              />
            </div>
          </div>

          {/* Ingredients Section */}
          <div className="bg-gradient-to-r from-mint/5 to-teal-500/5 p-4 rounded-xl border border-mint/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <IconPlus className="w-5 h-5 text-mint-500" />
                Ingredients
              </h3>
              <button
                type="button"
                onClick={addIngredient}
                className="px-4 py-2 bg-mint-500 text-white rounded-lg hover:bg-mint-600 transition-colors flex items-center gap-2"
              >
                <IconPlus className="w-4 h-4" />
                Add Ingredient
              </button>
            </div>

            {errors.ingredients && (
              <p className="text-red-500 text-sm mb-3">{errors.ingredients}</p>
            )}

            <div className="space-y-3">
              {ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Food Selection */}
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Food *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search for food..."
                            value={ingredient.food?.name || ''}
                            onClick={() => setShowIngredientSearch(index)}
                            readOnly
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-marigold/20 focus:border-marigold transition-all cursor-pointer bg-white text-gray-900"
                          />
                          <IconPlus className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>

                        {/* Food Search Dropdown */}
                        <AnimatePresence>
                          {showIngredientSearch === index && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                            >
                              <div className="p-3 border-b border-gray-200">
                                <input
                                  type="text"
                                  placeholder="Search foods..."
                                  value={searchQuery}
                                  onChange={(e) =>
                                    setSearchQuery(e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-marigold/20 focus:border-marigold"
                                  autoFocus
                                />
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                {filteredFoods.map((food) => (
                                  <button
                                    key={food.id}
                                    type="button"
                                    onClick={() => selectFood(index, food)}
                                    className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="font-medium text-gray-900">
                                      {food.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {food.brand && `${food.brand} • `}
                                      {food.per100g.kcal} kcal per 100g
                                    </div>
                                  </button>
                                ))}
                                {filteredFoods.length === 0 && searchQuery && (
                                  <div className="p-3 text-gray-500 text-center">
                                    No foods found
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Grams */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Grams *
                        </label>
                        <input
                          type="number"
                          value={ingredient.grams}
                          onChange={(e) =>
                            updateIngredient(index, 'grams', e.target.value)
                          }
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-marigold/20 focus:border-marigold transition-all bg-white text-gray-900 placeholder:text-gray-500"
                          placeholder="100"
                          min="0.1"
                          step="0.1"
                        />
                      </div>

                      {/* Serving Label */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Serving Label
                        </label>
                        <input
                          type="text"
                          value={ingredient.servingLabel}
                          onChange={(e) =>
                            updateIngredient(
                              index,
                              'servingLabel',
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-marigold/20 focus:border-marigold transition-all bg-white text-gray-900 placeholder:text-gray-500"
                          placeholder="1 cup, 1 piece"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    disabled={ingredients.length === 1}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Nutrition Preview */}
          <div className="bg-gradient-to-r from-orange-500/5 to-red-500/5 p-6 rounded-xl border border-orange-500/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <IconCalculator className="w-5 h-5 text-orange-500" />
              Recipe Nutrition (Total)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {nutrition.kcal.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Calories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {nutrition.protein.toFixed(1)}g
                </div>
                <div className="text-sm text-gray-600">Protein</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {nutrition.carbs.toFixed(1)}g
                </div>
                <div className="text-sm text-gray-600">Carbs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {nutrition.fat.toFixed(1)}g
                </div>
                <div className="text-sm text-gray-600">Fat</div>
              </div>
            </div>
            {formData.servings && Number(formData.servings) > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-center text-sm text-gray-600">
                  Per serving:{' '}
                  {(nutrition.kcal / Number(formData.servings)).toFixed(1)} kcal
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions *
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) =>
                setFormData({ ...formData, instructions: e.target.value })
              }
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-marigold/20 focus:border-marigold transition-all bg-white text-gray-900 placeholder:text-gray-500 ${
                errors.instructions ? 'border-red-300' : 'border-gray-200'
              }`}
              rows={6}
              placeholder="1. Heat oil in a pan...&#10;2. Add onions and sauté...&#10;3. Continue with remaining steps..."
            />
            {errors.instructions && (
              <p className="text-red-500 text-sm mt-1">{errors.instructions}</p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-marigold to-orange-500 text-white rounded-xl font-medium hover:from-marigold/90 hover:to-orange-500/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Recipe...
                </>
              ) : (
                <>
                  <IconCheck className="w-5 h-5" />
                  Create Recipe
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
