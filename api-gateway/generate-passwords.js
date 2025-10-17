const bcrypt = require('bcryptjs');

async function generatePasswords() {
  const passwords = {
    admin: 'admin123',
    cashier1: 'cashier123', 
    processor1: 'processor123'
  };
  
  console.log('Generated password hashes:');
  console.log('========================');
  
  for (const [username, password] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`${username}: password="${password}" hash="${hash}"`);
  }
}

generatePasswords();