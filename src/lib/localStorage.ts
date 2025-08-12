// Local Storage Service for persisting user data
export class LocalStorageService {
  private static readonly USER_KEY = 'wellnessdash_user';
  private static readonly GOALS_KEY = 'wellnessdash_goals';
  private static readonly PREFERENCES_KEY = 'wellnessdash_preferences';
  private static readonly DIARY_KEY = 'wellnessdash_diary';
  private static readonly FOODS_KEY = 'wellnessdash_foods';

  // User Profile Management
  static saveUser(user: any): void {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user to localStorage:', error);
    }
  }

  static getUser(): any | null {
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get user from localStorage:', error);
      return null;
    }
  }

  static updateUser(updates: Partial<any>): void {
    try {
      const currentUser = this.getUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...updates };
        this.saveUser(updatedUser);
      }
    } catch (error) {
      console.error('Failed to update user in localStorage:', error);
    }
  }

  static clearUser(): void {
    try {
      localStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.error('Failed to clear user from localStorage:', error);
    }
  }

  // Goals Management
  static saveGoals(goals: any): void {
    try {
      localStorage.setItem(this.GOALS_KEY, JSON.stringify(goals));
    } catch (error) {
      console.error('Failed to save goals to localStorage:', error);
    }
  }

  static getGoals(): any | null {
    try {
      const goalsData = localStorage.getItem(this.GOALS_KEY);
      return goalsData ? JSON.parse(goalsData) : null;
    } catch (error) {
      console.error('Failed to get goals from localStorage:', error);
      return null;
    }
  }

  static updateGoals(updates: Partial<any>): void {
    try {
      const currentGoals = this.getGoals();
      if (currentGoals) {
        const updatedGoals = { ...currentGoals, ...updates };
        this.saveGoals(updatedGoals);
      }
    } catch (error) {
      console.error('Failed to update goals in localStorage:', error);
    }
  }

  // Preferences Management
  static savePreferences(preferences: any): void {
    try {
      localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save preferences to localStorage:', error);
    }
  }

  static getPreferences(): any | null {
    try {
      const prefsData = localStorage.getItem(this.PREFERENCES_KEY);
      return prefsData ? JSON.parse(prefsData) : null;
    } catch (error) {
      console.error('Failed to get preferences from localStorage:', error);
    }
  }

  static updatePreferences(updates: Partial<any>): void {
    try {
      const currentPrefs = this.getPreferences();
      if (currentPrefs) {
        const updatedPrefs = { ...currentPrefs, ...updates };
        this.savePreferences(updatedPrefs);
      }
    } catch (error) {
      console.error('Failed to update preferences in localStorage:', error);
    }
  }

  // Diary Entries Management
  static saveDiaryEntries(entries: any[]): void {
    try {
      localStorage.setItem(this.DIARY_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save diary entries to localStorage:', error);
    }
  }

  static getDiaryEntries(): any[] {
    try {
      const entriesData = localStorage.getItem(this.DIARY_KEY);
      return entriesData ? JSON.parse(entriesData) : [];
    } catch (error) {
      console.error('Failed to get diary entries from localStorage:', error);
      return [];
    }
  }

  static addDiaryEntry(entry: any): void {
    try {
      const entries = this.getDiaryEntries();
      entries.push(entry);
      this.saveDiaryEntries(entries);
    } catch (error) {
      console.error('Failed to add diary entry to localStorage:', error);
    }
  }

  static updateDiaryEntry(id: number, updates: Partial<any>): void {
    try {
      const entries = this.getDiaryEntries();
      const index = entries.findIndex(entry => entry.id === id);
      if (index !== -1) {
        entries[index] = { ...entries[index], ...updates };
        this.saveDiaryEntries(entries);
      }
    } catch (error) {
      console.error('Failed to update diary entry in localStorage:', error);
    }
  }

  static deleteDiaryEntry(id: number): void {
    try {
      const entries = this.getDiaryEntries();
      const filteredEntries = entries.filter(entry => entry.id !== id);
      this.saveDiaryEntries(filteredEntries);
    } catch (error) {
      console.error('Failed to delete diary entry from localStorage:', error);
    }
  }

  // Foods Management
  static saveFoods(foods: any[]): void {
    try {
      localStorage.setItem(this.FOODS_KEY, JSON.stringify(foods));
    } catch (error) {
      console.error('Failed to save foods to localStorage:', error);
    }
  }

  static getFoods(): any[] {
    try {
      const foodsData = localStorage.getItem(this.FOODS_KEY);
      return foodsData ? JSON.parse(foodsData) : [];
    } catch (error) {
      console.error('Failed to get foods from localStorage:', error);
      return [];
    }
  }

  static addFood(food: any): void {
    try {
      const foods = this.getFoods();
      foods.push(food);
      this.saveFoods(foods);
    } catch (error) {
      console.error('Failed to add food to localStorage:', error);
    }
  }

  // Utility Methods
  static clearAll(): void {
    try {
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.GOALS_KEY);
      localStorage.removeItem(this.PREFERENCES_KEY);
      localStorage.removeItem(this.DIARY_KEY);
      localStorage.removeItem(this.FOODS_KEY);
      console.log('✅ All WellnessDash data cleared from localStorage');
    } catch (error) {
      console.error('Failed to clear all data from localStorage:', error);
    }
  }

  static getStorageSize(): string {
    try {
      let totalSize = 0;
      const keys = [
        this.USER_KEY,
        this.GOALS_KEY,
        this.PREFERENCES_KEY,
        this.DIARY_KEY,
        this.FOODS_KEY
      ];

      keys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          totalSize += new Blob([data]).size;
        }
      });

      if (totalSize < 1024) {
        return `${totalSize} B`;
      } else if (totalSize < 1024 * 1024) {
        return `${(totalSize / 1024).toFixed(2)} KB`;
      } else {
        return `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
      }
    } catch (error) {
      console.error('Failed to calculate storage size:', error);
      return 'Unknown';
    }
  }

  static exportData(): any {
    try {
      return {
        user: this.getUser(),
        goals: this.getGoals(),
        preferences: this.getPreferences(),
        diary: this.getDiaryEntries(),
        foods: this.getFoods(),
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  }

  static importData(data: any): boolean {
    try {
      if (data.user) this.saveUser(data.user);
      if (data.goals) this.saveGoals(data.goals);
      if (data.preferences) this.savePreferences(data.preferences);
      if (data.diary) this.saveDiaryEntries(data.diary);
      if (data.foods) this.saveFoods(data.foods);
      
      console.log('✅ Data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  // Check if localStorage is available
  static isAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // Initialize default data if none exists
  static initializeDefaults(): void {
    try {
      if (!this.getUser()) {
        const defaultUser = {
          id: 'local-dev',
          email: 'dev@local.com',
          display_name: 'Local Developer',
          age: 25,
          gender: 'male',
          height: 170,
          weight: 70,
          bmi: 24.2,
          goal: 'maintain',
          daily_targets: {
            calories: 2000,
            protein: 150,
            carbs: 250,
            fat: 65,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.saveUser(defaultUser);
      }

      if (!this.getGoals()) {
        const defaultGoals = {
          kcal: 2000,
          protein: 150,
          carbs: 250,
          fat: 65,
        };
        this.saveGoals(defaultGoals);
      }

      if (!this.getPreferences()) {
        const defaultPreferences = {
          theme: 'light',
          language: 'en',
          notifications: true,
          autoSave: true,
        };
        this.savePreferences(defaultPreferences);
      }

      console.log('✅ Default data initialized');
    } catch (error) {
      console.error('Failed to initialize defaults:', error);
    }
  }
}
