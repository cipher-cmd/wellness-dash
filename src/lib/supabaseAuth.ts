import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

// User profile interface
export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // in cm
  weight: number; // in kg
  goal: 'lose' | 'maintain' | 'gain';
  bmi: number;
  activityLevel?:
    | 'sedentary'
    | 'lightly_active'
    | 'moderately_active'
    | 'very_active'
    | 'extremely_active';
  daily_targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  created_at: string;
  updated_at: string;
}

// Google Authentication
export const signInWithGoogle = async () => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) throw error;
    // OAuth flow redirects, so we don't return a user here
    return null;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Sync user profile with Google OAuth data
export const syncUserProfileWithGoogle = async (user: User) => {
  try {
    // Check if user profile exists
    const existingProfile = await getUserProfile(user.id);

    if (existingProfile) {
      // Update existing profile with latest Google data
      const updates: Partial<UserProfile> = {};

      if (
        user.user_metadata?.full_name &&
        user.user_metadata.full_name !== existingProfile.display_name
      ) {
        updates.display_name = user.user_metadata.full_name;
      }

      if (
        user.user_metadata?.avatar_url &&
        user.user_metadata.avatar_url !== existingProfile.avatar_url
      ) {
        updates.avatar_url = user.user_metadata.avatar_url;
      }

      if (Object.keys(updates).length > 0) {
        await updateUserProfile(user.id, updates);
      }
    }

    return existingProfile;
  } catch (error) {
    console.error('Error syncing user profile with Google:', error);
    return null;
  }
};

// Create user profile
export const createUserProfile = async (
  user: User,
  profileData: Omit<
    UserProfile,
    'id' | 'email' | 'display_name' | 'avatar_url' | 'created_at' | 'updated_at'
  >
) => {
  try {
    const userProfile: Omit<UserProfile, 'id'> = {
      email: user.email || '',
      display_name: user.user_metadata?.full_name || 'User',
      avatar_url: user.user_metadata?.avatar_url || undefined,
      ...profileData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{ id: user.id, ...userProfile }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>
) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
};

// Get auth instance (for compatibility)
export const auth = {
  currentUser: null,
  onAuthStateChanged: onAuthStateChange,
};
