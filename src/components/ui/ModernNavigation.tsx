import { motion } from 'framer-motion';
import {
  IconNotebook,
  IconPlus,
  IconTarget,
  IconTrendingUp,
  IconBrain,
} from '@tabler/icons-react';
import type { UserProfile as UserProfileType } from '../../lib/supabaseAuth';

interface ModernNavigationProps {
  activeTab: 'diary' | 'goals' | 'progress';
  onTabChange: (tab: 'diary' | 'goals' | 'progress') => void;
  onOpenAdd?: () => void;
  isAddOpen?: boolean;
  onGenerateMealPlan?: () => void;
  user?: UserProfileType;
  onLogout?: () => void;
}

export default function ModernNavigation({
  activeTab,
  onTabChange,
  onOpenAdd,
  isAddOpen,
  onGenerateMealPlan,
  user,
  onLogout,
}: ModernNavigationProps) {
  const tabs: Array<{
    id: 'diary' | 'goals' | 'progress';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'diary', label: 'Food Diary', icon: IconNotebook },
    { id: 'goals', label: 'Goals', icon: IconTarget },
    { id: 'progress', label: 'Progress', icon: IconTrendingUp },
  ];

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200/60 sticky top-0 z-40 py-6 sm:py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Mobile Layout - 2 Lines */}
        <div className="block sm:hidden">
          {/* Line 1 - Navigation Tabs */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-2xl border border-gray-200">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`relative px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                      isActive
                        ? 'text-white shadow-lg'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    style={
                      isActive
                        ? {
                            background:
                              'linear-gradient(to right, #f97316, #f97316)',
                          }
                        : {}
                    }
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-marigold-500 to-orange-500 -z-10"
                        initial={{ borderRadius: 12 }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}
                    <div className="relative flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      <span className="font-semibold">{tab.label}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Line 2 - Action Buttons */}
          <div className="flex items-center justify-center gap-3">
            {/* Add Food Button */}
            {onOpenAdd && (
              <motion.button
                onClick={onOpenAdd}
                className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-md ${
                  isAddOpen
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                    : 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 border border-orange-300 hover:from-orange-200 hover:to-orange-300 hover:text-orange-800'
                }`}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <IconPlus className="w-5 h-5" />
                  <span>Add Food</span>
                </div>
              </motion.button>
            )}

            {/* Generate Meal Plan Button */}
            {onGenerateMealPlan && (
              <motion.button
                onClick={onGenerateMealPlan}
                className="px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg hover:shadow-xl border border-purple-400"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <IconBrain className="w-5 h-5" />
                  <span>Generate Meal Plan</span>
                </div>
              </motion.button>
            )}

            {/* User Profile */}
            {user && onLogout && (
              <motion.button
                className="px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 hover:text-gray-800 border border-gray-300 shadow-md hover:shadow-lg"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {user.display_name
                        ? user.display_name.charAt(0).toUpperCase()
                        : 'U'}
                    </span>
                  </div>
                  <span>Profile</span>
                </div>
              </motion.button>
            )}
          </div>
        </div>

        {/* Desktop Layout - Single Line */}
        <div className="hidden sm:flex items-center justify-center">
          <div className="flex items-center gap-6">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-3xl border border-gray-200">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`relative px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-300 flex items-center gap-3 ${
                      isActive
                        ? 'text-white shadow-lg'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    style={
                      isActive
                        ? {
                            background:
                              'linear-gradient(to right, #f97316, #f97316)',
                          }
                        : {}
                    }
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-marigold-500 to-orange-500 -z-10"
                        initial={{ borderRadius: 16 }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}
                    <div className="relative flex items-center gap-3">
                      <Icon className="w-6 h-6" />
                      <span className="font-semibold">{tab.label}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Add Food Button */}
            {onOpenAdd && (
              <motion.button
                onClick={onOpenAdd}
                className={`px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-200 shadow-md ${
                  isAddOpen
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                    : 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 border border-orange-300 hover:from-orange-200 hover:to-orange-300 hover:text-orange-800'
                }`}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <IconPlus className="w-6 h-6" />
                  <span className="hidden sm:inline">Add Food</span>
                </div>
              </motion.button>
            )}

            {/* Generate Meal Plan Button */}
            {onGenerateMealPlan && (
              <motion.button
                onClick={onGenerateMealPlan}
                className="px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-200 bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg hover:shadow-xl border border-purple-400"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <IconBrain className="w-6 h-6" />
                  <span className="hidden sm:inline">Generate Meal Plan</span>
                </div>
              </motion.button>
            )}

            {/* User Profile */}
            {user && onLogout && (
              <motion.button
                className="px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-200 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 hover:text-gray-800 border border-gray-300 shadow-md hover:shadow-lg"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {user.display_name
                        ? user.display_name.charAt(0).toUpperCase()
                        : 'U'}
                    </span>
                  </div>
                  <span className="hidden sm:inline">Profile</span>
                </div>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
