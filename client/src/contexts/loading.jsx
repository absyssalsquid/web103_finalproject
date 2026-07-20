// LoadingContext.js
import { createContext, useContext, useState } from 'react';

// Initialize context
const LoadingContext = createContext(undefined);

// Provide context to the application tree
export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(0);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
      {isLoading > 0 && <GlobalSpinner />} {/* Optional: Centralized UI */}
    </LoadingContext.Provider>
  );
};

// Simple visual spinner component
const GlobalSpinner = () => (
  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
    <div>Loading...</div>
  </div>
);


export const useLoadingContext = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};