import { motion } from 'framer-motion';
import { IconHome, IconSearch, IconArrowLeft } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-marigold-50 via-white to-mint-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-32 h-32 bg-gradient-to-br from-marigold-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <span className="text-6xl">🍽️</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-6xl font-bold text-gray-900 mb-4"
          >
            404
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-semibold text-gray-800 mb-3"
          >
            Page Not Found
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-gray-600 mb-8"
          >
            The page you're looking for doesn't exist. Maybe it got lost in the
            kitchen?
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <Link
            to="/"
            className="block w-full bg-gradient-to-r from-marigold-500 to-orange-500 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:from-marigold-600 hover:to-orange-600 transition-all"
          >
            <IconHome className="w-5 h-5" />
            Go to Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
          >
            <IconArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 p-4 bg-white rounded-xl border border-gray-200"
        >
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <IconSearch className="w-4 h-4" />
            <span>Looking for something specific? Try our search feature!</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
