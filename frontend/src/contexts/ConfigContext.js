'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(() => {
    // Initialize from localStorage immediately
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('__APP_CONFIG__');
      if (cached) {
        const data = JSON.parse(cached);
        window.__RUNTIME_CONFIG__ = data;
        return data;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(!config);

  useEffect(() => {
    async function loadConfig() {
      try {
        // If already loaded from localStorage, just refresh in background
        const response = await fetch('/api/config');
        const data = await response.json();
        
        // Store in both window and localStorage
        if (typeof window !== 'undefined') {
          window.__RUNTIME_CONFIG__ = data;
          localStorage.setItem('__APP_CONFIG__', JSON.stringify(data));
        }
        
        setConfig(data);
      } catch (error) {
        console.error('Failed to load config:', error);
        // Only set fallback if no config exists
        if (!config) {
          const fallbackConfig = {
            apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:30081/api',
            dashboardUrl: process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:4005/',
            environment: 'development'
          };
          setConfig(fallbackConfig);
          if (typeof window !== 'undefined') {
            window.__RUNTIME_CONFIG__ = fallbackConfig;
          }
        }
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading configuration...
      </div>
    );
  }

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
