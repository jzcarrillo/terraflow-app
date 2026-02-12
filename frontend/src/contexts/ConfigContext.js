'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch('/api/config');
        const data = await response.json();
        
        // Update global API_CONFIG
        if (typeof window !== 'undefined') {
          window.__RUNTIME_CONFIG__ = data;
        }
        
        setConfig(data);
      } catch (error) {
        console.error('Failed to load config:', error);
        setConfig({
          apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:30081/api',
          dashboardUrl: process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:4005/',
          environment: 'development'
        });
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
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
