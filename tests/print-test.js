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

console.log(f?'\nПРОВАЛЕНО':'\nОК'); process.exit(f);
