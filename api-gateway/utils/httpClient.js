const axios = require('axios');

// CENTRALIZED HTTP CLIENT WITH CONSISTENT CONFIG
const httpClient = axios.create({
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ADD REQUEST INTERCEPTOR FOR CONSISTENT LOGGING
httpClient.interceptors.request.use(
  (config) => {
  
    return config;
  },
  (error) => Promise.reject(error)
);

// ADD RESPONSE INTERCEPTOR FOR CONSISTENT ERROR HANDLING
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(`❌ HTTP Error: ${error.message}`);
    return Promise.reject(error);
  }
);

module.exports = httpClient;