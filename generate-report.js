const report = require('multiple-cucumber-html-reporter');

report.generate({
  jsonDir: './bdd-reports',
  reportPath: './bdd-reports/html',
  metadata: {
    browser: {
      name: 'Node.js',
      version: process.version
    },
    device: 'Local Machine',
    platform: {
      name: process.platform,
      version: require('os').release()
    }
  },
  customData: {
    title: 'Terraflow BDD Test Results',
    data: [
      { label: 'Project', value: 'Terraflow Land Registry' },
      { label: 'Release', value: '1.0.0' },
      { label: 'Execution Date', value: new Date().toLocaleString() },
      { label: 'Features Tested', value: 'Land Title Registration, User Authentication, Payment Processing, Land Transfer' }
    ]
  }
});

console.log('\n✅ BDD Report generated successfully!');
console.log('📊 Features covered:');
console.log('   - Land Title Registration');
console.log('   - User Authentication');
console.log('   - Payment Processing');
console.log('   - Land Transfer Management');
console.log('\n📁 Report location: bdd-reports/html/index.html\n');
