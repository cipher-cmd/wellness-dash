import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  rounded?: string;
}

export const Skeleton = ({ 
  className = '', 
  height = 'h-4', 
  width = 'w-full', 
  rounded = 'rounded' 
}: SkeletonProps) => (
  <motion.div
    className={`bg-gray-200 animate-pulse ${height} ${width} ${rounded} ${className}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  />
);

export const MealSectionSkeleton = () => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
    <div className="flex items-center gap-3 mb-4">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-5 w-24 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
    
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="w-16 h-8 rounded-lg" />
        </div>
      ))}
    </div>
    
    <div className="mt-4 pt-4 border-t border-gray-100">
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  </div>
);

export const DailySummarySkeleton = () => (
  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
    <div className="text-center mb-6">
      <Skeleton className="h-8 w-48 mx-auto mb-3" />
      <Skeleton className="h-5 w-64 mx-auto" />
    </div>
    
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="text-center">
          <Skeleton className="w-16 h-16 rounded-full mx-auto mb-3" />
          <Skeleton className="h-5 w-20 mx-auto mb-2" />
          <Skeleton className="h-4 w-16 mx-auto" />
        </div>
      ))}
    </div>
  </div>
);

export const NavigationSkeleton = () => (
  <div className="bg-white border-b border-gray-200 px-4 py-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Skeleton className="w-32 h-8" />
        <div className="hidden sm:flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-20 h-10 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="w-24 h-10 rounded-lg" />
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>
    </div>
  </div>
);

export const PageSkeleton = () => (
  <div className="min-h-screen bg-slate-50">
    <NavigationSkeleton />
    <main className="container mx-auto px-4 py-6 max-w-6xl">
      <DailySummarySkeleton />
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <MealSectionSkeleton />
        <MealSectionSkeleton />
        <MealSectionSkeleton />
        <MealSectionSkeleton />
      </div>
    </main>
  </div>
);
