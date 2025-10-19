const axios = require('axios');

// Test login with token refresh
const testLogin = async () => {
  try {
    console.log('🔐 Testing login with automatic token refresh...');
    
    const loginData = {
      username: 'jzcarrillo',
      password: 'password123' // Replace with actual password
    };
    
    const response = await axios.post('http://localhost:30081/api/auth/login', loginData);
    
    if (response.data.success) {
      console.log('✅ Login successful!');
      console.log('👤 User:', response.data.user.username);
      console.log('🔄 Fresh token generated:', response.data.token.substring(0, 50) + '...');
      console.log('⏰ Token expires in: 24 hours');
      
      // Test the token immediately
      const testResponse = await axios.get('http://localhost:30081/api/land-titles', {
        headers: {
          'Authorization': `Bearer ${response.data.token}`
        }
      });
      
      console.log('✅ Token works! Land titles response:', testResponse.data.message);
    } else {
      console.log('❌ Login failed:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Login test failed:', error.response?.data || error.message);
  }
};

testLogin();