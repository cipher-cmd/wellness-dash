import { motion } from 'framer-motion';
import { IconBrandGoogle, IconUser } from '@tabler/icons-react';

interface LocalAuthProps {
  onSignInSuccess: () => void;
}

export default function LocalAuth({ onSignInSuccess }: LocalAuthProps) {
  const handleLocalSignIn = () => {
    // Simulate successful authentication
    console.log('✅ Local authentication successful');
    onSignInSuccess();
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4">
      {/* Custom Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/Background.PNG)' }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-marigold-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🍽️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to WellnessDash
            </h1>
            <p className="text-gray-600">Local Development Mode</p>
          </div>

          {/* Local Sign In Button */}
          <button
            onClick={handleLocalSignIn}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-3 transition-all duration-200 hover:shadow-md mb-4"
          >
            <IconUser className="w-5 h-5" />
            Continue as Local User
          </button>

          {/* Google Sign In Button (Disabled in local mode) */}
          <button
            disabled
            className="w-full bg-gray-300 text-gray-500 px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-3 cursor-not-allowed"
          >
            <IconBrandGoogle className="w-5 h-5" />
            Continue with Google (Disabled in Local Mode)
          </button>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Local Development Mode:</strong> Google OAuth is disabled
              to prevent redirect issues. Use "Continue as Local User" to test
              the app locally.
            </p>
          </div>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center mt-6">
            By continuing, you agree to our{' '}
            <a href="#" className="text-marigold-600 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-marigold-600 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
