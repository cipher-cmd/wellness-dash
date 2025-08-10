import { motion } from 'framer-motion';
import { IconPlus, IconFlame, IconTrash } from '@tabler/icons-react';
import type { DiaryEntry } from '../../lib/db';
import { db } from '../../lib/db';
import { deleteDiaryById } from '../../lib/supabaseSync';

interface EnhancedMealSectionProps {
  meal: string;
  entries: DiaryEntry[];
  onAddFood: () => void;
}

export default function EnhancedMealSection({
  meal,
  entries,
  onAddFood,
}: EnhancedMealSectionProps) {
  const mealIcons = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍎',
  };

  const mealColors = {
    breakfast: 'from-yellow-400 to-orange-400',
    lunch: 'from-orange-400 to-red-400',
    dinner: 'from-purple-400 to-blue-400',
    snack: 'from-green-400 to-teal-400',
  };

  const getMealDisplayName = (meal: string) => {
    return meal.charAt(0).toUpperCase() + meal.slice(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-2xl shadow-lg p-4 mb-4 border border-gray-100 hover:shadow-xl transition-all duration-300"
    >
      {/* Meal Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full bg-gradient-to-r ${
              mealColors[meal as keyof typeof mealColors]
            } flex items-center justify-center text-white text-xl shadow-lg`}
          >
            {mealIcons[meal as keyof typeof mealIcons]}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 capitalize">
              {getMealDisplayName(meal)}
            </h3>
            <p className="text-sm text-gray-500">
              {entries.length} food item{entries.length !== 1 ? 's' : ''} logged
            </p>
          </div>
        </div>

        {/* Consolidated flow: use the global "+ Add Food" button in the navbar */}
      </div>

      {/* Food Entries */}
      {entries.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-2"
        >
          {entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.4 }}
              className="group bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200 hover:border-marigold hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-marigold to-orange-500 rounded-full flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300">
                    <IconFlame className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-marigold-500 transition-colors duration-300">
                      {entry.customName || 'Food'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {entry.servingLabel} × {entry.quantity}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-marigold-500">
                      {entry.grams}g
                    </div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                  <button
                    aria-label="Delete entry"
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                    onClick={async () => {
                      if (!entry.id) return;
                      await db.diary.delete(entry.id);
                      await deleteDiaryById(entry.id);
                      // Optimistic UI: remove from current list visually by reloading page section
                      const ev = new CustomEvent('diary:changed');
                      window.dispatchEvent(ev);
                    }}
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center py-8"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconFlame className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-lg text-gray-600 mb-2">No foods logged yet</p>
          <p className="text-sm text-gray-500 mb-4">
            Start your {meal} by adding some nutritious foods
          </p>
          <motion.button
            onClick={onAddFood}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-marigold to-orange-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <IconPlus className="w-4 h-4" />
            Add Food
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}
