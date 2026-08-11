/**
 * Синхронізація каси.
 * Причина: на v4_cash_operations.order_id стоїть FK на v4_orders.
 * Один запис із посиланням на видалене замовлення валив увесь пакет,
 * а помилка глушилась у catch(e){} — каса не доїжджала з 31.07.2026.
 */
const fs=require('fs'), path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf-8');
let f=0; const t=(n,c)=>{console.log((c?'✓ ':'✗ ')+n); if(!c)f=1;};

// дістаємо mapCash і виконуємо з підставними даними
const m=src.match(/function mapCash\(\)\{[\s\S]*?\n\}/);
if(!m){console.log('✗ mapCash не знайдено');process.exit(1);}
let orders, cashbook;
eval(m[0]);

console.log('--- касовий запис не губиться ---');
orders=[{id:'ord1'},{id:'ord2'}];
cashbook=[
  {id:'c1',orderId:'ord1',amount:500,date:'2026-08-01'},
  {id:'c2',orderId:'ord_ВИДАЛЕНЕ',amount:1200,date:'2026-08-02'},  // сирота
  {id:'c3',orderId:null,amount:300,date:'2026-08-03'}
];
const r=mapCash();
t('усі 3 записи збережено',            r.length===3);
t('сума ціла (2000)',                  r.reduce((s,x)=>s+x.amount,0)===2000);
t('живе посилання лишилось',           r.find(x=>x.id==='c1').order_id==='ord1');
t('мертве посилання обнулено',         r.find(x=>x.id==='c2').order_id===null);
t('гроші сироти на місці (1200)',      r.find(x=>x.id==='c2').amount===1200);
t('порожнє посилання не ламає',        r.find(x=>x.id==='c3').order_id===null);

console.log('--- витримує порожнечу ---');
orders=[]; cashbook=[];
t('порожня каса не падає',             mapCash().length===0);
orders=undefined; cashbook=[{id:'c9',orderId:'x',amount:10}];
t('без замовлень не падає',            mapCash()[0].order_id===null);

console.log('--- помилки більше не глушаться ---');
t('є змінна останньої помилки',        /let _syncErr/.test(src));
t('синк порціями',                     /SYNC_CHUNK/.test(src) && /_upsertChunked/.test(src));
t('порожнього catch(e){} у синку нема', !/catch\(e\)\{\}\s*\}\s*else\s*_sig/.test(src));
t('помилка пишеться в консоль',        /console\.warn\('\[sync\]'/.test(src));
t('підпис не оновлюється при збої',    /_sig НЕ оновлюємо/.test(src));

console.log('--- статус чесний ---');
t('попереджає що не увійшли',          /НЕ УВІЙШЛИ/.test(src));
t('показує помилку',                   /ПОМИЛКА/.test(src));
t('показує час вдалої синх.',          /_syncOk/.test(src));

console.log(f?'\nПРОВАЛЕНО':'\nОК'); process.exit(f);
