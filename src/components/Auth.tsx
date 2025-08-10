import { motion } from 'framer-motion';
import { IconBrandGoogle } from '@tabler/icons-react';
import { signInWithGoogle } from '../lib/supabaseAuth';

interface AuthProps {
  onSignInSuccess: () => void;
}

export default function Auth({ onSignInSuccess }: AuthProps) {
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      onSignInSuccess();
    } catch (error) {
      console.error('Sign in error:', error);
      // You can add error handling UI here
    }
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
            <p className="text-gray-600">
              Sign in to start your nutrition journey
            </p>
          </div>

          {/* Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-white border-2 border-marigold-200 hover:border-marigold-400 text-marigold-700 px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-3 transition-all duration-200 hover:shadow-md"
          >
            <IconBrandGoogle className="w-5 h-5" />
            Continue with Google
          </button>

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

          {/* Benefits */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Why sign in with Google?
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-marigold-400 rounded-full"></span>
                Fast and secure authentication
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-marigold-400 rounded-full"></span>
                No need to remember passwords
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-marigold-400 rounded-full"></span>
                Your data stays private and secure
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
