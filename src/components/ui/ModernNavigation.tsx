import { motion } from 'framer-motion';
import {
  IconNotebook,
  IconPlus,
  IconTarget,
  IconTrendingUp,
} from '@tabler/icons-react';
import UserProfile from '../UserProfile';
import type { UserProfile as UserProfileType } from '../../lib/supabaseAuth';

interface ModernNavigationProps {
  activeTab: 'diary' | 'goals' | 'progress';
  onTabChange: (tab: 'diary' | 'goals' | 'progress') => void;
  onOpenAdd?: () => void;
  isAddOpen?: boolean;
  user?: UserProfileType;
  onLogout?: () => void;
  onProfileUpdate?: (updatedProfile: UserProfileType) => void;
}

export default function ModernNavigation({
  activeTab,
  onTabChange,
  onOpenAdd,
  isAddOpen,
  user,
  onLogout,
  onProfileUpdate,
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
    <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-40 py-4 sm:py-6">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Spacer for left side */}
          <div className="w-16 sm:w-24 lg:w-32"></div>

          {/* Centered Navigation Tabs */}
          <div className="flex-1 flex justify-center">
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 lg:gap-3 p-1.5 sm:p-2 lg:p-3 bg-white rounded-3xl shadow-lg border border-gray-100">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`relative px-2.5 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-2.5 md:py-3 lg:py-4 rounded-2xl font-bold text-xs sm:text-sm md:text-base lg:text-lg transition-all duration-200 min-h-[44px] flex items-center justify-center ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 bg-orange-500 rounded-2xl"
                        layoutId="activeTab"
                        transition={{
                          type: 'spring',
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}

                    <div className="relative flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-3">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                      <span className="text-xs sm:text-sm md:text-base lg:text-lg">
                        {tab.label}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Add Food Button */}
          <motion.button
            onClick={onOpenAdd}
            className={`ml-2 sm:ml-4 md:ml-6 lg:ml-8 px-2.5 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 rounded-2xl font-bold text-sm sm:text-base lg:text-lg transition-all duration-200 ${
              isAddOpen
                ? 'bg-orange-500 text-white'
                : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-1 sm:gap-2">
              <IconPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Add Food</span>
            </div>
          </motion.button>

          {/* User Profile - Moved further right with distinct styling */}
          {user && onLogout && (
            <div className="ml-4 sm:ml-6 md:ml-8 lg:ml-12 w-20 sm:w-28 md:w-32 lg:w-36 flex justify-end">
              <div className="rounded-2xl px-2 sm:px-3 md:px-4 py-1 sm:py-2 transition-all duration-200 hover:bg-slate-50 hover:text-slate-900">
                <UserProfile
                  user={user}
                  onLogout={onLogout}
                  onProfileUpdate={onProfileUpdate}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
