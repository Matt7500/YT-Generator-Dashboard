import { createContext, useEffect, useState, useContext } from 'react';
import supabase from '../clients/supabaseClient';

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [initialRoute, setInitialRoute] = useState(null);

    useEffect(() => {
        // Get the current route before auth check
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/signup' && 
            currentPath !== '/forgot-password' && currentPath !== '/reset-password') {
            sessionStorage.setItem('lastAuthenticatedRoute', currentPath);
        }

        // Check initial session
        const initializeAuth = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                setSession(initialSession);
                
                if (initialSession) {
                    const lastRoute = sessionStorage.getItem('lastAuthenticatedRoute');
                    setInitialRoute(lastRoute || '/dashboard');
                }
            } catch (error) {
                console.error('Error checking auth session:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session) {
                sessionStorage.removeItem('lastAuthenticatedRoute');
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    // Sign in with Google
    const signInWithGoogle = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });

        if (error) {
            throw error;
        }

        return data;
    };

    //Send Password Reset Email
    const sendPasswordReset = async (email) => {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            throw error;
        }

        return data;
    };

    //Update Password
    const updatePassword = async (newPassword) => {
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            throw error;
        }

        return data;
    };

    //Sign Up
    const signUp = async ({ email, password, name }) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    role: 'user',
                },
            },
        });

        if (error) {
            throw error;
        }

        if (!data?.user) {
            throw new Error('No user data returned from Supabase');
        }

        return data;
    };

    //Sign Out
    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            throw error;
        }
    };

    //Sign In
    const signIn = async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            throw error;
        }

        return data;
    };

    return (
        <AuthContext.Provider value={{ 
            session, 
            isLoading,
            initialRoute,
            signUp, 
            signOut, 
            signIn,
            signInWithGoogle, 
            sendPasswordReset,
            updatePassword 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const userAuth = () => {
    return useContext(AuthContext);
};