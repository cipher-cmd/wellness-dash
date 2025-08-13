import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconArrowLeft, IconArrowRight, IconCheck } from '@tabler/icons-react';
import { createUserProfile, getCurrentUser } from '../lib/supabaseAuth';

import type { UserProfile } from '../lib/supabaseAuth';

interface OnboardingProps {
  onComplete: (userProfile: UserProfile) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    age: '',
    gender: '' as 'male' | 'female' | 'other',
    height: '',
    weight: '',
    goal: '' as 'lose' | 'maintain' | 'gain',
  });

  const [calculatedData, setCalculatedData] = useState({
    bmi: 0,
    dailyTargets: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = (
    field: keyof typeof formData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateBMI = (height: number, weight: number) => {
    const heightInMeters = height / 100;
    return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
  };

  const calculateDailyTargets = (
    age: number,
    gender: 'male' | 'female' | 'other',
    height: number,
    weight: number,
    goal: 'lose' | 'maintain' | 'gain'
  ) => {
    // Mifflin-St Jeor Equation
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr = gender === 'male' ? bmr + 5 : bmr - 161;

    // Activity multiplier (assuming moderate activity)
    let tdee = bmr * 1.55;

    // Adjust based on goal
    switch (goal) {
      case 'lose':
        tdee -= 500; // 500 calorie deficit
        break;
      case 'gain':
        tdee += 300; // 300 calorie surplus
        break;
    }

    // Macro distribution
    const protein = Math.round(weight * 2.2); // 2.2g per kg body weight
    const fat = Math.round((tdee * 0.25) / 9); // 25% of calories from fat
    const carbs = Math.round((tdee - protein * 4 - fat * 9) / 4); // Remaining calories from carbs

    return {
      calories: Math.round(tdee),
      protein,
      carbs: Math.max(0, carbs),
      fat,
    };
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Calculate BMI and daily targets
      const age = parseInt(formData.age);
      const height = parseInt(formData.height);
      const weight = parseInt(formData.weight);

      if (age && height && weight && formData.gender && formData.goal) {
        const bmi = calculateBMI(height, weight);
        const dailyTargets = calculateDailyTargets(
          age,
          formData.gender,
          height,
          weight,
          formData.goal
        );

        setCalculatedData({ bmi, dailyTargets });
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    console.log('Get Started button clicked!');

    try {
      const currentUser = await getCurrentUser();
      console.log('Current user:', currentUser);

      if (!currentUser) {
        console.error('No current user found');
        alert('Please sign in to continue');
        return;
      }

      setIsSubmitting(true);

      const profileData = {
        age: parseInt(formData.age),
        gender: formData.gender,
        height: parseInt(formData.height),
        weight: parseInt(formData.weight),
        goal: formData.goal,
        bmi: calculatedData.bmi,
        daily_targets: calculatedData.dailyTargets,
      };

      console.log('Profile data to submit:', profileData);

      let userProfile: UserProfile | null = null;

      try {
        userProfile = await createUserProfile(currentUser, profileData);
        console.log('Profile created successfully!');
      } catch (profileError) {
        console.warn('Profile creation failed, but continuing:', profileError);
        // Continue anyway - the user can still use the app
      }

      // Create a local user profile if Supabase creation failed
      if (!userProfile) {
        userProfile = {
          id: currentUser.id,
          email: currentUser.email || '',
          display_name: currentUser.user_metadata?.full_name || 'User',
          avatar_url: currentUser.user_metadata?.avatar_url,
          age: parseInt(formData.age),
          gender: formData.gender,
          height: parseInt(formData.height),
          weight: parseInt(formData.weight),
          goal: formData.goal,
          bmi: calculatedData.bmi,
          activityLevel: 'moderately_active',
          daily_targets: calculatedData.dailyTargets,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      // Call onComplete with the user profile
      onComplete(userProfile);
    } catch (error) {
      console.error('Error creating profile:', error);
      alert(
        `Error creating profile: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return (
        formData.age &&
        formData.gender &&
        formData.height &&
        formData.weight &&
        formData.goal
      );
    }
    return true;
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal Weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep} of 3
              </span>
              <span className="text-sm text-gray-500">Onboarding</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Your Details
                </h2>
                <p className="text-gray-600 mb-6">
                  Help us personalize your nutrition plan by providing some
                  basic information.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age (years)
                    </label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => updateFormData('age', e.target.value)}
                      className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 placeholder-gray-400"
                      placeholder="25"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        updateFormData(
                          'gender',
                          e.target.value as 'male' | 'female' | 'other'
                        )
                      }
                      className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) => updateFormData('height', e.target.value)}
                      className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 placeholder-gray-400"
                      placeholder="170"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => updateFormData('weight', e.target.value)}
                      className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 placeholder-gray-400"
                      placeholder="70"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Goal
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        value: 'lose',
                        label: 'Lose Weight',
                        color: 'bg-red-50 text-red-700 border-red-200',
                      },
                      {
                        value: 'maintain',
                        label: 'Maintain Weight',
                        color: 'bg-orange-50 text-orange-700 border-orange-200',
                      },
                      {
                        value: 'gain',
                        label: 'Gain Weight',
                        color: 'bg-orange-50 text-orange-700 border-orange-200',
                      },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          updateFormData(
                            'goal',
                            option.value as 'lose' | 'maintain' | 'gain'
                          )
                        }
                        className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                          formData.goal === option.value
                            ? `border-orange-500 ${option.color}`
                            : 'border-orange-200 hover:border-orange-300 bg-white text-gray-700 hover:bg-orange-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Your Personalized Plan
                </h2>
                <p className="text-gray-600 mb-6">
                  Based on your details, here's what we recommend for your daily
                  nutrition targets.
                </p>

                <div className="bg-orange-50 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Your BMI
                  </h3>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-orange-600 mb-2">
                      {calculatedData.bmi}
                    </div>
                    <div className="text-gray-600">
                      {getBMICategory(calculatedData.bmi)}
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Daily Nutrition Targets
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {calculatedData.dailyTargets.calories}
                      </div>
                      <div className="text-sm text-gray-600">Calories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {calculatedData.dailyTargets.protein}g
                      </div>
                      <div className="text-sm text-gray-600">Protein</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {calculatedData.dailyTargets.carbs}g
                      </div>
                      <div className="text-sm text-gray-600">Carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {calculatedData.dailyTargets.fat}g
                      </div>
                      <div className="text-sm text-gray-600">Fat</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  You're All Set!
                </h2>
                <p className="text-gray-600 mb-6">
                  Your personalized nutrition plan is ready. Let's start
                  tracking your progress!
                </p>

                <div className="bg-green-50 rounded-xl p-6 mb-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconCheck className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Profile Created Successfully
                    </h3>
                    <p className="text-gray-600">
                      Your goals and targets have been saved and personalized
                      just for you.
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-4">
                    You can always update these settings later from your
                    profile.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
            >
              <IconArrowLeft className="w-4 h-4" />
              Back
            </button>

            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <IconArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Setting up...' : 'Get Started'}
                <IconArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
