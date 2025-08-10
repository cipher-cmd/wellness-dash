import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  IconPlus,
  IconX,
  IconCheck,
  IconCalculator,
} from '@tabler/icons-react';
import { db, type Food } from '../lib/db';
import { upsertFood } from '../lib/supabaseSync';

interface CustomFoodCreatorProps {
  onFoodCreated: (food: Food) => void;
  onClose: () => void;
}

export default function CustomFoodCreator({
  onFoodCreated,
  onClose,
}: CustomFoodCreatorProps) {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    tags: '',
    kcal: '',
    protein: '',
    carbs: '',
    fat: '',
    servingLabel: '',
    servingGrams: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Food name is required';
    }

    if (
      !formData.kcal ||
      isNaN(Number(formData.kcal)) ||
      Number(formData.kcal) < 0
    ) {
      newErrors.kcal = 'Valid calories are required';
    }

    if (
      !formData.protein ||
      isNaN(Number(formData.protein)) ||
      Number(formData.protein) < 0
    ) {
      newErrors.protein = 'Valid protein value is required';
    }

    if (
      !formData.carbs ||
      isNaN(Number(formData.carbs)) ||
      Number(formData.carbs) < 0
    ) {
      newErrors.carbs = 'Valid carbs value is required';
    }

    if (
      !formData.fat ||
      isNaN(Number(formData.fat)) ||
      Number(formData.fat) < 0
    ) {
      newErrors.fat = 'Valid fat value is required';
    }

    if (!formData.servingLabel.trim()) {
      newErrors.servingLabel = 'Serving label is required';
    }

    if (
      !formData.servingGrams ||
      isNaN(Number(formData.servingGrams)) ||
      Number(formData.servingGrams) <= 0
    ) {
      newErrors.servingGrams = 'Valid serving size is required';
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
      const newFood: Food = {
        name: formData.name.trim(),
        brand: formData.brand.trim() || undefined,
        tags: formData.tags.trim()
          ? formData.tags.split(',').map((tag) => tag.trim())
          : [],
        per100g: {
          kcal: Number(formData.kcal),
          protein: Number(formData.protein),
          carbs: Number(formData.carbs),
          fat: Number(formData.fat),
        },
        servings: [
          {
            label: formData.servingLabel.trim(),
            grams: Number(formData.servingGrams),
          },
        ],
        verified: false, // Custom foods are not verified
      };

      const id = await db.foods.add(newFood);
      const createdFood = { ...newFood, id };
      await upsertFood(createdFood);
      console.info(
        'Created food locally and attempted Supabase upsert',
        createdFood
      );

      onFoodCreated(createdFood);
      onClose();
    } catch (error) {
      console.error('Error creating custom food:', error);
      setErrors({ submit: 'Failed to create food. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const calculateTotal = () => {
    const kcal = Number(formData.kcal) || 0;
    const protein = Number(formData.protein) || 0;
    const carbs = Number(formData.carbs) || 0;
    const fat = Number(formData.fat) || 0;

    // Calculate total calories from macros (4 cal per gram of protein/carbs, 9 cal per gram of fat)
    const calculatedKcal = protein * 4 + carbs * 4 + fat * 9;

    return {
      kcal,
      calculatedKcal,
      difference: Math.abs(kcal - calculatedKcal),
    };
  };

  const { kcal, calculatedKcal, difference } = calculateTotal();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl w-full h-full overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-marigold to-orange-500 rounded-full flex items-center justify-center">
              <IconPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Create Custom Food
              </h2>
              <p className="text-gray-600">
                Add your homemade recipes and local foods
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
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Food Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-marigold/20 focus:border-marigold transition-all bg-white text-gray-900 placeholder:text-gray-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="e.g., Mom's Special Biryani"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand (Optional)
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-marigold/20 focus:border-marigold transition-all bg-white text-gray-900 placeholder:text-gray-500"
                placeholder="e.g., Homemade, Local Restaurant"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (Optional)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-marigold/20 focus:border-marigold transition-all bg-white text-gray-900 placeholder:text-gray-500"
              placeholder="e.g., homemade, spicy, north indian (separate with commas)"
            />
            <p className="text-gray-500 text-sm mt-1">
              Add tags to help you find this food later
            </p>
          </div>

          {/* Nutrition Information */}
          <div className="bg-gradient-to-r from-marigold/5 to-orange-500/5 p-6 rounded-xl border border-marigold/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <IconCalculator className="w-5 h-5 text-marigold-500" />
              Nutrition per 100g
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calories *
                </label>
                <input
                  type="number"
                  value={formData.kcal}
                  onChange={(e) => handleInputChange('kcal', e.target.value)}
                  className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-marigold/20 focus:border-marigold transition-all bg-white text-gray-900 placeholder:text-gray-500 ${
                    errors.kcal ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
                {errors.kcal && (
                  <p className="text-red-500 text-sm mt-1">{errors.kcal}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Protein (g) *
                </label>
                <input
                  type="number"
                  value={formData.protein}
                  onChange={(e) => handleInputChange('protein', e.target.value)}
                  className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-marigold/20 focus:border-marigold transition-all bg-white text-gray-900 placeholder:text-gray-500 ${
                    errors.protein ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
                {errors.protein && (
                  <p className="text-red-500 text-sm mt-1">{errors.protein}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carbs (g) *
                </label>
                <input
                  type="number"
                  value={formData.carbs}
                  onChange={(e) => handleInputChange('carbs', e.target.value)}
                  className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-marigold/20 focus:border-marigold transition-all bg-white text-gray-900 placeholder:text-gray-500 ${
                    errors.carbs ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
                {errors.carbs && (
                  <p className="text-red-500 text-sm mt-1">{errors.carbs}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fat (g) *
                </label>
                <input
                  type="number"
                  value={formData.fat}
                  onChange={(e) => handleInputChange('fat', e.target.value)}
                  className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-marigold/20 focus:border-marigold transition-all bg-white text-gray-900 placeholder:text-gray-500 ${
                    errors.fat ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
                {errors.fat && (
                  <p className="text-red-500 text-sm mt-1">{errors.fat}</p>
                )}
              </div>
            </div>

            {/* Nutrition Validation */}
            {kcal > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Entered calories:</span>
                  <span className="font-medium">{kcal} kcal</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Calculated from macros:</span>
                  <span className="font-medium">
                    {calculatedKcal.toFixed(1)} kcal
                  </span>
                </div>
                {difference > 5 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                    ⚠️ There's a {difference.toFixed(1)} kcal difference.
                    Double-check your values.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Serving Size */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serving Label *
              </label>
              <input
                type="text"
                value={formData.servingLabel}
                onChange={(e) =>
                  handleInputChange('servingLabel', e.target.value)
                }
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-marigold/20 focus:border-marigold transition-all bg-white text-gray-900 placeholder:text-gray-500 ${
                  errors.servingLabel ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="e.g., 1 Plate, 1 Cup, 1 Piece"
              />
              {errors.servingLabel && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.servingLabel}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serving Size (g) *
              </label>
              <input
                type="number"
                value={formData.servingGrams}
                onChange={(e) =>
                  handleInputChange('servingGrams', e.target.value)
                }
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-marigold/20 focus:border-marigold transition-all bg-white text-gray-900 placeholder:text-gray-500 ${
                  errors.servingGrams ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="0"
                min="0.1"
                step="0.1"
              />
              {errors.servingGrams && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.servingGrams}
                </p>
              )}
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 px-4 sm:px-6 py-3 border-2 border-marigold-200 text-marigold-700 rounded-xl font-medium hover:bg-marigold-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-marigold to-orange-500 text-white rounded-xl font-medium hover:from-marigold/90 hover:to-orange-500/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <IconCheck className="w-5 h-5" />
                  Create Food
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
