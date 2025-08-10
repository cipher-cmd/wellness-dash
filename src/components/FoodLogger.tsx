import { useState } from 'react';
import { db, type Food, type DiaryEntry } from '../lib/db';
import { upsertDiary } from '../lib/supabaseSync';

interface FoodLoggerProps {
  selectedFood: Food | null;
  onClose: () => void;
  onFoodLogged: () => void;
  embedded?: boolean; // when true, renders as inline card (no fullscreen overlay)
}

export default function FoodLogger({
  selectedFood,
  onClose,
  onFoodLogged,
  embedded = false,
}: FoodLoggerProps) {
  const [selectedMeal, setSelectedMeal] = useState<
    'breakfast' | 'lunch' | 'dinner' | 'snack'
  >('breakfast');
  const [selectedServing, setSelectedServing] = useState(
    selectedFood?.servings?.[0] || null
  );
  const [quantity, setQuantity] = useState(1);
  const [isLogging, setIsLogging] = useState(false);
  const [price, setPrice] = useState<string>('');

  if (!selectedFood) return null;

  const calculateNutrition = () => {
    if (!selectedServing) return { kcal: 0, protein: 0, carbs: 0, fat: 0 };

    const multiplier = (selectedServing.grams * quantity) / 100;
    return {
      kcal: Math.round(selectedFood.per100g.kcal * multiplier),
      protein: Math.round(selectedFood.per100g.protein * multiplier * 10) / 10,
      carbs: Math.round(selectedFood.per100g.carbs * multiplier * 10) / 10,
      fat: Math.round(selectedFood.per100g.fat * multiplier * 10) / 10,
    };
  };

  const handleLogFood = async () => {
    if (!selectedServing) return;

    setIsLogging(true);
    try {
      const entry: Omit<DiaryEntry, 'id'> = {
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        meal: selectedMeal,
        foodId: selectedFood.id,
        customName: selectedFood.name,
        servingLabel: selectedServing.label,
        grams: selectedServing.grams,
        quantity: quantity,
        price: price ? Number(price) : null,
      };

      const id = await db.diary.add(entry);
      await upsertDiary({ ...entry, id });
      console.info('Logged diary locally and attempted Supabase upsert', {
        ...entry,
        id,
      });
      console.log('Food logged successfully:', entry);
      onFoodLogged();
      onClose();
    } catch (error) {
      console.error('Error logging food:', error);
    } finally {
      setIsLogging(false);
    }
  };

  const nutrition = calculateNutrition();

  const card = (
    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-auto max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-marigold-600 rounded-t-2xl p-3 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white drop-shadow-sm">
            Log Food
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:text-white/90 text-2xl font-light transition-colors bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>
        <div className="mt-1">
          <h4 className="font-semibold text-lg text-white drop-shadow-sm">
            {selectedFood.name}
          </h4>
          <p className="text-white/90 text-sm drop-shadow-sm">
            Add to your daily nutrition
          </p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Food Info */}
        <div className="bg-gradient-to-br from-gray-50 to-marigold-50 rounded-xl p-3 border border-marigold-100">
          <h5 className="font-semibold text-gray-900 mb-2 text-sm uppercase tracking-wide">
            Nutrition per 100g
          </h5>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-gray-600">Protein:</span>
              <span className="font-semibold text-gray-900">
                {selectedFood.per100g.protein}g
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-marigold-500 rounded-full"></div>
              <span className="text-gray-600">Carbs:</span>
              <span className="font-semibold text-gray-900">
                {selectedFood.per100g.carbs}g
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
              <span className="text-gray-600">Fat:</span>
              <span className="font-semibold text-gray-900">
                {selectedFood.per100g.fat}g
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Calories:</span>
              <span className="font-semibold text-gray-900">
                {selectedFood.per100g.kcal} kcal
              </span>
            </div>
          </div>
        </div>

        {/* Meal Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Select Meal
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(
              (meal) => (
                <button
                  key={meal}
                  onClick={() => setSelectedMeal(meal)}
                  className={`px-3 py-2 rounded-lg border-2 font-medium transition-all text-sm ${
                    selectedMeal === meal
                      ? 'border-marigold-500 bg-marigold-50 text-marigold-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-marigold-200 hover:bg-marigold-25'
                  }`}
                >
                  {meal.charAt(0).toUpperCase() + meal.slice(1)}
                </button>
              )
            )}
          </div>
        </div>

        {/* Serving Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Serving Size
          </label>
          <select
            value={
              selectedServing
                ? `${selectedServing.label} (${selectedServing.grams}g)`
                : ''
            }
            onChange={(e) => {
              const serving = selectedFood.servings?.find(
                (s) => `${s.label} (${s.grams}g)` === e.target.value
              );
              setSelectedServing(serving || null);
            }}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-marigold-500 focus:border-marigold-500 bg-white text-gray-900 font-medium transition-all"
          >
            {selectedFood.servings?.map((serving) => (
              <option
                key={serving.label}
                value={`${serving.label} (${serving.grams}g)`}
              >
                {serving.label} ({serving.grams}g)
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Quantity
          </label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-marigold-500 focus:border-marigold-500 bg-white text-gray-900 placeholder:text-gray-400 font-medium transition-all"
            placeholder="1.0"
          />
        </div>

        {/* Price (Optional) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Price (₹){' '}
            <span className="text-gray-400 font-normal text-xs">
              (Optional)
            </span>
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g., 15"
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-marigold-500 focus:border-marigold-500 bg-white text-gray-900 placeholder:text-gray-400 font-medium transition-all"
          />
          <p className="text-xs text-gray-500 mt-1">
            💡 Community-powered pricing: share what you paid for this serving.
          </p>
        </div>

        {/* Nutrition Summary */}
        <div className="bg-gradient-to-br from-marigold-50 to-orange-50 rounded-xl p-3 border border-marigold-200">
          <h5 className="font-bold text-gray-900 mb-3 text-center uppercase tracking-wide text-sm">
            Total Nutrition
          </h5>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {nutrition.kcal}
              </div>
              <div className="text-xs text-gray-600 uppercase tracking-wide">
                Calories
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600 mb-1">
                {nutrition.protein}g
              </div>
              <div className="text-xs text-gray-600 uppercase tracking-wide">
                Protein
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-marigold-600 mb-1">
                {nutrition.carbs}g
              </div>
              <div className="text-xs text-gray-600 uppercase tracking-wide">
                Carbs
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-700 mb-1">
                {nutrition.fat}g
              </div>
              <div className="text-xs text-gray-600 uppercase tracking-wide">
                Fat
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleLogFood}
            disabled={isLogging || !selectedServing}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-marigold-500 to-orange-500 text-white rounded-xl font-semibold hover:from-marigold-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {isLogging ? 'Logging...' : 'Log Food'}
          </button>
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return card;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{card}</div>
    </div>
  );
}
