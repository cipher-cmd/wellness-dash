import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconPlus,
  IconX,
  IconShoppingCart,
  IconCheck,
  IconTrash,
  IconDownload,
  IconPrinter,
  IconCalculator,
  IconList,
  IconCalendar,
} from '@tabler/icons-react';
import { db, type Recipe, type MealPlan } from '../lib/db';

interface ShoppingItem {
  id: string;
  name: string;
  totalGrams: number;
  category: string;
  estimatedPrice?: number;
  isChecked: boolean;
  sources: string[];
}

interface ShoppingListGeneratorProps {
  onClose: () => void;
}

const FOOD_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Grains & Cereals',
  'Proteins',
  'Dairy & Eggs',
  'Spices & Condiments',
  'Oils & Fats',
  'Beverages',
  'Snacks',
  'Other',
] as const;

export default function ShoppingListGenerator({
  onClose,
}: ShoppingListGeneratorProps) {
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<number[]>([]);
  const [selectedMealPlans, setSelectedMealPlans] = useState<number[]>([]);
  const [customItems, setCustomItems] = useState<
    { name: string; grams: string; category: string }[]
  >([]);
  const [newCustomItem, setNewCustomItem] = useState({
    name: '',
    grams: '',
    category: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allRecipes, allMealPlans] = await Promise.all([
        db.recipes.toArray(),
        db.mealPlans.toArray(),
      ]);

      setRecipes(allRecipes);
      setMealPlans(allMealPlans);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateShoppingList = () => {
    const itemMap = new Map<string, ShoppingItem>();

    // Process selected recipes
    for (const recipeId of selectedRecipes) {
      const recipe = recipes.find((r) => r.id === recipeId);
      if (recipe) {
        for (const ingredient of recipe.ingredients) {
          const key = ingredient.foodName.toLowerCase();
          const existing = itemMap.get(key);

          if (existing) {
            existing.totalGrams += ingredient.grams;
            existing.sources.push(recipe.name);
          } else {
            itemMap.set(key, {
              id: key,
              name: ingredient.foodName,
              totalGrams: ingredient.grams,
              category: 'Other',
              isChecked: false,
              sources: [recipe.name],
            });
          }
        }
      }
    }

    // Process selected meal plans
    for (const mealPlanId of selectedMealPlans) {
      const mealPlan = mealPlans.find((mp) => mp.id === mealPlanId);
      if (mealPlan && mealPlan.recipeId) {
        const recipe = recipes.find((r) => r.id === mealPlan.recipeId);
        if (recipe && mealPlan.servings) {
          const multiplier = mealPlan.servings / recipe.servings;
          for (const ingredient of recipe.ingredients) {
            const key = ingredient.foodName.toLowerCase();
            const existing = itemMap.get(key);

            if (existing) {
              existing.totalGrams += ingredient.grams * multiplier;
              if (!existing.sources.includes(recipe.name)) {
                existing.sources.push(recipe.name);
              }
            } else {
              itemMap.set(key, {
                id: key,
                name: ingredient.foodName,
                totalGrams: ingredient.grams * multiplier,
                category: 'Other',
                isChecked: false,
                sources: [recipe.name],
              });
            }
          }
        }
      }
    }

    // Process custom items
    for (const customItem of customItems) {
      if (customItem.name.trim() && customItem.grams) {
        const key = customItem.name.toLowerCase();
        const existing = itemMap.get(key);

        if (existing) {
          existing.totalGrams += Number(customItem.grams);
          existing.sources.push('Custom');
        } else {
          itemMap.set(key, {
            id: key,
            name: customItem.name.trim(),
            totalGrams: Number(customItem.grams),
            category: customItem.category,
            isChecked: false,
            sources: ['Custom'],
          });
        }
      }
    }

    // Convert to array and categorize items
    const shoppingListArray = Array.from(itemMap.values()).map((item) => {
      // Auto-categorize based on name
      const name = item.name.toLowerCase();
      if (
        name.includes('rice') ||
        name.includes('wheat') ||
        name.includes('bread') ||
        name.includes('pasta')
      ) {
        item.category = 'Grains & Cereals';
      } else if (
        name.includes('chicken') ||
        name.includes('fish') ||
        name.includes('meat') ||
        name.includes('dal') ||
        name.includes('beans')
      ) {
        item.category = 'Proteins';
      } else if (
        name.includes('milk') ||
        name.includes('yogurt') ||
        name.includes('cheese') ||
        name.includes('egg')
      ) {
        item.category = 'Dairy & Eggs';
      } else if (
        name.includes('oil') ||
        name.includes('ghee') ||
        name.includes('butter')
      ) {
        item.category = 'Oils & Fats';
      } else if (
        name.includes('tomato') ||
        name.includes('onion') ||
        name.includes('potato') ||
        name.includes('carrot')
      ) {
        item.category = 'Vegetables';
      } else if (
        name.includes('apple') ||
        name.includes('banana') ||
        name.includes('orange')
      ) {
        item.category = 'Fruits';
      } else if (
        name.includes('salt') ||
        name.includes('pepper') ||
        name.includes('cumin') ||
        name.includes('turmeric')
      ) {
        item.category = 'Spices & Condiments';
      }

      return item;
    });

    // Sort by category and name
    shoppingListArray.sort((a, b) => {
      const categoryOrder =
        FOOD_CATEGORIES.indexOf(
          a.category as (typeof FOOD_CATEGORIES)[number]
        ) -
        FOOD_CATEGORIES.indexOf(b.category as (typeof FOOD_CATEGORIES)[number]);
      if (categoryOrder !== 0) return categoryOrder;
      return a.name.localeCompare(b.name);
    });

    setShoppingList(shoppingListArray);
  };

  const toggleItemCheck = (itemId: string) => {
    setShoppingList((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
      )
    );
  };

  const removeItem = (itemId: string) => {
    setShoppingList((prev) => prev.filter((item) => item.id !== itemId));
  };

  const addCustomItem = () => {
    if (
      newCustomItem.name.trim() &&
      newCustomItem.grams &&
      newCustomItem.category
    ) {
      setCustomItems([...customItems, { ...newCustomItem }]);
      setNewCustomItem({ name: '', grams: '', category: '' });
      setShowCustomItemForm(false);
    }
  };

  const removeCustomItem = (index: number) => {
    setCustomItems(customItems.filter((_, i) => i !== index));
  };

  const exportShoppingList = () => {
    const content = shoppingList
      .map(
        (item) =>
          `${item.isChecked ? '☑' : '☐'} ${item.name} - ${item.totalGrams}g`
      )
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shopping-list.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const printShoppingList = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const content = `
        <html>
          <head>
            <title>Shopping List</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .category { font-weight: bold; margin-top: 20px; color: #059669; }
              .item { margin: 5px 0; }
              .checked { text-decoration: line-through; color: #6b7280; }
            </style>
          </head>
          <body>
            <h1>Shopping List</h1>
            ${FOOD_CATEGORIES.map((category) => {
              const items = shoppingList.filter(
                (item) => item.category === category
              );
              if (items.length === 0) return '';
              return `
                <div class="category">${category}</div>
                ${items
                  .map(
                    (item) => `
                  <div class="item ${item.isChecked ? 'checked' : ''}">
                    ${item.isChecked ? '☑' : '☐'} ${item.name} - ${
                      item.totalGrams
                    }g
                  </div>
                `
                  )
                  .join('')}
              `;
            }).join('')}
          </body>
        </html>
      `;
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getCategoryItems = (category: string) => {
    return shoppingList.filter((item) => item.category === category);
  };

  const getTotalItems = () => shoppingList.length;
  const getCheckedItems = () =>
    shoppingList.filter((item) => item.isChecked).length;
  const getTotalWeight = () =>
    shoppingList.reduce((sum, item) => sum + item.totalGrams, 0);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-marigold-50/80 via-white/80 to-mint-50/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

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
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-marigold to-orange-500 rounded-full flex items-center justify-center">
              <IconShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Shopping List Generator
              </h2>
              <p className="text-gray-600">
                Generate shopping lists from your meal plans and recipes
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

        <div className="p-4 space-y-4">
          {/* Configuration Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recipe Selection */}
            <div className="bg-gradient-to-r from-mint/5 to-teal-500/5 p-4 rounded-xl border border-mint/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <IconList className="w-5 h-5 text-mint-500" />
                Select Recipes
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recipes.length > 0 ? (
                  recipes.map((recipe) => (
                    <label
                      key={recipe.id}
                      className="flex items-center gap-3 p-2 hover:bg-white/50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecipes.includes(recipe.id!)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRecipes([
                              ...selectedRecipes,
                              recipe.id!,
                            ]);
                          } else {
                            setSelectedRecipes(
                              selectedRecipes.filter((id) => id !== recipe.id)
                            );
                          }
                        }}
                        className="rounded border-gray-300 text-mint-500 focus:ring-mint-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {recipe.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {recipe.ingredients.length} ingredients
                        </div>
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No recipes available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Meal Plan Selection */}
            <div className="bg-gradient-to-r from-orange-500/5 to-red-500/5 p-4 rounded-xl border border-orange-500/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <IconCalendar className="w-5 h-5 text-orange-500" />
                Select Meal Plans
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {mealPlans.length > 0 ? (
                  mealPlans.map((mealPlan) => (
                    <label
                      key={mealPlan.id}
                      className="flex items-center gap-3 p-2 hover:bg-white/50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMealPlans.includes(mealPlan.id!)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMealPlans([
                              ...selectedMealPlans,
                              mealPlan.id!,
                            ]);
                          } else {
                            setSelectedMealPlans(
                              selectedMealPlans.filter(
                                (id) => id !== mealPlan.id
                              )
                            );
                          }
                        }}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {mealPlan.recipeId
                            ? recipes.find((r) => r.id === mealPlan.recipeId)
                                ?.name
                            : mealPlan.customName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {mealPlan.date} • {mealPlan.meal}
                        </div>
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No meal plans available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Custom Items */}
          <div className="bg-gradient-to-r from-marigold/5 to-yellow-500/5 p-4 rounded-xl border border-marigold/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <IconPlus className="w-5 h-5 text-marigold-500" />
                Custom Items
              </h3>
              <button
                onClick={() => setShowCustomItemForm(true)}
                className="px-4 py-2 bg-marigold-500 text-white rounded-lg hover:bg-marigold-600 transition-colors flex items-center gap-2"
              >
                <IconPlus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {customItems.length > 0 && (
              <div className="space-y-2">
                {customItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {item.grams}g • {item.category}
                      </div>
                    </div>
                    <button
                      onClick={() => removeCustomItem(index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="text-center">
            <button
              onClick={generateShoppingList}
              disabled={
                selectedRecipes.length === 0 &&
                selectedMealPlans.length === 0 &&
                customItems.length === 0
              }
              className="px-8 py-3 bg-gradient-to-r from-marigold to-orange-500 text-white rounded-xl font-medium hover:from-marigold/90 hover:to-orange-500/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
            >
              <IconCalculator className="w-5 h-5" />
              Generate Shopping List
            </button>
          </div>

          {/* Shopping List */}
          {shoppingList.length > 0 && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {getTotalItems()}
                    </div>
                    <div className="text-sm text-gray-600">Total Items</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {getCheckedItems()}
                    </div>
                    <div className="text-sm text-gray-600">Checked</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {getTotalWeight().toFixed(0)}g
                    </div>
                    <div className="text-sm text-gray-600">Total Weight</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {getTotalItems() > 0
                        ? Math.round(
                            (getCheckedItems() / getTotalItems()) * 100
                          )
                        : 0}
                      %
                    </div>
                    <div className="text-sm text-gray-600">Progress</div>
                  </div>
                </div>
              </div>

              {/* Export Actions */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={exportShoppingList}
                  className="px-6 py-2 bg-mint-500 text-white rounded-lg hover:bg-mint-600 transition-colors flex items-center gap-2"
                >
                  <IconDownload className="w-4 h-4" />
                  Export as Text
                </button>
                <button
                  onClick={printShoppingList}
                  className="px-6 py-2 bg-marigold-500 text-white rounded-lg hover:bg-marigold-600 transition-colors flex items-center gap-2"
                >
                  <IconPrinter className="w-4 h-4" />
                  Print List
                </button>
              </div>

              {/* Categorized List */}
              <div className="space-y-6">
                {FOOD_CATEGORIES.map((category) => {
                  const items = getCategoryItems(category);
                  if (items.length === 0) return null;

                  return (
                    <div
                      key={category}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                    >
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h4 className="font-semibold text-gray-900">
                          {category}
                        </h4>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-4 hover:bg-gray-50"
                          >
                            <button
                              onClick={() => toggleItemCheck(item.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                item.isChecked
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {item.isChecked ? (
                                <IconCheck className="w-4 h-4" />
                              ) : (
                                <IconCheck className="w-4 h-4" />
                              )}
                            </button>
                            <div className="flex-1">
                              <div
                                className={`font-medium ${
                                  item.isChecked
                                    ? 'line-through text-gray-500'
                                    : 'text-gray-900'
                                }`}
                              >
                                {item.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {item.totalGrams}g • {item.sources.join(', ')}
                              </div>
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <IconTrash className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Custom Item Form Modal */}
        <AnimatePresence>
          {showCustomItemForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gradient-to-br from-marigold-50/80 via-white/80 to-mint-50/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Add Custom Item
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Name
                    </label>
                    <input
                      type="text"
                      value={newCustomItem.name}
                      onChange={(e) =>
                        setNewCustomItem({
                          ...newCustomItem,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-marigold/20 focus:border-marigold transition-all"
                      placeholder="e.g., Fresh Tomatoes"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (grams)
                    </label>
                    <input
                      type="number"
                      value={newCustomItem.grams}
                      onChange={(e) =>
                        setNewCustomItem({
                          ...newCustomItem,
                          grams: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-marigold/20 focus:border-marigold transition-all"
                      placeholder="500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newCustomItem.category}
                      onChange={(e) =>
                        setNewCustomItem({
                          ...newCustomItem,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-marigold/20 focus:border-marigold transition-all"
                    >
                      {FOOD_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowCustomItemForm(false)}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addCustomItem}
                    disabled={
                      !newCustomItem.name.trim() ||
                      !newCustomItem.grams ||
                      !newCustomItem.category
                    }
                    className="flex-1 px-4 py-2 bg-marigold-500 text-white rounded-lg hover:bg-marigold-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Item
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
