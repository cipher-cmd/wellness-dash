import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IconAlertTriangle, IconCheck, IconX } from '@tabler/icons-react';

interface CompatibilityCheck {
  name: string;
  test: () => boolean;
  required: boolean;
  description: string;
}

export default function BrowserCompatibility() {
  const [isVisible, setIsVisible] = useState(false);
  const [checks, setChecks] = useState<
    Array<CompatibilityCheck & { passed: boolean }>
  >([]);

  const compatibilityChecks: CompatibilityCheck[] = [
    {
      name: 'Service Worker',
      test: () => 'serviceWorker' in navigator,
      required: true,
      description: 'Required for offline functionality and PWA features',
    },
    {
      name: 'IndexedDB',
      test: () => 'indexedDB' in window,
      required: true,
      description: 'Required for local data storage',
    },
    {
      name: 'Web App Manifest',
      test: () => 'standalone' in navigator,
      required: false,
      description: 'Enables app installation on mobile devices',
    },
    {
      name: 'Push Notifications',
      test: () => 'PushManager' in window,
      required: false,
      description: 'Enables push notifications for meal reminders',
    },
    {
      name: 'Background Sync',
      test: () =>
        'serviceWorker' in navigator &&
        'sync' in window.ServiceWorkerRegistration?.prototype,
      required: false,
      description: 'Enables background data synchronization',
    },
    {
      name: 'Modern JavaScript',
      test: () => {
        try {
          new Function('() => {}');
          return true;
        } catch {
          return false;
        }
      },
      required: true,
      description: 'Required for app functionality',
    },
    {
      name: 'CSS Grid & Flexbox',
      test: () =>
        CSS.supports('display', 'grid') && CSS.supports('display', 'flex'),
      required: true,
      description: 'Required for responsive layout',
    },
    {
      name: 'Web Animations',
      test: () => 'animate' in Element.prototype,
      required: false,
      description: 'Enables smooth animations and transitions',
    },
  ];

  useEffect(() => {
    const runChecks = () => {
      const results = compatibilityChecks.map((check) => ({
        ...check,
        passed: check.test(),
      }));

      setChecks(results);

      // Show compatibility check if any required features are missing
      const hasRequiredFailures = results.some(
        (check) => check.required && !check.passed
      );
      setIsVisible(hasRequiredFailures);
    };

    // Run checks after a short delay to ensure DOM is ready
    const timer = setTimeout(runChecks, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const failedRequired = checks.filter(
    (check) => check.required && !check.passed
  );
  const failedOptional = checks.filter(
    (check) => !check.required && !check.passed
  );
  const passed = checks.filter((check) => check.passed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconAlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Browser Compatibility Check
          </h2>
          <p className="text-gray-600">
            Some features may not work properly on your current browser
          </p>
        </div>

        {/* Required Features */}
        {failedRequired.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
              <IconX className="w-5 h-5" />
              Required Features (Missing)
            </h3>
            <div className="space-y-3">
              {failedRequired.map((check) => (
                <div
                  key={check.name}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-red-800">
                      {check.name}
                    </span>
                    <IconX className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-sm text-red-700">{check.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optional Features */}
        {failedOptional.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
              <IconAlertTriangle className="w-5 h-5" />
              Optional Features (Missing)
            </h3>
            <div className="space-y-3">
              {failedOptional.map((check) => (
                <div
                  key={check.name}
                  className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-yellow-800">
                      {check.name}
                    </span>
                    <IconAlertTriangle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <p className="text-sm text-yellow-700">{check.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Working Features */}
        {passed.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
              <IconCheck className="w-5 h-5" />
              Working Features
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {passed.map((check) => (
                <div
                  key={check.name}
                  className="p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-green-800">
                      {check.name}
                    </span>
                    <IconCheck className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-sm text-green-700">{check.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">Recommendations:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Update to the latest version of your browser</li>
            <li>• Use Chrome, Firefox, Safari, or Edge for best experience</li>
            <li>• Enable JavaScript and cookies</li>
            {failedRequired.length > 0 && (
              <li className="font-semibold text-red-700">
                ⚠️ Some required features are missing. The app may not work
                properly.
              </li>
            )}
          </ul>
        </div>

        <button
          onClick={() => setIsVisible(false)}
          className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
        >
          Continue Anyway
        </button>
      </motion.div>
    </motion.div>
  );
}
