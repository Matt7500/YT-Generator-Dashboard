import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session);
      
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        const profile = await fetchUserProfile(session.user.id);
        if (mounted) {
          setUserProfile(profile);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    // Check current session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        const profile = await fetchUserProfile(session.user.id);
        if (mounted) {
          setUserProfile(profile);
        }
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email, password, name) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            name: name,
            email: email,
            role: 'user',
            subscription_tier: 'free',
            subscription_status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }

      return { data: authData, error: null };
    } catch (error) {
      console.error('Error in signUp:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      return { data, error };
    } catch (error) {
      console.error('Error in signIn:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      // First clear the Supabase session
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error in signOut:', error);
        return { error };
      }

      // Clear local storage
      window.localStorage.removeItem('supabase.auth.token');
      
      // Clear local state
      setUser(null);
      setUserProfile(null);
      
      return { error: null };
    } catch (error) {
      console.error('Error in signOut:', error);
      return { error };
    }
  };

  const value = {
    signUp,
    signIn,
    signOut,
    user,
    userProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 