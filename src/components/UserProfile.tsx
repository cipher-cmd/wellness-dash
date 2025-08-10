import { useState, useEffect, useRef } from 'react';
import {
  IconUser,
  IconLogout,
  IconSettings,
  IconChevronDown,
  IconX,
  IconDeviceFloppy,
} from '@tabler/icons-react';
import {
  signOutUser,
  type UserProfile,
  updateUserProfile,
} from '../lib/supabaseAuth';

interface UserProfileProps {
  user: UserProfile;
  onLogout: () => void;
  onProfileUpdate?: (updatedProfile: UserProfile) => void;
}

export default function UserProfile({
  user,
  onLogout,
  onProfileUpdate,
}: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    age: user.age,
    gender: user.gender,
    height: user.height,
    weight: user.weight,
    goal: user.goal,
    daily_targets: { ...user.daily_targets },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close settings modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    };

    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsOpen]);

  const handleLogout = async () => {
    try {
      await signOutUser();
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const calculateBMI = (height: number, weight: number) => {
    const heightInMeters = height / 100;
    return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
  };

  const calculateDailyTargets = (
    height: number,
    weight: number,
    age: number,
    gender: 'male' | 'female' | 'other',
    goal: 'lose' | 'maintain' | 'gain'
  ) => {
    // Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Apply activity multiplier (moderate activity level)
    const tdee = bmr * 1.55;

    // Adjust calories based on goal
    let targetCalories: number;
    switch (goal) {
      case 'lose':
        targetCalories = tdee - 500; // 500 calorie deficit for weight loss
        break;
      case 'gain':
        targetCalories = tdee + 300; // 300 calorie surplus for weight gain
        break;
      default: // maintain
        targetCalories = tdee;
    }

    // Calculate macronutrient distribution
    // Protein: 1.6-2.2g per kg body weight (higher for weight loss)
    const proteinMultiplier = goal === 'lose' ? 2.2 : 1.8;
    const targetProtein = Math.round(weight * proteinMultiplier);

    // Fat: 20-35% of total calories
    const targetFat = Math.round((targetCalories * 0.25) / 9); // 25% of calories, 9 cal/g

    // Carbs: remaining calories
    const remainingCalories =
      targetCalories - targetProtein * 4 - targetFat * 9;
    const targetCarbs = Math.round(remainingCalories / 4); // 4 cal/g

    return {
      calories: Math.round(targetCalories),
      protein: targetProtein,
      carbs: targetCarbs,
      fat: targetFat,
    };
  };

  const handleInputChange = (field: string, value: string | number) => {
    const newFormData = { ...formData, [field]: value };

    // Auto-calculate daily targets when height, weight, age, gender, or goal changes
    if (['height', 'weight', 'age', 'gender', 'goal'].includes(field)) {
      const newTargets = calculateDailyTargets(
        newFormData.height,
        newFormData.weight,
        newFormData.age,
        newFormData.gender,
        newFormData.goal
      );

      setFormData({
        ...newFormData,
        daily_targets: newTargets,
      });
    } else {
      setFormData(newFormData);
    }
  };

  const handleDailyTargetChange = (
    field: keyof typeof formData.daily_targets,
    value: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      daily_targets: {
        ...prev.daily_targets,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updatedProfile = await updateUserProfile(user.id, {
        ...formData,
        bmi: calculateBMI(formData.height, formData.weight),
      });

      if (updatedProfile && onProfileUpdate) {
        onProfileUpdate(updatedProfile);
      }

      setIsSettingsOpen(false);
      // Update local form data with the saved values
      setFormData({
        age: updatedProfile.age,
        gender: updatedProfile.gender,
        height: updatedProfile.height,
        weight: updatedProfile.weight,
        goal: updatedProfile.goal,
        daily_targets: { ...updatedProfile.daily_targets },
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getGoalColor = (goal: string) => {
    switch (goal) {
      case 'lose':
        return 'text-red-600 bg-red-100';
      case 'maintain':
        return 'text-blue-600 bg-blue-100';
      case 'gain':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi >= 18.5 && bmi < 24.9) return 'Normal Weight';
    if (bmi >= 25 && bmi < 29.9) return 'Overweight';
    return 'Obesity';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl hover:bg-gradient-to-r hover:from-marigold-50 hover:to-orange-50 transition-all duration-200 hover:shadow-md border border-transparent hover:border-marigold-200"
        style={{ minWidth: 'fit-content' }}
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.display_name}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-sm"
          />
        ) : (
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-marigold-400 to-orange-500 rounded-full flex items-center justify-center shadow-sm border-2 border-white">
            <IconUser className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        )}
        <span className="text-sm sm:text-base font-semibold text-gray-700 hidden sm:block">
          {user.display_name}
        </span>
        <IconChevronDown
          className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Profile Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          style={{
            width: 'min(calc(100vw - 2rem), 320px)',
            right: '0',
            left: 'auto',
            maxWidth: 'calc(100vw - 1rem)',
          }}
        >
          {/* Profile Header */}
          <div className="p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-marigold-50 via-orange-50 to-amber-50 border-b border-marigold-100">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.display_name}
                  className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full border-2 border-white shadow-lg"
                />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-marigold-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <IconUser className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 truncate">
                  {user.display_name}
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <span
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-md ${getGoalColor(
                  user.goal
                )}`}
              >
                {user.goal === 'lose' && 'Lose Weight'}
                {user.goal === 'maintain' && 'Maintain Weight'}
                {user.goal === 'gain' && 'Gain Weight'}
              </span>
            </div>
          </div>

          {/* BMI Section */}
          <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <div className="w-1.5 h-5 sm:h-6 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full"></div>
              Body Mass Index
            </h4>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-800 mb-1">
                {user.bmi.toFixed(1)}
              </div>
              <div className="text-xs sm:text-sm text-blue-600 font-medium">
                {getBMICategory(user.bmi)}
              </div>
            </div>
          </div>

          {/* Daily Targets Section */}
          <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
            <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <div className="w-1.5 h-5 sm:h-6 bg-gradient-to-b from-green-400 to-emerald-500 rounded-full"></div>
              Daily Targets
            </h4>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-white/50 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-600 font-medium text-xs">
                    Calories
                  </span>
                  <span className="text-xs text-gray-500">kcal</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-gray-800">
                  {user.daily_targets.calories.toLocaleString()}
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-white/50 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-600 font-medium text-xs">
                    Protein
                  </span>
                  <span className="text-xs text-gray-500">g</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-gray-800">
                  {user.daily_targets.protein}
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-white/50 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-600 font-medium text-xs">
                    Carbs
                  </span>
                  <span className="text-xs text-gray-500">g</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-gray-800">
                  {user.daily_targets.carbs}
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-white/50 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-600 font-medium text-xs">Fat</span>
                  <span className="text-xs text-gray-500">g</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-gray-800">
                  {user.daily_targets.fat}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-3 sm:p-4 bg-gray-50">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 hover:text-gray-900 hover:bg-white rounded-xl transition-all duration-200 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md border border-gray-200 hover:border-gray-300"
            >
              <IconSettings className="w-4 h-4" />
              Edit Profile & Settings
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 mt-2 sm:mt-3 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md border border-red-200 hover:border-red-300"
            >
              <IconLogout className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            ref={settingsRef}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl max-h-[90vh] overflow-y-auto modal-content"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-2 h-6 sm:h-8 bg-gradient-to-b from-marigold-400 to-orange-500 rounded-full"></div>
                Edit Profile
              </h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 hover:bg-white rounded-xl transition-all duration-200 hover:shadow-md border border-gray-200 hover:border-gray-300"
              >
                <IconX className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Personal Information */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 sm:p-5 border border-gray-200">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-3">
                  <div className="w-2 h-5 sm:h-6 bg-gradient-to-b from-marigold-400 to-orange-500 rounded-full"></div>
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Age (years)
                    </label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) =>
                        handleInputChange('age', parseInt(e.target.value) || 0)
                      }
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-marigold-500 focus:border-transparent bg-white shadow-sm"
                      min="1"
                      max="120"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        handleInputChange(
                          'gender',
                          e.target.value as 'male' | 'female' | 'other'
                        )
                      }
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-marigold-500 focus:border-transparent bg-white shadow-sm"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) =>
                        handleInputChange(
                          'height',
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-marigold-500 focus:border-transparent bg-white shadow-sm"
                      min="100"
                      max="250"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) =>
                        handleInputChange(
                          'weight',
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-marigold-500 focus:border-transparent bg-white shadow-sm"
                      min="30"
                      max="300"
                    />
                  </div>
                </div>

                {/* BMI Preview */}
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-r from-marigold-50 to-orange-50 rounded-xl border border-marigold-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs sm:text-sm text-marigold-800 font-semibold">
                        New BMI Preview
                      </span>
                      <p className="text-xs text-marigold-600 mt-1">
                        Updates automatically as you change height or weight
                      </p>
                    </div>
                    <div className="text-center">
                      <span className="text-xl sm:text-2xl font-bold text-marigold-800 block">
                        {calculateBMI(formData.height, formData.weight)}
                      </span>
                      <span className="text-xs text-marigold-600">BMI</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Goal */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-4 sm:p-5 border border-blue-200">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-3">
                  <div className="w-2 h-5 sm:h-6 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full"></div>
                  Fitness Goal
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  {(['lose', 'maintain', 'gain'] as const).map((goal) => (
                    <button
                      key={goal}
                      onClick={() => handleInputChange('goal', goal)}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 font-medium ${
                        formData.goal === goal
                          ? 'border-marigold-500 bg-marigold-50 text-marigold-700 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                      }`}
                    >
                      {goal === 'lose' && 'Lose Weight'}
                      {goal === 'maintain' && 'Maintain Weight'}
                      {goal === 'gain' && 'Gain Weight'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily Targets */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-4 sm:p-5 border border-green-200">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-3">
                  <div className="w-2 h-5 sm:h-6 bg-gradient-to-b from-green-400 to-emerald-500 rounded-full"></div>
                  Daily Nutritional Targets
                </h3>
                <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs sm:text-sm text-blue-700">
                    <strong>Auto-calculated:</strong> These values are
                    automatically calculated based on your personal information
                    and fitness goal. You can manually adjust them if needed.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Calories
                    </label>
                    <input
                      type="number"
                      value={formData.daily_targets.calories}
                      onChange={(e) =>
                        handleDailyTargetChange(
                          'calories',
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-marigold-500 focus:border-transparent bg-blue-50 shadow-sm"
                      min="1000"
                      max="5000"
                    />
                    <p className="text-xs text-blue-600 mt-1 font-medium">
                      Auto-calculated
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      value={formData.daily_targets.protein}
                      onChange={(e) =>
                        handleDailyTargetChange(
                          'protein',
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-marigold-500 focus:border-transparent bg-blue-50 shadow-sm"
                      min="20"
                      max="300"
                    />
                    <p className="text-xs text-blue-600 mt-1 font-medium">
                      Auto-calculated
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Carbs (g)
                    </label>
                    <input
                      type="number"
                      value={formData.daily_targets.carbs}
                      onChange={(e) =>
                        handleDailyTargetChange(
                          'carbs',
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-marigold-500 focus:border-transparent bg-blue-50 shadow-sm"
                      min="50"
                      max="600"
                    />
                    <p className="text-xs text-blue-600 mt-1 font-medium">
                      Auto-calculated
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Fat (g)
                    </label>
                    <input
                      type="number"
                      value={formData.daily_targets.fat}
                      onChange={(e) =>
                        handleDailyTargetChange(
                          'fat',
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-marigold-500 focus:border-transparent bg-blue-50 shadow-sm"
                      min="20"
                      max="150"
                    />
                    <p className="text-xs text-blue-600 mt-1 font-medium">
                      Auto-calculated
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-all duration-200 font-medium border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-marigold-500 to-orange-500 hover:from-marigold-600 hover:to-orange-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg"
              >
                <IconDeviceFloppy className="w-4 h-4" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
