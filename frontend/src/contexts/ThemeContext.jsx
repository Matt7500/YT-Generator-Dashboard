import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    // Initialize theme from cookie or default to 'light'
    const [theme, setTheme] = useState(() => {
        const savedTheme = Cookies.get('theme');
        return savedTheme || 'light';
    });

    // Update cookie and document class when theme changes
    useEffect(() => {
        Cookies.set('theme', theme, { expires: 365 }); // Cookie expires in 1 year
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}; 