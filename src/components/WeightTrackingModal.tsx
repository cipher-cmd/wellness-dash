import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconScale, IconMinus, IconX, IconPlus } from '@tabler/icons-react';
import { WeightTrackingService, type WeightEntry } from '../lib/weightTracking';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [newWeight, setNewWeight] = useState(currentWeight);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadWeightData();
      checkWeightReminder();
    }
  }, [isOpen, userId]);

  const loadWeightData = async () => {
    const entries = await WeightTrackingService.getWeightEntries(userId);
    setWeightEntries(entries);
  };

  const checkWeightReminder = async () => {
    const shouldShow = await WeightTrackingService.shouldShowWeightReminder(
      userId
    );
    setShowReminder(shouldShow);
  };

  const handleSubmitWeight = async () => {
    if (newWeight < 30 || newWeight > 200) {
      alert('Please enter a valid weight between 30 and 200 kg');
      return;
    }

    setIsSubmitting(true);
    try {
      const newEntry = await WeightTrackingService.addWeightEntry({
        user_id: userId,
        weight: newWeight,
        date: new Date().toISOString().split('T')[0],
        notes: notes.trim() || undefined,
      });

      if (newEntry) {
        setWeightEntries((prev) => [newEntry, ...prev]);
        onWeightUpdate(newWeight);
        setNotes('');
        setShowReminder(false);

        // Show success message
        alert('Weight logged successfully!');
      }
    } catch (error) {
      console.error('Error logging weight:', error);
      alert('Failed to log weight. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWeightChange = () => {
    if (weightEntries.length < 2)
      return { totalChange: 0, weeklyChange: 0, trend: 'stable' as const };
    return WeightTrackingService.calculateWeightChange(weightEntries);
  };

  const formatChartData = () => {
    return weightEntries
      .slice(-30) // Last 30 entries
      .reverse()
      .map((entry) => ({
        date: new Date(entry.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        weight: entry.weight,
      }));
  };

  const { totalChange, weeklyChange, trend } = getWeightChange();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <IconScale className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Weight Tracking
                  </h2>
                  <p className="text-gray-600">Monitor your progress weekly</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <IconX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Weekly Reminder */}
            {showReminder && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <IconScale className="w-5 h-5 text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">
                      Weekly Weight Check-in
                    </h3>
                    <p className="text-yellow-700 text-sm">
                      It's been a week since your last weight entry. Log your
                      current weight to track your progress!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Weight Input Section */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-3">
                Log New Weight
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Weight (kg)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setNewWeight((prev) => Math.max(30, prev - 0.1))
                      }
                      className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <IconMinus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={newWeight}
                      onChange={(e) =>
                        setNewWeight(parseFloat(e.target.value) || 0)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-center font-medium"
                      min="30"
                      max="200"
                      step="0.1"
                    />
                    <button
                      onClick={() =>
                        setNewWeight((prev) => Math.min(200, prev + 0.1))
                      }
                      className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <IconPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., After workout, morning weight"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <button
                onClick={handleSubmitWeight}
                disabled={isSubmitting}
                className="w-full mt-4 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Logging...' : 'Log Weight'}
              </button>
            </div>

            {/* Weight Summary */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {currentWeight} kg
                </div>
                <div className="text-sm text-gray-600">Current Weight</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <div
                  className={`text-2xl font-bold ${
                    trend === 'decreasing'
                      ? 'text-green-600'
                      : trend === 'increasing'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  {totalChange > 0 ? '+' : ''}
                  {totalChange.toFixed(1)} kg
                </div>
                <div className="text-sm text-gray-600">Total Change</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <div
                  className={`text-2xl font-bold ${
                    weeklyChange > 0
                      ? 'text-red-600'
                      : weeklyChange < 0
                      ? 'text-green-600'
                      : 'text-gray-600'
                  }`}
                >
                  {weeklyChange > 0 ? '+' : ''}
                  {weeklyChange.toFixed(2)} kg/week
                </div>
                <div className="text-sm text-gray-600">Weekly Rate</div>
              </div>
            </div>

            {/* Weight Trend Chart */}
            {weightEntries.length > 1 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Weight Trend (Last 30 Days)
                </h3>
                <div className="h-64 bg-gray-50 rounded-lg p-4">
                  {typeof window !== 'undefined' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formatChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="weight"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

            {/* Recent Entries */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">
                Recent Entries
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {weightEntries.slice(0, 10).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <IconScale className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {entry.weight} kg
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(entry.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {entry.notes && (
                      <div className="text-sm text-gray-500 italic">
                        "{entry.notes}"
                      </div>
                    )}
                  </div>
                ))}
                {weightEntries.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No weight entries yet. Start tracking your progress!
                  </div>
                )}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
