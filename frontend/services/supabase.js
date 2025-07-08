import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing. Make sure to set them in your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Use AsyncStorage for session persistence
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Required for React Native
  },
});

/**
 * Increments the score for a given user by calling the RPC function in Supabase.
 * @param {string} userId - The UUID of the user whose score should be incremented.
 * @returns {Promise<void>}
 */
export const incrementScoreForUser = async (userId) => {
  if (!userId) {
    console.error('User ID is required to increment score.');
    return;
  }

  const { error } = await supabase.rpc('increment_score', {
    user_id_to_update: userId,
    score_to_add: 10,
  });

  if (error) {
    console.error('Error incrementing score:', error.message);
  }
};
