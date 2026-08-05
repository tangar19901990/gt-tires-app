const {JSDOM}=require('jsdom'), fs=require('fs'), P='/home/claude/gt-tires-app/';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{runScripts:'outside-only',url:'https://x.test/'});
const w=dom.window;
['sessionStorage','localStorage'].forEach(k=>{const m={};w[k]={getItem:x=>m[x]??null,setItem:(x,v)=>m[x]=String(v),removeItem:x=>delete m[x],key:i=>Object.keys(m)[i]??null,get length(){return Object.keys(m).length}};});
w.eval(fs.readFileSync(P+'top-secret-panel.js','utf8'));
w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
const d=w.document, ok=[];
function t(n,c){ok.push((c?'✓':'✗')+' '+n); if(!c)process.exitCode=1;}

t('кнопка top_secret створена', !!d.getElementById('tsToggle'));
t('панель створена',            !!d.getElementById('tsPanel'));
t('бекдроп створений',          !!d.getElementById('tsBackdrop'));
t('замок видно одразу',         d.getElementById('tsGate').hidden===false);
t('меню сховане до піну',       d.getElementById('tsBody').hidden===true);

w.toggleTopSecret(true);
t('панель відкрилась',          d.body.classList.contains('ts-open'));

d.getElementById('tsPin').value='0000';
d.getElementById('tsPinGo').click();
t('невірний пін не пускає',     d.getElementById('tsBody').hidden===true);
t('показано помилку',           d.getElementById('tsErr').textContent==='Невірний код');

d.getElementById('tsPin').value='2606';
d.getElementById('tsPinGo').click();
t('вірний пін пускає',          d.getElementById('tsBody').hidden===false);
t('замок сховано',              d.getElementById('tsGate').hidden===true);

const items=d.querySelectorAll('#tsBody .ts-item');
const groups=d.querySelectorAll('#tsBody .ts-group');
t('пунктів меню: '+items.length, items.length===6);
t('розділів: '+groups.length,    groups.length===3);
t('є пункт "скоро"',            d.querySelectorAll('.ts-soon').length===2);

d.getElementById('tsLock').click();
t('замкнення повертає гейт',    d.getElementById('tsGate').hidden===false);
t('панель закрилась',           !d.body.classList.contains('ts-open'));

console.log(ok.join('\n'));
console.log(process.exitCode?'\nПРОВАЛЕНО':'\nВСІ ТЕСТИ ПРОЙДЕНІ');
