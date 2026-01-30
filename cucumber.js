module.exports = {
  default: {
    require: ['features/step_definitions/**/*.js'],
    format: [
      'progress',
      'json:bdd-reports/cucumber-report.json'
    ],
    publishQuiet: true
  }
};
