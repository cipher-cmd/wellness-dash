import { supabase } from './supabase';

export interface WeightEntry {
  id: string;
  user_id: string;
  weight: number;
  date: string;
  notes?: string;
  created_at: string;
}

export interface WeightGoal {
  id: string;
  user_id: string;
  target_weight: number;
  goal_type: 'lose' | 'gain' | 'maintain';
  created_at: string;
}

export class WeightTrackingService {
  static async getWeightEntries(userId: string): Promise<WeightEntry[]> {
    try {
      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        // Handle missing table error gracefully
        if (error.code === '42P01') { // Table doesn't exist
          console.warn('Weight tracking table not found - feature not yet set up');
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching weight entries:', error);
      return [];
    }
  }

  static async addWeightEntry(entry: Omit<WeightEntry, 'id' | 'created_at'>): Promise<WeightEntry | null> {
    try {
      const { data, error } = await supabase
        .from('weight_entries')
        .insert([entry])
        .select()
        .single();

      if (error) {
        // Handle missing table error gracefully
        if (error.code === '42P01') { // Table doesn't exist
          console.warn('Weight tracking table not found - feature not yet set up');
          // Return mock data for now
          return {
            id: Date.now().toString(),
            ...entry,
            created_at: new Date().toISOString(),
          };
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error adding weight entry:', error);
      return null;
    }
  }

  static async getLatestWeight(userId: string): Promise<WeightEntry | null> {
    try {
      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === '42P01') {
          return null;
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error fetching latest weight:', error);
      return null;
    }
  }

  static async shouldShowWeightReminder(userId: string): Promise<boolean> {
    try {
      const latestEntry = await this.getLatestWeight(userId);
      if (!latestEntry) return true;

      const daysSinceLastEntry = Math.floor(
        (Date.now() - new Date(latestEntry.date).getTime()) / (1000 * 60 * 60 * 24)
      );

      return daysSinceLastEntry >= 7;
    } catch (error) {
      console.error('Error checking weight reminder:', error);
      return false;
    }
  }

  static async getWeightTrend(userId: string): Promise<WeightEntry[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching weight trend:', error);
      return [];
    }
  }

  static calculateWeightChange(entries: WeightEntry[]): {
    totalChange: number;
    weeklyRate: number;
    trend: 'up' | 'down' | 'stable';
  } {
    if (entries.length < 2) {
      return { totalChange: 0, weeklyRate: 0, trend: 'stable' };
    }

    const sortedEntries = entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstWeight = sortedEntries[0].weight;
    const lastWeight = sortedEntries[sortedEntries.length - 1].weight;
    const totalChange = lastWeight - firstWeight;

    const daysBetween = Math.floor(
      (new Date(sortedEntries[sortedEntries.length - 1].date).getTime() - new Date(sortedEntries[0].date).getTime()) / (1000 * 60 * 60 * 24)
    );

    const weeklyRate = daysBetween > 0 ? (totalChange / daysBetween) * 7 : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(totalChange) > 0.1) {
      trend = totalChange > 0 ? 'up' : 'down';
    }

    return { totalChange, weeklyRate, trend };
  }

  static async getWeightGoal(userId: string): Promise<WeightGoal | null> {
    try {
      const { data, error } = await supabase
        .from('weight_goals')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === '42P01') {
          return null;
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error fetching weight goal:', error);
      return null;
    }
  }

  static async setWeightGoal(goal: Omit<WeightGoal, 'id' | 'created_at'>): Promise<WeightGoal | null> {
    try {
      const { data, error } = await supabase
        .from('weight_goals')
        .upsert([goal], { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        if (error.code === '42P01') {
          console.warn('Weight goals table not found - feature not yet set up');
          return {
            id: Date.now().toString(),
            ...goal,
            created_at: new Date().toISOString(),
          };
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error setting weight goal:', error);
      return null;
    }
  }
}
