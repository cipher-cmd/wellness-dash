import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconPlus,
  IconCalculator,
  IconBookmark,
  IconShare,
} from '@tabler/icons-react';

import { generateMealIdeas } from '../../lib/ai';

interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  image?: string;
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  createdAt: Date;
  isFavorite: boolean;
}

interface RecipeIngredient {
  foodId: string;
  foodName: string;
  amount: number;
  unit: string;
  nutritionalContribution: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export default function EnhancedRecipeBuilder() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const difficultyColors = {
    Easy: 'bg-green-100 text-green-800 border-green-200',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Hard: 'bg-red-100 text-red-800 border-red-200',
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      // For now, we'll use localStorage. In a real app, this would be in the database
      const savedRecipes = localStorage.getItem('wellnessdash_recipes');
      if (savedRecipes) {
        setRecipes(JSON.parse(savedRecipes));
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  const saveRecipes = (newRecipes: Recipe[]) => {
    localStorage.setItem('wellnessdash_recipes', JSON.stringify(newRecipes));
    setRecipes(newRecipes);
  };

  const createNewRecipe = () => {
    const newRecipe: Recipe = {
      id: Date.now().toString(),
      name: '',
      description: '',
      ingredients: [],
      instructions: [''],
      prepTime: 15,
      cookTime: 30,
      servings: 4,
      difficulty: 'Medium',
      tags: [],
      nutritionalInfo: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      createdAt: new Date(),
      isFavorite: false,
    };
    setSelectedRecipe(newRecipe);
    setIsCreating(true);
  };

  const saveRecipe = async (recipe: Recipe) => {
    try {
      // Calculate nutritional info from ingredients
      const nutritionalInfo = recipe.ingredients.reduce(
        (acc, ingredient) => ({
          calories: acc.calories + ingredient.nutritionalContribution.calories,
          protein: acc.protein + ingredient.nutritionalContribution.protein,
          carbs: acc.carbs + ingredient.nutritionalContribution.carbs,
          fat: acc.fat + ingredient.nutritionalContribution.fat,
          fiber: 0, // Fiber not available in ingredient data
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
      );

      const updatedRecipe = { ...recipe, nutritionalInfo };
      const existingIndex = recipes.findIndex((r) => r.id === recipe.id);

      let newRecipes: Recipe[];
      if (existingIndex >= 0) {
        newRecipes = [...recipes];
        newRecipes[existingIndex] = updatedRecipe;
      } else {
        newRecipes = [...recipes, updatedRecipe];
      }

      saveRecipes(newRecipes);
      setIsCreating(false);
      setSelectedRecipe(null);
    } catch (error) {
      console.error('Error saving recipe:', error);
    }
  };

  const toggleFavorite = (recipeId: string) => {
    const newRecipes = recipes.map((r) =>
      r.id === recipeId ? { ...r, isFavorite: !r.isFavorite } : r
    );
    saveRecipes(newRecipes);
  };

  const generateAIRecipe = async () => {
    if (!searchTerm.trim()) return;

    setIsGeneratingAI(true);
    try {
      const prompt = `Create a healthy recipe for: ${searchTerm}. Include ingredients, instructions, and nutritional information.`;
      const aiResponse = await generateMealIdeas(prompt);

      // Parse AI response and create recipe structure
      const newRecipe: Recipe = {
        id: Date.now().toString(),
        name: `AI Generated: ${searchTerm}`,
        description: aiResponse || 'AI-generated recipe based on your search.',
        ingredients: [],
        instructions: [aiResponse || ''],
        prepTime: 15,
        cookTime: 30,
        servings: 4,
        difficulty: 'Medium',
        tags: [searchTerm.toLowerCase()],
        nutritionalInfo: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
        },
        createdAt: new Date(),
        isFavorite: false,
      };

      setSelectedRecipe(newRecipe);
      setIsCreating(true);
    } catch (error) {
      console.error('Error generating AI recipe:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch =
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => recipe.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const allTags = Array.from(new Set(recipes.flatMap((r) => r.tags)));

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Recipe Builder
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create, manage, and discover delicious recipes that align with your
            nutrition goals
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search recipes or ingredients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-marigold-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={generateAIRecipe}
              disabled={isGeneratingAI || !searchTerm.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGeneratingAI ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <IconCalculator className="w-5 h-5" />
                  AI Recipe
                </>
              )}
            </button>
            <button
              onClick={createNewRecipe}
              className="px-6 py-3 bg-gradient-to-r from-marigold-500 to-orange-500 text-white rounded-xl font-semibold hover:from-marigold-600 hover:to-orange-600 transition-all flex items-center gap-2"
            >
              <IconPlus className="w-5 h-5" />
              New Recipe
            </button>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() =>
                      setSelectedTags((prev) =>
                        prev.includes(tag)
                          ? prev.filter((t) => t !== tag)
                          : [...prev, tag]
                      )
                    }
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-marigold-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recipe Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <motion.div
              key={recipe.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => setSelectedRecipe(recipe)}
            >
              {/* Recipe Image Placeholder */}
              <div className="h-48 bg-gradient-to-br from-marigold-100 to-orange-100 rounded-t-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-marigold-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <IconBookmark className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm text-marigold-700 font-medium">
                    Recipe Image
                  </p>
                </div>
              </div>

              {/* Recipe Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-marigold-600 transition-colors">
                    {recipe.name}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(recipe.id);
                    }}
                    className={`p-2 rounded-lg transition-all ${
                      recipe.isFavorite
                        ? 'text-red-500 hover:bg-red-50'
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <IconBookmark
                      className={`w-5 h-5 ${
                        recipe.isFavorite ? 'fill-current' : ''
                      }`}
                    />
                  </button>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {recipe.description}
                </p>

                {/* Recipe Meta */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <IconCalculator className="w-4 h-4" />
                    {recipe.prepTime + recipe.cookTime} min
                  </span>
                  <span className="flex items-center gap-1">
                    <IconShare className="w-4 h-4" />
                    {recipe.servings} servings
                  </span>
                </div>

                {/* Difficulty Badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      difficultyColors[recipe.difficulty]
                    }`}
                  >
                    {recipe.difficulty}
                  </span>

                  {/* Nutritional Preview */}
                  <div className="text-right">
                    <div className="text-lg font-bold text-marigold-600">
                      {recipe.nutritionalInfo.calories} kcal
                    </div>
                    <div className="text-xs text-gray-500">
                      P: {recipe.nutritionalInfo.protein}g | C:{' '}
                      {recipe.nutritionalInfo.carbs}g | F:{' '}
                      {recipe.nutritionalInfo.fat}g
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredRecipes.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconBookmark className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No recipes found
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedTags.length > 0
                ? 'Try adjusting your search or filters'
                : 'Create your first recipe to get started!'}
            </p>
            {!searchTerm && selectedTags.length === 0 && (
              <button
                onClick={createNewRecipe}
                className="px-6 py-3 bg-gradient-to-r from-marigold-500 to-orange-500 text-white rounded-xl font-semibold hover:from-marigold-600 hover:to-orange-600 transition-all"
              >
                Create Recipe
              </button>
            )}
          </div>
        )}
      </div>

      {/* Recipe Modal */}
      <AnimatePresence>
        {(isCreating || selectedRecipe) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setIsCreating(false);
              setSelectedRecipe(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Recipe Form Content would go here */}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {isCreating ? 'Create New Recipe' : 'Edit Recipe'}
                </h2>
                <p className="text-gray-600 mb-6">
                  Recipe form implementation would go here with full CRUD
                  functionality.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => selectedRecipe && saveRecipe(selectedRecipe)}
                    className="px-6 py-2 bg-marigold-500 text-white rounded-lg hover:bg-marigold-600 transition-colors"
                  >
                    Save Recipe
                  </button>
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedRecipe(null);
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
