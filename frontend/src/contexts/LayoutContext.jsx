import React, { createContext, useContext } from 'react';

const LayoutContext = createContext();

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (!context) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};

export const LayoutProvider = ({ children }) => {
    const PageWrapper = ({ children }) => {
        return (
            <div className="container">
                <div className="content-container">
                    {children}
                </div>
            </div>
        );
    };

    return (
        <LayoutContext.Provider value={{ PageWrapper }}>
            {children}
        </LayoutContext.Provider>
    );
}; 