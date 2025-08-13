import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconUser,
  IconTarget,
  IconSettings,
  IconLogout,
  IconX,
  IconDeviceFloppy,
  IconEdit,
  IconScale,
} from '@tabler/icons-react';
import type { UserProfile } from '../../lib/supabaseAuth';
import WeightTrackingModal from '../WeightTrackingModal';

interface UserProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  onLogout: () => void;
}

export default function UserProfileModal({
  user,
  isOpen,
  onClose,
  onUpdateProfile,
  onLogout,
}: UserProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(user);
  const [activeTab, setActiveTab] = useState<
    'profile' | 'goals' | 'preferences'
  >('profile');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showWeightTracking, setShowWeightTracking] = useState(false);

  useEffect(() => {
    setEditedProfile(user);
  }, [user]);

  const handleSave = () => {
    // Validate required fields
    if (!editedProfile.display_name.trim()) {
      alert('Display name is required');
      return;
    }

    if (editedProfile.age < 13 || editedProfile.age > 120) {
      alert('Please enter a valid age between 13 and 120');
      return;
    }

    if (editedProfile.height < 100 || editedProfile.height > 250) {
      alert('Please enter a valid height between 100 and 250 cm');
      return;
    }

    if (editedProfile.weight < 30 || editedProfile.weight > 200) {
      alert('Please enter a valid weight between 30 and 200 kg');
      return;
    }

    onUpdateProfile(editedProfile);
    setIsEditing(false);

    // Show success message
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleCancel = () => {
    setEditedProfile(user);
    setIsEditing(false);
  };

  const updateField = (field: keyof UserProfile, value: string | number) => {
    setEditedProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateDailyTargets = (
    field: keyof UserProfile['daily_targets'],
    value: number
  ) => {
    setEditedProfile((prev) => ({
      ...prev,
      daily_targets: {
        ...prev.daily_targets,
        [field]: value,
      },
    }));
  };

  // Calculate BMI when height or weight changes
  const updateHeightOrWeight = (field: 'height' | 'weight', value: number) => {
    setEditedProfile((prev) => {
      const newProfile = {
        ...prev,
        [field]: value,
      };

      // Calculate new BMI
      if (newProfile.height && newProfile.weight) {
        const heightInMeters = newProfile.height / 100;
        newProfile.bmi =
          Math.round(
            (newProfile.weight / (heightInMeters * heightInMeters)) * 10
          ) / 10;
      }

      return newProfile;
    });
  };

  // Get BMI category
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { category: 'Normal weight', color: 'text-green-600' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-600' };
    return { category: 'Obese', color: 'text-red-600' };
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.display_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to icon if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <IconUser className={`w-8 h-8 ${user.avatar_url ? 'hidden' : ''}`} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{user.display_name}</h2>
                  <p className="text-blue-100">{user.email}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <IconX className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Success Message */}
          {showSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 mx-6 mt-4 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Profile updated successfully!
              </div>
            </motion.div>
          )}

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              {[
                { id: 'profile', label: 'Profile', icon: IconUser },
                { id: 'goals', label: 'Goals', icon: IconTarget },
                { id: 'preferences', label: 'Preferences', icon: IconSettings },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() =>
                      setActiveTab(
                        tab.id as 'profile' | 'goals' | 'preferences'
                      )
                    }
                    className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 transition-all ${
                      isActive
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Personal Information
                  </h3>
                  <div className="flex gap-2">
                    {!isEditing && (
                      <>
                        <button
                          onClick={() => setShowWeightTracking(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          <IconScale className="w-4 h-4" />
                          Track Weight
                        </button>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <IconEdit className="w-4 h-4" />
                          Edit
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile.display_name}
                        onChange={(e) =>
                          updateField('display_name', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                        {user.display_name}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedProfile.age}
                        onChange={(e) =>
                          updateField('age', parseInt(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                        {user.age} years
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    {isEditing ? (
                      <select
                        value={editedProfile.gender}
                        onChange={(e) => updateField('gender', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 capitalize">
                        {user.gender}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Height (cm)
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedProfile.height}
                        onChange={(e) =>
                          updateHeightOrWeight(
                            'height',
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="100"
                        max="250"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                        {user.height} cm
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (kg)
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedProfile.weight}
                        onChange={(e) =>
                          updateHeightOrWeight(
                            'weight',
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="30"
                        max="200"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                        {user.weight} kg
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      BMI
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 font-semibold">
                          {editedProfile.bmi}
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            getBMICategory(editedProfile.bmi).color
                          }`}
                        >
                          {getBMICategory(editedProfile.bmi).category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Goal
                    </label>
                    {isEditing ? (
                      <select
                        value={editedProfile.goal}
                        onChange={(e) => updateField('goal', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="lose">Lose Weight</option>
                        <option value="maintain">Maintain Weight</option>
                        <option value="gain">Gain Weight</option>
                      </select>
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 capitalize">
                        {user.goal} weight
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Activity Level
                    </label>
                    {isEditing ? (
                      <select
                        value={
                          editedProfile.activityLevel || 'moderately_active'
                        }
                        onChange={(e) =>
                          updateField('activityLevel', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="sedentary">
                          Sedentary (little or no exercise)
                        </option>
                        <option value="lightly_active">
                          Lightly Active (light exercise 1-3 days/week)
                        </option>
                        <option value="moderately_active">
                          Moderately Active (moderate exercise 3-5 days/week)
                        </option>
                        <option value="very_active">
                          Very Active (hard exercise 6-7 days/week)
                        </option>
                        <option value="extremely_active">
                          Extremely Active (very hard exercise, physical job)
                        </option>
                      </select>
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 capitalize">
                        {user.activityLevel || 'moderately_active'}
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <IconDeviceFloppy className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Sign Out Button - Moved to bottom of Profile tab */}
                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-2 w-full px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors border border-red-200"
                  >
                    <IconLogout className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* Goals Tab */}
            {activeTab === 'goals' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Daily Nutrition Goals
                  </h3>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <IconEdit className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Daily Calories
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedProfile.daily_targets.calories}
                        onChange={(e) =>
                          updateDailyTargets(
                            'calories',
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                        {user.daily_targets.calories} kcal
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Daily Protein (g)
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedProfile.daily_targets.protein}
                        onChange={(e) =>
                          updateDailyTargets(
                            'protein',
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                        {user.daily_targets.protein}g
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Daily Carbs (g)
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedProfile.daily_targets.carbs}
                        onChange={(e) =>
                          updateDailyTargets('carbs', parseInt(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                        {user.daily_targets.carbs}g
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Daily Fat (g)
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedProfile.daily_targets.fat}
                        onChange={(e) =>
                          updateDailyTargets('fat', parseInt(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                        {user.daily_targets.fat}g
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <IconDeviceFloppy className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  App Preferences
                </h3>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Account Actions
                  </h4>
                  <div className="space-y-3">
                    <p className="text-sm text-blue-700">
                      Sign out option is now available in the Profile tab.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    App Information
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Version: 1.0.0</p>
                    <p>Last Updated: {new Date().toLocaleDateString()}</p>
                    <p>
                      Database:{' '}
                      {user.id === 'local-dev'
                        ? 'Local Development'
                        : 'Production'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Weight Tracking Modal */}
      <WeightTrackingModal
        isOpen={showWeightTracking}
        onClose={() => setShowWeightTracking(false)}
        userId={user.id}
        currentWeight={user.weight}
        onWeightUpdate={(newWeight) => {
          // Update the user profile with new weight
          const updatedProfile = { ...user, weight: newWeight };
          onUpdateProfile(updatedProfile);
        }}
      />
    </AnimatePresence>
  );
}
