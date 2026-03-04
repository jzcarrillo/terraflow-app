'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize from localStorage on mount
    const cached = localStorage.getItem('__APP_CONFIG__');
    if (cached) {
      const data = JSON.parse(cached);
      window.__RUNTIME_CONFIG__ = data;
      setConfig(data);
      setLoading(false);
    }

    async function loadConfig() {
      try {
        const response = await fetch('/api/config');
        const data = await response.json();
        
        window.__RUNTIME_CONFIG__ = data;
        localStorage.setItem('__APP_CONFIG__', JSON.stringify(data));
        setConfig(data);
      } catch (error) {
        console.error('Failed to load config:', error);
        if (!config) {
          const fallbackConfig = {
            apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:30081/api',
            dashboardUrl: process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:4005/',
            environment: 'development'
          };
          setConfig(fallbackConfig);
          window.__RUNTIME_CONFIG__ = fallbackConfig;
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
