/**
 * GT Tires CRM — run-all.js
 * -----------------------------------------------------------
 * Запускає всі тести підряд і показує загальний підсумок.
 *
 * ЗАПУСК:
 *   cd tests
 *   npm install      (один раз)
 *   npm test
 *
 * Щоб додати новий тест — поклади файл у tests/ і додай назву у SUITES.
 * -----------------------------------------------------------
 */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const SUITES = [
  { file: 'smoke-test.js',      name: 'Бізнес-логіка (прайс, замовлення, функції)' },
  { file: 'top-secret-test.js', name: 'Панель top_secret (пін, меню)' },
  { file: 'secrets-test.js',    name: 'Секрети в репозиторії' },
  { file: 'print-test.js',      name: 'Друк заказ-наряду (фірма, нотатки, ПДВ)' },
  { file: 'vat-money-test.js',  name: 'ПДВ: суми не губляться в касі' },
];

let failed = 0;
const results = [];

for (const s of SUITES) {
  const full = path.join(__dirname, s.file);

  if (!fs.existsSync(full)) {
    console.log(`\n⚠️  ${s.file} — файл не знайдено, пропускаю`);
    results.push({ ...s, status: 'skip' });
    continue;
  }

  console.log('\n' + '─'.repeat(52));
  console.log(`▶  ${s.name}`);
  console.log('─'.repeat(52));

  const r = spawnSync(process.execPath, [full], {
    stdio: 'inherit',
    cwd: __dirname,
  });

  const okRun = r.status === 0;
  if (!okRun) failed++;
  results.push({ ...s, status: okRun ? 'pass' : 'fail' });
}

console.log('\n' + '='.repeat(52));
console.log('ПІДСУМОК');
console.log('='.repeat(52));
results.forEach(r => {
  const mark = r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : '⚠️ ';
  console.log(`${mark} ${r.name}`);
});

if (failed === 0) {
  console.log('\n✅ Все чисто — можна заливати\n');
  process.exit(0);
} else {
  console.log(`\n❌ Провалено наборів: ${failed} — заливати НЕ можна\n`);
  process.exit(1);
}
