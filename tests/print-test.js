const {JSDOM}=require('jsdom'), fs=require('fs'), path=require('path');
const P=path.join(__dirname,'..')+'/';
const dom=new JSDOM('<!doctype html><body></body>',{url:'https://x.test/',runScripts:'dangerously'});
const w=dom.window;
w.fmtMoney = n => (n||0)+' грн';
w.document.body.innerHTML='<div id="printFrame-stub"></div>';
const sc=w.document.createElement('script');
sc.textContent=fs.readFileSync(P+'print.js','utf8');
w.document.body.appendChild(sc);

let html=null;
// перехоплюємо генерацію: підміняємо iframe
const origCreate=w.document.createElement.bind(w.document);
w.document.createElement=function(t){
  const el=origCreate(t);
  if(t==='iframe'){
    Object.defineProperty(el,'contentDocument',{get:()=>({
      open(){}, write(h){html=h;}, close(){}
    })});
    Object.defineProperty(el,'contentWindow',{get:()=>({focus(){},print(){}})});
  }
  return el;
};

let f=0; const t=(n,c)=>{ console.log((c?'✓ ':'✗ ')+n); if(!c)f=1; };

w._printOrder={
  clientName:'Іванов', company:'ТОВ "Логістика & Ко"', phone:'+380971112233',
  car:'Scania R450', plate:'AA1234BB', paymentType:'cashless',
  notes:'Перевірити тиск\nЗамінити вентиль <терміново>',
  services:[{name:'Шиномонтаж R22.5',qty:4,price:250}], total:1000, orderNumber:'1042'
};
w.printOrderNariad();

// лапки в текстовому вузлі екранувати не треба, амперсанд — треба
t('назва фірми надрукована',      html.includes('ТОВ "Логістика &amp; Ко"'));
t('амперсанд не зламав розмітку', !html.includes('Логістика & Ко'));
t('заголовок ФІРМА є',            html.includes('>ФІРМА<'));
t('нотатки надруковані',          html.includes('Перевірити тиск'));
t('заголовок НОТАТКИ є',          html.includes('>НОТАТКИ<'));
t('переніс рядка в нотатках цілий', html.includes('Замінити вентиль'));
t('кутові дужки екрановані',      html.includes('&lt;терміново&gt;') && !html.includes('<терміново>'));
t('клієнт на місці',              html.includes('Іванов'));

// без фірми і нотаток — блоки не мають з'являтись
html=null;
w._printOrder={clientName:'Петров',services:[],total:0,orderNumber:'1043'};
w.printOrderNariad();
t('без фірми блок не виводиться',   !html.includes('>ФІРМА<'));
t('без нотаток блок не виводиться', !html.includes('>НОТАТКИ<'));
t('порожня фірма не ламає друк',    html.includes('Петров'));

// --- ПДВ ---
html=null;
w._printOrder={clientName:'ТОВ Клієнт', company:'ТОВ "Логістика"', paymentType:'cashless', vat:true,
  services:[{name:'Шиномонтаж',qty:1,price:1200}], total:1200, orderNumber:'1044'};
w.printOrderNariad();
t('позначено БЕЗГОТІВКА З ПДВ', html.includes('БЕЗГОТІВКА З ПДВ'));
t('рядок "Сума без ПДВ" є',     html.includes('Сума без ПДВ'));
t('рядок "ПДВ 20%" є',          html.includes('ПДВ 20%'));
// 1200 / 1.2 = 1000, ПДВ = 200
t('база порахована вірно (1000)', html.includes('1000'));
t('ПДВ порахований вірно (200)',  html.includes('200'));

// безнал БЕЗ ПДВ — рядків бути не має
html=null;
w._printOrder={clientName:'Петро', paymentType:'cashless', vat:false,
  services:[], total:500, orderNumber:'1045'};
w.printOrderNariad();
t('без ПДВ: позначка звичайна',   html.includes('БЕЗГОТІВКА') && !html.includes('З ПДВ'));
t('без ПДВ: рядків ПДВ немає',    !html.includes('Сума без ПДВ'));

// готівка
html=null;
w._printOrder={clientName:'Іван', paymentType:'cash', services:[], total:300, orderNumber:'1046'};
w.printOrderNariad();
t('готівка: позначка ГОТІВКА',    html.includes('ГОТІВКА') && !html.includes('БЕЗГОТІВКА'));
t('готівка: рядків ПДВ немає',    !html.includes('ПДВ 20%'));

console.log(f?'\nПРОВАЛЕНО':'\nОК'); process.exit(f);
