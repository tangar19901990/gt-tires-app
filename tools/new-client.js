#!/usr/bin/env node
/**
 * ============================================================
 *  new-client.js — підключення нового клієнта
 * ------------------------------------------------------------
 *  Робить копію CRM під окремого клієнта:
 *    1. збирає потрібні файли (без бекапів, бота, документації)
 *    2. підставляє назву, client_slug і ключі Supabase клієнта
 *    3. ВИРІЗАЄ панель top_secret — клієнт її бачити не повинен
 *    4. створює репозиторій на GitHub і заливає файли
 *    5. вмикає GitHub Pages
 *
 *  ЗАПУСК:
 *    export GITHUB_TOKEN='ghp_...'
 *    node tools/new-client.js \
 *        --name "Шиномонтаж Колесо" \
 *        --slug koleso-brovary \
 *        --supabase-url https://xxxx.supabase.co \
 *        --supabase-key eyJ...
 *
 *  Необов'язково:
 *    --dry        нічого не заливати, лише показати що буде
 *    --repo NAME  своя назва репозиторію
 *
 *  ПІСЛЯ ЦЬОГО:
 *    відкрити licenses.html і натиснути «Підключити» —
 *    там створюється сама ліцензія з датою закінчення.
 * ============================================================
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const OWNER = 'tangar19901990';

/* Файли, які отримує клієнт. Решта (бекапи, бот, документація,
   licenses.html, top-secret*.html) НЕ копіюється — навмисно. */
const FILES = [
  'gt-tires-v4-supabase-ready.html',
  'app.js',
  'print.js',
  'styles.css',
  'index.html',
  'manifest.json',
  'service-worker.js',
  '.nojekyll',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

/* ---------- аргументи ---------- */

function args() {
  const a = process.argv.slice(2);
  const o = { dry: false };
  for (let i = 0; i < a.length; i++) {
    const k = a[i];
    if (k === '--dry') { o.dry = true; continue; }
    if (!k.startsWith('--')) continue;
    o[k.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = a[++i];
  }
  return o;
}

function die(msg) {
  console.error('\n❌ ' + msg + '\n');
  process.exit(1);
}

/* ---------- GitHub API ---------- */

function gh(method, endpoint, body) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) die('Не задано GITHUB_TOKEN.\n   export GITHUB_TOKEN=\'ghp_...\'');

  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path: endpoint,
      method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'gt-tires-new-client',
        ...(data ? { 'Content-Type': 'application/json',
                     'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, res => {
      let out = '';
      res.on('data', c => out += c);
      res.on('end', () => {
        let json = null;
        try { json = out ? JSON.parse(out) : null; } catch (e) {}
        if (res.statusCode >= 200 && res.statusCode < 300) return resolve(json);
        reject(new Error(`GitHub ${res.statusCode}: ` +
          ((json && json.message) || out.slice(0, 200))));
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

/* ---------- патч HTML ---------- */

function patchHtml(html, o) {
  let out = html;
  const before = out.length;

  // 1. Назва вкладки
  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(o.name)}</title>`);

  // 2. client_slug у перевірці ліцензії
  const slugRe = /var CLIENT_SLUG = '[^']*';/;
  if (!slugRe.test(out)) die('У HTML не знайдено CLIENT_SLUG — структура змінилась.');
  out = out.replace(slugRe, `var CLIENT_SLUG = '${o.slug}';`);

  // 3. База клієнта: підставляємо ДО перевірки ліцензії,
  //    щоб app.js одразу побачив свій проєкт Supabase.
  const anchor = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>';
  if (!out.includes(anchor)) die('У HTML не знайдено підключення supabase-js.');
  const boot =
    anchor + '\n' +
    '<script>\n' +
    '/* База цього клієнта. Ставиться один раз при першому відкритті. */\n' +
    '(function(){\n' +
    `  if (!localStorage.getItem('gt_supa_url')) localStorage.setItem('gt_supa_url', '${o.supabaseUrl}');\n` +
    `  if (!localStorage.getItem('gt_supa_key')) localStorage.setItem('gt_supa_key', '${o.supabaseKey}');\n` +
    '})();\n' +
    '</script>';
  out = out.replace(anchor, boot);

  // 4. ВИРІЗАЄМО панель адміністратора — клієнту вона не належить
  const tsRe = /\s*<script src="top-secret-panel\.js[^"]*"><\/script>/g;
  const hadTs = tsRe.test(out);
  out = out.replace(tsRe, '');
  if (!hadTs) {
    console.warn('   ⚠️  top-secret-panel.js у HTML не знайдено — перевір вручну!');
  }

  // 5. Контроль: у файлі не має лишитись згадок адмінки
  ['top-secret', 'licenses.html', 'admin_grant', 'GtTires'].forEach(bad => {
    if (out.includes(bad)) die(`У файлі клієнта лишилась згадка "${bad}" — не заливаю.`);
  });

  console.log(`   HTML: ${before} → ${out.length} байт`);
  return out;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ---------- головне ---------- */

async function main() {
  const o = args();

  ['name', 'slug', 'supabaseUrl', 'supabaseKey'].forEach(k => {
    if (!o[k]) die(`Не задано --${k.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}\n` +
                   '   node tools/new-client.js --help');
  });

  if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(o.slug)) {
    die('slug має бути латиницею, малими літерами, через дефіс: koleso-brovary');
  }
  if (!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(o.supabaseUrl)) {
    die('supabase-url має виглядати так: https://xxxxxxxx.supabase.co');
  }
  if (o.supabaseKey.length < 100 || !o.supabaseKey.startsWith('eyJ')) {
    die('supabase-key не схожий на anon-ключ');
  }
  // Захист від найдорожчої помилки: ключ від чужої бази
  if (o.supabaseUrl.includes('lxeswqlkereptdtwytbp')) {
    die('Це база GT Tires, а не клієнта! Клієнту потрібен ОКРЕМИЙ проєкт Supabase.');
  }

  const repo = o.repo || `gt-tires-app-${o.slug}`;

  console.log('\n═══════════════════════════════════════');
  console.log('  Підключення клієнта');
  console.log('═══════════════════════════════════════');
  console.log(`  Назва:      ${o.name}`);
  console.log(`  slug:       ${o.slug}`);
  console.log(`  Репозиторій: ${OWNER}/${repo}`);
  console.log(`  База:       ${o.supabaseUrl}`);
  if (o.dry) console.log('  Режим:      ПЕРЕВІРКА (нічого не заливаю)');
  console.log('');

  /* збираємо файли */
  console.log('1. Готую файли');
  const payload = [];
  for (const rel of FILES) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) die(`Немає файлу ${rel}`);
    if (rel.endsWith('.png')) {
      payload.push({ path: rel, content: fs.readFileSync(full).toString('base64') });
    } else if (rel === 'gt-tires-v4-supabase-ready.html') {
      const html = patchHtml(fs.readFileSync(full, 'utf-8'), o);
      payload.push({ path: rel, content: Buffer.from(html, 'utf-8').toString('base64') });
    } else {
      payload.push({ path: rel, content: fs.readFileSync(full).toString('base64') });
    }
  }
  console.log(`   Файлів: ${payload.length}`);

  if (o.dry) {
    console.log('\n✅ Перевірка пройдена. Прибери --dry щоб залити.\n');
    return;
  }

  /* репозиторій */
  console.log('2. Створюю репозиторій');
  try {
    await gh('POST', '/user/repos', {
      name: repo,
      description: `GT Tires CRM — ${o.name}`,
      private: false,
      auto_init: true
    });
    console.log('   Створено');
  } catch (e) {
    if (/already exists/i.test(e.message)) {
      console.log('   Уже існує — оновлюю файли');
    } else throw e;
  }

  await new Promise(r => setTimeout(r, 2500));

  /* файли */
  console.log('3. Заливаю файли');
  for (const f of payload) {
    let sha = null;
    try {
      const cur = await gh('GET', `/repos/${OWNER}/${repo}/contents/${f.path}`);
      sha = cur && cur.sha;
    } catch (e) { /* немає — створимо */ }

    await gh('PUT', `/repos/${OWNER}/${repo}/contents/${f.path}`, {
      message: sha ? `update ${f.path}` : `add ${f.path}`,
      content: f.content,
      ...(sha ? { sha } : {})
    });
    console.log(`   ✓ ${f.path}`);
    await new Promise(r => setTimeout(r, 350));   // щоб не впертись у ліміт
  }

  /* Pages */
  console.log('4. Вмикаю GitHub Pages');
  try {
    await gh('POST', `/repos/${OWNER}/${repo}/pages`,
             { source: { branch: 'main', path: '/' } });
    console.log('   Увімкнено');
  } catch (e) {
    console.log('   ' + (/already/i.test(e.message) ? 'Уже увімкнено' : e.message));
  }

  const url = `https://${OWNER}.github.io/${repo}/gt-tires-v4-supabase-ready.html`;

  console.log('\n═══════════════════════════════════════');
  console.log('  ГОТОВО');
  console.log('═══════════════════════════════════════');
  console.log('\n  Посилання клієнту (запрацює за 2-5 хв):\n');
  console.log('  ' + url);
  console.log('\n  Далі:');
  console.log('  1. Відкрий licenses.html → «Підключити»');
  console.log(`  2. client_slug впиши: ${o.slug}`);
  console.log('  3. Скинь клієнту посилання вище\n');
}

main().catch(e => die(e.message));
