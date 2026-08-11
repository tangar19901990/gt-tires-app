/**
 * Перевірка збірки для клієнта.
 * Головне питання: чи не витікає клієнту адмінка й чужа база.
 */
const fs=require('fs'), path=require('path'), {execFileSync}=require('child_process');
const ROOT=path.join(__dirname,'..');
const TOOLS=path.join(ROOT,'tools');
let f=0; const t=(n,c)=>{console.log((c?'✓ ':'✗ ')+n); if(!c)f=1;};

const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.'+'x'.repeat(120);
const src=fs.readFileSync(path.join(ROOT,'gt-tires-v4-supabase-ready.html'),'utf-8');

// відтворюємо патч тим самим кодом, що й скрипт
const code=fs.readFileSync(path.join(TOOLS,'new-client.js'),'utf-8');
const m=code.match(/function patchHtml[\s\S]*?\n\}/);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const die=msg=>{throw new Error(msg)};
const patchHtml=eval('('+m[0].replace(/^function patchHtml/,'function')+')');

const out=patchHtml(src,{
  name:'Шиномонтаж <Колесо> & Диск',
  slug:'koleso-brovary',
  supabaseUrl:'https://abcdefghijklmnop.supabase.co',
  supabaseKey:KEY
});

console.log('\n--- що отримує клієнт ---');
t('слуг клієнта підставлено',      out.includes("var CLIENT_SLUG = 'koleso-brovary'"));
t('слуга gt-tires не лишилось',    !out.includes("CLIENT_SLUG = 'gt-tires'"));
t('база клієнта підставлена',      out.includes('abcdefghijklmnop.supabase.co'));
t('назва в заголовку',             out.includes('<title>Шиномонтаж &lt;Колесо&gt; &amp; Диск</title>'));
t('назва екранована (без <>)',     !out.includes('<title>Шиномонтаж <Колесо>'));

console.log('\n--- чого клієнт отримати НЕ повинен ---');
t('панелі top_secret немає',       !out.includes('top-secret-panel.js'));
t('посилань на licenses.html немає', !out.includes('licenses.html'));
t('пароля адмінки немає',          !out.includes('GtTires-tmp'));
t('слова admin_grant немає',       !out.includes('admin_grant'));

console.log('\n--- що має лишитись робочим ---');
t('перевірка ліцензії на місці',   out.includes('licenses') && out.includes('paid_until'));
t('app.js підключений',            /app\.js\?v=\d+/.test(out));
t('print.js підключений',          /print\.js\?v=\d+/.test(out));
t('стилі підключені',              /styles\.css\?v=\d+/.test(out));

console.log('\n--- список файлів ---');
const files=code.match(/const FILES = \[([\s\S]*?)\]/)[1]
  .split('\n').map(s=>s.trim().replace(/^'|',?$/g,'')).filter(s=>s&&!s.startsWith('/*'));
t('licenses.html не в списку',     !files.includes('licenses.html'));
t('top-secret.html не в списку',   !files.some(x=>x.includes('top-secret')));
t('gtdb.js не в списку',           !files.includes('gtdb.js'));
t('бота немає',                    !files.some(x=>x.includes('bot')));
t('бекапів немає',                 !files.some(x=>x.startsWith('backup/')));
t('.env не потрапляє',             !files.some(x=>x.includes('.env')));
t('CRM у списку',                  files.includes('gt-tires-v4-supabase-ready.html'));

console.log('\n--- захист від помилок оператора ---');
function run(a){
  try{ execFileSync(process.execPath,[path.join(TOOLS,'new-client.js'),...a],
       {encoding:'utf-8',stdio:['ignore','pipe','pipe']}); return null; }
  catch(e){ return (e.stdout||'')+(e.stderr||''); }
}
const ok=['--dry','--name','X','--slug','abc-def','--supabase-url','https://abcdefghijklmnop.supabase.co','--supabase-key',KEY];
t('коректні дані проходять',       run(ok)===null);
t('база GT Tires відхиляється',
  /окремий проєкт/i.test(run(['--dry','--name','X','--slug','abc-def','--supabase-url','https://lxeswqlkereptdtwytbp.supabase.co','--supabase-key',KEY])||''));
t('кривий slug відхиляється',
  /slug/i.test(run(['--dry','--name','X','--slug','Колесо Бровари','--supabase-url','https://abcdefghijklmnop.supabase.co','--supabase-key',KEY])||''));
t('кривий url відхиляється',
  /supabase-url/i.test(run(['--dry','--name','X','--slug','abc-def','--supabase-url','http://ya.ru','--supabase-key',KEY])||''));
t('короткий ключ відхиляється',
  /ключ/i.test(run(['--dry','--name','X','--slug','abc-def','--supabase-url','https://abcdefghijklmnop.supabase.co','--supabase-key','eyJshort'])||''));
t('без назви не працює',
  /name/i.test(run(['--dry','--slug','abc-def','--supabase-url','https://abcdefghijklmnop.supabase.co','--supabase-key',KEY])||''));

console.log(f?'\nПРОВАЛЕНО':'\nОК'); process.exit(f);
