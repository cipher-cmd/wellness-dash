import { motion } from 'framer-motion';
import { IconBrain, IconHeart, IconTarget } from '@tabler/icons-react';

export default function AnimatedGradientHeader() {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-marigold via-orange-500 to-red-500 text-white shadow-2xl">
      {/* Floating Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-20 right-20 w-16 h-16 bg-white/10 rounded-full blur-xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.6, 0.3, 0.6],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
        <motion.div
          className="absolute bottom-10 left-1/3 w-12 h-12 bg-white/10 rounded-full blur-xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
      </div>

      {/* Main Header Content */}
      <div className="relative container mx-auto px-2 sm:px-3 md:px-4 lg:px-6 py-4 sm:py-6 md:py-8 lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-full overflow-hidden"
        >
          <motion.h1
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-6xl font-bold mb-2 sm:mb-3 lg:mb-4 flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <motion.button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('nav:change', { detail: { tab: 'diary' } })
                );
              }}
              className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 hover:bg-white/10 px-1.5 sm:px-3 md:px-4 py-1 sm:py-2 lg:py-2 rounded-xl transition-colors"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <img
                src="/logo.png"
                alt="WellnessDash"
                className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 lg:w-16 lg:h-16 rounded flex-shrink-0"
              />
              <span className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-4xl font-bold truncate max-w-[90px] sm:max-w-[120px] md:max-w-[160px] lg:max-w-none">
                WellnessDash
              </span>
            </motion.button>
          </motion.h1>
          <motion.p
            className="text-xs sm:text-sm md:text-base lg:text-xl text-marigold-50 font-medium mb-2 sm:mb-3 md:mb-4 lg:mb-6 px-1 sm:px-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            India-first nutrition tracker — Intelligent Vitality
          </motion.p>

          {/* Feature Icons */}
          <motion.div
            className="flex justify-center gap-2 sm:gap-4 md:gap-6 lg:gap-12 mt-3 sm:mt-4 md:mt-6 lg:mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <motion.button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('nav:change', { detail: { tab: 'diary' } })
                );
              }}
              className="flex flex-col items-center gap-1.5 sm:gap-2 md:gap-3 px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-3 lg:py-4 rounded-xl hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <IconBrain className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-12 lg:h-12 text-marigold-100" />
              <span className="text-xs sm:text-sm md:text-base lg:text-lg text-marigold-100 font-medium text-center leading-tight">
                Smart Tracking
              </span>
            </motion.button>
            <motion.button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('nav:change', { detail: { tab: 'goals' } })
                );
              }}
              className="flex flex-col items-center gap-1.5 sm:gap-2 md:gap-3 px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-3 lg:py-4 rounded-xl hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <IconHeart className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-12 lg:h-12 text-marigold-100" />
              <span className="text-xs sm:text-sm md:text-base lg:text-lg text-marigold-100 font-medium text-center leading-tight">
                Healthy Living
              </span>
            </motion.button>
            <motion.button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('nav:change', { detail: { tab: 'progress' } })
                );
              }}
              className="flex flex-col items-center gap-1.5 sm:gap-2 md:gap-3 px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-3 lg:py-4 rounded-xl hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <IconTarget className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-12 lg:h-12 text-marigold-100" />
              <span className="text-xs sm:text-sm md:text-base lg:text-lg text-marigold-100 font-medium text-center leading-tight">
                Goal Achievement
              </span>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </header>
  );
}
