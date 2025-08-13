import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconKeyboard, IconX } from '@tabler/icons-react';

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
}

interface KeyboardShortcutsProps {
  onAddFood: () => void;
  onGenerateMealPlan: () => void;
  onOpenProfile: () => void;
  onToggleGoals: () => void;
  onToggleProgress: () => void;
}

export default function KeyboardShortcuts({
  onAddFood,
  onGenerateMealPlan,
  onOpenProfile,
  onToggleGoals,
  onToggleProgress,
}: KeyboardShortcutsProps) {
  const [showShortcuts, setShowShortcuts] = useState(false);

  const shortcuts: Shortcut[] = [
    { key: 'A', description: 'Add Food', action: onAddFood },
    { key: 'M', description: 'Generate Meal Plan', action: onGenerateMealPlan },
    { key: 'P', description: 'Open Profile', action: onOpenProfile },
    { key: 'G', description: 'Go to Goals', action: onToggleGoals },
    { key: 'R', description: 'Go to Progress', action: onToggleProgress },
    {
      key: '?',
      description: 'Show/Hide Shortcuts',
      action: () => setShowShortcuts(!showShortcuts),
    },
    {
      key: 'Escape',
      description: 'Close Modals',
      action: () => setShowShortcuts(false),
    },
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const shortcut = shortcuts.find((s) => s.key.toLowerCase() === key);

      if (shortcut && !event.ctrlKey && !event.altKey && !event.metaKey) {
        event.preventDefault();
        shortcut.action();
      }

      // Show shortcuts help with Ctrl+?
      if (event.ctrlKey && event.key === '?') {
        event.preventDefault();
        setShowShortcuts(true);
      }

      // Close with Escape
      if (event.key === 'Escape') {
        setShowShortcuts(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  if (!showShortcuts) {
    return (
      <button
        onClick={() => setShowShortcuts(true)}
        className="fixed bottom-4 left-4 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors z-40"
        title="Keyboard Shortcuts (Ctrl+?)"
      >
        <IconKeyboard className="w-5 h-5" />
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        onClick={() => setShowShortcuts(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <IconKeyboard className="w-6 h-6" />
              Keyboard Shortcuts
            </h2>
            <button
              onClick={() => setShowShortcuts(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <IconX className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <motion.div
                key={shortcut.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-gray-700">{shortcut.description}</span>
                <kbd className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-sm font-mono">
                  {shortcut.key}
                </kbd>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Pro Tips:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • Use <kbd className="px-1 bg-blue-200 rounded">Ctrl+?</kbd> to
                show shortcuts anytime
              </li>
              <li>
                • Press <kbd className="px-1 bg-blue-200 rounded">Escape</kbd>{' '}
                to close modals
              </li>
              <li>• Shortcuts work from anywhere in the app</li>
            </ul>
          </div>

          <button
            onClick={() => setShowShortcuts(false)}
            className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors mt-4"
          >
            Got it!
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
