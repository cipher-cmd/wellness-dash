import { supabase } from './supabase';

export interface WeightEntry {
  id?: string;
  user_id: string;
  weight: number; // in kg
  date: string; // ISO date string
  notes?: string;
  created_at?: string;
}

export interface WeightGoal {
  user_id: string;
  target_weight: number;
  target_date?: string;
  current_weight: number;
  goal_type: 'lose' | 'maintain' | 'gain';
  weekly_target?: number; // kg per week
}

export class WeightTrackingService {
  // Get all weight entries for a user
  static async getWeightEntries(userId: string): Promise<WeightEntry[]> {
    try {
      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        // Handle missing table error gracefully
        if (error.code === '42P01') {
          // Table doesn't exist
          console.warn(
            'Weight tracking table not found - feature not yet set up'
          );
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

  // Add a new weight entry
  static async addWeightEntry(
    entry: Omit<WeightEntry, 'id' | 'created_at'>
  ): Promise<WeightEntry | null> {
    try {
      const { data, error } = await supabase
        .from('weight_entries')
        .insert([entry])
        .select()
        .single();

      if (error) {
        // Handle missing table error gracefully
        if (error.code === '42P01') {
          // Table doesn't exist
          console.warn(
            'Weight tracking table not found - feature not yet set up'
          );
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

  // Get the latest weight entry
  static async getLatestWeight(userId: string): Promise<WeightEntry | null> {
    try {
      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching latest weight:', error);
      return null;
    }
  }

  // Check if user needs weight reminder (weekly)
  static async shouldShowWeightReminder(userId: string): Promise<boolean> {
    try {
      const latestEntry = await this.getLatestWeight(userId);

      if (!latestEntry) {
        // No weight entries yet - show reminder
        return true;
      }

      const lastEntryDate = new Date(latestEntry.date);
      const today = new Date();
      const daysSinceLastEntry = Math.floor(
        (today.getTime() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Show reminder if it's been more than 7 days
      return daysSinceLastEntry >= 7;
    } catch (error) {
      console.error('Error checking weight reminder:', error);
      return true;
    }
  }

  // Get weight trend (last 30 days)
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

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching weight trend:', error);
      return [];
    }
  }

  // Calculate weight change over time
  static calculateWeightChange(entries: WeightEntry[]): {
    totalChange: number;
    weeklyChange: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    if (entries.length < 2) {
      return { totalChange: 0, weeklyChange: 0, trend: 'stable' };
    }

    const sortedEntries = entries.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const firstWeight = sortedEntries[0].weight;
    const lastWeight = sortedEntries[sortedEntries.length - 1].weight;
    const totalChange = lastWeight - firstWeight;

    // Calculate weekly change
    const firstDate = new Date(sortedEntries[0].date);
    const lastDate = new Date(sortedEntries[sortedEntries.length - 1].date);
    const weeksDiff =
      (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 7);
    const weeklyChange = weeksDiff > 0 ? totalChange / weeksDiff : 0;

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (Math.abs(totalChange) > 0.5) {
      trend = totalChange > 0 ? 'increasing' : 'decreasing';
    }

    return { totalChange, weeklyChange, trend };
  }

  // Get weight goal for user
  static async getWeightGoal(userId: string): Promise<WeightGoal | null> {
    try {
      const { data, error } = await supabase
        .from('weight_goals')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching weight goal:', error);
      return null;
    }
  }

  // Set or update weight goal
  static async setWeightGoal(goal: WeightGoal): Promise<WeightGoal | null> {
    try {
      const { data, error } = await supabase
        .from('weight_goals')
        .upsert([goal], { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error setting weight goal:', error);
      return null;
    }
  }
}
