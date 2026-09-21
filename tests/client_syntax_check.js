const fs = require('fs');
const vm = require('vm');

const files = [
  'public/js/config.js',
  'public/js/api.js',
  'public/js/loanChecker.js',
  'public/js/creditAnalyzer.js',
  'public/js/emiCalculator.js',
  'public/js/aiTips.js',
  'public/js/sheetsSubmission.js',
  'public/js/app.js'
];

let hasError = false;
for (const f of files) {
  try {
    const code = fs.readFileSync(f, 'utf8');
    new vm.Script(code);
    console.log('✔ Syntax OK:', f);
  } catch (err) {
    console.error('✖ Syntax ERROR in', f, err.message);
    hasError = true;
  }
}

if (hasError) process.exit(1);
console.log('\nAll frontend client scripts passed syntax validation!');
