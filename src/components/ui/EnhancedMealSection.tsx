import { motion } from 'framer-motion';
import { IconPlus, IconInfoCircle, IconChefHat } from '@tabler/icons-react';
import type { DiaryEntry } from '../../lib/db';

interface EnhancedMealSectionProps {
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  entries: DiaryEntry[];
  onAddFood: () => void;
}

const mealConfig = {
  breakfast: {
    title: 'Breakfast',
    icon: '🌅',
    tips: [
      'Start your day with protein',
      'Include whole grains',
      'Add some fruits',
    ],
    sampleFoods: ['Oatmeal with berries', 'Eggs and toast', 'Greek yogurt'],
  },
  lunch: {
    title: 'Lunch',
    icon: '☀️',
    tips: ['Balance protein and carbs', 'Include vegetables', 'Stay hydrated'],
    sampleFoods: ['Grilled chicken salad', 'Quinoa bowl', 'Vegetable soup'],
  },
  dinner: {
    title: 'Dinner',
    icon: '🌙',
    tips: [
      'Lighter meal in the evening',
      'Focus on vegetables',
      'Limit heavy carbs',
    ],
    sampleFoods: [
      'Salmon with greens',
      'Stir-fried vegetables',
      'Lean meat with salad',
    ],
  },
  snack: {
    title: 'Snacks',
    icon: '🍎',
    tips: [
      'Choose nutrient-dense options',
      'Watch portion sizes',
      'Include protein',
    ],
    sampleFoods: ['Nuts and seeds', 'Apple with peanut butter', 'Greek yogurt'],
  },
};

export default function EnhancedMealSection({
  meal,
  entries,
  onAddFood,
}: EnhancedMealSectionProps) {
  const config = mealConfig[meal];
  const hasEntries = entries.length > 0;

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <h3 className="text-lg font-semibold text-gray-800">
            {config.title}
          </h3>
        </div>
        <motion.button
          onClick={onAddFood}
          className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <IconPlus className="w-5 h-5" />
        </motion.button>
      </div>

      {hasEntries ? (
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 rounded-xl p-3 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">
                  {entry.customName || 'Food Item'}
                </span>
                <span className="text-sm text-gray-500">{entry.grams}g</span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Tips Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <IconInfoCircle className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-800">Smart Tips</h4>
            </div>
            <ul className="space-y-1">
              {config.tips.map((tip, index) => (
                <li
                  key={index}
                  className="text-sm text-blue-700 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Sample Foods */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center gap-2 mb-3">
              <IconChefHat className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-800">Great Options</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {config.sampleFoods.map((food, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-white rounded-full text-sm text-green-700 border border-green-200"
                >
                  {food}
                </span>
              ))}
            </div>
          </div>

          {/* Add Food CTA */}
          <motion.button
            onClick={onAddFood}
            className="w-full bg-gradient-to-r from-orange-100 to-orange-200 hover:from-orange-200 hover:to-orange-300 text-orange-700 border border-orange-300 rounded-xl py-3 px-4 font-semibold transition-all flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <IconPlus className="w-5 h-5" />
            Add {config.title} Food
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
