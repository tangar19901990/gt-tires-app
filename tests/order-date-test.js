/**
 * Ручне редагування дати заказ-наряду.
 * Ризик: дата замовлення і дати касових записів по ньому мають
 * лишатись узгодженими, інакше звіт за день розійдеться з нарядами.
 */
const fs=require('fs'), path=require('path');
const ROOT=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(ROOT,'app.js'),'utf-8');
const html=fs.readFileSync(path.join(ROOT,'gt-tires-v4-supabase-ready.html'),'utf-8');
const css=fs.readFileSync(path.join(ROOT,'styles.css'),'utf-8');
let f=0; const t=(n,c)=>{console.log((c?'✓ ':'✗ ')+n); if(!c)f=1;};

// підтягуємо функції дати
const g=n=>{
  const i=src.indexOf('function '+n+'(');
  if(i<0) throw new Error(n+' не знайдено');
  const j=src.indexOf('\n}', i);
  return src.slice(i, j+2);
};
let cashbook=[], saved=0;
const save=()=>saved++;
const alertMsgs=[]; global.alert=m=>alertMsgs.push(m);
let fieldValue='';
global.document={getElementById:id=>id==='oDate'?{get value(){return fieldValue},set value(v){fieldValue=v}}:null};
eval(g('isoToLocalInput')); eval(g('setOrderDateNow')); eval(g('setOrderDateValue'));
eval(g('orderDateFromInput')); eval(g('shiftOrderCashDates'));

console.log('--- перетворення дат ---');
const iso='2026-08-05T14:30:00.000Z';
const localStr=isoToLocalInput(iso);
t('ISO -> поле',            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localStr));
t('туди-назад без зсуву',   Math.abs(new Date(localStr)-new Date(iso))<60000);
t('порожнє = зараз',        /^\d{4}-/.test(isoToLocalInput(null)));
t('крива дата не валить',   isoToLocalInput('казна-що')==='');

console.log('--- читання з поля ---');
fieldValue='2026-08-01T09:15';
let r=new Date(orderDateFromInput());
t('дата з поля читається',  r.getFullYear()===2026 && r.getMonth()===7 && r.getDate()===1);
t('час зберігається',       r.getHours()===9 && r.getMinutes()===15);
fieldValue='';
t('порожнє поле = сьогодні', Math.abs(new Date(orderDateFromInput())-Date.now())<5000);

console.log('--- захист від друкарських помилок ---');
alertMsgs.length=0; fieldValue='2206-08-01T10:00';
r=new Date(orderDateFromInput());
t('2206 рік відхилено',      r.getFullYear()<2100);
t('користувача попереджено', alertMsgs.some(m=>/помилков/i.test(m)));
alertMsgs.length=0; fieldValue='1990-01-01T10:00';
t('1990 рік відхилено',      new Date(orderDateFromInput()).getFullYear()>2020);

console.log('--- каса їде разом із замовленням ---');
cashbook=[
  {id:'k1',orderId:'ord1',amount:500,date:'2026-08-05T10:00:00.000Z'},
  {id:'k2',orderId:'ord1',amount:300,date:'2026-08-05T16:00:00.000Z'},
  {id:'k3',orderId:'ord2',amount:900,date:'2026-08-05T11:00:00.000Z'}
];
const moved=shiftOrderCashDates('ord1','2026-08-05T12:00:00.000Z','2026-08-01T12:00:00.000Z');
t('перенесено 2 записи',     moved===2);
t('перший переїхав на 01.08', cashbook[0].date.slice(0,10)==='2026-08-01');
t('другий переїхав на 01.08', cashbook[1].date.slice(0,10)==='2026-08-01');
t('різниця в часі збережена', new Date(cashbook[1].date)-new Date(cashbook[0].date)===6*3600*1000);
t('чуже замовлення не чіпали', cashbook[2].date.slice(0,10)==='2026-08-05');
t('суми не змінились',        cashbook.reduce((s,c)=>s+c.amount,0)===1700);
t('зміни збережено',          saved>0);

console.log('--- та сама дата нічого не рухає ---');
saved=0;
t('без зміни дня — 0 записів', shiftOrderCashDates('ord1','2026-08-01T09:00:00.000Z','2026-08-01T18:00:00.000Z')===0);
t('зайвого збереження немає',  saved===0);

console.log('--- інтеграція ---');
t('поле є у формі',           /id="oDate"/.test(html) && /datetime-local/.test(html));
t('кнопка «зараз» є',         /setOrderDateNow\(\)/.test(html));
t('нове замовлення бере поле', /date: orderDateFromInput\(\)/.test(src));
t('редагування міняє дату',   /o\.date = newDate/.test(src));
t('редагування рухає касу',   /shiftOrderCashDates\(o\.id, prevDate, newDate\)/.test(src));
t('при редагуванні поле заповнюється', /setOrderDateValue\(edit\.date\)/.test(src));
t('при новому — поточний час', /setOrderDateNow\(\);/.test(src));
t('на друку поля немає',      /@media print\{ \.odate-row\{display:none\} \}/.test(css));

console.log(f?'\nПРОВАЛЕНО':'\nОК'); process.exit(f);
