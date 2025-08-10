import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  IconDownload,
  IconUpload,
  IconDatabase,
  IconFileExport,
  IconFileImport,
  IconTrash,
  IconCheck,
  IconAlertTriangle,
  IconInfoCircle,
} from '@tabler/icons-react';
import { db } from '../../lib/db';

interface ExportData {
  version: string;
  timestamp: string;
  foods: any[];
  diary: any[];
  goals: any[];
  recipes: any[];
  mealPlans: any[];
  settings: any;
}

interface ImportResult {
  success: boolean;
  message: string;
  details?: {
    foods: number;
    diary: number;
    goals: number;
    recipes: number;
    mealPlans: number;
  };
}

export default function DataManager() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const exportData = useCallback(async () => {
    setIsExporting(true);
    try {
      // Collect all data from the database
      const [foods, diary, goals, recipes, mealPlans] = await Promise.all([
        db.foods.toArray(),
        db.diary.toArray(),
        db.goals.toArray(),
        db.recipes.toArray(),
        db.mealPlans.toArray(),
      ]);

      // Get settings from localStorage
      const settings = {
        goals: localStorage.getItem('wellnessdash_goals'),
        weightData: localStorage.getItem('wellnessdash_weight_data'),
        theme: localStorage.getItem('wellnessdash_theme'),
        preferences: localStorage.getItem('wellnessdash_preferences'),
      };

      const exportData: ExportData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        foods,
        diary,
        goals,
        recipes,
        mealPlans,
        settings,
      };

      // Create and download the file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `wellnessdash-backup-${
        new Date().toISOString().split('T')[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Show success message
      setImportResult({
        success: true,
        message: 'Data exported successfully!',
        details: {
          foods: foods.length,
          diary: diary.length,
          goals: goals.length,
          recipes: recipes.length,
          mealPlans: mealPlans.length,
        },
      });

      // Clear success message after 5 seconds
      setTimeout(() => setImportResult(null), 5000);
    } catch (error) {
      console.error('Export failed:', error);
      setImportResult({
        success: false,
        message: 'Export failed. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  }, []);

  const importData = useCallback(async (file: File) => {
    setIsImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const importData: ExportData = JSON.parse(text);

      // Validate the import data
      if (!importData.version || !importData.foods || !importData.diary) {
        throw new Error('Invalid backup file format');
      }

      // Clear existing data
      await Promise.all([
        db.foods.clear(),
        db.diary.clear(),
        db.goals.clear(),
        db.recipes.clear(),
        db.mealPlans.clear(),
      ]);

      // Import new data
      await Promise.all([
        db.foods.bulkAdd(importData.foods),
        db.diary.bulkAdd(importData.diary),
        db.goals.bulkAdd(importData.goals || []),
        db.recipes.bulkAdd(importData.recipes || []),
        db.mealPlans.bulkAdd(importData.mealPlans || []),
      ]);

      // Restore settings
      if (importData.settings) {
        Object.entries(importData.settings).forEach(([key, value]) => {
          if (value) {
            localStorage.setItem(`wellnessdash_${key}`, value as string);
          }
        });
      }

      setImportResult({
        success: true,
        message: 'Data imported successfully!',
        details: {
          foods: importData.foods.length,
          diary: importData.diary.length,
          goals: (importData.goals || []).length,
          recipes: (importData.recipes || []).length,
          mealPlans: (importData.mealPlans || []).length,
        },
      });

      // Clear success message after 5 seconds
      setTimeout(() => setImportResult(null), 5000);
    } catch (error) {
      console.error('Import failed:', error);
      setImportResult({
        success: false,
        message: `Import failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      });
    } finally {
      setIsImporting(false);
    }
  }, []);

  const clearAllData = useCallback(async () => {
    setIsClearing(true);
    try {
      // Clear database
      await Promise.all([
        db.foods.clear(),
        db.diary.clear(),
        db.goals.clear(),
        db.recipes.clear(),
        db.mealPlans.clear(),
      ]);

      // Clear localStorage
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith('wellnessdash_')
      );
      keys.forEach((key) => localStorage.removeItem(key));

      setImportResult({
        success: true,
        message: 'All data cleared successfully!',
      });

      setShowConfirmClear(false);

      // Clear success message after 5 seconds
      setTimeout(() => setImportResult(null), 5000);
    } catch (error) {
      console.error('Clear failed:', error);
      setImportResult({
        success: false,
        message: 'Failed to clear data. Please try again.',
      });
    } finally {
      setIsClearing(false);
    }
  }, []);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        importData(file);
      }
    },
    [importData]
  );

  const getDatabaseStats = useCallback(async () => {
    try {
      const [foods, diary, goals, recipes, mealPlans] = await Promise.all([
        db.foods.count(),
        db.diary.count(),
        db.goals.count(),
        db.recipes.count(),
        db.mealPlans.count(),
      ]);

      return { foods, diary, goals, recipes, mealPlans };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return { foods: 0, diary: 0, goals: 0, recipes: 0, mealPlans: 0 };
    }
  }, []);

  const [stats, setStats] = useState({
    foods: 0,
    diary: 0,
    goals: 0,
    recipes: 0,
    mealPlans: 0,
  });

  React.useEffect(() => {
    getDatabaseStats().then(setStats);
  }, [getDatabaseStats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <IconDatabase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Data Manager</h2>
            <p className="text-gray-600">
              Backup, restore, and manage your wellness data
            </p>
          </div>
        </div>
      </div>

      {/* Database Statistics */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Database Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.foods}
            </div>
            <div className="text-sm text-gray-600">Foods</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.diary}
            </div>
            <div className="text-sm text-gray-600">Diary Entries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats.goals}
            </div>
            <div className="text-sm text-gray-600">Goals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {stats.recipes}
            </div>
            <div className="text-sm text-gray-600">Recipes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {stats.mealPlans}
            </div>
            <div className="text-sm text-gray-600">Meal Plans</div>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <IconFileExport className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
        </div>
        <p className="text-gray-600 mb-4">
          Create a backup of all your wellness data including foods, diary
          entries, goals, recipes, and meal plans.
        </p>
        <button
          onClick={exportData}
          disabled={isExporting}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
        >
          {isExporting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Exporting...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <IconDownload className="w-4 h-4" />
              Export All Data
            </div>
          )}
        </button>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <IconFileImport className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Import Data</h3>
        </div>
        <p className="text-gray-600 mb-4">
          Restore your data from a backup file. This will replace all existing
          data.
        </p>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
            id="import-file"
          />
          <label
            htmlFor="import-file"
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <IconUpload className="w-4 h-4" />
              Choose Backup File
            </div>
          </label>
          {isImporting && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              Importing...
            </div>
          )}
        </div>
      </div>

      {/* Clear Data Section */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <IconTrash className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Clear All Data
          </h3>
        </div>
        <p className="text-gray-600 mb-4">
          Permanently delete all your wellness data. This action cannot be
          undone.
        </p>
        <button
          onClick={() => setShowConfirmClear(true)}
          className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
        >
          <div className="flex items-center gap-2">
            <IconTrash className="w-4 h-4" />
            Clear All Data
          </div>
        </button>
      </div>

      {/* Import Result */}
      {importResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-6 shadow-lg border ${
            importResult.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {importResult.success ? (
              <IconCheck className="w-6 h-6 text-green-600" />
            ) : (
              <IconAlertTriangle className="w-6 h-6 text-red-600" />
            )}
            <div>
              <h4
                className={`font-semibold ${
                  importResult.success ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {importResult.success ? 'Success!' : 'Error'}
              </h4>
              <p
                className={`text-sm ${
                  importResult.success ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {importResult.message}
              </p>
              {importResult.details && (
                <div className="mt-2 text-xs text-green-600">
                  Imported: {importResult.details.foods} foods,{' '}
                  {importResult.details.diary} diary entries,
                  {importResult.details.goals} goals,{' '}
                  {importResult.details.recipes} recipes,
                  {importResult.details.mealPlans} meal plans
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Confirmation Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <IconAlertTriangle className="w-8 h-8 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900">
                Confirm Data Deletion
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to permanently delete all your wellness
              data? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={clearAllData}
                disabled={isClearing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isClearing ? 'Clearing...' : 'Delete All Data'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <IconInfoCircle className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Data Management Tips
          </h3>
        </div>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• Export your data regularly to prevent data loss</p>
          <p>• Backup files contain all your personal wellness information</p>
          <p>• Importing will replace all existing data - use with caution</p>
          <p>• Data is stored locally on your device for privacy</p>
        </div>
      </div>
    </div>
  );
}
