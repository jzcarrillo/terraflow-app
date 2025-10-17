const bcrypt = require('bcryptjs');

async function generateAdminPassword() {
  // Change this to whatever password you want
  const adminPassword = 'password';  // Simple password
  
  const hash = await bcrypt.hash(adminPassword, 10);
  console.log(`Admin password: "${adminPassword}"`);
  console.log(`Admin hash: "${hash}"`);
}

generateAdminPassword();