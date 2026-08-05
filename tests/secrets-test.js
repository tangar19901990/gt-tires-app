/**
 * GT Tires — secrets-test.js
 * -----------------------------------------------------------
 * Не дає залити секрет у репозиторій.
 *
 * Приводом став реальний випадок: у травні 2026 токен бота
 * потрапив у gt_tires_bot.py як значення за замовчуванням,
 * пролежав у публічному репо 2,5 місяці, його знайшли
 * автоматичні збирачі й повісили на бота чужий вебхук.
 *
 * ЗАПУСК:  node secrets-test.js   (або npm test — входить у набір)
 * -----------------------------------------------------------
 */
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
let failed = 0;

const ok   = (m) => console.log('  ✅ ' + m);
const fail = (m, d) => { failed++; console.log('  ❌ ' + m + (d ? '\n       ' + d : '')); };

/* Що шукаємо */
const RULES = [
  {
    name: 'Токен Telegram-бота',
    re:   /\b\d{8,12}:AA[A-Za-z0-9_-]{30,}/g,
    fix:  'Прибери з коду. Використовуй os.getenv("BOT_TOKEN") без значення за замовчуванням.'
  },
  {
    name: 'GitHub Personal Access Token',
    re:   /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g,
    fix:  'Відклич на github.com/settings/tokens і передавай змінною оточення.'
  },
  {
    name: 'Приватний ключ',
    re:   /-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g,
    fix:  'Приватні ключі не місце в репозиторії.'
  },
  {
    name: 'Пароль у рядку підключення до БД',
    re:   /postgres(?:ql)?:\/\/[^\s'":]+:[^\s'"@]+@/g,
    fix:  'Винеси DSN у змінну оточення.'
  },
  {
    name: 'Ключ OpenAI / Anthropic',
    re:   /\b(sk-[A-Za-z0-9]{20,}|sk-ant-[A-Za-z0-9_-]{20,})\b/g,
    fix:  'Відклич ключ і передавай змінною оточення.'
  }
];

/* Файли, які перевіряти не треба */
const SKIP_DIR  = ['node_modules', '.git', 'backup'];
const SKIP_FILE = ['.env.example', 'secrets-test.js'];
const BINARY    = /\.(png|jpg|jpeg|gif|webp|ico|pdf|zip|woff2?|ttf|mp4)$/i;

function tracked() {
  try {
    return execSync('git ls-files', { cwd: ROOT, encoding: 'utf-8' })
      .split('\n').filter(Boolean);
  } catch (e) {
    console.log('  ⚠️  git недоступний — перевірка пропущена');
    return null;
  }
}

console.log('GT Tires — перевірка на секрети\n' + '='.repeat(40));

const files = tracked();

if (files === null) {
  process.exit(0);
}

console.log('\n1. Файли в репозиторії');

const hits = [];
let checked = 0;

files.forEach(function (rel) {
  if (SKIP_DIR.some(function (d) { return rel.startsWith(d + '/'); })) return;
  if (SKIP_FILE.indexOf(path.basename(rel)) !== -1) return;
  if (BINARY.test(rel)) return;

  let txt;
  try { txt = fs.readFileSync(path.join(ROOT, rel), 'utf-8'); }
  catch (e) { return; }

  checked++;

  RULES.forEach(function (rule) {
    const m = txt.match(rule.re);
    if (!m) return;
    const line = txt.slice(0, txt.indexOf(m[0])).split('\n').length;
    hits.push({ rel: rel, line: line, rule: rule, sample: m[0] });
  });
});

if (hits.length === 0) {
  ok('Секретів не знайдено (перевірено файлів: ' + checked + ')');
} else {
  hits.forEach(function (h) {
    fail(h.rule.name + ' — ' + h.rel + ':' + h.line,
         '…' + h.sample.slice(-8) + '   ' + h.rule.fix);
  });
}

console.log('\n2. .gitignore');

let gi = '';
try { gi = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf-8'); } catch (e) {}

if (/^\.env\s*$/m.test(gi)) ok('.env у .gitignore');
else fail('.env має бути у .gitignore', 'Інакше файл із секретами потрапить у репо.');

if (files.indexOf('.env') === -1) ok('.env не закомічений');
else fail('.env закомічений у репозиторій!', 'git rm --cached .env — і відклич усе, що там лежало.');

console.log('\n' + '='.repeat(40));
if (failed === 0) {
  console.log('✅ ЧИСТО\n');
  process.exit(0);
} else {
  console.log('❌ ЗНАЙДЕНО ПРОБЛЕМ: ' + failed + '\n');
  console.log('Секрет, що потрапив у коміт, лишається в історії назавжди.');
  console.log('Видалити рядок недостатньо — треба ВІДКЛИКАТИ сам секрет.\n');
  process.exit(1);
}
