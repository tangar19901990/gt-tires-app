/**
 * Перевірка: замовлення з ПДВ має рахуватись як БЕЗГОТІВКА в касі та звітах.
 * Якби paymentType зберігався як 'cashless_vat', ці суми зникли б
 * і з готівки, і з безготівки — гроші «загубились» би у звітах.
 */
const fs=require('fs'), path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf-8');
let f=0; const t=(n,c)=>{ console.log((c?'✓ ':'✗ ')+n); if(!c)f=1; };

// дістаємо хелпери з app.js без запуску всього файлу
const m=src.match(/function payTypeUI[\s\S]*?function payTypeIsVat\(v\)\{[^}]*\}/);
if(!m){ console.log('✗ хелпери payType* не знайдено'); process.exit(1); }
eval(m[0]);

t('кнопка з ПДВ зберігається як cashless', payTypeStore('cashless_vat')==='cashless');
t('звичайний безнал не змінився',          payTypeStore('cashless')==='cashless');
t('готівка не змінилась',                  payTypeStore('cash')==='cash');
t('порожнє значення → готівка',            payTypeStore('')==='cash');
t('ознака ПДВ ставиться',                  payTypeIsVat('cashless_vat')===true);
t('на звичайному безналі ПДВ немає',        payTypeIsVat('cashless')===false);

t('UI відновлює ПДВ',        payTypeUI({paymentType:'cashless',vat:true})==='cashless_vat');
t('UI відновлює безнал',     payTypeUI({paymentType:'cashless',vat:false})==='cashless');
t('UI відновлює готівку',    payTypeUI({paymentType:'cash'})==='cash');
t('UI витримує порожній обʼєкт', payTypeUI(null)==='cash');

// касова книга рахує method==='cashless'
const cash=[{type:'income',method:payTypeStore('cashless_vat'),amount:1200},
            {type:'income',method:payTypeStore('cash'),amount:300}];
const incCash    =cash.filter(c=>c.type==='income'&&(c.method||'cash')==='cash').reduce((s,c)=>s+c.amount,0);
const incCashless=cash.filter(c=>c.type==='income'&&c.method==='cashless').reduce((s,c)=>s+c.amount,0);
t('ПДВ-замовлення у безготівці (1200)', incCashless===1200);
t('готівка окремо (300)',               incCash===300);
t('нічого не загубилось (1500)',        incCash+incCashless===1500);

// збереження нового замовлення справді викликає хелпери
t('saveOrder використовує payTypeStore', /paymentType:\s*payTypeStore\(/.test(src));
t('saveOrder записує ознаку vat',        /vat:\s*payTypeIsVat\(/.test(src));

console.log(f?'\nПРОВАЛЕНО':'\nОК'); process.exit(f);
