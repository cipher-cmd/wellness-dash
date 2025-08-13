import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX, IconPlus, IconMinus, IconScale } from '@tabler/icons-react';
import { WeightTrackingService, type WeightEntry } from '../lib/weightTracking';

interface WeightTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentWeight: number;
  onWeightUpdate: (newWeight: number) => void;
}

export default function WeightTrackingModal({
  isOpen,
  onClose,
  userId,
  currentWeight,
  onWeightUpdate,
}: WeightTrackingModalProps) {
  const [weight, setWeight] = useState(currentWeight);
  const [notes, setNotes] = useState('');
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadWeightData();
      checkWeightReminder();
    }
  }, [isOpen, userId]);

  const loadWeightData = async () => {
    try {
      const entries = await WeightTrackingService.getWeightEntries(userId);
      setWeightEntries(entries);
    } catch (error) {
      console.error('Error loading weight data:', error);
    }
  };

  const checkWeightReminder = async () => {
    try {
      const shouldShow = await WeightTrackingService.shouldShowWeightReminder(userId);
      setShowReminder(shouldShow);
    } catch (error) {
      console.error('Error checking weight reminder:', error);
    }
  };

  const handleWeightChange = (change: number) => {
    setWeight(prev => Math.max(30, Math.min(200, prev + change)));
  };

  const handleSubmit = async () => {
    if (weight <= 0) return;

    setIsLoading(true);
    try {
      const newEntry = await WeightTrackingService.addWeightEntry({
        user_id: userId,
        weight,
        date: new Date().toISOString().split('T')[0],
        notes: notes.trim() || undefined,
      });

      if (newEntry) {
        setWeightEntries(prev => [newEntry, ...prev]);
        onWeightUpdate(weight);
        setNotes('');
        setShowReminder(false);
        onClose();
      }
    } catch (error) {
      console.error('Error adding weight entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const { totalChange, weeklyRate } = WeightTrackingService.calculateWeightChange(weightEntries);
  const latestWeight = weightEntries[0]?.weight || currentWeight;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <IconScale className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Weight Tracking</h2>
                    <p className="text-blue-100">Track your progress and stay motivated</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-blue-100 transition-colors"
                >
                  <IconX className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Weekly Reminder */}
              {showReminder && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                    <p className="text-yellow-800 font-medium">
                      It's been over a week since your last weight entry. Time to check in!
                    </p>
                  </div>
                </div>
              )}

              {/* Current Weight Input */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Log Current Weight</h3>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    onClick={() => handleWeightChange(-1)}
                    className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                  >
                    <IconMinus className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-800">{weight}</div>
                    <div className="text-gray-500">kg</div>
                  </div>
                  <button
                    onClick={() => handleWeightChange(1)}
                    className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                  >
                    <IconPlus className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter weight in kg"
                  min="30"
                  max="200"
                />
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="How are you feeling? Any changes in routine?"
                  rows={3}
                />
              </div>

              {/* Progress Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{latestWeight}</div>
                  <div className="text-sm text-blue-600">Current Weight (kg)</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {totalChange > 0 ? '+' : ''}{totalChange.toFixed(1)}
                  </div>
                  <div className="text-sm text-green-600">Total Change (kg)</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {weeklyRate > 0 ? '+' : ''}{weeklyRate.toFixed(2)}
                  </div>
                  <div className="text-sm text-purple-600">Weekly Rate (kg/week)</div>
                </div>
              </div>

              {/* Weight Trend Chart */}
              {weightEntries.length > 1 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Weight Trend (Last 30 Days)</h3>
                  <div className="h-64 bg-gray-50 rounded-lg p-4">
                    <div className="text-center text-gray-500 py-8">
                      Chart visualization would go here
                      <br />
                      <small>Using Recharts library for production</small>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Entries */}
              {weightEntries.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Recent Entries</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {weightEntries.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <IconScale className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{entry.weight} kg</span>
                          {entry.notes && (
                            <span className="text-sm text-gray-600">- {entry.notes}</span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(entry.date).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isLoading || weight <= 0}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save Weight Entry'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
