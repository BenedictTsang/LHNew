import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextType, UserProfile } from '../types';
import { supabase } from '../lib/supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'session_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const validateSession = async () => {
      const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
      if (storedSessionId) {
        try {
          const { data: sessionData, error: sessionError } = await supabase
            .rpc('validate_session', { session_id_input: storedSessionId });

          if (sessionError || !sessionData || !sessionData[0]?.is_valid) {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            setUser(null);
            setSessionId(null);
            setLoading(false);
            return;
          }

          const validSession = sessionData[0];
          const { data: dbUser, error: userError } = await supabase
            .from('users')
            .select('id, username, role, force_password_change, accent_preference, can_access_proofreading, can_access_spelling, display_name, class')
            .eq('id', validSession.user_id)
            .maybeSingle();

          if (!dbUser || userError) {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            setUser(null);
            setSessionId(null);
          } else {
            setUser({
              id: dbUser.id,
              username: dbUser.username,
              role: dbUser.role,
              force_password_change: dbUser.force_password_change,
              accent_preference: dbUser.accent_preference || 'en-US',
              can_access_proofreading: dbUser.can_access_proofreading || false,
              can_access_spelling: dbUser.can_access_spelling || false,
              display_name: dbUser.display_name || dbUser.username,
              class: dbUser.class || null,
            });
            setSessionId(storedSessionId);
          }
        } catch (e) {
          localStorage.removeItem(SESSION_STORAGE_KEY);
          setUser(null);
          setSessionId(null);
        }
      }
      setLoading(false);
    };

    validateSession();
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth/login`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: new Error(data.error || 'Login failed') };
      }

      const { data: sessionData, error: sessionError } = await supabase
        .rpc('create_session', { user_id_input: data.user.id });

      if (sessionError || !sessionData || !sessionData[0]) {
        return { error: new Error('Failed to create session') };
      }

      const newSessionId = sessionData[0].session_id;
      setUser(data.user);
      setSessionId(newSessionId);
      localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    if (sessionId) {
      try {
        await supabase.rpc('delete_session', { session_id: sessionId });
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
    setUser(null);
    setSessionId(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const changePassword = async (
    currentPassword: string | undefined,
    newPassword: string,
    verificationCode?: string
  ) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth/change-password`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          currentPassword,
          newPassword,
          verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: new Error(data.error || 'Password change failed') };
      }

      const updatedUser = { ...user, force_password_change: false };
      setUser(updatedUser);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updateAccentPreference = async (accent: string) => {
    if (!user) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ accent_preference: accent })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating accent preference:', error);
        return;
      }

      const updatedUser = { ...user, accent_preference: accent };
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to update accent preference:', error);
    }
  };

  const isAdmin = user?.role === 'admin';
  const accentPreference = user?.accent_preference || 'en-US';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        changePassword,
        isAdmin,
        accentPreference,
        updateAccentPreference,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
