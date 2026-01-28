module.exports = {
  default: {
    require: ['features/step_definitions/**/*.js'],
    format: [
      'progress',
      'html:bdd-reports/bdd-report.html',
      'json:bdd-reports/bdd-report.json'
    ],
    publishQuiet: true
  }
};
