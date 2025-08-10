import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconPlus,
  IconTrash,
  IconShoppingCart,
  IconCheck,
  IconCategory,
  IconBrain,
  IconDownload,
} from '@tabler/icons-react';
import { db, type Food } from '../../lib/db';
import { generateMealIdeas } from '../../lib/ai';

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  isChecked: boolean;
  priority: 'High' | 'Medium' | 'Low';
  notes: string;
  source: 'manual' | 'meal-plan' | 'ai-suggested';
}

interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  totalEstimatedCost: number;
  createdAt: Date;
  isActive: boolean;
}

const FOOD_CATEGORIES = [
  'Fruits & Vegetables',
  'Dairy & Eggs',
  'Meat & Fish',
  'Grains & Bread',
  'Pantry Staples',
  'Snacks & Treats',
  'Beverages',
  'Frozen Foods',
  'Condiments & Sauces',
  'Baking Supplies',
];

const CATEGORY_COLORS = {
  'Fruits & Vegetables': 'bg-green-100 text-green-800 border-green-200',
  'Dairy & Eggs': 'bg-blue-100 text-blue-800 border-blue-200',
  'Meat & Fish': 'bg-red-100 text-red-800 border-red-200',
  'Grains & Bread': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Pantry Staples': 'bg-purple-100 text-purple-800 border-purple-200',
  'Snacks & Treats': 'bg-pink-100 text-pink-800 border-pink-200',
  Beverages: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Frozen Foods': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Condiments & Sauces': 'bg-orange-100 text-orange-800 border-orange-200',
  'Baking Supplies': 'bg-amber-100 text-amber-800 border-amber-200',
};

const PRIORITY_COLORS = {
  High: 'bg-red-100 text-red-800 border-red-200',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Low: 'bg-green-100 text-green-800 border-green-200',
};

export default function EnhancedShoppingListGenerator({
  onClose,
}: {
  onClose: () => void;
}) {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [activeList, setActiveList] = useState<ShoppingList | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [availableFoods, setAvailableFoods] = useState<Food[]>([]);

  useEffect(() => {
    loadShoppingLists();
    loadAvailableFoods();
  }, []);

  const loadShoppingLists = async () => {
    try {
      const savedLists = localStorage.getItem('wellnessdash_shoppinglists');
      if (savedLists) {
        const lists = JSON.parse(savedLists);
        setShoppingLists(lists);
        const active = lists.find((list: ShoppingList) => list.isActive);
        if (active) setActiveList(active);
      }
    } catch (error) {
      console.error('Error loading shopping lists:', error);
    }
  };

  const loadAvailableFoods = async () => {
    try {
      const foods = await db.foods.toArray();
      setAvailableFoods(foods);
    } catch (error) {
      console.error('Error loading foods:', error);
    }
  };

  const saveShoppingLists = (newLists: ShoppingList[]) => {
    localStorage.setItem(
      'wellnessdash_shoppinglists',
      JSON.stringify(newLists)
    );
    setShoppingLists(newLists);
  };

  const createNewList = () => {
    const newList: ShoppingList = {
      id: Date.now().toString(),
      name: `Shopping List ${shoppingLists.length + 1}`,
      items: [],
      totalEstimatedCost: 0,
      createdAt: new Date(),
      isActive: true,
    };

    // Deactivate other lists
    const updatedLists = shoppingLists.map((list) => ({
      ...list,
      isActive: false,
    }));
    updatedLists.push(newList);

    saveShoppingLists(updatedLists);
    setActiveList(newList);
    setIsCreating(false);
  };

  const addItemToList = (listId: string, item: Omit<ShoppingItem, 'id'>) => {
    const newItem: ShoppingItem = {
      ...item,
      id: Date.now().toString(),
    };

    const updatedLists = shoppingLists.map((list) => {
      if (list.id === listId) {
        const newItems = [...list.items, newItem];
        const totalCost = newItems.reduce(
          (sum, item) => sum + item.estimatedPrice,
          0
        );
        return { ...list, items: newItems, totalEstimatedCost: totalCost };
      }
      return list;
    });

    saveShoppingLists(updatedLists);
    if (activeList?.id === listId) {
      setActiveList(updatedLists.find((list) => list.id === listId) || null);
    }
  };

  const removeItemFromList = (listId: string, itemId: string) => {
    const updatedLists = shoppingLists.map((list) => {
      if (list.id === listId) {
        const newItems = list.items.filter((item) => item.id !== itemId);
        const totalCost = newItems.reduce(
          (sum, item) => sum + item.estimatedPrice,
          0
        );
        return { ...list, items: newItems, totalEstimatedCost: totalCost };
      }
      return list;
    });

    saveShoppingLists(updatedLists);
    if (activeList?.id === listId) {
      setActiveList(updatedLists.find((list) => list.id === listId) || null);
    }
  };

  const toggleItemChecked = (listId: string, itemId: string) => {
    const updatedLists = shoppingLists.map((list) => {
      if (list.id === listId) {
        const newItems = list.items.map((item) =>
          item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
        );
        return { ...list, items: newItems };
      }
      return list;
    });

    saveShoppingLists(updatedLists);
    if (activeList?.id === listId) {
      setActiveList(updatedLists.find((list) => list.id === listId) || null);
    }
  };

  const generateFromMealPlan = async () => {
    if (!activeList) return;

    setIsGeneratingAI(true);
    try {
      // Get meal plan data from localStorage
      const mealPlans = localStorage.getItem('wellnessdash_mealplans');
      if (mealPlans) {
        const plans = JSON.parse(mealPlans);
        const allIngredients = new Map<
          string,
          { quantity: number; unit: string }
        >();

        // Aggregate ingredients from meal plans
        plans.forEach((plan: any) => {
          Object.values(plan.meals)
            .flat()
            .forEach((mealItem: any) => {
              const food = availableFoods.find((f) => f.id === mealItem.foodId);
              if (food) {
                const key = food.name.toLowerCase();
                const existing = allIngredients.get(key);
                if (existing) {
                  existing.quantity += mealItem.grams;
                } else {
                  allIngredients.set(key, {
                    quantity: mealItem.grams,
                    unit: 'g',
                  });
                }
              }
            });
        });

        // Add ingredients to shopping list
        allIngredients.forEach((details, name) => {
          const food = availableFoods.find(
            (f) => f.name.toLowerCase() === name
          );
          if (food) {
            addItemToList(activeList.id, {
              name: food.name,
              category: determineCategory(food),
              quantity: Math.ceil(details.quantity / 100), // Convert to reasonable units
              unit: 'units',
              estimatedPrice: Math.random() * 10 + 2, // Random price for demo
              isChecked: false,
              priority: 'Medium',
              notes: `From meal plan`,
              source: 'meal-plan',
            });
          }
        });
      }
    } catch (error) {
      console.error('Error generating from meal plan:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const generateAISuggestions = async () => {
    if (!activeList || !searchTerm.trim()) return;

    setIsGeneratingAI(true);
    try {
      const prompt = `Suggest 5 essential grocery items for a healthy diet that would complement: ${searchTerm}. Include category, quantity, and priority level.`;
      const aiResponse = await generateMealIdeas(prompt);

      // Parse AI response and add suggestions
      console.log('AI suggestions:', aiResponse);

      // For demo purposes, add some AI-suggested items
      const suggestions = [
        {
          name: 'Fresh Spinach',
          category: 'Fruits & Vegetables',
          quantity: 1,
          unit: 'bunch',
          priority: 'High' as const,
        },
        {
          name: 'Greek Yogurt',
          category: 'Dairy & Eggs',
          quantity: 2,
          unit: 'containers',
          priority: 'Medium' as const,
        },
        {
          name: 'Quinoa',
          category: 'Grains & Bread',
          quantity: 1,
          unit: 'bag',
          priority: 'Medium' as const,
        },
        {
          name: 'Almonds',
          category: 'Snacks & Treats',
          quantity: 1,
          unit: 'bag',
          priority: 'Low' as const,
        },
        {
          name: 'Olive Oil',
          category: 'Pantry Staples',
          quantity: 1,
          unit: 'bottle',
          priority: 'High' as const,
        },
      ];

      suggestions.forEach((suggestion) => {
        addItemToList(activeList.id, {
          ...suggestion,
          estimatedPrice: Math.random() * 15 + 5,
          isChecked: false,
          notes: 'AI suggested',
          source: 'ai-suggested',
        });
      });
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const determineCategory = (food: Food): string => {
    const name = food.name.toLowerCase();
    const tags = food.tags?.map((tag) => tag.toLowerCase()) || [];

    if (
      name.includes('apple') ||
      name.includes('banana') ||
      name.includes('vegetable') ||
      tags.some((tag) => tag.includes('fruit') || tag.includes('vegetable'))
    ) {
      return 'Fruits & Vegetables';
    }
    if (
      name.includes('milk') ||
      name.includes('yogurt') ||
      name.includes('cheese') ||
      name.includes('egg')
    ) {
      return 'Dairy & Eggs';
    }
    if (
      name.includes('chicken') ||
      name.includes('fish') ||
      name.includes('beef') ||
      name.includes('pork')
    ) {
      return 'Meat & Fish';
    }
    if (
      name.includes('rice') ||
      name.includes('bread') ||
      name.includes('pasta') ||
      name.includes('wheat')
    ) {
      return 'Grains & Bread';
    }
    if (
      name.includes('oil') ||
      name.includes('sauce') ||
      name.includes('spice')
    ) {
      return 'Pantry Staples';
    }

    return 'Pantry Staples';
  };

  const exportList = (list: ShoppingList) => {
    const content = `
Shopping List: ${list.name}
Generated: ${list.createdAt.toLocaleDateString()}

${list.items
  .map(
    (item) =>
      `${item.isChecked ? '☑' : '☐'} ${item.name} - ${item.quantity} ${
        item.unit
      } (${item.category})`
  )
  .join('\n')}

Total Estimated Cost: $${list.totalEstimatedCost.toFixed(2)}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${list.name.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredItems =
    activeList?.items.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        !selectedCategory || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }) || [];

  const groupedItems = filteredItems.reduce((groups, item) => {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category].push(item);
    return groups;
  }, {} as Record<string, ShoppingItem[]>);

  return (
    <div className="bg-slate-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-0 mb-6 sm:mb-8">
          <div className="text-center lg:text-left flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Shopping List Generator
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto lg:mx-0">
              Create smart shopping lists from your meal plans and get
              AI-powered suggestions
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors text-sm sm:text-base"
          >
            Close
          </button>
        </div>

        {/* List Management */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full lg:w-auto">
              <select
                value={activeList?.id || ''}
                onChange={(e) => {
                  const list = shoppingLists.find(
                    (l) => l.id === e.target.value
                  );
                  setActiveList(list || null);
                }}
                className="px-3 sm:px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-marigold-500 focus:border-transparent text-sm sm:text-base w-full sm:w-auto"
              >
                <option value="">Select a list</option>
                {shoppingLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name} ({list.items.length} items)
                  </option>
                ))}
              </select>

              <button
                onClick={() => setIsCreating(true)}
                className="px-4 sm:px-6 py-2 bg-gradient-to-r from-marigold-500 to-orange-500 text-white rounded-lg font-semibold hover:from-marigold-600 hover:to-orange-600 transition-all flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
              >
                <IconPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                New List
              </button>
            </div>

            {activeList && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => generateFromMealPlan()}
                  disabled={isGeneratingAI}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <IconShoppingCart className="w-4 h-4" />
                  From Meal Plan
                </button>

                <button
                  onClick={() => exportList(activeList)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all flex items-center gap-2"
                >
                  <IconDownload className="w-4 h-4" />
                  Export
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        {activeList && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-6 sm:mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-marigold-500 focus:border-transparent"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-marigold-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {FOOD_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <button
                onClick={generateAISuggestions}
                disabled={isGeneratingAI || !searchTerm.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isGeneratingAI ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    AI...
                  </>
                ) : (
                  <>
                    <IconBrain className="w-5 h-5" />
                    AI Suggest
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Shopping List Content */}
        {activeList ? (
          <div className="space-y-6">
            {/* List Header */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {activeList.name}
                  </h2>
                  <p className="text-gray-600">
                    {activeList.items.length} items • Created{' '}
                    {activeList.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-marigold-600">
                    ${activeList.totalEstimatedCost.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">Estimated Total</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className="bg-marigold-500 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      activeList.items.length > 0
                        ? (activeList.items.filter((item) => item.isChecked)
                            .length /
                            activeList.items.length) *
                          100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>

              <div className="text-sm text-gray-600">
                {activeList.items.filter((item) => item.isChecked).length} of{' '}
                {activeList.items.length} items completed
              </div>
            </div>

            {/* Grouped Items */}
            {Object.entries(groupedItems).map(([category, items]) => (
              <div
                key={category}
                className="bg-white rounded-2xl shadow-lg border border-gray-100"
              >
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <IconCategory className="w-5 h-5" />
                    {category}
                  </h3>
                </div>

                <div className="p-4">
                  <div className="space-y-3">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                          item.isChecked
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-gray-100 hover:border-marigold-200'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() =>
                              toggleItemChecked(activeList.id, item.id)
                            }
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              item.isChecked
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 hover:border-marigold-400'
                            }`}
                          >
                            {item.isChecked && (
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
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <span>
                                {item.quantity} {item.unit}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                  PRIORITY_COLORS[item.priority]
                                }`}
                              >
                                {item.priority}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                  CATEGORY_COLORS[
                                    item.category as keyof typeof CATEGORY_COLORS
                                  ] ||
                                  'bg-gray-100 text-gray-800 border-gray-200'
                                }`}
                              >
                                {item.category}
                              </span>
                            </div>
                            {item.notes && (
                              <div className="text-xs text-gray-400 mt-1">
                                {item.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-semibold text-marigold-600">
                              ${item.estimatedPrice.toFixed(2)}
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              removeItemFromList(activeList.id, item.id)
                            }
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <IconTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {filteredItems.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-100">
                <IconShoppingCart className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No items found
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || selectedCategory
                    ? 'Try adjusting your search or filters'
                    : 'Add some items to get started!'}
                </p>
                {!searchTerm && !selectedCategory && (
                  <button
                    onClick={() => generateFromMealPlan()}
                    className="px-6 py-3 bg-gradient-to-r from-marigold-500 to-orange-500 text-white rounded-xl font-semibold hover:from-marigold-600 hover:to-orange-600 transition-all"
                  >
                    Generate from Meal Plan
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Welcome State */
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
            <IconShoppingCart className="w-32 h-32 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-4">
              No Shopping List Selected
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Create a new shopping list or select an existing one to start
              organizing your grocery shopping
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-8 py-4 bg-gradient-to-r from-marigold-500 to-orange-500 text-white rounded-xl font-semibold hover:from-marigold-600 hover:to-orange-600 transition-all text-lg"
            >
              Create Your First List
            </button>
          </div>
        )}
      </div>

      {/* Create List Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsCreating(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Create New Shopping List
              </h2>
              <p className="text-gray-600 mb-6">
                Start with a new shopping list and add items from your meal
                plans or manually.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={createNewList}
                  className="px-6 py-2 bg-marigold-500 text-white rounded-lg hover:bg-marigold-600 transition-colors"
                >
                  Create List
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
