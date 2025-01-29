import { createContext, useEffect, useState, useContext } from 'react';
import supabase from '../clients/supabaseClient';

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
    const [session, setSession] = useState(undefined);

    // Sign in with Google
    const signInWithGoogle = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard`
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

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
    }, []);

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