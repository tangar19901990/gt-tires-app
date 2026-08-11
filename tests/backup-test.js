/**
 * Автоматична резервна копія.
 * Ризик, який закриваємо: localStorage — основне сховище CRM.
 * Чистка кешу браузера = втрата всього.
 */
const fs=require('fs'), path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf-8');
const panel=fs.readFileSync(path.join(__dirname,'..','top-secret-panel.js'),'utf-8');
let f=0; const t=(n,c)=>{console.log((c?'✓ ':'✗ ')+n); if(!c)f=1;};

// --- збір даних ---
const LS_KEY='gt_tires_v4_';
const store={};
global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v)};
const m=src.match(/function collectBackupPayload\(\)\{[\s\S]*?\n\}/);
if(!m){console.log('✗ collectBackupPayload не знайдено');process.exit(1);}
eval(m[0]);

console.log('--- що потрапляє в копію ---');
store[LS_KEY+'orders']=JSON.stringify([{id:'o1',total:500}]);
store[LS_KEY+'clients']=JSON.stringify([{id:'c1',name:'Іванов'}]);
store[LS_KEY+'cash']=JSON.stringify([{id:'k1',amount:500}]);
store[LS_KEY+'usedTires']=JSON.stringify([{id:'t1'}]);
let p=collectBackupPayload();
t('замовлення в копії',   p.orders && p.orders.length===1);
t('клієнти в копії',      p.clients && p.clients.length===1);
t('каса в копії',         p.cash && p.cash.length===1);
t('Б/У шини в копії',     p.usedTires && p.usedTires.length===1);
t('чужих ключів немає',   !Object.keys(p).some(k=>k.includes('supa')||k.includes('Backup')));

console.log('--- стійкість ---');
store[LS_KEY+'orders']='{зламаний json';
p=collectBackupPayload();
t('битий JSON не валить збір', typeof p==='object');
t('битий ключ пропущено',      p.orders===undefined);

console.log('--- захист від затирання ---');
t('порожню копію не пишемо',   /немає даних/.test(src));
t('завелику копію не пишемо',  /завеликий/.test(src) && /4500/.test(src));
t('раз на день',               /BACKUP_MARK/.test(src) && /сьогодні вже робили/.test(src));
t('лише після чистого синку',  /cloudBackup\(\)\.then/.test(src));
const upsertBlock=src.match(/from\('v4_backups'\)\.upsert\(\{[\s\S]{0,400}?\}\);/);
t('копія за той самий день оновлюється', !!upsertBlock && /onConflict:\s*'id'/.test(upsertBlock[0]));
t('id копії — дата',                     !!upsertBlock && /id:\s*today/.test(upsertBlock[0]));

console.log('--- відновлення ---');
t('питає підтвердження',       /confirm\('Відновити дані/.test(src));
t('попереджає про заміну',     /ЗАМІНЕНО/.test(src));
t('спершу зберігає поточне',   /exportData\(\)/.test(src.match(/async function restoreBackup[\s\S]*?\n\}/)[0]));
t('перезавантажує сторінку',   /location\.reload/.test(src));

console.log('--- доступ ---');
t('бекап лише після входу',    /!_session/.test(src.match(/async function cloudBackup[\s\S]*?\n\}/)[0]));
t('відновлення лише після входу', /Спочатку увійдіть/.test(src.match(/async function restoreBackup[\s\S]*?\n\}/)[0]));

console.log('--- екран у панелі ---');
t('пункт "Резервні копії" є',  /Резервні копії/.test(panel));
t('дати клікабельні',          /restoreBackup\(b\.id\)/.test(panel));
t('видно скільки чого',        /замовлень/.test(panel) && /клієнтів/.test(panel) && /каса/.test(panel));
t('є кнопка Назад',            /← Назад/.test(panel));

console.log(f?'\nПРОВАЛЕНО':'\nОК'); process.exit(f);
