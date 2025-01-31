import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';

const AuthCallback = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Handle the OAuth callback
        const handleCallback = async () => {
            try {
                // Get the session - Supabase will automatically handle the OAuth response
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) throw error;

                if (session) {
                    // Successfully authenticated
                    console.log('Authentication successful');
                    navigate('/dashboard');
                } else {
                    console.error('No session found');
                    navigate('/login');
                }
            } catch (error) {
                console.error('Error in auth callback:', error.message);
                navigate('/login');
            }
        };

        handleCallback();
    }, [navigate]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <p>Processing authentication...</p>
        </div>
    );
};

export default AuthCallback; 