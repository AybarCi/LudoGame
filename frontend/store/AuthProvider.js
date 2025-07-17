import React, { useState, useEffect, createContext, useContext } from 'react';
import { useSocket } from './SocketProvider';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const { connect, disconnect } = useSocket();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setSession(session);
      setUser(currentUser);

      if (currentUser) {
        console.log('[AuthProvider] Auth state changed: User logged in. Connecting socket.');
        connect(currentUser);
      } else {
        console.log('[AuthProvider] Auth state changed: User logged out. Disconnecting socket.');
        disconnect();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [connect, disconnect]);

  const updateScore = async (amount) => {
    if (!user) return;

    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('score')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching score:', fetchError);
      return;
    }

    const newScore = (currentProfile.score || 0) + amount;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ score: newScore })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating score:', updateError);
    } else {
      // This part is tricky because the user object from auth doesn't have the profile data.
      // The profile data is usually fetched separately. Let's assume the UI will refetch or update from a different source.
      // For now, we can try to update the local state if it has a similar structure.
      setUser(prevUser => {
        const newProfile = { ...(prevUser.profile || {}), score: newScore };
        return { ...prevUser, profile: newProfile };
      });
    }
  };

  const value = {
    session,
    user,
    loading,
    signIn: async (email, password) => {
      setLoading(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return {};
      } catch (error) {
        return { error };
      } finally {
        setLoading(false);
      }
    },
    signUp: async (email, password, username) => {
      setLoading(true);
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username, avatar_url: `https://api.dicebear.com/6.x/identicon/svg?seed=${username}` } },
        });
        if (error) throw error;
        return {};
      } catch (error) {
        return { error };
      } finally {
        setLoading(false);
      }
    },
    signOut: async () => {
      setLoading(true);
      try {
        await supabase.auth.signOut();
      } catch (error) {
        // Even if sign out fails, we don't want to be stuck in loading
      } finally {
        setLoading(false);
      }
    },
    updateScore,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
