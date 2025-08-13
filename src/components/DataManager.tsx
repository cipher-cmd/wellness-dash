import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  IconDownload,
  IconUpload,
  IconTrash,
  IconFileExport,
  IconFileImport,
} from '@tabler/icons-react';
import { LocalStorageService } from '../lib/localStorage';

interface DataManagerProps {
  onClose: () => void;
}

export default function DataManager({ onClose }: DataManagerProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const exportData = async () => {
    setIsExporting(true);
    try {
      const data = {
        user: LocalStorageService.getUser(),
        goals: LocalStorageService.getGoals(),
        preferences: LocalStorageService.getPreferences(),
        diaryEntries: LocalStorageService.getDiaryEntries(),
        foods: LocalStorageService.getFoods(),
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wellnessdash-data-${
        new Date().toISOString().split('T')[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Data exported successfully!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to export data. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const importData = async () => {
    if (!importFile) return;

    setIsImporting(true);
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);

      // Validate data structure
      if (!data.version || !data.user) {
        throw new Error('Invalid data format');
      }

      // Import data
      if (data.user) LocalStorageService.saveUser(data.user);
      if (data.goals) LocalStorageService.saveGoals(data.goals);
      if (data.preferences)
        LocalStorageService.savePreferences(data.preferences);
      if (data.diaryEntries)
        LocalStorageService.saveDiaryEntries(data.diaryEntries);
      if (data.foods) LocalStorageService.saveFoods(data.foods);

      setMessage({
        type: 'success',
        text: 'Data imported successfully! Please refresh the page.',
      });
      setImportFile(null);
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to import data. Please check the file format.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const clearAllData = () => {
    if (
      confirm(
        'Are you sure you want to clear all data? This action cannot be undone.'
      )
    ) {
      LocalStorageService.clearAll();
      setMessage({ type: 'success', text: 'All data cleared successfully!' });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      setImportFile(file);
    } else {
      setMessage({ type: 'error', text: 'Please select a valid JSON file.' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Data Management</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <IconTrash className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Export Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <IconFileExport className="w-5 h-5" />
            Export Data
          </h3>
          <p className="text-gray-600 text-sm mb-3">
            Download all your nutrition data, goals, and preferences as a JSON
            file.
          </p>
          <button
            onClick={exportData}
            disabled={isExporting}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
          >
            <IconDownload className="w-5 h-5" />
            {isExporting ? 'Exporting...' : 'Export Data'}
          </button>
        </div>

        {/* Import Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <IconFileImport className="w-5 h-5" />
            Import Data
          </h3>
          <p className="text-gray-600 text-sm mb-3">
            Import previously exported data to restore your nutrition history.
          </p>
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
            id="import-file"
          />
          <label
            htmlFor="import-file"
            className="block w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-medium text-center cursor-pointer hover:bg-gray-200 transition-colors mb-3"
          >
            <IconUpload className="w-5 h-5 inline mr-2" />
            Choose File
          </label>
          {importFile && (
            <div className="text-sm text-gray-600 mb-3">
              Selected: {importFile.name}
            </div>
          )}
          <button
            onClick={importData}
            disabled={!importFile || isImporting}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
          >
            <IconUpload className="w-5 h-5" />
            {isImporting ? 'Importing...' : 'Import Data'}
          </button>
        </div>

        {/* Clear Data Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
            <IconTrash className="w-5 h-5" />
            Clear All Data
          </h3>
          <p className="text-gray-600 text-sm mb-3">
            Permanently delete all your data. This action cannot be undone.
          </p>
          <button
            onClick={clearAllData}
            className="w-full bg-red-500 text-white px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-600 transition-all"
          >
            <IconTrash className="w-5 h-5" />
            Clear All Data
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors mt-4"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}
