
// ==================== DATA ====================
const LS_KEY = 'gt_tires_v4_';
const load = k => { try { return JSON.parse(localStorage.getItem(LS_KEY+k)) || []; } catch(e){ return []; }};
const save = (k,v) => localStorage.setItem(LS_KEY+k, JSON.stringify(v));
const loadVal = k => localStorage.getItem(LS_KEY+k);
const saveVal = (k,v) => localStorage.setItem(LS_KEY+k, v);
const ORDER_DRAFT_KEY = LS_KEY+'orderDraft';

let orders = load('orders');
let clients = load('clients');
let tires = load('tires');
let warehouse = load('warehouse');
let cashbook = load('cash');
// === Шини AI (Етап 1): окремий стан, існуючі дані не чіпаються ===
let usedTires = load('usedTires');
let marketPrices = load('marketPrices');
let aiLogs = load('aiLogs');
let taiSub = 'market';
let priceOverrides = (()=>{try{return JSON.parse(localStorage.getItem(LS_KEY+'priceOverrides'))||{};}catch(e){return {};}})();
let priceEditOn = localStorage.getItem(LS_KEY+'priceEditOn')==='1';
let customServices = load('customSvc');
let quickServices = load('quickSvc');
let topSecret = loadVal('ts') === '1';

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const fmtDate = d => { const dt=new Date(d); return dt.toLocaleDateString('uk-UA')+' '+dt.toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit'}); };
const fmtMoney = n => Number(n).toLocaleString('uk-UA')+'₴';
const today = () => new Date().toISOString().slice(0,10);

// ==================== PRICE LIST (14 categories, 199 items) ====================
// Priority: 1)Монтаж 2)Ремонт/латки 3)Решта
const CAT_META = [
  { name:"Легковий монтаж", icon:"🚗", color:"#e53935", short:"Легкові" },
  { name:"Вантажний монтаж", icon:"🚛", color:"#1e88e5", short:"Вантажні" },
  { name:"Сільгосп / Спец", icon:"🚜", color:"#43a047", short:"Сільгосп" },
  { name:"Пластирі TL", icon:"🔴", color:"#39ff14", short:"TL" },
  { name:"Пластирі CT", icon:"🟠", color:"#39ff14", short:"CT" },
  { name:"Пластирі BP", icon:"🟡", color:"#39ff14", short:"BP" },
  { name:"Пластирі UP", icon:"🟢", color:"#39ff14", short:"UP" },
  { name:"Ремонт камер", icon:"🛞", color:"#00acc1", short:"Камери" },
  { name:"Додатковий ремонт", icon:"🔧", color:"#f4511e", short:"Дод.ремонт" },
  { name:"Балансування вантаж", icon:"⚖️", color:"#3949ab", short:"Баланс." },
  { name:"Кріплення", icon:"🔩", color:"#8e24aa", short:"Кріплення" },
  { name:"Вентилі", icon:"🎯", color:"#d81b60", short:"Вентилі" },
  { name:"Рихтування дисків", icon:"💿", color:"#7b1fa2", short:"Рихтування" },
];
const CAT_ICONS = {0:"icons/cat-0.png",1:"icons/cat-1.png",2:"icons/cat-2.png",3:"icons/cat-3.png",4:"icons/cat-4.png",5:"icons/cat-5.png",6:"icons/cat-6.png",7:"icons/cat-7.png",8:"icons/cat-8.png",9:"icons/cat-9.png",10:"icons/cat-10.png",11:"icons/cat-11.png",12:"icons/cat-12.png"};
const PRICE_LIST = [
  // === 0: ЛЕГКОВИЙ МОНТАЖ ===
  { cat:0 },
  {id:1,name:"Седан/Хетчбек R13",price:175},{id:2,name:"Седан/Хетчбек R14",price:190},
  {id:3,name:"Седан/Хетчбек R15",price:210},{id:4,name:"Седан/Хетчбек R16",price:220},
  {id:5,name:"Седан/Хетчбек R17",price:250},{id:6,name:"Седан/Хетчбек R18",price:290},
  {id:7,name:"Седан/Хетчбек R19",price:310},{id:8,name:"Седан/Хетчбек R20",price:335},
  {id:9,name:"Седан/Хетчбек R21",price:355},{id:10,name:"Седан/Хетчбек R22",price:375},
  {id:11,name:"Седан/Хетчбек R23",price:405},{id:12,name:"Седан/Хетчбек R24",price:435},
  {id:13,name:"Седан S45/RunFlat доплата",price:50},
  {id:14,name:"Мінівен/Джип/SUV R14",price:205},{id:15,name:"Мінівен/Джип/SUV R15",price:220},
  {id:16,name:"Мінівен/Джип/SUV R16",price:250},{id:17,name:"Мінівен/Джип/SUV R17",price:290},
  {id:18,name:"Мінівен/Джип/SUV R18",price:315},{id:19,name:"Мінівен/Джип/SUV R19",price:340},
  {id:20,name:"Мінівен/Джип/SUV R20",price:355},{id:21,name:"Мінівен/Джип/SUV R21",price:375},
  {id:22,name:"Мінівен/Джип/SUV R22",price:400},{id:23,name:"Мінівен/Джип/SUV R23",price:435},
  {id:24,name:"Мінівен/Джип/SUV R24",price:455},
  {id:25,name:"Мінівен/SUV S45/RunFlat доплата",price:60},
  {id:26,name:"Бус/Комерційний R13",price:205},{id:27,name:"Бус/Комерційний R14",price:220},
  {id:28,name:"Бус/Комерційний R15",price:250},{id:29,name:"Бус/Комерційний R16",price:290},
  {id:30,name:"Бус/Комерційний R16 Газель",price:340},{id:31,name:"Бус/Комерційний R17",price:315},
  {id:32,name:"Бус/Комерційний R18",price:340},{id:33,name:"Спаровані колеса доплата/шт",price:25},

  // === 1: ВАНТАЖНИЙ МОНТАЖ ===
  { cat:1 },
  {id:34,name:"Шиномонтаж R17.5 (безкамерні)",price:400},
  {id:35,name:"Шиномонтаж R22.5 (безкамерні)",price:450},
  {id:36,name:"Шиномонтаж R20 (камерні)",price:650},
  {id:37,name:"Шиномонтаж R22.5+ (камерні)",price:800},
  {id:38,name:"Зняття/встановлення 1 колеса",price:180},
  {id:39,name:"Зняття/встановлення здвоєного",price:275},
  {id:40,name:"Поглиблення поздовжнє R17.5",price:380},
  {id:41,name:"Поглиблення поздовжнє R22.5",price:450},
  {id:42,name:"Поглиблення змішане R17.5",price:580},
  {id:43,name:"Поглиблення змішане R22.5",price:700},
  {id:44,name:"Поглиблення водовідводів R17.5",price:250},
  {id:45,name:"Поглиблення водовідводів R22.5",price:300},
  {id:46,name:"Слюсарні роботи / 1 година",price:800},
  {id:47,name:"Піддомкрачування ТЗ",price:150},
  {id:48,name:"Накачка",price:75},{id:49,name:"Підкачка",price:50},

  // === 2: СІЛЬГОСП / СПЕЦ ===
  { cat:2 },
  {id:50,name:"Шиномонтаж с/г до 24\"",price:1200},
  {id:51,name:"Шиномонтаж с/г 33\"+",price:3200},
  {id:52,name:"Великогабаритні до 28\"",price:3200},
  {id:53,name:"Великогабаритні понад 28\"",price:3850},
  {id:54,name:"Вентиль TR218A",price:280},
  {id:55,name:"Вентиль TR618A",price:460},
  {id:56,name:"Вентиль TRJ 653-03",price:700},

  // === 3: ПЛАСТИРІ TL ===
  { cat:3 },
  {id:72,name:"110 TL",price:700},{id:73,name:"112 TL",price:760},{id:74,name:"114 TL",price:820},
  {id:75,name:"115 TL",price:880},{id:76,name:"116 TL",price:940},{id:77,name:"120 TL",price:1000},
  {id:78,name:"122 TL",price:1100},{id:79,name:"124 TL",price:1150},{id:80,name:"125 TL",price:1200},
  {id:81,name:"126 TL",price:1250},{id:82,name:"128 TL",price:1300},{id:83,name:"135 TL",price:1750},
  {id:84,name:"140 TL",price:1400},{id:85,name:"142 TL",price:1850},{id:86,name:"144 TL",price:1950},
  {id:87,name:"146 TL",price:2050},{id:88,name:"331 TL",price:1650},{id:89,name:"333 TL",price:1750},
  {id:90,name:"335 TL",price:1850},{id:91,name:"337 TL",price:1950},{id:92,name:"533 TL",price:1750},
  {id:93,name:"537 TL",price:2100},

  // === 4: ПЛАСТИРІ CT ===
  { cat:4 },
  {id:94,name:"CT 10",price:650},{id:95,name:"CT 10 HD",price:700},{id:96,name:"CT 12",price:820},
  {id:97,name:"CT 12 HD",price:850},{id:98,name:"CT 20",price:1000},{id:99,name:"CT 22",price:1100},
  {id:100,name:"CT 24",price:1150},{id:101,name:"CT 26",price:1250},{id:102,name:"CT 33",price:1300},
  {id:103,name:"CT 35",price:1450},{id:104,name:"CT 37",price:1550},{id:105,name:"CT 40",price:1700},
  {id:106,name:"CT 42",price:1850},{id:107,name:"CT 44",price:1950},{id:108,name:"CT 46",price:2050},

  // === 5: ПЛАСТИРІ BP ===
  { cat:5 },
  {id:109,name:"BP 0 (60мм)",price:360},{id:110,name:"BP 1 (70мм)",price:380},
  {id:111,name:"BP 2 (90мм)",price:1300},{id:112,name:"BP 3 (100мм)",price:1500},
  {id:113,name:"BP 4 (130мм)",price:1700},{id:114,name:"BP 5 (165мм)",price:2000},
  {id:115,name:"BP 6 (240мм)",price:2600},{id:116,name:"BP 7 (290мм)",price:3000},

  // === 6: ПЛАСТИРІ UP ===
  { cat:6 },
  {id:117,name:"UP 3",price:400},{id:118,name:"UP 4,5",price:420},
  {id:119,name:"UP 6",price:450},{id:120,name:"UP 8",price:700},

  // === 7: РЕМОНТ КАМЕР ===
  { cat:7 },
  {id:121,name:"Латка овальна Mini (40×30)",price:120},{id:122,name:"Латка овальна Small (65×40)",price:150},
  {id:123,name:"Латка овальна Medium (100×50)",price:180},{id:124,name:"Латка овальна Large (150×70)",price:200},
  {id:125,name:"Латка овальна Giant (160×100)",price:270},{id:126,name:"Латка овальна Giant Rim (240×60)",price:300},
  {id:127,name:"Латка кругла Tiny (25)",price:180},{id:128,name:"Латка кругла Miny (35)",price:120},
  {id:129,name:"Латка кругла Small (45)",price:150},{id:130,name:"Латка кругла Medium (60)",price:180},
  {id:131,name:"Латка кругла Large (80)",price:200},{id:132,name:"Латка кругла Maxi (100)",price:270},
  {id:133,name:"Латка кругла Giant (125)",price:300},{id:134,name:"Вентильна основа VG8",price:350},
  {id:135,name:"Вложка VS3 (d90)",price:150},{id:136,name:"ТП прокол",price:150},
  {id:137,name:"ТП 5 см",price:250},{id:138,name:"ТП 10 см",price:300},
  {id:139,name:"ТП 15 см",price:400},{id:140,name:"ТП 20 см",price:500},

  // === 8: ДОДАТКОВИЙ РЕМОНТ ===
  { cat:8 },
  {id:141,name:"Косметичний ремонт (боковина) 1см²",price:35},
  {id:142,name:"Косметичний ремонт (протектор/плече) 1см²",price:50},
  {id:143,name:"Ремонт гумою A+B, 5 см",price:300},
  {id:144,name:"Дублювання ремонтного матеріалу",price:300},
  {id:145,name:"Зняття старого ремонтного елементу",price:350},

  // === 9: БАЛАНСУВАННЯ ВАНТАЖ ===
  { cat:9 },
  {id:146,name:"Балансув. до R17.5 забивні (без вартості)",price:250},
  {id:147,name:"Балансув. до R17.5 забивні (з вартістю)",price:400},
  {id:148,name:"Балансув. до R17.5 адгезивні (без вартості)",price:300},
  {id:149,name:"Балансув. R19.5-R24.5 забивні (без вартості)",price:300},
  {id:150,name:"Балансув. R19.5-R24.5 забивні (з вартістю)",price:450},
  {id:151,name:"Балансув. R19.5-R24.5 адгезивні (без вартості)",price:350},
  {id:152,name:"Тягарець забивний 25г",price:60},{id:153,name:"Тягарець забивний 50г",price:70},
  {id:154,name:"Тягарець забивний 75г",price:80},{id:155,name:"Тягарець забивний 100г",price:90},
  {id:156,name:"Тягарець забивний 150г",price:100},{id:157,name:"Тягарець забивний 200г",price:120},
  {id:158,name:"Тягарець забивний 250г",price:140},{id:159,name:"Тягарець забивний 300г",price:160},
  {id:160,name:"Тягарець забивний 350г",price:170},{id:161,name:"Тягарець забивний 400г",price:190},
  {id:162,name:"Тягарець адгезивний 50г",price:80},{id:163,name:"Тягарець адгезивний 75г",price:90},
  {id:164,name:"Тягарець адгезивний 100г",price:100},{id:165,name:"Тягарець адгезивний 150г",price:110},
  {id:166,name:"Тягарець адгезивний 175г",price:120},{id:167,name:"Тягарець адгезивний 200г",price:130},
  {id:168,name:"Тягарець адгезивний 250г",price:150},{id:169,name:"Тягарець адгезивний 300г",price:170},
  {id:170,name:"Балансування гранулами (1г)",price:1.2},
  {id:171,name:"Оптимізація дисбалансу колеса",price:1000},

  // === 10: КРІПЛЕННЯ ===
  { cat:10 },
  {id:172,name:"Заміна гайки М22 (32)",price:150},
  {id:173,name:"Центруюче кільце 6мм/18мм",price:80},
  {id:174,name:"Шайба конусна цільна/розрізна",price:80},
  {id:175,name:"Перевірка затяжки динам. ключем",price:100},
  {id:176,name:"Зрізання гайки",price:250},
  {id:177,name:"Ключ для важких гайок",price:100},
  {id:178,name:"Змащування шпильок (1 колесо)",price:25},
  {id:179,name:"Встановлення ковпачка",price:25},

  // === 11: ВЕНТИЛІ ===
  { cat:11 },
  {id:62,name:"Вентиль TR 414",price:80},
  {id:63,name:"Вентиль TR 414 (X)",price:90},
  {id:64,name:"Вентиль розбірний",price:130},
  {id:68,name:"Датчик тиску встановл./зняття",price:50},
  {id:180,name:"Заміна ковпачка / золотника",price:10},
  {id:181,name:"Вентиль легкосплавний диск",price:275},
  {id:182,name:"Вентиль прямий 32мм/42мм",price:200},
  {id:183,name:"Вентиль прямий 84мм",price:250},
  {id:184,name:"Вентиль вигнутий 90°",price:300},
  {id:185,name:"Подовжувач пластик",price:100},
  {id:186,name:"Подовжувач латунний",price:200},
  {id:187,name:"Подовжувач гумовий",price:150},

  // === 12: РИХТУВАННЯ ДИСКІВ ===
  { cat:12 },
  {id:188,name:"Сталевий R13-R14",price:200},{id:189,name:"Сталевий R15",price:250},
  {id:190,name:"Сталевий R16",price:300},{id:191,name:"Сталевий R17",price:350},
  {id:192,name:"Легкосплавний R13",price:300},{id:193,name:"Легкосплавний R14-15",price:350},
  {id:194,name:"Легкосплавний R16",price:400},{id:195,name:"Легкосплавний R17-18",price:450},
  {id:196,name:"Легкосплавний R19",price:500},{id:197,name:"Легкосплавний R20",price:550},
  {id:198,name:"Легкосплавний R21+",price:600},{id:199,name:"Ремонт осьового зміщення",price:400},
];

// ==================== NAV ====================
document.querySelectorAll('.nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
    document.getElementById('sec-'+btn.dataset.tab).classList.add('active');
    if(btn.dataset.tab==='debtors') renderDebtors(); if(btn.dataset.tab==='stats') renderHome();
    if(btn.dataset.tab==='bookings') renderBookings();
    if(btn.dataset.tab==='home') openNewOrder();
    if(btn.dataset.tab==='tiremarket'){ try{ renderTireMarketPanel(); }catch(e){} }
  });
});

// ==================== MODAL ====================
function openModal(html){ var mc=document.getElementById('modalContent'); mc.classList.remove('modal-wide'); mc.innerHTML=html; document.getElementById('modalOverlay').classList.add('open'); }
function closeModal(){ document.getElementById('modalOverlay').classList.remove('open'); }

// ==================== PRICE TABLE ====================
let activeCatFilter = -1; // -1 = all
function renderCatTiles(){
  const el = document.getElementById('priceCats');
  if(!el) return;
  let html = `<div class="cat-tile${activeCatFilter===-1?' active':''}" style="background:rgba(255,255,255,0.08);color:#fff" onclick="setCatFilter(-1)"><span class="tile-icon">📋</span>Всі<span class="tile-count">${PRICE_LIST.filter(i=>i.id).length} поз.</span></div>`;
  CAT_META.forEach((c,i)=>{
    const cnt = PRICE_LIST.filter(it=>!it.cat && it.cat!==0 ? false : true).length; // count items
    const itemCount = PRICE_LIST.filter(it=>{
      if(it.id===undefined) return false;
      let ci=-1; for(let j=PRICE_LIST.indexOf(it)-1;j>=0;j--){ if(PRICE_LIST[j].cat!==undefined && PRICE_LIST[j].id===undefined){ ci=PRICE_LIST[j].cat; break; } }
      return ci===i;
    }).length;
    html += `<div class="cat-tile${activeCatFilter===i?' active':''}" style="background:${c.color}22;color:${c.color};border-color:${activeCatFilter===i?c.color:'transparent'}" onclick="setCatFilter(${i})"><span class="tile-icon">${CAT_ICONS[i]?('<img class="tileimg" src="'+CAT_ICONS[i]+'">'):c.icon}</span>${c.name}<span class="tile-count">${itemCount} поз.</span></div>`;
  });
  el.innerHTML = html;
}
function setCatFilter(idx){
  activeCatFilter = idx;
  document.getElementById('priceSearch').value = '';
  renderCatTiles();
  renderPrice();
}
function effPrice(item){ if(!item) return 0; const o=priceOverrides[item.id]; return (o!=null)?o:item.price; }
function findSvc(id){ id=+id; let it=PRICE_LIST.find(i=>i.id===id); if(it) return {id:it.id,name:it.name,price:effPrice(it)}; let c=(customServices||[]).find(i=>i.id===id); if(c) return {id:c.id,name:c.name,price:effPrice(c)}; return null; }
function togglePriceEdit(v){ priceEditOn=!!v; localStorage.setItem(LS_KEY+'priceEditOn', priceEditOn?'1':'0'); if(document.getElementById('oSvcPickList')) renderOrderPickList(); }
function editPrice(id){ id=+id; const cur=findSvc(id); if(!cur) return; const v=prompt('Нова ціна для «'+cur.name+'»:', cur.price); if(v===null) return; const n=parseFloat(v); if(isNaN(n)||n<0){ alert('Невірна ціна'); return; } priceOverrides[id]=n; localStorage.setItem(LS_KEY+'priceOverrides',JSON.stringify(priceOverrides)); if(typeof renderPrice==='function') renderPrice(); if(document.getElementById('oSvcPickList')) renderOrderPickList(); if(window._orderSvcs){ const it2=window._orderSvcs.find(x=>x.id===id); if(it2){ it2.price=n; if(typeof renderSelectedSvcs==='function') renderSelectedSvcs(); } } }
function resetPrice(id){ id=+id; delete priceOverrides[id]; localStorage.setItem(LS_KEY+'priceOverrides',JSON.stringify(priceOverrides)); renderPrice(); }
function addCustomService(){ const name=prompt('Назва нової послуги:'); if(!name) return; const price=parseFloat(prompt('Ціна, ₴:','0'))||0; const maxId=(customServices||[]).reduce((m,x)=>Math.max(m,x.id),9000); customServices.push({id:maxId+1,name:name.trim(),price}); save('customSvc',customServices); renderPrice(); }
function delCustomService(id){ id=+id; if(!confirm('Видалити власну послугу?'))return; customServices=customServices.filter(x=>x.id!==id); save('customSvc',customServices); quickServices=quickServices.filter(q=>q!==id); save('quickSvc',quickServices); renderPrice(); }
function toggleQuick(id){ id=+id; if(quickServices.includes(id)) quickServices=quickServices.filter(q=>q!==id); else quickServices.push(id); save('quickSvc',quickServices); renderPrice(); if(document.getElementById('oQuick')) renderOrderQuick(); }
function renderOrderQuick(){
  const el=document.getElementById('oQuick'); if(!el) return;
  const list = quickServices.map(id=>{ const x=findSvc(id); if(!x) return ''; return `<div onclick="addOrderSvc(${x.id})" style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-bottom:1px solid var(--border);cursor:pointer;font-size:0.82rem"><span>${x.name}</span><b style="color:var(--red-light)">${fmtMoney(x.price)}</b></div>`; }).join('');
  const popular = getPopularOrderServices(6).filter(x=>!quickServices.includes(x.id));
  const popularHtml = popular.length
    ? `<div class="order-popular-box"><div class="order-popular-title">🔥 Популярні з історії</div><div class="order-popular-list">${popular.map(x=>`<button type="button" class="order-chip" onclick="addOrderSvc(${x.id})"><span>${x.name}</span><b>${fmtMoney(x.price)}</b></button>`).join('')}</div></div>`
    : `<div class="order-popular-empty">Ще немає історії — хіти з'являться автоматично</div>`;
  el.innerHTML = `<button type="button" class="btn btn-dark btn-sm" style="width:100%;display:flex;justify-content:space-between;align-items:center;font-size:0.8rem" onclick="toggleQuickPanel()"><span>⭐ Швидкі послуги (${quickServices.length})</span><span id="oQuickArrow">▾</span></button>
    <div id="oQuickList" style="display:none;border:1px solid var(--border);border-radius:8px;margin-top:6px;overflow:hidden">
      ${list || '<div style="padding:10px;font-size:0.78rem;color:var(--text-dim)">Поки порожньо. Створи нижче або постав ⭐ у Прайсі.</div>'}
      <div style="padding:8px"><button type="button" class="btn btn-red btn-sm" style="width:100%;font-size:0.74rem" onclick="createQuickService()">＋ Створити швидку послугу</button></div>
    </div>${popularHtml}`;
}
function toggleQuickPanel(){ const l=document.getElementById('oQuickList'); const a=document.getElementById('oQuickArrow'); if(!l) return; const open=l.style.display==='none'; l.style.display=open?'block':'none'; if(a) a.textContent=open?'▴':'▾'; }
function createQuickService(){ const name=prompt('Назва швидкої послуги:'); if(!name) return; const price=parseFloat(prompt('Ціна, ₴:','0'))||0; const maxId=(customServices||[]).reduce((m,x)=>Math.max(m,x.id),9000); const id=maxId+1; customServices.push({id,name:name.trim(),price}); save('customSvc',customServices); if(!quickServices.includes(id)){ quickServices.push(id); save('quickSvc',quickServices); } renderOrderQuick(); const l=document.getElementById('oQuickList'); if(l) l.style.display='block'; if(typeof renderPrice==='function') renderPrice(); }
function normPhone(p){ const d=(p||'').replace(/\D/g,''); return d.length>9?d.slice(-9):d; }
function findClientByPhone(p){ const n=normPhone(p); if(!n) return null; return clients.find(c=>c.phone&&normPhone(c.phone)===n)||null; }
function normName(n){ return (n||'').trim().replace(/\s+/g,' ').toLowerCase(); }
function findClientByName(n){ const k=normName(n); if(!k) return null; return clients.find(c=>normName(c.name)===k)||null; }
function normPlate(v){ return (v||'').toUpperCase().replace(/[^A-ZА-ЯІЇЄ0-9]/g,''); }
function findClientByPlate(v){ const k=normPlate(v); if(!k) return null; return clients.find(c=>c.plate&&normPlate(c.plate)===k)||null; }
function formatUaPhone(v){
  const digits=(v||'').replace(/\D/g,'');
  if(!digits) return '';
  let d=digits;
  if(d.startsWith('380')) d=d.slice(0,12);
  else if(d.startsWith('80')) d=('3'+d).slice(0,12);
  else if(d.startsWith('0')) d=('38'+d).slice(0,12);
  else if(d.length<=9) d=('380'+d).slice(0,12);
  else d=d.slice(0,12);
  const rest=d.slice(3);
  const parts=[];
  if(rest.slice(0,2)) parts.push(rest.slice(0,2));
  if(rest.slice(2,5)) parts.push(rest.slice(2,5));
  if(rest.slice(5,7)) parts.push(rest.slice(5,7));
  if(rest.slice(7,9)) parts.push(rest.slice(7,9));
  return '+380'+(parts.length?' '+parts.join(' '):'');
}
function applyOrderClientMatch(c){
  if(!c) return;
  const ce=document.getElementById('oClient');
  const cae=document.getElementById('oCar');
  const ple=document.getElementById('oPlate');
  if(ce&&!ce.value.trim()) ce.value=c.name||'';
  if(cae&&!cae.value.trim()&&c.car) cae.value=c.car;
  if(ple&&!ple.value.trim()&&c.plate) ple.value=c.plate;
}
function renderClientHint(c,source){
  const el=document.getElementById('oClientHint'); if(!el) return;
  if(!c){ el.textContent='Новий клієнт'; el.className='client-hint'; return; }
  const src = source==='plate' ? 'по номеру' : source==='name' ? 'по імені' : 'по телефону';
  const bits=[`Знайдено ${src}`];
  if(c.name) bits.push(c.name);
  if(c.car) bits.push(c.car);
  if(c.plate) bits.push(c.plate);
  if(c.lastVisit) bits.push('візит '+new Date(c.lastVisit).toLocaleDateString('uk-UA'));
  el.textContent=bits.join(' · ');
  el.className='client-hint found';
}
function findOrderClientCandidate(){
  const phone=(document.getElementById('oPhone')||{}).value||'';
  const plate=(document.getElementById('oPlate')||{}).value||'';
  const name=(document.getElementById('oClient')||{}).value||'';
  const byPhone=findClientByPhone(phone); if(byPhone) return {client:byPhone,source:'phone'};
  const byPlate=findClientByPlate(plate); if(byPlate) return {client:byPlate,source:'plate'};
  const byName=findClientByName(name); if(byName) return {client:byName,source:'name'};
  return {client:null,source:''};
}
function syncOrderClientHint(fill){
  const hit=findOrderClientCandidate();
  if(hit.client && fill) applyOrderClientMatch(hit.client);
  renderClientHint(hit.client, hit.source);
  return hit.client;
}
function orderPhoneLookup(){
  const pe=document.getElementById('oPhone'); if(!pe) return;
  const cur=pe.value||'';
  const fmt=formatUaPhone(cur);
  if(fmt && fmt!==cur) pe.value=fmt;
  setOrderFieldInvalid('oPhone',false);
  syncOrderClientHint(true);
  clearOrderFeedback();
  saveOrderDraft();
  updateOrderSubmitState();
}
function orderPlateLookup(){
  setOrderFieldInvalid('oPlate',false);
  syncOrderClientHint(true);
  clearOrderFeedback();
  saveOrderDraft();
  updateOrderSubmitState();
}
function getPopularOrderServices(limit){
  const map={};
  (orders||[]).forEach(o=>{
    (o.services||[]).forEach(s=>{
      const id=+s.id;
      if(!id) return;
      if(!map[id]) map[id]={id,name:s.name||'Послуга',price:+s.price||0,uses:0};
      map[id].uses+=Math.max(1,+s.qty||1);
      if(+s.price>0) map[id].price=+s.price;
    });
  });
  return Object.values(map)
    .sort((a,b)=>b.uses-a.uses)
    .slice(0,limit||6)
    .map(x=>{
      const current=findSvc(x.id);
      return {
        id:x.id,
        name:(current&&current.name)||x.name,
        price:(current&&current.price!=null)?current.price:x.price,
        uses:x.uses
      };
    });
}
function clearOrderDraft(){ try{ localStorage.removeItem(ORDER_DRAFT_KEY); }catch(e){} }
function loadOrderDraft(){ try{ return JSON.parse(localStorage.getItem(ORDER_DRAFT_KEY)||'null'); }catch(e){ return null; } }
function saveOrderDraft(){
  if(window._editOrderId) return;
  const draft={
    clientName:(document.getElementById('oClient')||{}).value||'',
    company:(document.getElementById('oCompany')||{}).value||'',
    phone:(document.getElementById('oPhone')||{}).value||'',
    car:(document.getElementById('oCar')||{}).value||'',
    plate:(document.getElementById('oPlate')||{}).value||'',
    notes:(document.getElementById('oNotes')||{}).value||'',
    paid:(document.getElementById('oPaid')||{}).value||'',
    paymentType:(document.getElementById('oPayType')||{}).value||'cash',
    services:(window._orderSvcs||[]).map(s=>({id:s.id,name:s.name,price:s.price,qty:s.qty})),
    materials:(window._orderMats||[]).map(m=>({id:m.id,name:m.name,qty:m.qty,src:m.src})),
    catFilter:window._orderCatFilter,
    catCount:CAT_META.length,
    radius:window._orderRadius
  };
  const hasData = draft.services.length || draft.materials.length || [draft.clientName,draft.phone,draft.car,draft.plate,draft.notes,draft.paid].some(v=>(v||'').trim());
  if(!hasData){ clearOrderDraft(); return; }
  try{ localStorage.setItem(ORDER_DRAFT_KEY, JSON.stringify(draft)); }catch(e){}
}
function applyOrderDraft(draft){
  if(!draft || window._editOrderId) return false;
  const set=(id,v)=>{ const e=document.getElementById(id); if(e) e.value=(v==null?'':v); };
  set('oClient',draft.clientName); setClientNameFields(draft.clientName); set('oCompany',draft.company); set('oPhone',draft.phone); set('oCar',draft.car); set('oPlate',draft.plate);
  set('oNotes',draft.notes); set('oPaid',draft.paid);
  window._orderCatFilter=(typeof draft.catFilter==='number' && draft.catCount===CAT_META.length)?draft.catFilter:0;
  window._orderRadius=draft.radius||null;
  window._orderSvcs=(draft.services||[]).map(s=>({id:s.id,name:s.name,price:s.price,qty:s.qty}));
  const stock=getOrderMaterialAvailability([]);
  window._orderMats=(draft.materials||[]).map(m=>{
    const meta=stock[m.id]||{max:0,name:m.name||'товар',src:m.src||'warehouse'};
    return {id:m.id,name:m.name||meta.name,qty:+m.qty||1,src:m.src||meta.src,max:+meta.max||0};
  });
  setOrderPayType(draft.paymentType||'cash');
  renderOrderCatBtns();
  renderOrderRadius();
  renderSvcViewSwitch();
  renderOrderPickList();
  renderSelectedSvcs();
  renderOrderMatPicker();
  renderOrderMats();
  renderOrderPaySummary();
  updateOrderSubmitState();
  syncOrderClientHint(false);
  return true;
}
function repeatOrder(oid){
  const o=orders.find(x=>x.id===oid); if(!o) return;
  closeModal();
  clearOrderDraft();
  openNewOrder();
  const set=(id,v)=>{ const e=document.getElementById(id); if(e) e.value=(v==null?'':v); };
  set('oClient',o.clientName||''); setClientNameFields(o.clientName); set('oCompany',o.company||''); set('oPhone',o.phone||''); set('oCar',o.car||''); set('oPlate',o.plate||'');
  set('oNotes',o.notes||''); set('oPaid','');
  setOrderPayType(o.paymentType||'cash');
  window._orderSvcs=(o.services||[]).map(s=>{ const cur=findSvc(s.id); return {id:s.id,name:(cur&&cur.name)||s.name,price:(cur&&cur.price!=null)?cur.price:s.price,qty:s.qty}; });
  const stock=getOrderMaterialAvailability([]);
  window._orderMats=(o.materials||[]).map(m=>{ const meta=stock[m.id]||{max:0,name:m.name||'товар',src:m.src||'warehouse'}; return {id:m.id,name:m.name||meta.name,qty:+m.qty||1,src:m.src||meta.src,max:+meta.max||0}; });
  renderOrderPickList();
  renderSelectedSvcs();
  renderOrderMatPicker();
  renderOrderMats();
  renderOrderPaySummary();
  syncOrderClientHint(false);
  saveOrderDraft();
  setOrderFeedback('success','Повторне замовлення підготовлено — перевір оплату і склад');
}
async function fetchServerOrderNumber(){ const sp=getSupa(); if(!sp||!navigator.onLine||!_session) return null; try{ const {data,error}=await sp.rpc('next_v4_order_number'); if(error||data==null) return null; return String(data); }catch(e){ return null; } }
async function assignServerNumbers(){ let changed=false; for(const o of (orders||[])){ if(o.numSrc==='temp'){ const n=await fetchServerOrderNumber(); if(n){ o.orderNumber=n; o.numSrc='server'; changed=true; } else break; } } if(changed){ save('orders',orders); if(typeof renderOrders==='function')renderOrders(); if(typeof renderDebtors==='function')renderDebtors(); } }
function priceRow(item,isCustom,cols){
  const p=effPrice(item); const edited=priceOverrides[item.id]!=null; const star=quickServices.includes(item.id)?'⭐':'☆';
  let r=`<tr><td>${isCustom?'•':item.id}</td><td>${item.name}</td><td><b ${edited?'style="color:var(--red-light)"':''}>${fmtMoney(p)}</b></td>`;
  if(topSecret) r+=`<td class="ts-price">${fmtMoney(Math.round(p*0.35))}</td>`;
  r+=`<td style="white-space:nowrap"><span style="cursor:pointer" onclick="toggleQuick(${item.id})">${star}</span> <span style="cursor:pointer" onclick="editPrice(${item.id})">✏️</span>${edited?` <span style="cursor:pointer" title="Скинути" onclick="resetPrice(${item.id})">↩️</span>`:''}${isCustom?` <span style="cursor:pointer" onclick="delCustomService(${item.id})">🗑️</span>`:''}</td></tr>`;
  return r;
}
function renderPrice(){
  const q = (document.getElementById('priceSearch')?.value||'').toLowerCase();
  const cols = topSecret ? 5 : 4;
  let html = `<thead><tr><th style="width:40px">№</th><th>Послуга</th><th style="width:80px">Ціна</th>`+(topSecret?'<th style="width:60px">35%</th>':'')+`<th style="width:90px">⭐/✏️</th></tr></thead><tbody>`;
  html += `<tr><td colspan="${cols}"><button class="btn btn-red btn-sm" style="font-size:0.7rem" onclick="addCustomService()">＋ Нова послуга</button></td></tr>`;
  let currentCat = -1;
  PRICE_LIST.forEach(item => {
    if(item.id === undefined && item.cat !== undefined){ currentCat = item.cat; return; }
    if(!item.id) return;
    if(activeCatFilter >= 0 && currentCat !== activeCatFilter) return;
    if(q && !item.name.toLowerCase().includes(q)) return;
    const catMeta = CAT_META[currentCat] || {name:'?',color:'#999',icon:''};
    if(!html.includes(`data-cidx="${currentCat}"`)){
      html += `<tr class="cat-row" data-cidx="${currentCat}"><td colspan="${cols}">${catMeta.icon} ${catMeta.name}</td></tr>`;
    }
    html += priceRow(item,false,cols);
  });
  const cust=(customServices||[]).filter(x=>!q||x.name.toLowerCase().includes(q));
  if(cust.length && activeCatFilter<0){ html += `<tr class="cat-row"><td colspan="${cols}">🧩 Власні послуги</td></tr>`; cust.forEach(x=>{ html+=priceRow(x,true,cols); }); }
  html += '</tbody>';
  document.getElementById('priceTable').innerHTML = html;
}
function getPriceCat(item){
  for(let i=PRICE_LIST.indexOf(item)-1;i>=0;i--) if(PRICE_LIST[i].cat!==undefined && !PRICE_LIST[i].id) return PRICE_LIST[i].cat;
  return -1;
}
function filterPrice(){ activeCatFilter=-1; renderCatTiles(); renderPrice(); }

// ==================== ORDERS ====================
function getOrderCashEntries(orderId){
  return (cashbook||[])
    .filter(c=>c.type==='income' && c.orderId===orderId)
    .sort((a,b)=>new Date(a.date)-new Date(b.date));
}
function getOrderPaidAmount(o){
  if(o && o.id){
    const entries=getOrderCashEntries(o.id);
    if(entries.length) return entries.reduce((s,c)=>s+(+c.amount||0),0);
  }
  return +(o&&o.paidAmount!=null?o.paidAmount:0)||0;
}
function getOrderDebtAmount(o){
  if(!o || o.status==='cancel') return 0;
  return Math.max(0,(+o.total||0)-getOrderPaidAmount(o));
}
function syncOrderPaymentState(orderOrId){
  const o=typeof orderOrId==='string' ? orders.find(x=>x.id===orderOrId) : orderOrId;
  if(!o) return {paid:0,debt:0};
  o.paidAmount=getOrderPaidAmount(o);
  o.debt=Math.max(0,(+o.total||0)-(+o.paidAmount||0));
  return {paid:o.paidAmount,debt:o.debt};
}
function paymentSourceLabel(src){
  const map={order_base:'Стартова оплата',debt_settlement:'Доплата боргу',close_cash:'Закриття в касу',manual:'Ручний платіж'};
  return map[src]||'Платіж';
}
function buildOrderPaymentDesc(o, source){
  const num=o.orderNumber||o.id.slice(-5).toUpperCase();
  const base='Замовлення #'+num+' — '+(o.clientName||'');
  if(source==='debt_settlement') return 'Погашення боргу #'+num+' — '+(o.clientName||'');
  if(source==='close_cash') return 'Закриття замовлення #'+num+' — '+(o.clientName||'');
  return base;
}
function addOrderPaymentEntry(o, amount, method, source, date, desc){
  const amt=+amount||0;
  if(!o || amt<=0) return null;
  cashbook.push({
    id:uid(),
    date:date||new Date().toISOString(),
    type:'income',
    amount:amt,
    method:method||o.paymentType||'cash',
    desc:desc||buildOrderPaymentDesc(o,source),
    orderId:o.id,
    paymentSource:source||'manual'
  });
  syncOrderPaymentState(o);
  save('cash',cashbook);
  return true;
}
function upsertOrderBasePayment(o, desiredPaid, date){
  if(!o) return;
  cashbook = cashbook.filter(c=>!(c.type==='income' && c.orderId===o.id && (c.paymentSource||'manual')==='order_base'));
  const extraPaid=getOrderCashEntries(o.id).reduce((s,c)=>s+(+c.amount||0),0);
  const baseAmount=Math.max(0,(+desiredPaid||0)-extraPaid);
  if(baseAmount>0){
    cashbook.push({
      id:uid(),
      date:date||o.date||new Date().toISOString(),
      type:'income',
      amount:baseAmount,
      method:o.paymentType||'cash',
      desc:buildOrderPaymentDesc(o,'order_base'),
      orderId:o.id,
      paymentSource:'order_base'
    });
  }
  syncOrderPaymentState(o);
  save('cash',cashbook);
}
function getOrderPaymentMeta(o){
  const total=+((o&&o.total)||0);
  const paid=getOrderPaidAmount(o);
  const debt=getOrderDebtAmount(o);
  if(!total) return {label:'Без суми', cls:'pay-empty'};
  if(debt<=0) return {label:'Оплачено', cls:'pay-paid'};
  if(paid>0) return {label:'Частково', cls:'pay-partial'};
  return {label:'Борг', cls:'pay-debt'};
}
function getOrderStatusMeta(o){
  const key=((o&&o.status)||'new');
  const map={
    new:{key:'new',label:'Нове',icon:'🆕',cls:'badge-new'},
    progress:{key:'progress',label:'В роботі',icon:'🔄',cls:'badge-progress'},
    done:{key:'done',label:'Виконано',icon:'✅',cls:'badge-done'},
    cancel:{key:'cancel',label:'Скасовано',icon:'❌',cls:'badge-cancel'}
  };
  return map[key]||map.new;
}
function refreshOrderCollections(){
  save('orders',orders);
  renderOrders();
  if(typeof renderDebtors==='function') renderDebtors();
  if(typeof renderCash==='function') renderCash();
  if(typeof renderHome==='function') renderHome();
  renderOrderBell();
}
function reopenOrderModalIfCurrent(oid){
  const overlay=document.querySelector('.modal-overlay.open');
  if(!overlay || !window._printOrder || window._printOrder.id!==oid) return;
  closeModal();
  viewOrder(oid);
}
function setOrderStatusQuick(oid,status){
  const o=orders.find(x=>x.id===oid); if(!o) return;
  if(status==='progress' && !o.startedAt) o.startedAt=new Date().toISOString();
  if(status==='done' && !o.doneAt) o.doneAt=new Date().toISOString();
  if(status==='cancel' && !o.cancelledAt) o.cancelledAt=new Date().toISOString();
  o.status=status;
  refreshOrderCollections();
  reopenOrderModalIfCurrent(oid);
}
function startOrderWork(oid){ setOrderStatusQuick(oid,'progress'); }
function finishOrderWork(oid){ setOrderStatusQuick(oid,'done'); }
function cancelOrderQuick(oid){ if(!confirm('Позначити замовлення як скасоване?')) return; setOrderStatusQuick(oid,'cancel'); }
function renderOrderListFilters(){
  const el=document.getElementById('orderFilterRow'); if(!el) return;
  const cur=window._orderListFilter||'all';
  const filters=[['all','Усі'],['new','Нові'],['progress','В роботі'],['done','Виконано'],['debt','З боргом']];
  el.innerHTML=filters.map(([k,label])=>`<button type="button" class="order-filter-btn${cur===k?' active':''}" onclick="setOrderListFilter('${k}')">${label}</button>`).join('');
}
function setOrderListFilter(v){
  window._orderListFilter=v||'all';
  renderOrderListFilters();
  filterOrders();
}
function renderOrders(){
  const stats = {total:orders.length, new_:0, progress:0, done:0, totalSum:0, debtCount:0, debtSum:0};
  orders.forEach(o=>{
    if(o.status==='new') stats.new_++;
    if(o.status==='progress') stats.progress++;
    if(o.status==='done'){ stats.done++; stats.totalSum+=o.total||0; }
    const debt=getOrderDebtAmount(o);
    if(debt>0){ stats.debtCount++; stats.debtSum+=debt; }
  });
  document.getElementById('orderStats').innerHTML = `
    <div class="stat-card"><div class="num">${stats.total}</div><div class="lbl">Всього</div></div>
    <div class="stat-card"><div class="num">${stats.new_}</div><div class="lbl">Нових</div></div>
    <div class="stat-card"><div class="num">${stats.progress}</div><div class="lbl">В роботі</div></div>
    <div class="stat-card"><div class="num">${fmtMoney(stats.totalSum)}</div><div class="lbl">Виконано</div></div>
    <div class="stat-card"><div class="num" style="color:var(--accent)">${fmtMoney(stats.debtSum)}</div><div class="lbl">Борг (${stats.debtCount})</div></div>
  `;
  renderOrderListFilters();
  filterOrders();
}
function filterOrders(){
  const q = (document.getElementById('orderSearch')?.value||'').toLowerCase();
  const filter = window._orderListFilter||'all';
  const list = orders.filter(o => {
    const s = `${o.id} ${o.orderNumber||''} ${o.car||''} ${o.plate||''} ${o.clientName||''} ${o.phone||''}`.toLowerCase();
    if(q && !s.includes(q)) return false;
    if(filter==='all') return true;
    if(filter==='debt') return getOrderDebtAmount(o)>0;
    return (o.status||'new')===filter;
  }).sort((a,b)=>new Date(b.date)-new Date(a.date));

  if(!list.length){
    const emptyText = filter==='debt' ? 'Боргових замовлень немає' : 'Замовлень поки немає';
    document.getElementById('ordersList').innerHTML=`<p style="color:var(--text-dim);text-align:center;padding:40px">${emptyText}</p>`;
    return;
  }

  let html='';
  list.forEach(o => {
    const st = getOrderStatusMeta(o);
    const pay = getOrderPaymentMeta(o);
    const paid = getOrderPaidAmount(o);
    const debt = getOrderDebtAmount(o);
    html += `<div class="card" onclick="viewOrder('${o.id}')">
      <div class="flex-between">
        <span style="font-family:'Oswald';color:var(--red-light)">#${o.orderNumber||o.id.slice(-5).toUpperCase()}</span>
        <div class="gap-btns" style="gap:6px">
          <span class="badge ${st.cls}">${st.icon} ${st.label}</span>
          <span class="pay-badge ${pay.cls}">${pay.label}</span>
        </div>
      </div>
      <div style="margin-top:6px;font-size:0.85rem">
        <div>🚗 ${o.car||'—'} ${o.plate?'· '+o.plate:''}</div>
        <div>👤 ${o.clientName||'—'} ${o.phone?'• '+o.phone:''}</div>
        <div style="color:var(--text-dim);font-size:0.78rem">${fmtDate(o.date)}</div>
      </div>
      <div style="margin-top:6px;font-family:'Oswald';font-size:1.1rem">${fmtMoney(o.total||0)}${debt>0?' <span style="color:var(--accent);font-size:0.82rem">• борг '+fmtMoney(debt)+'</span>':''}${topSecret?' <span class="ts-price">(майстер: '+fmtMoney(Math.round((o.total||0)*0.35))+')</span>':''}</div>
      <div style="margin-top:4px;color:var(--text-dim);font-size:0.77rem">${o.paymentType==='cashless'?'💳 Безготівка':'💵 Готівка'} · оплачено ${fmtMoney(paid)}${debt>0?' · залишок '+fmtMoney(debt):''}</div>
      <div class="order-card-actions no-print" onclick="event.stopPropagation()">
        <button class="order-action-btn" onclick="event.stopPropagation();repeatOrder('${o.id}')">🔁 Повтор</button>
        <button class="order-action-btn ${st.key==='progress'?'is-active':''}" onclick="event.stopPropagation();startOrderWork('${o.id}')">🔄 В роботу</button>
        <button class="order-action-btn success ${st.key==='done'?'is-active':''}" onclick="event.stopPropagation();finishOrderWork('${o.id}')">✅ Виконано</button>
        <button class="order-action-btn danger ${st.key==='cancel'?'is-active':''}" onclick="event.stopPropagation();cancelOrderQuick('${o.id}')">✖ Скасувати</button>
      </div>
    </div>`;
  });
  document.getElementById('ordersList').innerHTML = html;
}
function nextOrderNumber(){ let n=parseInt(localStorage.getItem(LS_KEY+'orderSeq')||'0',10)||0; n++; try{localStorage.setItem(LS_KEY+'orderSeq',n);}catch(e){} return String(n).padStart(5,'0'); }
function renderOrderBell(){
  const b=document.getElementById('oBellBadge'); if(!b) return;
  const n=(orders||[]).filter(o=>getOrderDebtAmount(o)>0).length;
  if(n>0){ b.textContent=n; b.style.display='inline-block'; } else { b.style.display='none'; }
}
function getOrderLiveState(){
  const services=window._orderSvcs||[];
  let total=0, itemCount=0;
  services.forEach(s=>{
    const qty=Math.max(1,+s.qty||1);
    itemCount+=qty;
    total+=(+s.price||0)*qty;
  });
  const pe=document.getElementById('oPaid');
  const rawPresent=!!(pe&&pe.value!=='');
  let entered=rawPresent?(parseFloat(pe.value)||0):total;
  if(entered<0) entered=0;
  const applied=Math.min(entered,total);
  const debt=Math.max(0,total-applied);
  const change=Math.max(0,entered-total);
  return {servicesCount:services.length,itemCount,total,entered,applied,debt,change,rawPresent};
}
function setOrderFeedback(type,msg){
  const el=document.getElementById('oOrderFeedback'); if(!el) return;
  if(!msg){ el.style.display='none'; el.textContent=''; el.className='order-feedback'; return; }
  el.style.display='block';
  el.textContent=msg;
  el.className='order-feedback '+type;
}
function clearOrderFeedback(){ setOrderFeedback('', ''); }
function renderOrderPaySummary(){
  const el=document.getElementById('oPaySummary');
  const totalEl=document.getElementById('oSvcTotal');
  const headSub=document.getElementById('oHeadSub');
  const s=getOrderLiveState();
  if(totalEl) totalEl.textContent=fmtMoney(s.total);
  if(headSub) headSub.textContent=s.servicesCount?`Обрано ${s.servicesCount} посл. · ${s.itemCount} шт · ${fmtMoney(s.total)}`:'Оберіть категорію та послуги зліва';
  if(!el) return;
  if(!s.total){ el.className='pay-summary is-empty'; el.textContent='До сплати: 0₴'; return; }
  if(!s.rawPresent){ el.className='pay-summary is-empty'; el.textContent=`До сплати: ${fmtMoney(s.total)} · порожнє поле = повна оплата`; return; }
  if(s.change>0){ el.className='pay-summary is-warn'; el.textContent=`До зарахування: ${fmtMoney(s.total)} · решта: ${fmtMoney(s.change)}`; return; }
  if(s.debt>0){ el.className='pay-summary is-warn'; el.textContent=`Сплачено: ${fmtMoney(s.applied)} · борг: ${fmtMoney(s.debt)}`; return; }
  el.className='pay-summary is-ok';
  el.textContent=`Оплачено повністю: ${fmtMoney(s.total)}`;
}
function setOrderFieldInvalid(id,on){
  const el=document.getElementById(id);
  if(el) el.classList.toggle('is-invalid', !!on);
}
function getOrderFormIssues(markFields){
  const mark=markFields!==false;
  if(mark) ['oClient','oPhone','oCar','oPlate'].forEach(id=>setOrderFieldInvalid(id,false));
  const issues=[];
  const client=((document.getElementById('oClient')||{}).value||'').trim();
  const phone=((document.getElementById('oPhone')||{}).value||'').trim();
  const car=((document.getElementById('oCar')||{}).value||'').trim();
  const plate=((document.getElementById('oPlate')||{}).value||'').trim();
  if(!client && !phone && !plate){
    issues.push('Вкажіть клієнта, телефон або держномер');
    if(mark){ setOrderFieldInvalid('oClient',true); setOrderFieldInvalid('oPhone',true); setOrderFieldInvalid('oPlate',true); }
  }
  if(client && client.length<2){
    issues.push("Ім'я клієнта закоротке");
    if(mark) setOrderFieldInvalid('oClient',true);
  }
  if(phone){
    const digits=phone.replace(/\D/g,'');
    if(digits.length!==12 || !digits.startsWith('380')){
      issues.push('Телефон має бути у форматі +380 XX XXX XX XX');
      if(mark) setOrderFieldInvalid('oPhone',true);
    }
  }
  if(car && car.length<2){
    issues.push('Уточніть авто');
    if(mark) setOrderFieldInvalid('oCar',true);
  }
  if(plate){
    const norm=normPlate(plate);
    if(norm.length<6 || norm.length>10){
      issues.push('Перевірте держномер');
      if(mark) setOrderFieldInvalid('oPlate',true);
    }
  }
  return issues;
}
function updateOrderSubmitState(){
  const btn=document.querySelector('[data-order-submit]'); if(!btn) return;
  const s=getOrderLiveState();
  const busy=!!window._orderSubmitting;
  const matIssues=getOrderMaterialIssues(window._orderMats||[], getOrderEditBaseMaterials());
  const formIssues=getOrderFormIssues(false);
  btn.disabled=busy || !s.servicesCount || !!matIssues.length || !!formIssues.length;
  btn.textContent=busy ? (window._editOrderId?'⏳ Зберігаю...':'⏳ Оформлюю...') : (window._editOrderId?'💾 Зберегти зміни':'✅ Оформити');
  btn.title=busy?'Зачекайте, триває збереження':(matIssues.length?'На складі не вистачає матеріалів':(formIssues[0]|| (s.servicesCount?'':'Спочатку додайте послугу')));
}
function splitClientName(full){
  full=(full||'').trim();
  if(!full) return ['',''];
  const parts=full.split(/\s+/);
  if(parts.length===1) return ['',parts[0]];
  return [parts[0], parts.slice(1).join(' ')];
}
function syncClientNameField(){
  const ln=(document.getElementById('oLastName')||{}).value||'';
  const fn=(document.getElementById('oFirstName')||{}).value||'';
  const ce=document.getElementById('oClient');
  if(ce) ce.value=(ln+' '+fn).trim();
  clearOrderFeedback();
  setOrderFieldInvalid('oClient',false);
  syncOrderClientHint(false);
  saveOrderDraft();
  updateOrderSubmitState();
}
function setClientNameFields(full){
  const [ln,fn]=splitClientName(full);
  const le=document.getElementById('oLastName'); if(le) le.value=ln;
  const fe=document.getElementById('oFirstName'); if(fe) fe.value=fn;
  const ce=document.getElementById('oClient'); if(ce) ce.value=(full||'').trim();
}
function initOrderInteractions(){
  ['oClient','oCompany','oCar','oPlate','oPaid','oNotes','oSvcSearch'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el || el.dataset.bound==='1') return;
    el.addEventListener('input',()=>{
      clearOrderFeedback();
      setOrderFieldInvalid(id,false);
      if(id==='oPaid'){ renderOrderPaySummary(); }
      if(id==='oClient' || id==='oPlate'){ syncOrderClientHint(id!=='oClient'); }
      if(id==='oCar'){ renderOrderPaySummary(); }
      saveOrderDraft();
      updateOrderSubmitState();
    });
    el.dataset.bound='1';
  });
  renderOrderPaySummary();
  updateOrderSubmitState();
  syncOrderClientHint(false);
}
window._orderListFilter = window._orderListFilter || 'all';
function setOrderPayType(v){
  const sel=document.getElementById('oPayType'); if(sel) sel.value=v;
  const cash=document.getElementById('payCashBtn'), card=document.getElementById('payCardBtn');
  if(cash) cash.classList.toggle('active', v==='cash');
  if(card) card.classList.toggle('active', v==='cashless');
  renderOrderPaySummary();
  updateOrderSubmitState();
  saveOrderDraft();
}
function openNewOrder(edit){
  window._orderSubmitting=false;
  document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('active'));
  const navBtn=document.querySelector('.nav button[data-tab="home"]'); if(navBtn) navBtn.classList.add('active');
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  const sec=document.getElementById('sec-home'); if(sec) sec.classList.add('active');
  window._orderSvcs = [];
  window._orderMats = [];
  window._orderCatFilter = 0;
  window._orderRadius = null;
  const search=document.getElementById('oSvcSearch'); if(search) search.value='';
  clearOrderFeedback();
  renderOrderCatBtns();
  renderOrderRadius();
  renderSvcViewSwitch();
  renderOrderPickList();
  renderOrderQuick();
  renderSelectedSvcs();
  renderOrderMatPicker();
  renderOrderMats();
  renderOrderBell();
  if(edit){
    window._editOrderId=edit.id;
    const set=(id,v)=>{const e=document.getElementById(id); if(e) e.value=(v==null?'':v);};
    set('oClient',edit.clientName); setClientNameFields(edit.clientName); set('oCompany',edit.company||''); set('oPhone',edit.phone); set('oCar',edit.car); set('oPlate',edit.plate);
    setOrderPayType(edit.paymentType||'cash'); set('oPaid',edit.paidAmount!=null?edit.paidAmount:''); set('oNotes',edit.notes);
    window._orderSvcs=(edit.services||[]).map(s=>({id:s.id,name:s.name,price:s.price,qty:s.qty}));
    window._orderMats=(edit.materials||[]).map(m=>{ const cur=(window._stockIdx||{})[m.id]; return {id:m.id,name:m.name,qty:m.qty,src:m.src,max:(cur?cur.max:0)+(+m.qty||0)}; });
    renderSelectedSvcs(); renderOrderMats(); renderOrderPickList();
    const h3=document.querySelector('.order-head h3'); if(h3) h3.textContent='✏️ Редагувати #'+(edit.orderNumber||edit.id.slice(-6).toUpperCase());
    const sb=document.querySelector('[data-order-submit]'); if(sb) sb.textContent='💾 Зберегти зміни';
  } else {
    window._editOrderId=null;
    ['oClient','oLastName','oFirstName','oCompany','oPhone','oCar','oPlate','oPaid','oNotes'].forEach(id=>{ const e=document.getElementById(id); if(e) e.value=''; });
    setOrderPayType('cash');
    const h3=document.querySelector('.order-head h3'); if(h3) h3.textContent='🧾 Нове замовлення';
    const sb=document.querySelector('[data-order-submit]'); if(sb) sb.textContent='✅ Оформити';
    if(applyOrderDraft(loadOrderDraft())) setOrderFeedback('success','Чернетку відновлено');
  }
  renderOrderPaySummary();
  updateOrderSubmitState();
  syncOrderClientHint(false);
}
function renderOrderCatBtns(){
  const el = document.getElementById('oSvcCatBtns');
  if(!el) return;
  const counts={}; let cur=-1;
  PRICE_LIST.forEach(it=>{ if(it.id===undefined && it.cat!==undefined){ cur=it.cat; return; } if(it.id) counts[cur]=(counts[cur]||0)+1; });
  const groupOf = i => (i<=2?0 : (i>=3&&i<=6?1 : 2));
  const groupTitles = ['🚗 Типи техніки','🩹 Латки','⚙️ Інше'];
  const cardHtml = (c,i) => {
    const on=window._orderCatFilter===i; const col=c.color;
    const ic=(typeof CAT_ICONS!=='undefined'&&CAT_ICONS[i])?`<img src="${CAT_ICONS[i]}">`:`<div style="font-size:3rem;height:60px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 3px 6px rgba(0,0,0,.6))">${c.icon}</div>`;
    const style=`--glowcol:${col};background:#121212;border:2px solid ${col};box-shadow:${on?'0 0 0 2px '+col+',0 0 28px '+col+'aa,0 0 50px '+col+'55,inset 0 0 18px '+col+'22':'0 0 14px '+col+'55,0 0 3px '+col+'99,inset 0 0 10px '+col+'11'};transition:box-shadow .25s ease,border-color .25s ease`;
    const check=on?`<span class="ocat-check" style="background:${col};color:#0a0a0a">✓</span>`:'';
    return `<div class="ocat-card${on?' active':''}" style="${style}" onclick="window._orderCatFilter=${i};window._orderRadius=null;document.getElementById('oSvcSearch').value='';renderOrderCatBtns();renderOrderRadius();renderOrderPickList()">${check}${ic}<div class="nm" style="color:${col};font-size:1.25rem;font-weight:800;text-shadow:0 0 10px ${col}aa;display:inline-block;border:2px solid ${col};border-radius:8px;padding:3px 10px;background:${col}14;box-shadow:0 0 14px ${col}77">${c.short}</div><div class="cnt">${counts[i]||0} послуг</div></div>`;
  };
  let h=''; let lastGroup=-1;
  CAT_META.forEach((c,i)=>{
    const g=groupOf(i);
    if(g!==lastGroup){
      if(lastGroup!==-1) h+='</div>';
      h+=`<div style="grid-column:1/-1;font-family:'Oswald';font-weight:700;letter-spacing:.08em;color:var(--red-light,#ff4444);margin:${lastGroup===-1?'0':'22px'} 0 10px;font-size:1.5rem;text-transform:uppercase;text-shadow:0 0 10px rgba(255,68,68,.75),0 0 22px rgba(255,68,68,.4);padding-bottom:6px;border-bottom:2px solid rgba(255,68,68,.35)">${groupTitles[g]}</div>`;
      h+='<div style="display:contents">';
      lastGroup=g;
    }
    h+=cardHtml(c,i);
  });
  if(lastGroup!==-1) h+='</div>';
  el.innerHTML = h;
}
function filterOrderServices(){ renderOrderPickList(); }
function svcRadius(name){ const m=(name||'').match(/R\d+(?:\.\d+)?/); return m?m[0]:null; }
function renderOrderRadius(){
  const el=document.getElementById('oRadius'); if(!el) return;
  const cf=window._orderCatFilter;
  if(cf<0){ el.innerHTML=''; return; }
  let cur=-1; const rads=[];
  PRICE_LIST.forEach(it=>{ if(it.id===undefined&&it.cat!==undefined){cur=it.cat;return;} if(!it.id||cur!==cf) return; const r=svcRadius(it.name); if(r&&!rads.includes(r)) rads.push(r); });
  if(rads.length<2){ el.innerHTML=''; return; }
  rads.sort((a,b)=>parseFloat(a.slice(1))-parseFloat(b.slice(1)));
  let h=`<div class="orad-label">Оберіть радіус</div><div class="orad-row"><button type="button" class="orad-btn${!window._orderRadius?' active':''}" onclick="window._orderRadius=null;renderOrderRadius();renderOrderPickList()">Всі</button>`;
  rads.forEach(r=>{ h+=`<button type="button" class="orad-btn${window._orderRadius===r?' active':''}" onclick="window._orderRadius='${r}';renderOrderRadius();renderOrderPickList()">${r}</button>`; });
  h+='</div>';
  el.innerHTML=h;
}
function svcViewMode(){ return localStorage.getItem(LS_KEY+'svcViewMode')||'grid'; }
function setSvcViewMode(m){ localStorage.setItem(LS_KEY+'svcViewMode',m); renderOrderPickList(); renderSvcViewSwitch(); }
function renderSvcViewSwitch(){
  const el=document.getElementById('oSvcViewSwitch'); if(!el) return;
  const cur=svcViewMode();
  const modes=[['grid','🔲','Сітка'],['list','📃','Список'],['slider','↔️','Слайдер']];
  el.innerHTML=modes.map(([m,ic,label])=>{
    const on=cur===m;
    return `<button type="button" onclick="setSvcViewMode('${m}')" style="flex:1;min-width:90px;padding:8px 6px;border-radius:8px;font-size:0.78rem;font-weight:600;background:${on?'var(--red,#e01f26)':'#1a1a1a'};color:#fff;border:1px solid ${on?'var(--red,#e01f26)':'#2a2a2a'}">${ic} ${label}</button>`;
  }).join('');
}
function renderOrderPickList(){
  const el = document.getElementById('oSvcPickList');
  if(!el) return;
  const q = (document.getElementById('oSvcSearch')?.value||'').toLowerCase();
  const cf = window._orderCatFilter;
  const mode = svcViewMode();
  if(mode==='list'){ el.style.cssText='display:flex;flex-direction:column;gap:6px'; el.className=''; }
  else if(mode==='slider'){ el.style.cssText='display:flex;flex-direction:row;overflow-x:auto;gap:10px;padding-bottom:8px;-webkit-overflow-scrolling:touch'; el.className=''; }
  else { el.style.cssText=''; el.className='osvc-grid'; }
  let h=''; let currentCat=-1; let count=0;
  const mkGrid=(item)=>{ const p=effPrice(item); const added=window._orderSvcs.some(s=>s.id===item.id);
    return `<button type="button" class="osvc-btn${added?' added':''}" onclick="addOrderSvc(${item.id})"><span class="sn">${item.name}</span><span class="sp">${fmtMoney(p)}${added?' ✓':''}</span>${priceEditOn?`<span class="osvc-edit" onclick="event.stopPropagation();editPrice(${item.id})">✏️</span>`:''}</button>`; };
  const mkList=(item)=>{ const p=effPrice(item); const added=window._orderSvcs.some(s=>s.id===item.id); const r=svcRadius(item.name);
    return `<button type="button" onclick="addOrderSvc(${item.id})" style="display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:${added?'rgba(224,31,38,.15)':'#141414'};border:1px solid ${added?'var(--red,#e01f26)':'#2a2a2a'};border-radius:10px;padding:10px 12px;color:#fff">${r?`<span style="font-family:'Oswald';font-weight:700;font-size:1.3rem;color:var(--red,#e01f26);min-width:52px">${r}</span>`:''}<span style="flex:1;font-size:0.86rem;line-height:1.25">${item.name}</span><span style="font-weight:700;color:#4ade80;white-space:nowrap">${fmtMoney(p)}${added?' ✓':''}</span>${priceEditOn?`<span onclick="event.stopPropagation();editPrice(${item.id})">✏️</span>`:''}</button>`; };
  const mkSlider=(item)=>{ const p=effPrice(item); const added=window._orderSvcs.some(s=>s.id===item.id); const r=svcRadius(item.name);
    return `<button type="button" onclick="addOrderSvc(${item.id})" style="flex:0 0 auto;width:128px;display:flex;flex-direction:column;align-items:center;gap:6px;background:${added?'rgba(224,31,38,.15)':'#141414'};border:1px solid ${added?'var(--red,#e01f26)':'#2a2a2a'};border-radius:12px;padding:12px 8px;color:#fff">${r?`<span style="font-family:'Oswald';font-weight:700;font-size:1.4rem;color:var(--red,#e01f26)">${r}</span>`:''}<span style="font-size:0.76rem;text-align:center;line-height:1.2;min-height:2.2em">${item.name}</span><span style="font-weight:700;color:#4ade80">${fmtMoney(p)}${added?' ✓':''}</span></button>`; };
  const mk = mode==='list'?mkList : mode==='slider'?mkSlider : mkGrid;
  PRICE_LIST.forEach(item=>{
    if(item.id===undefined && item.cat!==undefined){ currentCat=item.cat; return; }
    if(!item.id) return;
    if(q){ if(!item.name.toLowerCase().includes(q)) return; }
    else { if(cf<0 || currentCat!==cf) return; if(window._orderRadius && svcRadius(item.name)!==window._orderRadius) return; }
    h+=mk(item); count++;
  });
  if(q){ (customServices||[]).forEach(item=>{ if(item.name.toLowerCase().includes(q)){ h+=mk(item); count++; } }); }
  if(!count) h=`<div style="grid-column:1/-1;padding:18px;text-align:center;color:var(--text-dim);font-size:0.84rem">${q?'Нічого не знайдено':'Оберіть категорію вгорі'}</div>`;
  el.innerHTML = h;
}
function gtHaptic(ms){ try{ if(navigator.vibrate) navigator.vibrate(ms||10); }catch(e){} }

/* Ripple — хвиля від дотику на кнопках і картках */
document.addEventListener('pointerdown', function(e){
  try{
    const t = e.target.closest('.ocat-card,.osvc-btn,.orad-btn,.pay-btn,.btn');
    if(!t) return;
    const r = t.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const s = document.createElement('span');
    s.className = 'gt-ripple';
    s.style.width = s.style.height = size + 'px';
    s.style.left = (e.clientX - r.left - size/2) + 'px';
    s.style.top  = (e.clientY - r.top  - size/2) + 'px';
    t.appendChild(s);
    setTimeout(()=>{ try{ s.remove(); }catch(_){}} , 600);
  }catch(_){}
}, {passive:true});

/* Пульсація суми при зміні */
function gtBumpTotal(){
  try{
    const el = document.querySelector('.cart-total');
    if(!el) return;
    el.classList.remove('gt-bump');
    void el.offsetWidth;
    el.classList.add('gt-bump');
    setTimeout(()=>{ try{ el.classList.remove('gt-bump'); }catch(_){}} , 500);
  }catch(_){}
}
function addOrderSvc(id){
  id=+id; const item = findSvc(id);
  if(!item) return;
  const existing = window._orderSvcs.find(s=>s.id===id);
  if(existing){ existing.qty++; }
  else { window._orderSvcs.push({id:item.id,name:item.name,price:item.price,qty:1}); }
  gtHaptic(10);
  gtBumpTotal();
  renderOrderPickList();
  renderSelectedSvcs();
  clearOrderFeedback();
}
function removeOrderSvc(id){
  window._orderSvcs = window._orderSvcs.filter(s=>s.id!==id);
  renderOrderPickList();
  renderSelectedSvcs();
  clearOrderFeedback();
}
function changeOrderSvcQty(id,delta){
  const s = window._orderSvcs.find(x=>x.id===id);
  if(!s) return;
  s.qty = Math.max(1, s.qty+delta);
  renderSelectedSvcs();
  clearOrderFeedback();
}
function renderSelectedSvcs(){
  const el = document.getElementById('oSelectedSvcs');
  const tel = document.getElementById('oSvcTotal');
  if(!el) return;
  let total=0;
  if(!window._orderSvcs.length){ el.innerHTML='<div style="text-align:center;color:var(--text-dim);font-size:0.8rem;padding:14px">Оберіть послуги зліва або натисніть хіт нижче</div>'; if(tel)tel.textContent=fmtMoney(0); renderOrderPaySummary(); updateOrderSubmitState(); saveOrderDraft(); return; }
  let h = '';
  window._orderSvcs.forEach(s=>{
    const sub = s.price*s.qty; total+=sub;
    h += `<div style="display:flex;align-items:center;gap:6px;padding:6px 0;border-bottom:1px solid var(--border);font-size:0.8rem">
      <button class="btn btn-dark btn-sm" style="padding:2px 6px;font-size:0.7rem" onclick="removeOrderSvc(${s.id})">✕</button>
      <span style="flex:1;line-height:1.15">${s.name}</span>
      <button class="btn btn-dark btn-sm" style="padding:2px 7px" onclick="changeOrderSvcQty(${s.id},-1)">−</button>
      <span style="min-width:18px;text-align:center;font-weight:700">${s.qty}</span>
      <button class="btn btn-dark btn-sm" style="padding:2px 7px" onclick="changeOrderSvcQty(${s.id},1)">+</button>
      <span style="min-width:62px;text-align:right;font-weight:700">${fmtMoney(sub)}</span>
    </div>`;
  });
  el.innerHTML = h;
  if(tel) tel.textContent = fmtMoney(total);
  renderOrderPaySummary();
  updateOrderSubmitState();
  saveOrderDraft();
}
function addServiceRow(){} // deprecated, kept for compat
function _stockList(){ const out=[]; (warehouse||[]).forEach(w=>out.push({id:w.id,name:w.name||'товар',max:+w.qty||0,src:'warehouse'})); (tires||[]).forEach(t=>out.push({id:t.id,name:((t.brand||'Шина')+' '+(t.size||'')).trim(),max:+t.qty||0,src:'tires'})); return out; }
function getOrderEditBaseMaterials(){
  if(!window._editOrderId) return [];
  const o=orders.find(x=>x.id===window._editOrderId);
  return (o&&o.materials)||[];
}
function getOrderMaterialAvailability(baseMaterials){
  const map={};
  _stockList().forEach(x=>map[x.id]={id:x.id,name:x.name,max:+x.max||0,src:x.src});
  (baseMaterials||[]).forEach(m=>{
    if(!map[m.id]) map[m.id]={id:m.id,name:m.name||'товар',max:0,src:m.src||'warehouse'};
    map[m.id].max+=(+m.qty||0);
  });
  return map;
}
function getOrderMaterialIssues(materials, baseMaterials){
  const stock=getOrderMaterialAvailability(baseMaterials);
  return (materials||[]).map(m=>{
    const meta=stock[m.id]||{max:0,name:m.name||'товар',src:m.src};
    const qty=+m.qty||0;
    const max=+meta.max||0;
    return {...m,name:m.name||meta.name,max,missing:Math.max(0,qty-max)};
  }).filter(m=>m.missing>0);
}
function syncOrderMaterialCaps(){
  const base=getOrderEditBaseMaterials();
  const stock=getOrderMaterialAvailability(base);
  window._orderMats=(window._orderMats||[]).map(m=>{
    const meta=stock[m.id]||{max:0,name:m.name||'товар',src:m.src};
    return {...m,name:m.name||meta.name,max:+meta.max||0,src:m.src||meta.src};
  });
}
function renderOrderMatPicker(){
  const sel=document.getElementById('oMatPick'); if(!sel) return;
  syncOrderMaterialCaps();
  const base=getOrderEditBaseMaterials();
  const stock=getOrderMaterialAvailability(base);
  const used={};
  (window._orderMats||[]).forEach(m=>used[m.id]=(used[m.id]||0)+(+m.qty||0));
  const list=Object.values(stock).map(x=>({
    ...x,
    remain:Math.max(0,(+x.max||0)-(used[x.id]||0))
  }));
  window._stockIdx={};
  list.forEach(x=>window._stockIdx[x.id]=x);
  if(!list.length){ sel.innerHTML='<option value="">Склад порожній</option>'; return; }
  sel.innerHTML='<option value="">— товар зі складу —</option>'+list.map(x=>`<option value="${x.id}" ${x.remain<=0?'disabled':''}>${x.name} (зал.: ${x.remain}${x.remain<=0?' · нема':''})</option>`).join('');
}
function addOrderMat(){
  const sel=document.getElementById('oMatPick'); const qe=document.getElementById('oMatQty');
  if(!sel||!sel.value) return;
  const idx=(window._stockIdx||{})[sel.value]; if(!idx) return;
  let q=parseInt(qe&&qe.value)||1; if(q<1)q=1;
  if((+idx.remain||0)<=0){ setOrderFeedback('error','На складі більше немає цього матеріалу'); renderOrderMatPicker(); return; }
  if(q>idx.remain){ setOrderFeedback('error',`Доступно лише ${idx.remain} шт: ${idx.name}`); q=idx.remain; }
  window._orderMats=window._orderMats||[];
  const ex=window._orderMats.find(m=>m.id===idx.id);
  if(ex){ ex.qty+=q; } else { window._orderMats.push({id:idx.id,name:idx.name,qty:q,src:idx.src,max:idx.max}); }
  if(qe)qe.value=1; sel.value='';
  renderOrderMatPicker();
  renderOrderMats();
}
function removeOrderMat(i){ (window._orderMats||[]).splice(i,1); renderOrderMatPicker(); renderOrderMats(); }
function renderOrderMats(){
  const el=document.getElementById('oMatList'); if(!el) return;
  syncOrderMaterialCaps();
  const ms=window._orderMats||[];
  if(!ms.length){ el.innerHTML=''; updateOrderSubmitState(); saveOrderDraft(); return; }
  const issues=getOrderMaterialIssues(ms, getOrderEditBaseMaterials());
  const issueMap={}; issues.forEach(x=>issueMap[x.id]=x);
  let html=ms.map((m,i)=>{
    const issue=issueMap[m.id];
    return `<div class="omat-item${issue?' is-overflow':''}"><span><b>${m.name}</b> × ${m.qty} <small>/ доступно ${m.max}</small>${issue?` <em>− бракує ${issue.missing}</em>`:''}</span><button type="button" onclick="removeOrderMat(${i})">✕</button></div>`;
  }).join('');
  if(issues.length){
    html+=`<div class="omat-warning">⚠️ На складі не вистачає: ${issues.map(x=>`${x.name} (−${x.missing})`).join(', ')}</div>`;
  }
  el.innerHTML=html;
  updateOrderSubmitState();
  saveOrderDraft();
}
function saveNewOrder(){
  const services = window._orderSvcs||[];
  let total = 0;
  services.forEach(s=>{ total+=s.price*s.qty; });
  if(!services.length){ setOrderFeedback('error','Спочатку додайте хоча б одну послугу'); return; }
  const formIssues=getOrderFormIssues(true);
  if(formIssues.length){ setOrderFeedback('error',formIssues[0]); updateOrderSubmitState(); return; }
  clearOrderFeedback();
  const order = {
    id: uid(),
    date: new Date().toISOString(),
    clientName: document.getElementById('oClient').value.trim(),
    company: (document.getElementById('oCompany')?document.getElementById('oCompany').value.trim():''),
    phone: document.getElementById('oPhone').value.trim(),
    car: document.getElementById('oCar').value.trim(),
    plate: (document.getElementById('oPlate')?document.getElementById('oPlate').value.trim():''),
    paymentType: (document.getElementById('oPayType')?document.getElementById('oPayType').value:'cash'),
    orderNumber: 'TMP-'+nextOrderNumber(), numSrc:'temp',
    services, total,
    notes: document.getElementById('oNotes').value.trim(),
    status: 'new',
    materials: (window._orderMats||[]).map(m=>({id:m.id,name:m.name,qty:m.qty,src:m.src}))
  };
  const matIssues=getOrderMaterialIssues(order.materials, []);
  if(matIssues.length){
    renderOrderMatPicker();
    renderOrderMats();
    setOrderFeedback('error','На складі не вистачає: '+matIssues.map(x=>`${x.name} (−${x.missing})`).join(', '));
    return;
  }
  {
    const _live=getOrderLiveState();
    order.paidAmount=_live.applied;
    order.debt=_live.debt;
    order.cashReceived=_live.entered;
    order.changeAmount=_live.change;
  }
  upsertOrderBasePayment(order, order.paidAmount, order.date);
  (order.materials||[]).forEach(mt=>{ const arr=(mt.src==='tires')?tires:warehouse; const it=arr.find(x=>x.id===mt.id); if(it){ it.qty=Math.max(0,(+it.qty||0)-(+mt.qty||0)); } }); if((order.materials||[]).length){ save('tires',tires); save('warehouse',warehouse); if(typeof renderTires==='function')renderTires(); if(typeof renderWarehouse==='function')renderWarehouse(); }
  // auto-add client (or update existing)
  if((order.clientName||'').trim() || order.phone){
    let existing = order.phone ? findClientByPhone(order.phone) : null;
    if(!existing && order.clientName) existing = findClientByName(order.clientName);
    if(existing){
      if((order.clientName||'').trim()) existing.name = order.clientName.trim();
      if(order.phone) existing.phone = order.phone;
      if(order.car) existing.car = order.car;
      if(order.plate) existing.plate = order.plate;
      existing.lastVisit = order.date;
    } else {
      clients.push({id:uid(),name:(order.clientName||'').trim(),phone:order.phone||'',car:order.car||'',plate:order.plate||'',date:order.date,lastVisit:order.date});
    }
    save('clients',clients);
  }
  orders.unshift(order);
  clearOrderDraft();
  save('orders',orders);
  renderOrders();
  renderClients();
  if(typeof renderCash==='function') renderCash();
  if(typeof renderDebtors==='function') renderDebtors();
  if(typeof renderHome==='function') renderHome();
  renderOrderBell();
  // Show print-ready order
  showOrderPrint(order,{mode:'created'});
  openNewOrder();
  if(navigator.onLine && _session){ assignServerNumbers(); }
}

function viewOrder(oid){
  const o = orders.find(x=>x.id===oid);
  if(!o) return;
  window._printOrder=o;
  let svcRows = (o.services||[]).map(s=>`
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #ddd;font-size:0.85rem">${s.name}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:center">${s.qty}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:right;font-weight:600">${fmtMoney(s.price)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:right;font-weight:700">${fmtMoney(s.price*s.qty)}</td>
    </tr>`).join('');
  const masterRow = topSecret ? `<div style="text-align:right;color:#b8860b;font-size:0.9rem;margin-top:4px">Майстер 35%: ${fmtMoney(Math.round((o.total||0)*0.35))}</div>` : '';
  const statusMeta = getOrderStatusMeta(o);
  const debtAmount = getOrderDebtAmount(o);
  const paidAmount = getOrderPaidAmount(o);
  const payments = getOrderCashEntries(o.id);
  const paymentHistory = payments.length
    ? `<div class="order-payments-box"><div class="order-payments-title">💰 Історія оплат</div>${payments.map(p=>`<div class="order-pay-row"><div><b>${fmtMoney(p.amount)}</b> · ${paymentSourceLabel(p.paymentSource||'manual')}</div><div style="color:var(--text-dim)">${fmtDate(p.date)} · ${(p.method||'cash')==='cashless'?'💳 Безготівка':'💵 Готівка'}</div></div>`).join('')}</div>`
    : `<div class="order-payments-box is-empty"><div class="order-payments-title">💰 Історія оплат</div><div style="color:var(--text-dim);font-size:0.82rem">Ще не було жодної оплати</div></div>`;
  openModal(`
    <div id="orderPrintArea">
      <div class="order-status-strip ${statusMeta.cls}">${statusMeta.icon} ${statusMeta.label}</div>
      <div style="text-align:center;margin-bottom:12px">
        <div style="font-family:'Oswald';font-size:1.3rem;font-weight:700">GT TIRES SERVICE</div>
        <div style="font-size:0.75rem;color:#888">ЗАКАЗ-НАРЯД</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.82rem;margin-bottom:12px;padding:8px;background:rgba(255,255,255,0.03);border-radius:8px">
        <div><b>№:</b> ${o.orderNumber||o.id.slice(-6).toUpperCase()}</div>
        <div><b>Дата:</b> ${fmtDate(o.date)}</div>
        <div><b>Клієнт:</b> ${o.clientName||'—'}</div>
        ${o.company?`<div><b>Фірма:</b> ${o.company}</div>`:''}
        <div><b>Тел:</b> ${o.phone||'—'}</div>
        <div><b>Авто:</b> ${o.car||'—'}</div>
        <div><b>Держномер:</b> ${o.plate||'—'}</div>
        <div><b>Оплата:</b> ${o.paymentType==='cashless'?'Безготівка':o.paymentType==='cash'?'Готівка':'—'}</div>
        <div><b>Оплачено:</b> ${fmtMoney(paidAmount)}</div>
        <div><b>Борг:</b> ${fmtMoney(debtAmount)}</div>
        <div><b>Статус:</b> ${statusMeta.icon} ${statusMeta.label}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:10px">
        <thead>
          <tr style="background:rgba(211,47,47,0.15)">
            <th style="padding:6px 8px;text-align:left;font-size:0.8rem">Послуга</th>
            <th style="padding:6px 8px;text-align:center;font-size:0.8rem;width:40px">К-ть</th>
            <th style="padding:6px 8px;text-align:right;font-size:0.8rem;width:70px">Ціна</th>
            <th style="padding:6px 8px;text-align:right;font-size:0.8rem;width:80px">Сума</th>
          </tr>
        </thead>
        <tbody>${svcRows}</tbody>
      </table>
      <div style="text-align:right;font-family:'Oswald';font-size:1.4rem;padding:8px 0;border-top:2px solid var(--red)">
        ВСЬОГО: ${fmtMoney(o.total||0)}
      </div>
      ${masterRow}
      ${paymentHistory}
      ${o.notes?'<div style="margin-top:8px;font-size:0.8rem;color:var(--text-dim)">📝 '+o.notes+'</div>':''}
      <div style="display:flex;gap:30px;margin-top:24px;font-size:0.75rem;color:#888">
        <div style="flex:1;border-top:1px solid #555;padding-top:4px">Підпис клієнта</div>
        <div style="flex:1;border-top:1px solid #555;padding-top:4px">Підпис майстра</div>
      </div>
    </div>
    <div class="order-modal-actions no-print">
      <button class="btn btn-red btn-sm" onclick="printOrderNariad()">🖨️ Друк</button>
      <button class="btn btn-dark btn-sm" onclick="openEditOrder('${o.id}')">✏️ Редагувати</button>
      <button class="btn btn-dark btn-sm" onclick="repeatOrder('${o.id}')">🔁 Повторити</button>
      <button class="order-action-btn ${statusMeta.key==='progress'?'is-active':''}" onclick="startOrderWork('${o.id}')">🔄 В роботу</button>
      <button class="order-action-btn success ${statusMeta.key==='done'?'is-active':''}" onclick="finishOrderWork('${o.id}')">✅ Виконано</button>
      <button class="order-action-btn danger ${statusMeta.key==='cancel'?'is-active':''}" onclick="cancelOrderQuick('${o.id}')">✖ Скасувати</button>
      <label style="font-size:0.78rem;margin-top:6px">Статус</label>
      <select id="oStatus" style="flex:1;min-width:150px">
        <option value="new" ${o.status==='new'?'selected':''}>Нове</option>
        <option value="progress" ${o.status==='progress'?'selected':''}>В роботі</option>
        <option value="done" ${o.status==='done'?'selected':''}>Виконано</option>
        <option value="cancel" ${o.status==='cancel'?'selected':''}>Скасовано</option>
      </select>
      <button class="btn btn-green btn-sm" onclick="updateOrderStatus('${o.id}')">💾</button>
      <button class="btn btn-dark btn-sm" onclick="completeAndCash('${o.id}')">💵 Закрити в касу</button>
      <button class="btn btn-dark btn-sm" onclick="if(confirm('Видалити?')){orders=orders.filter(x=>x.id!=='${o.id}');closeModal();refreshOrderCollections();}">🗑️</button>
      <button class="btn btn-dark btn-sm" onclick="closeModal()">Закрити</button>
    </div>
  `);
}
function updateOrderStatus(oid){
  const o=orders.find(x=>x.id===oid); if(!o) return;
  o.status=document.getElementById('oStatus').value;
  if(o.status==='progress' && !o.startedAt) o.startedAt=new Date().toISOString();
  if(o.status==='done' && !o.doneAt) o.doneAt=new Date().toISOString();
  if(o.status==='cancel' && !o.cancelledAt) o.cancelledAt=new Date().toISOString();
  closeModal();
  refreshOrderCollections();
}
function completeAndCash(oid){
  const o=orders.find(x=>x.id===oid); if(!o) return;
  const _rem=getOrderDebtAmount(o);
  o.status='done';
  o.doneAt=o.doneAt||new Date().toISOString();
  if(_rem<=0){
    syncOrderPaymentState(o);
    closeModal();
    refreshOrderCollections();
    return;
  }
  addOrderPaymentEntry(o,_rem,o.paymentType||'cash','close_cash',new Date().toISOString(),buildOrderPaymentDesc(o,'close_cash'));
  o.cashReceived=(+o.cashReceived||0)+_rem;
  o.changeAmount=0;
  save('orders',orders); save('cash',cashbook);
  closeModal();
  renderOrders();
  if(typeof renderDebtors==='function') renderDebtors();
  if(typeof renderCash==='function') renderCash();
  if(typeof renderHome==='function') renderHome();
  renderOrderBell();
}

// ==================== CLIENTS ====================
function renderClients(){ filterClients(); }
function filterClients(){
  const q=(document.getElementById('clientSearch')?.value||'').toLowerCase();
  const list=clients.filter(c=>!q||`${c.name} ${c.phone} ${c.car}`.toLowerCase().includes(q));
  if(!list.length){ document.getElementById('clientsList').innerHTML='<p style="color:var(--text-dim);text-align:center;padding:40px">Клієнтів немає</p>'; return; }
  let html='';
  list.forEach(c=>{
    const orderCount=orders.filter(o=>o.clientName===c.name).length;
    html+=`<div class="card">
      <div class="flex-between"><span style="font-family:'Oswald';color:var(--red-light)">${c.name}</span><span style="font-size:0.75rem;color:var(--text-dim)">Замовлень: ${orderCount}</span></div>
      <div style="font-size:0.82rem;margin-top:4px">${c.phone||''} ${c.car?'• 🚗 '+c.car:''}</div>
      <div class="gap-btns mt"><button class="btn btn-dark btn-sm" onclick="if(confirm('Видалити клієнта?')){clients=clients.filter(x=>x.id!=='${c.id}');save('clients',clients);renderClients();}">🗑️</button></div>
    </div>`;
  });
  document.getElementById('clientsList').innerHTML=html;
}
function openNewClient(){
  openModal(`<h3>Новий клієнт</h3>
    <label>Ім'я</label><input id="cName"><label>Телефон</label><input id="cPhone" type="tel">
    <label>Авто</label><input id="cCar">
    <div class="gap-btns mt"><button class="btn btn-red" onclick="saveNewClient()">💾 Зберегти</button><button class="btn btn-dark" onclick="closeModal()">Скасувати</button></div>`);
}
function saveNewClient(){
  const name=document.getElementById('cName').value.trim(); if(!name){alert('Введіть ім\'я');return;}
  clients.push({id:uid(),name,phone:document.getElementById('cPhone').value.trim(),car:document.getElementById('cCar').value.trim(),date:new Date().toISOString()});
  save('clients',clients); closeModal(); renderClients();
}

// ==================== TIRES ====================
function renderTires(){
  if(!tires.length){ document.getElementById('tiresList').innerHTML='<p style="color:var(--text-dim);text-align:center;padding:40px">Шин немає</p>'; return; }
  let html='<div class="tbl-wrap"><table><thead><tr><th>Розмір</th><th>Бренд</th><th>Сезон</th><th>К-ть</th><th>Ціна</th><th>В боті</th><th></th></tr></thead><tbody>';
  tires.forEach(t=>{
    const seasonIcon = t.season==='winter'?'❄️':t.season==='summer'?'☀️':t.season==='allseason'?'🌦️':'';
    html+=`<tr><td>${t.size}</td><td>${t.brand||'—'}</td><td>${seasonIcon} ${t.season==='winter'?'Зима':t.season==='summer'?'Літо':t.season==='allseason'?'Всесезон':'—'}</td><td>${t.qty}</td><td><b>${fmtMoney(t.price)}</b></td>
    <td style="text-align:center">${t.showInBot?'✅':'—'}</td>
    <td><button class="btn btn-dark btn-sm" onclick="if(confirm('Видалити?')){tires=tires.filter(x=>x.id!=='${t.id}');save('tires',tires);renderTires();}">🗑️</button></td></tr>`;
  });
  html+='</tbody></table></div>';
  document.getElementById('tiresList').innerHTML=html;
}
function openNewTire(){
  openModal(`<h3>Додати шини б/в</h3>
    <label>Розмір *</label><input id="tSize" placeholder="205/55 R16">
    <label>Бренд</label><input id="tBrand" placeholder="Michelin, Bridgestone...">
    <label>Сезон</label>
    <select id="tSeason">
      <option value="">— не вказано —</option>
      <option value="summer">☀️ Літо</option>
      <option value="winter">❄️ Зима</option>
      <option value="allseason">🌦️ Всесезон</option>
    </select>
    <label>Кількість</label><input id="tQty" type="number" value="4">
    <label>Ціна (за шт) *</label><input id="tPrice" type="number" placeholder="800">
    <label style="display:flex;align-items:center;gap:8px;margin-top:12px;cursor:pointer">
      <input type="checkbox" id="tShowBot" checked style="width:auto;margin:0"> Показувати в Telegram боті
    </label>
    <div class="gap-btns mt"><button class="btn btn-red" onclick="saveNewTire()">💾 Зберегти</button><button class="btn btn-dark" onclick="closeModal()">Скасувати</button></div>`);
}
function saveNewTire(){
  const size = document.getElementById('tSize').value.trim();
  const price = parseInt(document.getElementById('tPrice').value)||0;
  if(!size || !price){ alert('Вкажіть розмір і ціну'); return; }
  tires.push({
    id:uid(),
    size,
    brand:document.getElementById('tBrand').value.trim(),
    season:document.getElementById('tSeason').value,
    qty:parseInt(document.getElementById('tQty').value)||0,
    price,
    showInBot:document.getElementById('tShowBot').checked
  });
  save('tires',tires); closeModal(); renderTires();
}
function exportTiresForBot(){
  const botTires = tires.filter(t=>t.showInBot).map(t=>({s:t.size,b:t.brand,se:t.season,q:t.qty,p:t.price}));
  const json = JSON.stringify(botTires);
  openModal(`<h3>📤 Шини для бота</h3>
    <p style="font-size:0.85rem;color:var(--text-dim)">Скопіюй цей код і надішли Claude, щоб оновити шини б/в у Telegram боті:</p>
    <textarea id="botExport" rows="6" style="font-family:monospace;font-size:0.7rem" readonly>${json}</textarea>
    <div class="gap-btns mt">
      <button class="btn btn-red" onclick="navigator.clipboard.writeText(document.getElementById('botExport').value);this.textContent='✅ Скопійовано'">📋 Копіювати</button>
      <button class="btn btn-dark" onclick="closeModal()">Закрити</button>
    </div>`);
}

// ==================== WAREHOUSE ====================
function renderWarehouse(){
  if(!warehouse.length){ document.getElementById('warehouseList').innerHTML='<p style="color:var(--text-dim);text-align:center;padding:40px">Склад порожній</p>'; return; }
  let html='<div class="tbl-wrap"><table><thead><tr><th>Назва</th><th>Кількість</th><th>Од.</th><th></th></tr></thead><tbody>';
  warehouse.forEach(w=>{
    html+=`<tr><td>${w.name}</td><td>${w.qty}</td><td>${w.unit||'шт'}</td>
    <td><button class="btn btn-dark btn-sm" onclick="if(confirm('Видалити?')){warehouse=warehouse.filter(x=>x.id!=='${w.id}');save('warehouse',warehouse);renderWarehouse();}">🗑️</button></td></tr>`;
  });
  html+='</tbody></table></div>';
  document.getElementById('warehouseList').innerHTML=html;
}
function openNewItem(){
  openModal(`<h3>Додати на склад</h3>
    <label>Назва</label><input id="wName"><label>Кількість</label><input id="wQty" type="number" value="1">
    <label>Одиниця</label><input id="wUnit" value="шт">
    <div class="gap-btns mt"><button class="btn btn-red" onclick="saveNewItem()">💾</button><button class="btn btn-dark" onclick="closeModal()">Скасувати</button></div>`);
}
function saveNewItem(){
  warehouse.push({id:uid(),name:document.getElementById('wName').value.trim(),qty:parseInt(document.getElementById('wQty').value)||0,unit:document.getElementById('wUnit').value.trim()||'шт'});
  save('warehouse',warehouse); closeModal(); renderWarehouse();
}

// ==================== CASH ====================
function renderDebtors(){
  const list=(orders||[]).filter(o=>getOrderDebtAmount(o)>0).sort((a,b)=>getOrderDebtAmount(b)-getOrderDebtAmount(a));
  const totalDebt=list.reduce((s,o)=>s+getOrderDebtAmount(o),0);
  const st=document.getElementById('debtorsStats');
  if(st) st.innerHTML=`<div class="stat-card"><div class="num" style="color:var(--accent)">${fmtMoney(totalDebt)}</div><div class="lbl">Загальний борг</div></div><div class="stat-card"><div class="num">${list.length}</div><div class="lbl">Боржників</div></div>`;
  const el=document.getElementById('debtorsList'); if(!el)return;
  if(!list.length){ el.innerHTML='<div class="card" style="text-align:center;color:var(--text-dim);padding:24px">Боргів немає 🎉</div>'; return; }
  el.innerHTML=list.map(o=>`<div class="card" style="margin-bottom:10px">
    <div class="flex-between"><div><b>#${o.orderNumber||o.id.slice(-5).toUpperCase()}</b> · ${o.clientName||'—'}${o.phone?' · '+o.phone:''}</div><span>${o.paymentType==='cashless'?'💳':'💵'}</span></div>
    <div style="font-size:0.82rem;color:var(--text-dim);margin:4px 0">${o.car||''} ${o.plate?'· '+o.plate:''} · ${fmtDate(o.date)}</div>
    <div style="font-family:'Oswald';font-size:1.02rem">Сума ${fmtMoney(o.total||0)} · Оплач. ${fmtMoney(getOrderPaidAmount(o))} · <span style="color:var(--accent)">Борг ${fmtMoney(getOrderDebtAmount(o))}</span></div>
    <div class="gap-btns mt no-print"><input type="number" id="pay_${o.id}" placeholder="${getOrderDebtAmount(o)}" style="max-width:130px"><button class="btn btn-red btn-sm" onclick="settleDebt('${o.id}')">💵 Погасити</button></div>
  </div>`).join('');
}
// ==================== ЗАЯВКИ З MINI APP ====================
// ==================== БАНЕР НОВИХ ЗАЯВОК (зверху екрана) ====================
async function checkNewBookings(){
  const el = document.getElementById('newBookingsBanner');
  const cnt = document.getElementById('newBookingsCount');
  if(!el) return;
  const s = getSupa();
  if(!s){ el.style.display='none'; return; }
  try{
    const { data, error } = await s.from('mini_app_bookings').select('id').eq('status','new');
    if(error){ return; }
    const n = (data||[]).length;
    if(n>0){
      if(cnt) cnt.textContent = n>99?'99+':String(n);
      el.style.display='flex';
      el.title = 'Нових заявок: '+n;
    } else {
      el.style.display='none';
    }
  }catch(e){}
}
function goToBookingsTab(){
  const btn = document.querySelector('.nav button[data-tab="bookings"]');
  if(btn) btn.click();
}
document.addEventListener('DOMContentLoaded', function(){
  setTimeout(checkNewBookings, 2000); // дати час підключитись до Supabase
  setInterval(checkNewBookings, 30000);
});
async function renderBookings(){
  const el = document.getElementById('bookingsList');
  if(!el) return;
  const s = getSupa();
  if(!s){ el.innerHTML = '<div class="card" style="text-align:center;color:var(--text-dim);padding:24px">Спочатку підключіть Supabase в Налаштуваннях</div>'; return; }
  el.innerHTML = '<div class="card" style="text-align:center;color:var(--text-dim);padding:24px">Завантаження…</div>';
  try{
    const { data, error } = await s.from('mini_app_bookings').select('*').order('created_at',{ascending:false});
    if(error){ el.innerHTML = '<div class="card" style="text-align:center;color:var(--accent);padding:24px">Помилка: '+error.message+'</div>'; return; }
    window._bookings = data||[];
    if(!data || !data.length){ el.innerHTML = '<div class="card" style="text-align:center;color:var(--text-dim);padding:24px">Заявок немає</div>'; return; }
    el.innerHTML = data.map(b=>{
      const isNew = b.status==='new';
      return `<div class="card" style="margin-bottom:10px;border-left:4px solid ${isNew?'var(--red,#e01f26)':'#2a2a2a'}">
        <div class="flex-between"><div><b>${b.name||'—'}</b> · ${b.phone||'—'}</div><span style="font-size:0.78rem;color:var(--text-dim)">${fmtDate(b.created_at)}</span></div>
        <div style="font-size:0.85rem;margin:4px 0">${b.car?('🚗 '+b.car):''}${b.service_wanted?(' · 🛠 '+b.service_wanted):''}${b.preferred_time?(' · 🕐 '+b.preferred_time):''}</div>
        <div class="gap-btns mt no-print">
          ${isNew?`<button class="btn btn-red btn-sm" onclick="bookingToOrder('${b.id}')">📋 Оформити замовлення</button>`:''}
          <button class="btn btn-dark btn-sm" onclick="markBookingDone('${b.id}')">${isNew?'✔ Позначити оброблено':'✔ Оброблено'}</button>
        </div>
      </div>`;
    }).join('');
  }catch(e){ el.innerHTML = '<div class="card" style="text-align:center;color:var(--accent);padding:24px">Помилка: '+e.message+'</div>'; }
  checkNewBookings();
}
async function markBookingDone(id){
  const s = getSupa(); if(!s) return;
  try{ await s.from('mini_app_bookings').update({status:'done'}).eq('id',id); renderBookings(); checkNewBookings(); }catch(e){ alert('Помилка: '+e.message); }
}
function bookingToOrder(id){
  const b = (window._bookings||[]).find(x=>x.id===id);
  if(!b) return;
  // Спочатку перемикаємось на вкладку "Головна" БЕЗ повторного відкриття нового
  // замовлення (клік по кнопці меню сам по собі викликає openNewOrder і стирає
  // будь-які дані, встановлені раніше) — тому перемикаємо секцію вручну.
  document.querySelectorAll('.nav button').forEach(b2=>b2.classList.remove('active'));
  const homeBtn=document.querySelector('.nav button[data-tab="home"]'); if(homeBtn) homeBtn.classList.add('active');
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  const homeSec=document.getElementById('sec-home'); if(homeSec) homeSec.classList.add('active');
  openNewOrder();
  setClientNameFields(b.name);
  const phoneEl=document.getElementById('oPhone'); if(phoneEl) phoneEl.value=b.phone||'';
  const carEl=document.getElementById('oCar'); if(carEl) carEl.value=b.car||'';
  const notesEl=document.getElementById('oNotes'); if(notesEl) notesEl.value=(b.service_wanted?('Бажана послуга: '+b.service_wanted+'. '):'')+(b.preferred_time?('Бажаний час: '+b.preferred_time):'');
  saveOrderDraft();
  markBookingDone(id);
}
function settleDebt(oid){
  const o=orders.find(x=>x.id===oid); if(!o) return;
  const inp=document.getElementById('pay_'+oid);
  const debt=getOrderDebtAmount(o);
  let amt=(inp&&inp.value!=='')?(parseFloat(inp.value)||0):debt;
  if(amt<=0) return; if(amt>debt) amt=debt;
  addOrderPaymentEntry(o,amt,o.paymentType||'cash','debt_settlement',new Date().toISOString(),buildOrderPaymentDesc(o,'debt_settlement'));
  save('orders',orders); save('cash',cashbook);
  renderDebtors();
  renderOrders();
  if(typeof renderCash==='function') renderCash();
  if(typeof renderHome==='function') renderHome();
  renderOrderBell();
  reopenOrderModalIfCurrent(oid);
}
function removeCashEntry(cid){
  const entry=(cashbook||[]).find(x=>x.id===cid); if(!entry) return;
  if(!confirm('Видалити запис з каси?')) return;
  cashbook=cashbook.filter(x=>x.id!==cid);
  save('cash',cashbook);
  if(entry.orderId){
    syncOrderPaymentState(entry.orderId);
    save('orders',orders);
    renderOrders();
    if(typeof renderDebtors==='function') renderDebtors();
    if(typeof renderHome==='function') renderHome();
    renderOrderBell();
    reopenOrderModalIfCurrent(entry.orderId);
  }
  renderCash();
}
function renderCash(){
  const income=cashbook.filter(c=>c.type==='income').reduce((s,c)=>s+c.amount,0);
  const expense=cashbook.filter(c=>c.type==='expense').reduce((s,c)=>s+c.amount,0);
  const incCash=cashbook.filter(c=>c.type==='income'&&(c.method||'cash')==='cash').reduce((s,c)=>s+c.amount,0);
  const incCashless=cashbook.filter(c=>c.type==='income'&&c.method==='cashless').reduce((s,c)=>s+c.amount,0);
  document.getElementById('cashStats').innerHTML=`
    <div class="stat-card"><div class="num" style="color:var(--green)">${fmtMoney(income)}</div><div class="lbl">Дохід</div></div>
    <div class="stat-card"><div class="num" style="color:var(--accent)">${fmtMoney(expense)}</div><div class="lbl">Витрати</div></div>
    <div class="stat-card"><div class="num">${fmtMoney(income-expense)}</div><div class="lbl">Баланс</div></div>
    <div class="stat-card"><div class="num" style="color:var(--green)">${fmtMoney(incCash)}</div><div class="lbl">💵 Готівка</div></div>
    <div class="stat-card"><div class="num" style="color:#42a5f5">${fmtMoney(incCashless)}</div><div class="lbl">💳 Безготівка</div></div>
  `;
  const sorted=[...cashbook].sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(!sorted.length){ document.getElementById('cashList').innerHTML='<p style="color:var(--text-dim);text-align:center;padding:40px">Записів немає</p>'; return; }
  let html='';
  sorted.forEach(c=>{
    const isIncome=c.type==='income';
    const orderTag=c.orderId?`<span class="cash-order-tag">${paymentSourceLabel(c.paymentSource||'manual')}</span>`:'';
    html+=`<div class="card"><div class="flex-between">
      <span style="font-size:0.8rem;color:var(--text-dim)">${fmtDate(c.date)}</span>
      <span style="font-family:'Oswald';font-size:1.1rem;color:${isIncome?'var(--green)':'var(--accent)'}">${isIncome?'+':'−'}${fmtMoney(c.amount)}</span>
    </div><div style="font-size:0.82rem;margin-top:4px">${c.desc||'—'}</div>
    <div class="cash-entry-meta">${(c.method||'cash')==='cashless'?'💳 Безготівка':'💵 Готівка'} ${orderTag}</div>
    <button class="btn btn-dark btn-sm mt" onclick="removeCashEntry('${c.id}')">🗑️</button>
    </div>`;
  });
  document.getElementById('cashList').innerHTML=html;
}
function openNewCash(){
  openModal(`<h3>Новий запис в касу</h3>
    <label>Тип</label><select id="cashType"><option value="income">💰 Дохід</option><option value="expense">💸 Витрата</option></select>
    <label>Сума</label><input id="cashAmt" type="number">
    <label>Опис</label><input id="cashDesc">
    <div class="gap-btns mt"><button class="btn btn-red" onclick="saveNewCash()">💾</button><button class="btn btn-dark" onclick="closeModal()">Скасувати</button></div>`);
}
function saveNewCash(){
  const amt=parseInt(document.getElementById('cashAmt').value)||0; if(!amt){alert('Введіть суму');return;}
  cashbook.push({id:uid(),date:new Date().toISOString(),type:document.getElementById('cashType').value,amount:amt,desc:document.getElementById('cashDesc').value.trim()});
  save('cash',cashbook); closeModal(); renderCash();
}

// ==================== SALARY ====================
function renderSalary(){
  const masterRate=0.35;
  const doneOrders=orders.filter(o=>o.status==='done');
  const totalRevenue=doneOrders.reduce((s,o)=>s+o.total,0);
  const masterEarnings=Math.round(totalRevenue*masterRate);

  // Group by month
  const monthly={};
  doneOrders.forEach(o=>{
    const m=o.date.slice(0,7);
    if(!monthly[m]) monthly[m]={rev:0,count:0};
    monthly[m].rev+=o.total; monthly[m].count++;
  });
  const months=Object.keys(monthly).sort().reverse();

  let html=`<div class="stats-grid">
    <div class="stat-card"><div class="num">${fmtMoney(totalRevenue)}</div><div class="lbl">Загальний дохід</div></div>
    <div class="stat-card"><div class="num" style="color:#FFD700">${fmtMoney(masterEarnings)}</div><div class="lbl">Майстер (35%)</div></div>
    <div class="stat-card"><div class="num">${doneOrders.length}</div><div class="lbl">Виконано замовлень</div></div>
  </div>`;

  if(months.length){
    html+='<div class="tbl-wrap mt"><table><thead><tr><th>Місяць</th><th>Замовлень</th><th>Дохід</th><th>Майстер 35%</th></tr></thead><tbody>';
    months.forEach(m=>{
      html+=`<tr><td>${m}</td><td>${monthly[m].count}</td><td>${fmtMoney(monthly[m].rev)}</td><td class="ts-price">${fmtMoney(Math.round(monthly[m].rev*masterRate))}</td></tr>`;
    });
    html+='</tbody></table></div>';
  }
  document.getElementById('salaryContent').innerHTML=html;
}

// ==================== REPORTS ====================
function showReport(period){
  const now=new Date();
  let filtered=orders.filter(o=>o.status==='done');
  let label='';
  if(period==='daily'){
    const td=today();
    filtered=filtered.filter(o=>o.date.slice(0,10)===td);
    label='Сьогодні ('+td+')';
  } else if(period==='weekly'){
    const week=new Date(now-7*86400000);
    filtered=filtered.filter(o=>new Date(o.date)>=week);
    label='Останні 7 днів';
  } else if(period==='monthly'){
    const m=now.toISOString().slice(0,7);
    filtered=filtered.filter(o=>o.date.slice(0,7)===m);
    label='Цей місяць ('+m+')';
  } else { label='Весь час'; }

  const totalRev=filtered.reduce((s,o)=>s+(o.total||0),0);
  const expenses=cashbook.filter(c=>c.type==='expense').reduce((s,c)=>s+c.amount,0);
  const profit=totalRev-expenses;

  // Services breakdown
  const svcCount={};
  filtered.forEach(o=>(o.services||[]).forEach(s=>{
    svcCount[s.name]=(svcCount[s.name]||0)+s.qty;
  }));
  const topServices=Object.entries(svcCount).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const maxSvc=topServices.length?topServices[0][1]:1;

  // Daily revenue chart
  const dailyRev={};
  filtered.forEach(o=>{
    const d=o.date.slice(0,10);
    dailyRev[d]=(dailyRev[d]||0)+(o.total||0);
  });
  const days=Object.keys(dailyRev).sort().slice(-14);
  const maxDay=Math.max(...days.map(d=>dailyRev[d]),1);

  let html=`<h3 style="font-family:'Oswald';color:var(--text);margin-bottom:14px">📊 ${label}</h3>`;
  html+=`<div class="stats-grid">
    <div class="stat-card"><div class="num">${filtered.length}</div><div class="lbl">Замовлень</div></div>
    <div class="stat-card"><div class="num" style="color:var(--green)">${fmtMoney(totalRev)}</div><div class="lbl">Дохід</div></div>
    <div class="stat-card"><div class="num" style="color:var(--accent)">${fmtMoney(expenses)}</div><div class="lbl">Витрати</div></div>
    <div class="stat-card"><div class="num" style="color:${profit>=0?'var(--green)':'var(--accent)'}">${fmtMoney(profit)}</div><div class="lbl">Прибуток</div></div>
  </div>`;

  if(topServices.length){
    html+='<div class="chart-container mt"><h3>Топ послуги</h3>';
    topServices.forEach(([name,count])=>{
      const w=Math.round(count/maxSvc*100);
      html+=`<div class="chart-bar-wrap"><div class="chart-bar-label">${name.length>25?name.slice(0,25)+'…':name}</div><div class="chart-bar" style="width:${w}%"></div><div class="chart-bar-val">${count}</div></div>`;
    });
    html+='</div>';
  }

  if(days.length){
    html+='<div class="chart-container mt"><h3>Дохід по днях</h3>';
    days.forEach(d=>{
      const w=Math.round(dailyRev[d]/maxDay*100);
      html+=`<div class="chart-bar-wrap"><div class="chart-bar-label">${d.slice(5)}</div><div class="chart-bar" style="width:${w}%;background:var(--green)"></div><div class="chart-bar-val">${fmtMoney(dailyRev[d])}</div></div>`;
    });
    html+='</div>';
  }

  if(topSecret){
    const masterTotal=Math.round(totalRev*0.35);
    html+=`<div class="chart-container mt" style="border-color:#FFD700"><h3 style="color:#FFD700">🔑 Top Secret — Розрахунок майстра</h3>
      <div class="stats-grid"><div class="stat-card"><div class="num" style="color:#FFD700">${fmtMoney(masterTotal)}</div><div class="lbl">Майстер 35%</div></div>
      <div class="stat-card"><div class="num">${fmtMoney(totalRev-masterTotal)}</div><div class="lbl">Власнику</div></div></div></div>`;
  }

  document.getElementById('reportContent').innerHTML=html;
}

// ==================== TOP SECRET ====================
function toggleTopSecret(){
  topSecret=!topSecret;
  saveVal('ts', topSecret?'1':'0');
  document.body.classList.toggle('ts-active',topSecret);
  document.getElementById('tsToggle').textContent=topSecret?'🔒 Деактивувати':'Активувати';
  document.getElementById('tsToggle').classList.toggle('btn-green',topSecret);
  document.getElementById('tsToggle').classList.toggle('btn-red',!topSecret);
  renderCatTiles(); renderPrice(); renderOrders();
}

// ==================== EXPORT / IMPORT ====================
function exportData(){
  const data={orders,clients,tires,warehouse,cashbook,usedTires,marketPrices,aiLogs,ts:topSecret,version:'v4',date:new Date().toISOString()};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download='gt-tires-backup-'+today()+'.json'; a.click();
}
function importData(e){
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=function(ev){
    try{
      const data=JSON.parse(ev.target.result);
      if(data.orders) { orders=data.orders; save('orders',orders); }
      if(data.clients) { clients=data.clients; save('clients',clients); }
      if(data.tires) { tires=data.tires; save('tires',tires); }
      if(data.warehouse) { warehouse=data.warehouse; save('warehouse',warehouse); }
      if(data.cashbook) { cashbook=data.cashbook; save('cash',cashbook); }
      if(data.usedTires) { usedTires=data.usedTires; save('usedTires',usedTires); }
      if(data.marketPrices) { marketPrices=data.marketPrices; save('marketPrices',marketPrices); }
      if(data.aiLogs) { aiLogs=data.aiLogs; save('aiLogs',aiLogs); }
      alert('Дані імпортовано!'); location.reload();
    }catch(err){ alert('Помилка імпорту: '+err.message); }
  };
  reader.readAsText(file);
}

// ==================== INIT ====================
// ==================== ШИНИ AI — ЕТАП 1 (локально, без OpenAI/бекенду) ====================
// Ізольований модуль. Не змінює заказів, клієнтів, каси, друку, прайсу, складу.
// Власний стан: usedTires / marketPrices / aiLogs. Власні ключі localStorage.
const TAI_STATUS = ['в наявності','продано','резерв','брак'];
const TAI_SIDE = ['добра','середня','погана'];
let _taiPhoto = '';            // фото з калькулятора (тимчасово)
let _taiLast = null;           // останній результат розрахунку

(function taiInjectStyle(){
  if(document.getElementById('taiStyle')) return;
  const s=document.createElement('style'); s.id='taiStyle';
  s.textContent=`
  #taiTabs{display:flex;gap:8px;overflow-x:auto;padding-bottom:10px;margin-bottom:12px}
  .tai-tab{flex:0 0 auto;padding:9px 14px;border-radius:12px;border:1px solid var(--border);background:rgba(255,255,255,.04);color:var(--text-dim);font-weight:700;font-size:.85rem;cursor:pointer;white-space:nowrap}
  .tai-tab.active{background:var(--red);color:#fff;border-color:var(--red)}
  .tai-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .tai-grid .full{grid-column:1/-1}
  .tai-res{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px}
  .tai-res .full{grid-column:1/-1}
  .tai-metric{background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:14px;padding:12px}
  .tai-metric .v{font-family:'Oswald';font-size:1.5rem;font-weight:700}
  .tai-metric .l{font-size:.72rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:.5px}
  .tai-decision{border-radius:16px;padding:16px;text-align:center;font-family:'Oswald';font-size:1.6rem;font-weight:700}
  .tai-dec-green{background:rgba(67,160,71,.15);border:1px solid #43a047;color:#66bb6a}
  .tai-dec-yellow{background:rgba(253,216,53,.13);border:1px solid #fdd835;color:#fdd835}
  .tai-dec-red{background:rgba(229,57,53,.15);border:1px solid #e53935;color:#ef5350}
  .tai-badge{display:inline-block;padding:3px 9px;border-radius:999px;font-size:.72rem;font-weight:700}
  .tai-b-в{background:rgba(67,160,71,.18);color:#66bb6a}
  .tai-b-п{background:rgba(120,120,120,.2);color:#bbb}
  .tai-b-р{background:rgba(253,216,53,.15);color:#fdd835}
  .tai-b-б{background:rgba(229,57,53,.18);color:#ef5350}
  .tai-soon{background:rgba(255,255,255,.03);border:1px dashed var(--border);border-radius:14px;padding:18px;text-align:center;color:var(--text-dim)}
  .tai-card{background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:14px;padding:12px;margin-bottom:10px}
  .tai-card .row{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
  .tai-thumb{width:54px;height:54px;border-radius:10px;object-fit:cover;flex:0 0 auto;background:#222}
  @media(max-width:560px){.tai-grid{grid-template-columns:1fr}.tai-res{grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(s);
})();

function _taiGet(id){ const e=document.getElementById(id); return e?e.value.trim():''; }
function _taiNum(id){ return parseInt(document.getElementById(id)?.value)||0; }
function _taiChk(id){ const e=document.getElementById(id); return !!(e&&e.checked); }

// рік з DOT (рік або WWYY) → число року
function taiDotYear(v){
  v=(''+(v||'')).trim(); if(!v) return null;
  if(/^\d{4}$/.test(v)){ const n=+v; if(n>=1990&&n<=2100) return n; return 2000+(+v.slice(2)); }
  if(/^\d{1,2}$/.test(v)){ return 2000+(+v); }
  const m=v.match(/\d{4}/); if(m) return taiDotYear(m[0]);
  return null;
}
function taiDotOld(v){ const y=taiDotYear(v); if(!y) return false; return (new Date().getFullYear()-y)>5; }

// ---- ЧИСТА ЛОКАЛЬНА ЛОГІКА (без OpenAI) ----
function taiCalcLogic(d){
  const newTread=+d.newTreadMm||0, cur=+d.curTreadMm||0, newPrice=+d.newPrice||0;
  let treadPercent = newTread>0 ? Math.round(cur/newTread*100) : 0;
  if(treadPercent>100) treadPercent=100; if(treadPercent<0) treadPercent=0;
  let basePct=0;
  if(treadPercent>=90) basePct=75;
  else if(treadPercent>=80) basePct=65;
  else if(treadPercent>=70) basePct=55;
  else if(treadPercent>=60) basePct=45;
  else if(treadPercent>=50) basePct=35;
  else if(treadPercent>=40) basePct=25;
  else basePct=0;
  const reasons=[]; let ded=0;
  const patches=+d.patches||0, plugs=+d.plugs||0, big=+d.bigRepairs||0;
  if(patches){ded+=500*patches; reasons.push('Латки ×'+patches+': −'+(500*patches)+'₴');}
  if(plugs){ded+=300*plugs; reasons.push('Грибки ×'+plugs+': −'+(300*plugs)+'₴');}
  if(big){ded+=1000*big; reasons.push('Великі ремонти ×'+big+': −'+(1000*big)+'₴');}
  if(d.sidewallRepair){ded+=1500; reasons.push('Боковий ремонт: −1500₴');}
  if(d.sidewallCond==='погана'){ded+=1000; reasons.push('Погана боковина: −1000₴');}
  const dotOld=taiDotOld(d.dotYear);
  if(dotOld){ded+=1000; reasons.push('DOT старше 5 років: −1000₴');}
  let maxBuy = Math.round(newPrice*basePct/100) - ded;
  if(maxBuy<0) maxBuy=0;
  let saleMin=Math.round(maxBuy*1.20), saleMax=Math.round(maxBuy*1.35), saleRec=Math.round(maxBuy*1.30);
  if(d.marketAvg && d.marketAvg>0){
    let capped=false;
    if(saleMax>d.marketAvg){ saleMax=d.marketAvg; capped=true; }
    if(saleRec>d.marketAvg){ saleRec=d.marketAvg; capped=true; }
    if(saleRec<saleMin) saleRec=saleMin;
    if(saleMax<saleMin) saleMax=saleMin;
    if(capped) reasons.push('Продаж обмежено ринковою ціною нової: '+d.marketAvg+'₴');
  }
  const profitMin=saleMin-maxBuy, profitMax=saleMax-maxBuy;
  let decision,dCls;
  if(treadPercent<40 || maxBuy<=0){ decision='❌ Не купувати'; dCls='red'; if(treadPercent<40) reasons.unshift('Протектор < 40% — низький залишок'); }
  else {
    let concerns=(d.sidewallRepair?1:0)+(d.sidewallCond==='погана'?1:0)+(big>0?1:0)+(dotOld?1:0)+((patches+plugs)>=3?1:0);
    if(treadPercent>=70 && concerns===0){ decision='✅ Купувати'; dCls='green'; }
    else { decision='🤝 Торгуватися'; dCls='yellow'; }
  }
  return {treadPercent,basePct,ded,maxBuy,saleMin,saleMax,saleRec,profitMin,profitMax,decision,dCls,reasons,dotOld};
}

// ---- НАВІГАЦІЯ ПО ВКЛАДКАХ МОДУЛЯ ----
function taiGo(sub){ taiSub=sub; renderTireAI(); }
function renderTireAI(){
  const tabsEl=document.getElementById('taiTabs'), bodyEl=document.getElementById('taiBody');
  if(!tabsEl||!bodyEl) return;
  const TABS=[['market','🛞 AI оцінка шин'],['stock','📦 Б/У склад'],['calc','🧮 Калькулятор']];
  tabsEl.innerHTML=TABS.map(t=>`<button class="tai-tab${taiSub===t[0]?' active':''}" onclick="taiGo('${t[0]}')">${t[1]}</button>`).join('');
  if(taiSub==='calc') renderTaiCalc();
  else if(taiSub==='stock') renderTaiStock();
  else if(taiSub==='ai') renderTaiAI();
  else if(taiSub==='market'||taiSub==='new') renderTaiMarket();
  else bodyEl.innerHTML = taiSoon(taiSub);
}
function taiSoon(k){
  const M={
    market:['🔎 Перевірити ринок','Збір цін з Prom / OLX / Rozetka / Guma / DoctorShina потребує бекенду (парсинг + CORS).'],
    new:['🆕 Нові шини','Пошук ціни нової шини в магазинах потребує бекенду.'],
    photo:['📷 Фото-розпізнавач','Аналіз фото через OpenAI Vision потребує Supabase Edge Function і ключа OpenAI на сервері.'],
    voice:['🎤 Голосовий заказ','Голосовий заказ з розбором у заказ-наряд — окремий етап.']
  };
  const m=M[k]||['Скоро',''];
  return `<div class="tai-soon"><div style="font-family:'Oswald';font-size:1.2rem;color:var(--text)">${m[0]}</div>
    <p style="margin-top:8px">${m[1]}</p>
    <p style="margin-top:8px;font-size:.8rem">Це Етап 2–3. Зараз працюють <b>Калькулятор Б/У</b> і <b>Склад Б/У</b> — повністю локально й безкоштовно.</p></div>`;
}

// ---- КАЛЬКУЛЯТОР Б/У ----
function renderTaiCalc(){
  const b=document.getElementById('taiBody');
  gtEnsureDatalists();
  b.innerHTML=`
  <div class="card">
    <h3 style="margin-bottom:10px">🧮 Оцінка вживаної шини</h3>
    <div class="tai-grid">
      <div class="full"><label>Розмір *</label>${gtSizeWidget('cSz','cSize','')}</div>
      <div><label>Бренд</label><input id="cBrand" list="gtBrands" placeholder="Michelin" oninput="gtSetModels(this.value)"></div>
      <div><label>Модель</label><input id="cModel" list="gtModels" placeholder="X Line"></div>
      <div><label>Ціна нової, ₴ *</label><input id="cNewPrice" type="number" inputmode="numeric" placeholder="18000"></div>
      <div><label>&nbsp;</label><button type="button" class="btn btn-dark" style="width:100%" onclick="taiPullMarketToCalc()">🔎 Ринкова ціна</button></div>
      <div><label>DOT / рік</label><input id="cDot" placeholder="2021 або 3521"></div>
      <div><label>Глибина нової, мм *</label><input id="cNewTread" type="number" inputmode="numeric" placeholder="16"></div>
      <div><label>Фактична глибина, мм *</label><input id="cCurTread" type="number" inputmode="numeric" placeholder="12"></div>
      <div><label>Латки, шт</label><input id="cPatches" type="number" inputmode="numeric" value="0"></div>
      <div><label>Грибки, шт</label><input id="cPlugs" type="number" inputmode="numeric" value="0"></div>
      <div><label>Великі ремонти, шт</label><input id="cBig" type="number" inputmode="numeric" value="0"></div>
      <div><label>Боковина</label><select id="cSide">${TAI_SIDE.map(s=>`<option value="${s}">${s}</option>`).join('')}</select></div>
      <div class="full"><label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="cSideRep" style="width:auto;margin:0"> Боковий ремонт</label></div>
      <div class="full"><label>Фото (необовʼязково)</label><input type="file" id="cPhoto" accept="image/*" onchange="taiCalcPhoto(this)"><span id="cPhotoNote" style="font-size:.75rem;color:var(--text-dim)"></span></div>
      <div class="full" id="cMarketNote" style="font-size:.8rem;color:var(--accent)"></div>
    </div>
    <div class="gap-btns mt">
      <button class="btn btn-red" onclick="taiRunCalc()">Розрахувати</button>
      <button class="btn btn-dark" onclick="taiCalcClear()">Очистити</button>
    </div>
  </div>
  <div id="taiCalcResult"></div>`;
  if(_taiPhoto){ const n=document.getElementById('cPhotoNote'); if(n) n.textContent='✅ фото додано'; }
}
function taiCalcPhoto(input){
  const note=document.getElementById('cPhotoNote'); if(note) note.textContent='стискаю…';
  taiCompressPhoto(input,dataUrl=>{ _taiPhoto=dataUrl; if(note) note.textContent=dataUrl?'✅ фото додано':''; });
}
function taiCalcClear(){
  _taiPhoto=''; _taiLast=null;
  ['cSize','cSzW','cSzP','cSzD','cBrand','cModel','cNewPrice','cDot','cNewTread','cCurTread','cPatches','cPlugs','cBig'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=(['cPatches','cPlugs','cBig'].includes(id))?'0':'';});
  const sr=document.getElementById('cSideRep'); if(sr) sr.checked=false;
  const r=document.getElementById('taiCalcResult'); if(r) r.innerHTML='';
  const n=document.getElementById('cPhotoNote'); if(n) n.textContent='';
}
function taiReadCalc(){
  return {
    size:_taiGet('cSize'), brand:_taiGet('cBrand'), model:_taiGet('cModel'),
    newPrice:_taiNum('cNewPrice'), dotYear:_taiGet('cDot'),
    newTreadMm:_taiNum('cNewTread'), curTreadMm:_taiNum('cCurTread'),
    patches:_taiNum('cPatches'), plugs:_taiNum('cPlugs'), bigRepairs:_taiNum('cBig'),
    sidewallCond:_taiGet('cSide'), sidewallRepair:_taiChk('cSideRep'), photo:_taiPhoto
  };
}
function taiRunCalc(){
  const mk=taiFindMarket(_taiGet('cBrand'),_taiGet('cModel'),_taiGet('cSize'));
  if(mk){
    const cp=document.getElementById('cNewPrice');
    if(cp && !cp.value){ cp.value=mk.recPrice||mk.avgPrice||''; }
    const nt=document.getElementById('cMarketNote');
    if(nt) nt.innerHTML='🔎 Ринкова ціна нової: реком. '+fmtMoney(mk.recPrice||0)+' · середня '+fmtMoney(mk.avgPrice||0)+' (перевірено '+(mk.checkedAt||'—')+')';
  }
  const d=taiReadCalc();
  if(mk) d.marketAvg=mk.avgPrice||0;
  if(!d.size||!d.newPrice||!d.newTreadMm||!d.curTreadMm){ alert('Заповніть: розмір, ціну нової, глибину нової і фактичну глибину'); return; }
  const r=taiCalcLogic(d); _taiLast={d,r};
  const el=document.getElementById('taiCalcResult');
  el.innerHTML=`
  <div class="card mt">
    <div class="tai-decision tai-dec-${r.dCls}">${r.decision}</div>
    <div class="tai-res mt">
      <div class="tai-metric"><div class="v">${r.treadPercent}%</div><div class="l">Залишок протектора</div></div>
      <div class="tai-metric"><div class="v">${fmtMoney(r.maxBuy)}</div><div class="l">Макс. ціна покупки</div></div>
      <div class="tai-metric"><div class="v">${fmtMoney(r.saleRec)}</div><div class="l">Реком. продаж (${fmtMoney(r.saleMin)}–${fmtMoney(r.saleMax)})</div></div>
      <div class="tai-metric"><div class="v">${fmtMoney(r.profitMin)}–${fmtMoney(r.profitMax)}</div><div class="l">Орієнт. прибуток</div></div>
    </div>
    <div class="tai-metric full mt" style="margin-top:10px">
      <div class="l" style="margin-bottom:6px">Пояснення</div>
      <div style="font-size:.85rem">База: ${r.basePct}% від ціни нової${r.ded?` − знижки ${fmtMoney(r.ded)}`:''}.</div>
      ${r.reasons.length?`<ul style="margin:6px 0 0 16px;font-size:.82rem;color:var(--text-dim)">${r.reasons.map(x=>`<li>${x}</li>`).join('')}</ul>`:'<div style="font-size:.82rem;color:var(--text-dim);margin-top:4px">Дефектів не вказано.</div>'}
    </div>
    <div class="gap-btns mt" style="margin-top:12px">
      <button class="btn btn-green" onclick="taiAddToStock()">＋ Додати в склад</button>
      <button class="btn btn-dark" onclick="taiMakeAd()">📝 Оголошення</button>
      <button class="btn btn-dark" onclick="taiGo('market')">🔎 Ринок</button>
    </div>
  </div>`;
}
function taiMakeAd(){
  if(!_taiLast){ alert('Спочатку зробіть розрахунок'); return; }
  const {d,r}=_taiLast; const L=[];
  L.push('🛞 '+[d.brand,d.model,d.size].filter(Boolean).join(' '));
  if(d.dotYear) L.push('Рік/DOT: '+d.dotYear);
  L.push('Залишок протектора: ~'+r.treadPercent+'% ('+(d.curTreadMm||'?')+' мм)');
  L.push('Боковина: '+(d.sidewallCond||'—'));
  const rep=[]; if(d.patches)rep.push(d.patches+' латк.'); if(d.plugs)rep.push(d.plugs+' грибк.'); if(d.bigRepairs)rep.push(d.bigRepairs+' рем.'); if(d.sidewallRepair)rep.push('боковий рем.');
  L.push('Ремонти: '+(rep.length?rep.join(', '):'без ремонтів'));
  if(r.saleRec) L.push('💵 Ціна: '+r.saleRec+'₴');
  L.push('📍 GT Tires, Велика Димерка · ☎ +380682590196');
  const txt=L.join('\n');
  openModal(`<h3>📝 Оголошення</h3>
    <textarea id="taiAd" rows="9" style="font-size:.85rem" readonly>${txt.replace(/</g,'&lt;')}</textarea>
    <div class="gap-btns mt">
      <button class="btn btn-red" onclick="navigator.clipboard.writeText(document.getElementById('taiAd').value);this.textContent='✅ Скопійовано'">📋 Копіювати</button>
      <button class="btn btn-dark" onclick="closeModal()">Закрити</button>
    </div>`);
}

// ---- СКЛАД Б/У ----
let taiStockFilter='all', taiStockQuery='';
function taiStatusBadge(s){ const k=(s||'')[0]; return `<span class="tai-badge tai-b-${k}">${s||'—'}</span>`; }
let taiStockView='cards';
const TAI_DEAL=['куплено','реалізація','зберігання'];
const TAI_PAY=['','оплачено','не оплачено','виплачено власнику','частково'];

function taiClientName(id){ const c=(clients||[]).find(x=>x.id===id); return c?(c.name||c.phone||'клієнт'):''; }
function taiClientOptions(sel){
  return '<option value="">— не вказано —</option>'+(clients||[]).slice()
    .sort((a,b)=>(''+(a.name||'')).localeCompare(''+(b.name||'')))
    .map(c=>`<option value="${c.id}"${sel===c.id?' selected':''}>${(c.name||'Без імені')}${c.phone?' · '+c.phone:''}</option>`).join('');
}
function taiDealShort(dt){ return dt==='реалізація'?'реаліз.':(dt==='зберігання'?'зберіг.':'куплено'); }
// прибуток без мутації (для відображення)
function taiProfitOf(t){
  const dt=t.dealType||'куплено';
  const sale=+t.actualSalePrice||0, buy=+t.purchasePrice||0, payout=+t.payoutToClient||0, storage=+t.storagePrice||0;
  if(dt==='реалізація') return sale>0?(sale-payout):0;
  if(dt==='зберігання') return storage;
  return sale>0?(sale-buy):0;
}
// розрахунок + запис у запис (при збереженні)
function taiComputeProfit(t){
  const dt=t.dealType||'куплено';
  const sale=+t.actualSalePrice||0, payout=+t.payoutToClient||0;
  if(dt==='реалізація'){ t.commissionAmount = sale>0?(sale-payout):0; t.profit=t.commissionAmount; }
  else if(dt==='зберігання'){ t.commissionAmount=0; t.profit=+t.storagePrice||0; }
  else { t.commissionAmount=0; t.profit = sale>0?(sale-(+t.purchasePrice||0)):0; }
  return t.profit;
}
function taiPayBadge(t){
  const p=t.paymentStatus||''; if(!p) return '';
  const ic={'оплачено':'💵','не оплачено':'⏳','виплачено власнику':'👤','частково':'½'}[p]||'';
  return `<span style="font-size:.72rem;color:var(--text-dim)">${ic} ${p}</span>`;
}

function renderTaiStock(){
  const b=document.getElementById('taiBody');
  const FILTERS=[['all','Всі'],['в наявності','В наявності'],['продано','Продано'],['резерв','Резерв'],['брак','Брак']];
  let list=usedTires.slice();
  if(taiStockFilter!=='all') list=list.filter(t=>t.status===taiStockFilter);
  const q=taiStockQuery.trim().toLowerCase();
  if(q) list=list.filter(t=>[t.size,t.brand,t.model,t.dotYear,t.status,t.dealType,taiClientName(t.buyerClientId),(''+t.treadPercent),(''+t.purchasePrice),(''+t.actualSalePrice)].join(' ').toLowerCase().includes(q));
  list.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  const cnt=usedTires.length, inStock=usedTires.filter(t=>t.status==='в наявності').length;
  const invVal=usedTires.filter(t=>t.status==='в наявності'&&(t.dealType||'куплено')==='куплено').reduce((s,t)=>s+(+t.purchasePrice||0),0);
  const soldProfit=usedTires.filter(t=>t.status==='продано').reduce((s,t)=>s+taiProfitOf(t),0);
  let html=`
  <div class="stats-grid" style="margin-bottom:12px">
    ${_statCard(cnt,'Всього шин')}
    ${_statCard(inStock,'В наявності')}
    ${_statCard(fmtMoney(invVal),'Вкладено')}
    ${_statCard(fmtMoney(soldProfit),'Прибуток (продано)')}
  </div>
  <div class="flex-between mb">
    <input id="taiSearch" placeholder="🔎 розмір, бренд, ціна, покупець…" value="${taiStockQuery.replace(/"/g,'&quot;')}" oninput="taiStockQuery=this.value;renderTaiStock();setTimeout(()=>{const e=document.getElementById('taiSearch');if(e){e.focus();e.setSelectionRange(e.value.length,e.value.length);}},0)">
    <button class="btn btn-red" onclick="taiNewUsedTire()" style="flex:0 0 auto;margin-left:8px">＋ Додати</button>
  </div>
  <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:10px">
    ${FILTERS.map(f=>`<button class="tai-tab${taiStockFilter===f[0]?' active':''}" onclick="taiStockFilter='${f[0]}';renderTaiStock()">${f[1]}</button>`).join('')}
  </div>
  <div style="display:flex;gap:8px;margin-bottom:10px">
    <button class="tai-tab${taiStockView==='cards'?' active':''}" onclick="taiStockView='cards';renderTaiStock()">🗂 Картки</button>
    <button class="tai-tab${taiStockView==='table'?' active':''}" onclick="taiStockView='table';renderTaiStock()">📊 Таблиця</button>
  </div>`;
  if(!list.length){ b.innerHTML=html+`<div class="tai-soon">Порожньо. Додайте шину з калькулятора або кнопкою «Додати».</div>`; return; }

  if(taiStockView==='table'){
    html+=`<div class="tbl-wrap"><table><thead><tr><th>Шина</th><th>Купівля</th><th>Продаж</th><th>Прибуток</th><th>Статус</th><th></th></tr></thead><tbody>`;
    html+=list.map(t=>{
      const dt=t.dealType||'куплено';
      const buyCol = dt==='куплено' ? fmtMoney(t.purchasePrice||0) : (dt==='реалізація'?'реаліз.':'зберіг.');
      const sale = t.actualSalePrice ? fmtMoney(t.actualSalePrice) : '—';
      const pr = taiProfitOf(t);
      const prCol = (t.status==='продано'||pr) ? `<b style="color:${pr>=0?'var(--green)':'var(--accent)'}">${fmtMoney(pr)}</b>` : '—';
      return `<tr onclick="taiEditUsedTire('${t.id}')" style="cursor:pointer">
        <td>${[t.brand,t.model].filter(Boolean).join(' ')||'—'}<br><small style="color:var(--text-dim)">${t.size||''} · ${taiDealShort(dt)}</small></td>
        <td>${buyCol}</td><td>${sale}</td><td>${prCol}</td>
        <td>${taiStatusBadge(t.status)}${t.paymentStatus?'<br>'+taiPayBadge(t):''}</td>
        <td style="white-space:nowrap"><button class="btn btn-dark btn-sm" onclick="event.stopPropagation();taiSetStatus('${t.id}')">📌</button> <button class="btn btn-dark btn-sm" onclick="event.stopPropagation();taiDelUsedTire('${t.id}')">🗑</button></td>
      </tr>`;
    }).join('');
    html+=`</tbody></table></div>`;
    b.innerHTML=html; return;
  }

  // cards
  html+=list.map(t=>{
    const dt=t.dealType||'куплено';
    const pr=taiProfitOf(t);
    const fin=[];
    if(dt==='куплено') fin.push('Купівля: <b>'+fmtMoney(t.purchasePrice||0)+'</b>');
    if(dt==='реалізація'){ if(t.ownerExpected) fin.push('Власник хоче: '+fmtMoney(t.ownerExpected)); if(t.payoutToClient) fin.push('Виплата: '+fmtMoney(t.payoutToClient)); }
    if(dt==='зберігання'&&t.storagePrice) fin.push('Зберігання: '+fmtMoney(t.storagePrice));
    fin.push('Реком: '+fmtMoney(t.recommendedSalePrice||0));
    if(t.actualSalePrice) fin.push('Продаж: <b>'+fmtMoney(t.actualSalePrice)+'</b>');
    if(t.status==='продано'||pr) fin.push((dt==='реалізація'?'Комісія: ':'Прибуток: ')+'<b style="color:'+(pr>=0?'var(--green)':'var(--accent)')+'">'+fmtMoney(pr)+'</b>');
    return `<div class="tai-card">
      <div class="row">
        ${t.photo?`<img class="tai-thumb" src="${t.photo}">`:''}
        <div style="flex:1;min-width:0">
          <div style="font-weight:700">${[t.brand,t.model].filter(Boolean).join(' ')||'Без назви'} · ${t.size||''}</div>
          <div style="font-size:.76rem;color:var(--text-dim)">${taiDealShort(dt)} · DOT ${t.dotYear||'—'} · протектор ${t.treadPercent||0}%${t.buyerClientId?' · покупець '+taiClientName(t.buyerClientId):''}</div>
          <div style="font-size:.82rem;margin-top:3px">${fin.join(' · ')}</div>
          <div style="margin-top:5px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">${taiStatusBadge(t.status)} ${taiPayBadge(t)}</div>
        </div>
      </div>
      <div class="gap-btns mt" style="margin-top:8px">
        <button class="btn btn-dark btn-sm" onclick="taiSetStatus('${t.id}')">📌 Угода/статус</button>
        <button class="btn btn-dark btn-sm" onclick="taiEditUsedTire('${t.id}')">✏️</button>
        <button class="btn btn-dark btn-sm" onclick="taiDelUsedTire('${t.id}')">🗑</button>
      </div>
    </div>`;
  }).join('');
  b.innerHTML=html;
}
function taiAddToStock(){
  if(!_taiLast){ alert('Спочатку зробіть розрахунок'); return; }
  const {d,r}=_taiLast;
  taiUsedTireModal(null,{
    dealType:'куплено',
    size:d.size,brand:d.brand,model:d.model,dotYear:d.dotYear,treadMm:d.curTreadMm,treadPercent:r.treadPercent,
    sidewallCond:d.sidewallCond,sidewallRepair:d.sidewallRepair,patches:d.patches,plugs:d.plugs,bigRepairs:d.bigRepairs,
    purchasePrice:r.maxBuy,recommendedSalePrice:r.saleRec,photo:d.photo,status:'в наявності'
  });
}
function taiNewUsedTire(){ taiUsedTireModal(null,{dealType:'куплено',status:'в наявності',treadPercent:0}); }
function taiEditUsedTire(id){ const t=usedTires.find(x=>x.id===id); if(t) taiUsedTireModal(id,t); }
function taiUsedTireModal(id,t){
  t=t||{}; window._taiModalPhoto=t.photo||''; gtEnsureDatalists();
  const dt=t.dealType||'куплено';
  const esc=v=>(''+(v==null?'':v)).replace(/"/g,'&quot;');
  openModal(`<h3>${id?'Редагувати':'Шина в склад'} (попередній перегляд)</h3>
    <label>Тип угоди</label>
    <select id="uDeal" onchange="taiDealToggle()">${TAI_DEAL.map(s=>`<option value="${s}"${dt===s?' selected':''}>${s}</option>`).join('')}</select>
    <div class="tai-grid" style="margin-top:8px">
      <div class="full"><label>Розмір *</label>${gtSizeWidget('uSz','uSize',t.size)}</div>
      <div><label>Бренд</label><input id="uBrand" list="gtBrands" value="${esc(t.brand)}" oninput="gtSetModels(this.value)"></div>
      <div><label>Модель</label><input id="uModel" list="gtModels" value="${esc(t.model)}"></div>
      <div><label>Вісь</label>${gtAxisSelect('uAxis',t.axis)}</div>
      <div><label>DOT / рік</label><input id="uDot" value="${esc(t.dotYear)}"></div>
      <div class="full"><label>Протектор, %</label>${gtTreadBtns('uTreadP')}<input id="uTreadP" type="number" value="${t.treadPercent||0}"></div>
      <div><label>Глибина, мм</label><input id="uTreadMm" type="number" value="${t.treadMm||''}"></div>
      <div><label>Стан</label>${gtCondSelect('uCond',t.condition)}</div>
      <div><label>Боковина</label><select id="uSide">${TAI_SIDE.map(s=>`<option value="${s}"${t.sidewallCond===s?' selected':''}>${s}</option>`).join('')}</select></div>
      <div id="uBuyWrap"><label>Закупівля, ₴</label><input id="uBuy" type="number" value="${t.purchasePrice||''}"></div>
      <div><label>Реком. продаж, ₴</label><input id="uSale" type="number" value="${t.recommendedSalePrice||''}"></div>
      <div id="uOwnerWrap"><label>Власник хоче, ₴</label><input id="uOwner" type="number" value="${t.ownerExpected||''}"></div>
      <div id="uPayoutWrap"><label>Виплата власнику, ₴</label><input id="uPayout" type="number" value="${t.payoutToClient||''}"></div>
      <div id="uStorageWrap"><label>Плата за зберігання, ₴</label><input id="uStorage" type="number" value="${t.storagePrice||''}"></div>
      <div><label>Статус</label><select id="uStatus">${TAI_STATUS.map(s=>`<option value="${s}"${t.status===s?' selected':''}>${s}</option>`).join('')}</select></div>
      <div class="full"><label>Джерело покупки</label><input id="uSource" value="${esc(t.source)}" placeholder="OLX / клієнт / обмін…"></div>
      <div class="full"><label>Примітки</label><input id="uNotes" value="${esc(t.notes)}"></div>
      <div class="full"><label>Фото</label><input type="file" id="uPhoto" accept="image/*" onchange="taiModalPhoto(this)"><span id="uPhotoNote" style="font-size:.75rem;color:var(--text-dim)">${t.photo?'✅ фото є':''}</span></div>
    </div>
    <div class="gap-btns mt">
      <button class="btn btn-red" onclick="taiSaveUsedTire(${id?`'${id}'`:'null'})">💾 Зберегти</button>
      <button class="btn btn-dark" onclick="closeModal()">Скасувати</button>
    </div>`);
  taiDealToggle();
  gtSetModels(t.brand||'');
}
function taiDealToggle(){
  const dt=_taiGet('uDeal')||'куплено';
  const show=(id,on)=>{const e=document.getElementById(id);if(e)e.style.display=on?'block':'none';};
  show('uBuyWrap', dt==='куплено');
  show('uOwnerWrap', dt==='реалізація');
  show('uPayoutWrap', dt==='реалізація');
  show('uStorageWrap', dt==='зберігання');
}
function taiModalPhoto(input){
  const note=document.getElementById('uPhotoNote'); if(note) note.textContent='стискаю…';
  taiCompressPhoto(input,dataUrl=>{ window._taiModalPhoto=dataUrl; if(note) note.textContent=dataUrl?'✅ фото додано':''; });
}
function taiSaveUsedTire(id){
  const dealType=_taiGet('uDeal')||'куплено';
  const size=_taiGet('uSize');
  if(!size){ alert('Вкажіть розмір'); return; }
  if(dealType==='куплено' && !_taiNum('uBuy')){ alert('Для угоди «куплено» вкажіть ціну закупівлі'); return; }
  const rec={
    dealType, size, brand:_taiGet('uBrand'), model:_taiGet('uModel'), dotYear:_taiGet('uDot'),
    treadPercent:_taiNum('uTreadP'), treadMm:_taiNum('uTreadMm'), sidewallCond:_taiGet('uSide'),
    purchasePrice:_taiNum('uBuy'), recommendedSalePrice:_taiNum('uSale'),
    ownerExpected:_taiNum('uOwner'), payoutToClient:_taiNum('uPayout'), storagePrice:_taiNum('uStorage'),
    axis:_taiGet('uAxis'), condition:_taiGet('uCond'), status:_taiGet('uStatus'), source:_taiGet('uSource'), notes:_taiGet('uNotes'), photo:window._taiModalPhoto||''
  };
  let target;
  if(id){ target=usedTires.find(x=>x.id===id); if(target){ Object.assign(target,rec); target.updatedAt=Date.now(); } }
  else { target=Object.assign({id:uid(),createdAt:Date.now(),actualSalePrice:0,profit:0,commissionAmount:0,buyerClientId:'',saleDate:'',paymentStatus:''},rec); usedTires.push(target); }
  if(target) taiComputeProfit(target);
  save('usedTires',usedTires);
  window._taiModalPhoto=''; closeModal(); taiSub='stock'; renderTireAI();
}
function taiSetStatus(id){
  const t=usedTires.find(x=>x.id===id); if(!t) return;
  const dt=t.dealType||'куплено';
  const today=new Date().toLocaleDateString('uk-UA');
  openModal(`<h3>📌 Угода — ${[t.brand,t.size].filter(Boolean).join(' ')} <span style="font-size:.7rem;color:var(--text-dim)">(${dt})</span></h3>
    <label>Статус</label>
    <select id="stStatus" onchange="taiStatusToggle()">
      ${TAI_STATUS.map(s=>`<option value="${s}"${t.status===s?' selected':''}>${s}</option>`).join('')}
    </select>
    <div id="stSaleWrap" style="display:${t.status==='продано'?'block':'none'};margin-top:8px">
      <label>Фактична ціна продажу, ₴</label><input id="stSale" type="number" value="${t.actualSalePrice||t.recommendedSalePrice||''}" oninput="taiStatusToggle()">
      ${dt==='реалізація'?`<label>Виплата власнику, ₴</label><input id="stPayout" type="number" value="${t.payoutToClient||t.ownerExpected||''}" oninput="taiStatusToggle()">`:''}
      <label>Дата продажу</label><input id="stDate" value="${t.saleDate||today}">
      <label>Покупець (клієнт)</label><select id="stBuyer">${taiClientOptions(t.buyerClientId)}</select>
      <label>Статус оплати</label><select id="stPay">${TAI_PAY.map(p=>`<option value="${p}"${(t.paymentStatus||'')===p?' selected':''}>${p||'—'}</option>`).join('')}</select>
      <div id="stCalc" style="margin-top:8px;font-size:.85rem;color:var(--text-dim)"></div>
    </div>
    <div class="gap-btns mt">
      <button class="btn btn-red" onclick="taiSaveStatus('${id}')">💾 Зберегти</button>
      <button class="btn btn-dark" onclick="closeModal()">Скасувати</button>
    </div>`);
  taiStatusToggle();
}
function taiStatusToggle(){
  const wrap=document.getElementById('stSaleWrap'); if(!wrap) return;
  const sold=_taiGet('stStatus')==='продано';
  wrap.style.display=sold?'block':'none';
  const calc=document.getElementById('stCalc'); if(!calc) return;
  const sale=_taiNum('stSale');
  const hasPayout=document.getElementById('stPayout')!==null;
  if(hasPayout){ const payout=_taiNum('stPayout'); const com=sale-payout; calc.innerHTML=`Комісія = продаж − виплата = <b>${fmtMoney(com)}</b> (це і є прибуток)`; }
  else { calc.innerHTML=''; }
}
function taiSaveStatus(id){
  const t=usedTires.find(x=>x.id===id); if(!t) return;
  t.status=_taiGet('stStatus');
  if(t.status==='продано'){
    t.actualSalePrice=_taiNum('stSale');
    t.saleDate=_taiGet('stDate')||new Date().toLocaleDateString('uk-UA');
    t.buyerClientId=_taiGet('stBuyer');
    t.paymentStatus=_taiGet('stPay');
    if((t.dealType||'куплено')==='реалізація') t.payoutToClient=_taiNum('stPayout');
  } else {
    t.actualSalePrice=0; t.saleDate=''; t.buyerClientId=''; t.paymentStatus='';
  }
  taiComputeProfit(t);
  t.updatedAt=Date.now(); save('usedTires',usedTires); closeModal(); renderTaiStock();
}
function taiDelUsedTire(id){
  if(!confirm('Видалити цю шину зі складу Б/У?')) return;
  usedTires=usedTires.filter(x=>x.id!==id); save('usedTires',usedTires); renderTaiStock();
}
// ---- стиснення фото (≤700px, jpeg q0.55) для економії localStorage ----
function taiCompressPhoto(input,cb){
  const f=input.files&&input.files[0]; if(!f){ cb(''); return; }
  const r=new FileReader();
  r.onload=()=>{ const im=new Image(); im.onload=()=>{
    const max=700; let w=im.width,h=im.height;
    if(w>=h&&w>max){ h=Math.round(h*max/w); w=max; } else if(h>w&&h>max){ w=Math.round(w*max/h); h=max; }
    const c=document.createElement('canvas'); c.width=w; c.height=h;
    c.getContext('2d').drawImage(im,0,0,w,h);
    try{ cb(c.toDataURL('image/jpeg',0.55)); }catch(e){ cb(''); }
  }; im.onerror=()=>cb(''); im.src=r.result; };
  r.onerror=()=>cb(''); r.readAsDataURL(f);
}

// ==================== ШИНИ AI — РИНКОВА ЦІНА НОВОЇ ШИНИ (ручний GPT-режим, без API) ====================
function _taiNorm(s){ return (s||'').toString().toLowerCase().replace(/\s+/g,' ').trim(); }
function taiFindMarket(brand,model,size){
  const b=_taiNorm(brand), m=_taiNorm(model), s=gtNormSize(size);
  if(!s && !b) return null;
  let list=marketPrices.filter(x=>gtNormSize(x.size)===s && _taiNorm(x.brand)===b && _taiNorm(x.model)===m);
  if(!list.length) list=marketPrices.filter(x=>gtNormSize(x.size)===s && _taiNorm(x.brand)===b);
  if(!list.length) list=marketPrices.filter(x=>gtNormSize(x.size)===s);
  if(!list.length) return null;
  list.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  return list[0];
}
function _taiPickNum(text,kw){
  const re=new RegExp(kw+'[^0-9\\n]{0,40}([0-9][0-9\\s.,\\u00a0]*)','i');
  const m=(text||'').match(re); if(!m) return 0;
  return parseInt(m[1].replace(/[\s.,\u00a0]/g,''))||0;
}
function _taiPickSources(text){
  const m=(text||'').match(/джерел[^:\n]*:?\s*(.+)/i);
  return m?m[1].trim().slice(0,400):'';
}
function taiBuildQuery(){
  const b=_taiGet('mqBrand'), m=_taiGet('mqModel'), s=_taiGet('mqSize');
  return 'Знайди актуальну ціну нової шини '+[b,m,s].filter(Boolean).join(' ')+' в Україні.\n'+
    'Дай коротко:\n1. мінімальну ціну;\n2. середню ціну;\n3. 3 джерела;\n4. рекомендовану ціну для калькулятора Б/У шин.\n'+
    'Формат:\nМінімум: X грн\nСередня: Y грн\nРекомендована: Z грн\nДжерела: ...';
}
function renderTaiMarket(){
  const b=document.getElementById('taiBody'); if(!b) return;
  gtEnsureDatalists();
  const seen={}, opts=[];
  usedTires.forEach(t=>{ const k=[t.brand,t.model,t.size].join('|'); if(!seen[k]&&(t.size||t.brand)){ seen[k]=1; opts.push(t); } });
  window._taiMarketOpts=opts;
  const sel='<select id="mqPick" onchange="taiMarketSelect(this.value)"><option value="">— ввести вручну —</option>'+
    opts.map((t,i)=>`<option value="${i}">${[t.brand,t.model,t.size].filter(Boolean).join(' ')}</option>`).join('')+'</select>';
  const today=new Date().toLocaleDateString('uk-UA');
  const saved=marketPrices.slice().sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  b.innerHTML=`
  <div class="card">
    <h3 style="margin-bottom:8px">🛞 AI оцінка шин</h3>
    <div style="font-size:.78rem;color:var(--text-dim);margin-bottom:10px">ℹ️ AI дає ринковий орієнтир (не відкриває сайти напряму). Введи дані й натисни «Перевірити ціну».</div>
    <label>Вибрати шину зі складу Б/У (необовʼязково)</label>${sel}
    <label style="margin-top:10px;display:block">Тип шини</label>
    <div style="display:flex;gap:16px;margin-top:4px">
      <label style="display:flex;align-items:center;gap:7px;cursor:pointer"><input type="radio" name="oraiMode" id="oraiModeNew" checked onchange="oraiSetMode()" style="width:auto;margin:0"> 🆕 Нова</label>
      <label style="display:flex;align-items:center;gap:7px;cursor:pointer"><input type="radio" name="oraiMode" id="oraiModeUsed" onchange="oraiSetMode()" style="width:auto;margin:0"> 🛞 Б/У</label>
    </div>
    <div class="tai-grid" style="margin-top:10px">
      <div class="full"><label>Розмір *</label>${gtSizeWidget('mqSz','mqSize','')}</div>
      <div><label>Бренд</label><input id="mqBrand" list="gtBrands" placeholder="Michelin" oninput="gtSetModels(this.value)"></div>
      <div><label>Модель</label><input id="mqModel" list="gtModels" placeholder="X Line"></div>
    </div>
    <div id="oraiUsedFields" style="display:none">
      <div class="tai-grid" style="margin-top:8px">
        <div><label>Стан</label>${gtCondSelect('oraiCond','')}</div>
        <div><label>Протектор</label><input id="oraiTread" placeholder="11 мм або 70%"></div>
        <div class="full"><label>Опис</label><input id="oraiDesc" placeholder="2 ремонти, боковина ціла…"></div>
      </div>
    </div>
    <label style="margin-top:10px;display:block">Джерела перевірки</label>
    <div id="oraiSources">${oraiSourcesHTML('new')}</div>
    <div class="gap-btns mt" style="margin-top:12px"><button class="btn btn-red" style="flex:1;font-size:1rem;padding:13px" onclick="oraiGet()">🔎 Перевірити ціну</button></div>
    <div class="gap-btns mt"><button class="btn btn-dark btn-sm" onclick="oraiLinks()">🔗 Сформувати пошукові посилання</button></div>
    <div id="oraiLinksBox"></div>
    <div id="oraiStatus" style="font-size:.82rem;color:var(--accent);min-height:18px;margin-top:6px"></div>
    <label style="margin-top:6px;display:block">Відповідь AI</label>
    <textarea id="oraiAnswer" rows="8" readonly placeholder="Тут зʼявиться AI-оцінка за вибраними джерелами…" style="font-size:.82rem"></textarea>
    <div class="gap-btns mt">
      <button class="btn btn-green" onclick="oraiSave()">💾 Зберегти результат</button>
      <button class="btn btn-dark" onclick="oraiToCalc()">🧮 У калькулятор</button>
      <button class="btn btn-dark" onclick="oraiToStock()">📦 У Б/У склад</button>
    </div>
  </div>
  <details class="card mt"><summary style="cursor:pointer;font-weight:700">⚙️ Резервний ручний режим (ChatGPT вручну)</summary>
    <div style="font-size:.76rem;color:var(--text-dim);margin:8px 0">Якщо немає API-ключа: підготуй запит, спитай ChatGPT вручну, встав відповідь.</div>
    <div class="gap-btns mt">
      <button class="btn btn-dark" onclick="taiMarketAsk()">🤖 Спитати GPT</button>
      <button class="btn btn-dark" onclick="taiMarketCopy()">📋 Скопіювати запит</button>
    </div>
    <label style="margin-top:8px;display:block">Запит для ChatGPT</label>
    <textarea id="mqQuery" rows="5" readonly style="font-size:.82rem"></textarea>
    <div id="mqStatus" style="font-size:.8rem;color:var(--accent);min-height:18px;margin-top:4px"></div>
    <label style="margin-top:6px;display:block">Відповідь GPT (вставити сюди)</label>
    <textarea id="mqAnswer" rows="5" placeholder="Встав сюди відповідь ChatGPT…" style="font-size:.82rem"></textarea>
    <div class="gap-btns mt">
      <button class="btn btn-dark" onclick="taiMarketPaste()">📥 Вставити відповідь</button>
      <button class="btn btn-dark" onclick="taiMarketExtract()">✨ Витягнути ціни</button>
    </div>
    <div class="tai-grid" style="margin-top:10px">
      <div><label>Мінімальна, ₴</label><input id="mqMin" type="number" inputmode="numeric"></div>
      <div><label>Середня, ₴</label><input id="mqAvg" type="number" inputmode="numeric"></div>
      <div><label>Рекомендована, ₴</label><input id="mqRec" type="number" inputmode="numeric"></div>
      <div><label>Дата перевірки</label><input id="mqDate" value="${today}"></div>
      <div class="full"><label>Джерела</label><input id="mqSources" placeholder="prom.ua, rozetka, …"></div>
      <div class="full"><label>Коментар</label><input id="mqComment"></div>
    </div>
    <div class="gap-btns mt">
      <button class="btn btn-green" onclick="taiMarketSave()">💾 Зберегти ціну</button>
      <button class="btn btn-dark" onclick="taiMarketUse(null)">🧮 У калькулятор</button>
    </div>
  </details>
  <details class="card mt"><summary style="cursor:pointer;font-weight:700">🔑 Налаштування AI API</summary>
    <div style="margin-top:8px">${oraiPanelHTML()}</div>
  </details>
  <div class="card mt">
    <h3 style="margin-bottom:8px">Збережені ринкові ціни (${marketPrices.length})</h3>
    ${saved.length?saved.map(r=>`
      <div class="tai-card"><div class="row"><div style="flex:1;min-width:0">
        <div style="font-weight:700">${[r.brand,r.model,r.size].filter(Boolean).join(' ')||'—'}</div>
        <div style="font-size:.8rem;color:var(--text-dim)">мін ${fmtMoney(r.minPrice||0)} · сер ${fmtMoney(r.avgPrice||0)} · реком <b>${fmtMoney(r.recPrice||0)}</b> · ${r.checkedAt||''}</div>
        ${r.sources?`<div style="font-size:.74rem;color:var(--text-dim)">${r.sources}</div>`:''}
      </div></div>
      <div class="gap-btns mt" style="margin-top:8px">
        <button class="btn btn-dark btn-sm" onclick="taiMarketUse('${r.id}')">🧮 В калькулятор</button>
        <button class="btn btn-dark btn-sm" onclick="taiDelMarket('${r.id}')">🗑</button>
      </div></div>`).join(''):'<div style="color:var(--text-dim);font-size:.85rem">Поки порожньо.</div>'}
  </div>`;
}
function taiMarketSelect(i){
  const t=(window._taiMarketOpts||[])[+i]; if(!t) return;
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v||'';};
  set('mqBrand',t.brand); set('mqModel',t.model); gtSetModels(t.brand||'');
  const sp=gtParseSize(t.size||''); set('mqSzW',sp.w); set('mqSzP',sp.p); set('mqSzD',sp.d); gtSizeSync('mqSz','mqSize');
}
function taiMarketAsk(){
  if(!_taiGet('mqSize')&&!_taiGet('mqBrand')){ alert('Вкажіть хоча б розмір або бренд'); return; }
  const q=taiBuildQuery(); const el=document.getElementById('mqQuery'); if(el) el.value=q;
  try{ navigator.clipboard.writeText(q); }catch(e){}
  const st=document.getElementById('mqStatus'); if(st) st.textContent='✅ Запит скопійовано. Відкрив ChatGPT — вставте (Ctrl+V), потім скопіюйте відповідь сюди.';
  try{ window.open('https://chatgpt.com/','_blank'); }catch(e){}
}
function taiMarketCopy(){
  const el=document.getElementById('mqQuery'); let q=el?el.value:''; if(!q){ q=taiBuildQuery(); if(el) el.value=q; }
  try{ navigator.clipboard.writeText(q); }catch(e){}
  const st=document.getElementById('mqStatus'); if(st) st.textContent='✅ Запит скопійовано';
}
function taiMarketPaste(){
  const ta=document.getElementById('mqAnswer'); if(!ta) return;
  if(navigator.clipboard&&navigator.clipboard.readText){
    navigator.clipboard.readText().then(t=>{ if(t){ ta.value=t; taiMarketExtract(); } else ta.focus(); }).catch(()=>ta.focus());
  } else ta.focus();
}
function taiMarketExtract(){
  const t=(document.getElementById('mqAnswer')||{}).value||'';
  const mn=_taiPickNum(t,'мінім'), av=_taiPickNum(t,'середн'), rc=_taiPickNum(t,'рекоменд'), src=_taiPickSources(t);
  const set=(id,v)=>{const e=document.getElementById(id);if(e&&v)e.value=v;};
  set('mqMin',mn); set('mqAvg',av); set('mqRec',rc||av);
  if(src){const e=document.getElementById('mqSources');if(e)e.value=src;}
  const st=document.getElementById('mqStatus');
  if(st) st.textContent=(mn||av||rc)?'✅ Ціни витягнуто — перевір і збережи':'⚠️ Не розпізнано автоматично — введи ціни вручну';
}
function taiMarketSave(){
  const size=_taiGet('mqSize'); if(!size){ alert('Вкажіть розмір'); return; }
  const rec={ id:uid(), size, brand:_taiGet('mqBrand'), model:_taiGet('mqModel'),
    minPrice:_taiNum('mqMin'), avgPrice:_taiNum('mqAvg'), recPrice:_taiNum('mqRec')||_taiNum('mqAvg'),
    sources:_taiGet('mqSources'), checkedAt:_taiGet('mqDate')||new Date().toLocaleDateString('uk-UA'),
    comment:_taiGet('mqComment'), createdAt:Date.now() };
  marketPrices.push(rec); save('marketPrices',marketPrices);
  aiLogs.push({id:uid(),type:'market',input:[rec.brand,rec.model,rec.size].filter(Boolean).join(' '),output:'min '+rec.minPrice+' avg '+rec.avgPrice+' rec '+rec.recPrice,createdAt:Date.now()});
  save('aiLogs',aiLogs);
  alert('Ціну збережено. Калькулятор Б/У підтягне її автоматично по бренду+моделі+розміру.');
  renderTaiMarket();
}
function taiMarketUse(id){
  let r;
  if(id){ r=marketPrices.find(x=>x.id===id); }
  else { r={size:_taiGet('mqSize'),brand:_taiGet('mqBrand'),model:_taiGet('mqModel'),recPrice:_taiNum('mqRec')||_taiNum('mqAvg')}; }
  if(!r||!r.size){ alert('Спочатку вкажіть або виберіть шину (розмір)'); return; }
  taiSub='calc'; renderTireAI();
  setTimeout(()=>{
    const set=(id,v)=>{const e=document.getElementById(id);if(e&&v!=null&&v!=='')e.value=v;};
    set('cSize',r.size); set('cBrand',r.brand||''); set('cModel',r.model||''); set('cNewPrice',r.recPrice||'');
    taiPullMarketToCalc();
  },0);
}
function taiDelMarket(id){
  if(!confirm('Видалити цю ринкову ціну?')) return;
  marketPrices=marketPrices.filter(x=>x.id!==id); save('marketPrices',marketPrices); renderTaiMarket();
}
function taiPullMarketToCalc(){
  const mk=taiFindMarket(_taiGet('cBrand'),_taiGet('cModel'),_taiGet('cSize'));
  const note=document.getElementById('cMarketNote');
  if(!mk){ if(note) note.innerHTML='Немає збереженої ринкової ціни для цієї шини. Відкрий «🔎 Перевірити ринок».'; return; }
  const cp=document.getElementById('cNewPrice'); if(cp) cp.value=mk.recPrice||mk.avgPrice||'';
  if(note) note.innerHTML='🔎 Ринкова ціна нової: реком. '+fmtMoney(mk.recPrice||0)+' · середня '+fmtMoney(mk.avgPrice||0)+' (перевірено '+(mk.checkedAt||'—')+')';
}

// ==================== РЕДАГУВАННЯ ЗАКАЗУ + НОВА ПОСЛУГА В ЗАКАЗІ ====================
function submitOrder(){
  if(window._orderSubmitting) return;
  window._orderSubmitting=true;
  updateOrderSubmitState();
  try{
    if(window._editOrderId) saveEditedOrder(window._editOrderId);
    else saveNewOrder();
  }catch(e){
    console.error(e);
    setOrderFeedback('error','Не вдалося зберегти замовлення');
  }finally{
    setTimeout(()=>{ window._orderSubmitting=false; updateOrderSubmitState(); }, 600);
  }
}
function openEditOrder(oid){ const o=orders.find(x=>x.id===oid); if(!o) return; openNewOrder(o); }

// створити послугу, якої немає в прайсі, прямо в заказі (і зберегти для повторного використання)
function toggleOrderNewSvc(){
  const f=document.getElementById('oNewSvcForm'); if(!f) return;
  const show=f.style.display==='none'||!f.style.display;
  f.style.display=show?'flex':'none';
  if(show){ const n=document.getElementById('oNewSvcName'); if(n) n.focus(); }
}
function addOrderCustomSvc(){
  const name=(document.getElementById('oNewSvcName')||{}).value;
  const nm=(name||'').trim();
  const price=parseFloat((document.getElementById('oNewSvcPrice')||{}).value)||0;
  if(!nm){ alert('Вкажіть назву послуги'); return; }
  const maxId=(customServices||[]).reduce((m,x)=>Math.max(m,x.id),9000);
  const id=maxId+1;
  customServices.push({id,name:nm,price}); save('customSvc',customServices);
  addOrderSvc(id);
  const ne=document.getElementById('oNewSvcName'); if(ne) ne.value='';
  const pe=document.getElementById('oNewSvcPrice'); if(pe) pe.value='';
  const f=document.getElementById('oNewSvcForm'); if(f) f.style.display='none';
  if(typeof renderPrice==='function') renderPrice();
}

// зберегти зміни існуючого заказу (із синхронізацією каси і складу)
function saveEditedOrder(oid){
  const o=orders.find(x=>x.id===oid);
  if(!o){ window._editOrderId=null; return saveNewOrder(); }
  const services=window._orderSvcs||[];
  if(!services.length){ setOrderFeedback('error','Спочатку додайте хоча б одну послугу'); return; }
  const formIssues=getOrderFormIssues(true);
  if(formIssues.length){ setOrderFeedback('error',formIssues[0]); updateOrderSubmitState(); return; }
  clearOrderFeedback();
  let total=0; services.forEach(s=>{ total+=s.price*s.qty; });
  const g=id=>{ const e=document.getElementById(id); return e?e.value:''; };
  const prevMaterials=(o.materials||[]).map(m=>({id:m.id,name:m.name,qty:m.qty,src:m.src}));

  // 2) оновлюємо поля заказу (id / номер / дату не чіпаємо)
  o.clientName=g('oClient').trim();
  o.phone=g('oPhone').trim();
  o.car=g('oCar').trim();
  o.plate=g('oPlate').trim();
  o.paymentType=g('oPayType')||'cash';
  o.notes=g('oNotes').trim();
  o.services=services;
  o.total=total;
  o.materials=(window._orderMats||[]).map(m=>({id:m.id,name:m.name,qty:m.qty,src:m.src}));
  {
    const live=getOrderLiveState();
    o.paidAmount=live.applied;
    o.debt=live.debt;
    o.cashReceived=live.entered;
    o.changeAmount=live.change;
  }
  if(!['done','cancel'].includes(o.status||'new')) o.status='progress';
  o.updatedAt=new Date().toISOString();

  const matIssues=getOrderMaterialIssues(o.materials, prevMaterials);
  if(matIssues.length){
    renderOrderMatPicker();
    renderOrderMats();
    setOrderFeedback('error','На складі не вистачає: '+matIssues.map(x=>`${x.name} (−${x.missing})`).join(', '));
    return;
  }

  // 3) повертаємо старі матеріали на склад і списуємо нові
  prevMaterials.forEach(mt=>{ const arr=(mt.src==='tires')?tires:warehouse; const it=arr.find(x=>x.id===mt.id); if(it){ it.qty=(+it.qty||0)+(+mt.qty||0); } });
  (o.materials||[]).forEach(mt=>{ const arr=(mt.src==='tires')?tires:warehouse; const it=arr.find(x=>x.id===mt.id); if(it){ it.qty=Math.max(0,(+it.qty||0)-(+mt.qty||0)); } });
  save('tires',tires); save('warehouse',warehouse);
  if(typeof renderTires==='function') renderTires();
  if(typeof renderWarehouse==='function') renderWarehouse();

  // 4) синхронізуємо базову оплату, не вбиваючи історію доплат
  upsertOrderBasePayment(o, o.paidAmount, o.date);
  syncOrderPaymentState(o);
  if(typeof renderCash==='function') renderCash();

  // 5) клієнт (як у створенні)
  if((o.clientName||'').trim() || o.phone){
    let ex=o.phone?findClientByPhone(o.phone):null;
    if(!ex && o.clientName) ex=findClientByName(o.clientName);
    if(ex){ if(o.clientName) ex.name=o.clientName; if(o.phone) ex.phone=o.phone; if(o.car) ex.car=o.car; if(o.plate) ex.plate=o.plate; ex.lastVisit=o.date; }
    else { clients.push({id:uid(),name:o.clientName||'',phone:o.phone||'',car:o.car||'',plate:o.plate||'',date:o.date,lastVisit:o.date}); }
    save('clients',clients);
  }

  save('orders',orders); renderOrders(); renderClients();
  if(typeof renderDebtors==='function') renderDebtors();
  if(typeof renderHome==='function') renderHome();
  renderOrderBell();
  window._editOrderId=null;
  showOrderPrint(o,{mode:'updated'});
}

// ==================== ШИНИ AI — AI ОЦІНКА ШИНИ (по тексту, через бекенд) ====================
// Ключ OpenAI НЕ зберігається у фронті. Фронт лише шле текст на endpoint (Edge Function).
// AI нічого не пише сам: «Додати в склад» відкриває форму підтвердження.
function taiAiEndpoint(){
  const saved=loadVal('aiEndpoint'); if(saved) return saved;
  return 'https://lxeswqlkereptdtwytbp.supabase.co/functions/v1/ai-evaluate-tire';
}
function taiAiSaveEndpoint(){ const e=document.getElementById('aiEndpoint'); saveVal('aiEndpoint', e?e.value.trim():''); renderTaiAI(); }
function renderTaiAI(){
  const b=document.getElementById('taiBody'); if(!b) return;
  const ep=taiAiEndpoint(); const saved=loadVal('aiEndpoint')||'';
  b.innerHTML=`
  <div class="card">
    <h3 style="margin-bottom:10px">🤖 AI оцінка шини (по тексту)</h3>
    <div style="font-size:.78rem;color:var(--text-dim);margin-bottom:8px">Опиши шину одним рядком — AI поверне структуровану оцінку. Ключ OpenAI лише на бекенді (Edge Function), не в застосунку. AI нічого не записує сам — спершу підтвердження.</div>
    <textarea id="aiText" rows="3" placeholder="Michelin 385/65 R22.5 2021 рік 11 мм 2 ремонти, боковина ціла"></textarea>
    <div class="gap-btns mt">
      <button class="btn btn-red" onclick="taiAiEvaluate()">🤖 Оцінити (AI)</button>
      <button class="btn btn-dark" onclick="taiAiLocalParse()">📝 Розібрати локально</button>
    </div>
    <div id="aiStatus" style="font-size:.8rem;color:var(--accent);min-height:18px;margin-top:6px"></div>
    <details style="margin-top:8px"><summary style="cursor:pointer;font-size:.8rem;color:var(--text-dim)">⚙️ Endpoint (бекенд)</summary>
      <label style="margin-top:6px;display:block">URL вашої Edge Function</label>
      <input id="aiEndpoint" value="${saved.replace(/"/g,'&quot;')}" placeholder="${ep||'https://&lt;проєкт&gt;.supabase.co/functions/v1/ai-evaluate-tire'}">
      <button class="btn btn-dark btn-sm mt" onclick="taiAiSaveEndpoint()">💾 Зберегти endpoint</button>
      <div style="font-size:.74rem;color:var(--text-dim);margin-top:6px">${ep?('Поточний: '+ep):'Не налаштовано — розгорни Edge Function (файл ai-evaluate-tire.ts).'}</div>
    </details>
  </div>
  <div id="aiResult"></div>`;
}
async function taiAiEvaluate(){
  const ta=document.getElementById('aiText'); const text=ta?ta.value.trim():'';
  if(!text){ alert('Введіть опис шини'); return; }
  const ep=taiAiEndpoint(); const st=document.getElementById('aiStatus');
  if(!ep){ if(st) st.innerHTML='⚠️ Endpoint не налаштовано. Розгорни Edge Function або натисни «Розібрати локально».'; return; }
  if(st) st.textContent='⏳ AI оцінює…';
  try{
    const headers={'Content-Type':'application/json'};
    headers['x-app-key']=aiAppKey();
    const k=(typeof SUPA_CFG!=='undefined'&&SUPA_CFG.key)?SUPA_CFG.key():''; // публічний anon-ключ (безпечно)
    if(k){ headers['Authorization']='Bearer '+k; headers['apikey']=k; }
    const res=await fetch(ep,{method:'POST',headers,body:JSON.stringify({text})});
    let data=null; try{ data=await res.json(); }catch(_){ }
    if(!res.ok){ const dt=data?((data.error||'')+(data.detail?(' — '+(''+data.detail).slice(0,400)):'')):('HTTP '+res.status); throw new Error(dt||('HTTP '+res.status)); }
    taiAiRenderResult(data,text,false);
    if(st) st.textContent='';
    aiLogs.push({id:uid(),type:'ai-evaluate',input:text.slice(0,200),output:JSON.stringify(data).slice(0,300),createdAt:Date.now()}); save('aiLogs',aiLogs);
  }catch(e){ if(st) st.innerHTML='❌ '+e.message+'. Перевір endpoint або скористайся локальним розбором.'; }
}
// локальний розбір без AI (regex) — щоб працювало одразу, поки бекенд не готовий
function taiAiLocalParse(){
  const ta=document.getElementById('aiText'); const text=ta?ta.value.trim():'';
  if(!text){ alert('Введіть опис шини'); return; }
  const size=((text.match(/\d{3}\/\d{2}\s?R?\s?\d{2}(?:\.\d)?/i)||[''])[0]||'').replace(/\s+/g,'');
  const year=parseInt((text.match(/\b(19|20)\d{2}\b/)||[''])[0])||0;
  const tread=parseFloat(((text.match(/(\d{1,2}(?:[.,]\d)?)\s?мм/i)||[,0])[1]+'').replace(',','.'))||0;
  const brand=((text.match(/\b(Michelin|Bridgestone|Goodyear|Continental|Hankook|Nokian|Pirelli|Dunlop|Yokohama|Toyo|Kumho|Barum|Rosava|Matador|Agate|Triangle|Aeolus|Sailun|Doublecoin)\b/i)||[''])[0])||((text.match(/^([A-ZА-ЯІЇЄ][\wа-яіїє]{2,})/)||[,''])[1]||'');
  const rm=(text.match(/(\d+)\s*ремонт/i)||[,''])[1];
  const side=/боковина\s*(ціла|добр)/i.test(text)?'добра':(/(погана|пошкодж|тріщин)/i.test(text)?'погана':'');
  taiAiRenderResult({
    brand:brand||'',size:size||'',year:year||0,tread_mm:tread||0,
    repairs:rm?(rm+' ремонт(и)'):'',condition_score:0,risk:'',
    max_buy_price:0,recommended_sell_price_min:0,recommended_sell_price_max:0,
    decision:'',comment:'Локальний розбір (без AI). Перевірте дані, ціну можна порахувати в калькуляторі.',_sidewall:side
  },text,false);
}
function taiAiRenderResult(d,text,edit){
  window._taiAiResult={d,text};
  const el=document.getElementById('aiResult'); if(!el) return;
  const dec=(d.decision||''); const decCls=/не\s*купув/i.test(dec)?'red':(/торг/i.test(dec)?'yellow':(/купув/i.test(dec)?'green':'yellow'));
  if(edit){
    const num=['year','tread_mm','condition_score','max_buy_price','recommended_sell_price_min','recommended_sell_price_max'];
    const F=(label,key)=>{ const isN=num.indexOf(key)>-1; return `<div><label>${label}</label><input ${isN?'type="number"':''} value="${(''+(d[key]==null?'':d[key])).replace(/"/g,'&quot;')}" oninput="window._taiAiResult.d['${key}']=this.${isN?'value===\'\'?0:(+this.value||0)':'value'}"></div>`; };
    el.innerHTML=`<div class="card mt"><h3 style="margin-bottom:8px">✏️ Редагування оцінки</h3>
      <div class="tai-grid">
        ${F('Бренд','brand')}${F('Розмір','size')}${F('Рік','year')}${F('Протектор, мм','tread_mm')}
        ${F('Ремонти','repairs')}${F('Оцінка стану','condition_score')}${F('Ризик','risk')}${F('Рішення','decision')}
        ${F('Макс. покупка, ₴','max_buy_price')}${F('Продаж від, ₴','recommended_sell_price_min')}${F('Продаж до, ₴','recommended_sell_price_max')}
        <div class="full"><label>Коментар</label><input value="${(''+(d.comment||'')).replace(/"/g,'&quot;')}" oninput="window._taiAiResult.d['comment']=this.value"></div>
      </div>
      <div class="gap-btns mt">
        <button class="btn btn-green" onclick="taiAiRenderResult(window._taiAiResult.d,window._taiAiResult.text,false)">✅ Готово</button>
        <button class="btn btn-dark" onclick="taiAiAddToStock()">＋ Додати в склад</button>
      </div></div>`;
    return;
  }
  el.innerHTML=`<div class="card mt">
    <div class="tai-decision tai-dec-${decCls}">${dec||'Оцінка готова'}</div>
    <div style="font-weight:700;margin-top:8px">${[d.brand,d.size].filter(Boolean).join(' ')||'—'} ${d.year?('· '+d.year):''}</div>
    <div class="tai-res mt">
      <div class="tai-metric"><div class="v">${d.tread_mm||0} мм</div><div class="l">Протектор</div></div>
      <div class="tai-metric"><div class="v">${d.condition_score||0}</div><div class="l">Оцінка стану</div></div>
      <div class="tai-metric"><div class="v">${fmtMoney(d.max_buy_price||0)}</div><div class="l">Макс. покупка</div></div>
      <div class="tai-metric"><div class="v">${fmtMoney(d.recommended_sell_price_min||0)}–${fmtMoney(d.recommended_sell_price_max||0)}</div><div class="l">Реком. продаж</div></div>
    </div>
    <div class="tai-metric full mt" style="margin-top:10px">
      ${d.risk?`<div style="font-size:.84rem">⚠️ Ризик: ${d.risk}</div>`:''}
      ${d.repairs?`<div style="font-size:.84rem">🔧 Ремонти: ${d.repairs}</div>`:''}
      ${d.comment?`<div style="font-size:.82rem;color:var(--text-dim);margin-top:4px">${d.comment}</div>`:''}
    </div>
    <div class="gap-btns mt" style="margin-top:12px">
      <button class="btn btn-green" onclick="taiAiAddToStock()">＋ Додати в склад</button>
      <button class="btn btn-dark" onclick="taiAiRenderResult(window._taiAiResult.d,window._taiAiResult.text,true)">✏️ Редагувати</button>
      <button class="btn btn-dark" onclick="taiAiCancel()">Скасувати</button>
    </div>
  </div>`;
}
function taiAiCancel(){ window._taiAiResult=null; const el=document.getElementById('aiResult'); if(el) el.innerHTML=''; }
function taiAiMapToTire(d){
  const notes=[
    'AI'+(d.decision?': '+d.decision:''),
    d.risk?('ризик: '+d.risk):'',
    d.condition_score?('стан: '+d.condition_score):'',
    d.repairs?('ремонти: '+d.repairs):'',
    (d.recommended_sell_price_min||d.recommended_sell_price_max)?('продаж '+(d.recommended_sell_price_min||0)+'–'+(d.recommended_sell_price_max||0)):'',
    d.comment||''
  ].filter(Boolean).join(' · ');
  return {
    dealType:'куплено', size:d.size||'', brand:d.brand||'', model:'', dotYear:d.year?(''+d.year):'',
    treadMm:d.tread_mm||0, treadPercent:0, sidewallCond:d._sidewall||'',
    purchasePrice:d.max_buy_price||0, recommendedSalePrice:d.recommended_sell_price_min||d.recommended_sell_price_max||0,
    status:'в наявності', source:'AI оцінка', notes:notes, photo:''
  };
}
// «Додати в склад» = відкрити форму ПІДТВЕРДЖЕННЯ (AI сам не пише в базу)
function taiAiAddToStock(){ if(!window._taiAiResult) return; taiUsedTireModal(null, taiAiMapToTire(window._taiAiResult.d)); }

// ==================== 🧠 AI TOOLS — окремий модуль (Етап 1: каркас) ====================
// Повністю відокремлено від CRM. Тільки ручний запуск. Жодних фонових процесів/автозапусків.
(function aiToolsInjectStyle(){
  if(document.getElementById('ai-tools-style')) return;
  const s=document.createElement('style'); s.id='ai-tools-style';
  s.textContent=`
  .ai-tools-wrap{padding-bottom:24px}
  .ai-tools-hero{position:relative;border-radius:20px;padding:18px 18px 16px;margin-bottom:16px;overflow:hidden;
    background:linear-gradient(135deg,rgba(232,31,41,.18),rgba(20,20,24,.6));
    border:1px solid rgba(255,255,255,.08);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
    box-shadow:0 10px 40px rgba(0,0,0,.45)}
  .ai-tools-hero h2{font-family:'Oswald';font-size:1.5rem;margin:0;letter-spacing:.5px}
  .ai-tools-hero p{margin:6px 0 0;font-size:.82rem;color:var(--text-dim)}
  .ai-tools-badge{display:inline-block;margin-top:8px;font-size:.7rem;font-weight:700;color:#9fe6b0;
    background:rgba(67,160,71,.16);border:1px solid rgba(67,160,71,.4);padding:3px 10px;border-radius:999px}
  .ai-tools-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
  @media(max-width:560px){.ai-tools-grid{grid-template-columns:1fr}}
  .ai-tools-card{position:relative;border-radius:18px;padding:16px;cursor:pointer;
    background:linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.02));
    border:1px solid rgba(255,255,255,.09);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
    box-shadow:0 6px 22px rgba(0,0,0,.4);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
  .ai-tools-card:hover{transform:translateY(-3px);border-color:var(--red);box-shadow:0 12px 30px rgba(232,31,41,.25)}
  .ai-tools-card:active{transform:translateY(-1px) scale(.99)}
  .ai-tools-ic{font-size:2.1rem;line-height:1;filter:drop-shadow(0 4px 8px rgba(0,0,0,.5))}
  .ai-tools-card h3{font-family:'Oswald';font-size:1.05rem;margin:10px 0 4px}
  .ai-tools-card .d{font-size:.76rem;color:var(--text-dim);line-height:1.3;min-height:32px}
  .ai-tools-run{margin-top:12px;width:100%;border:none;border-radius:12px;padding:11px;font-weight:700;font-size:.88rem;
    color:#fff;cursor:pointer;background:linear-gradient(135deg,var(--red),#b5141d);box-shadow:0 4px 14px rgba(232,31,41,.4)}
  .ai-tools-run.soon{background:linear-gradient(135deg,#3a3a42,#26262c);box-shadow:none;color:#bdbdc6}
  .ai-tools-stage{position:absolute;top:12px;right:12px;font-size:.64rem;font-weight:700;letter-spacing:.4px;
    padding:2px 8px;border-radius:999px;background:rgba(240,169,43,.16);color:#f0a92b;border:1px solid rgba(240,169,43,.4)}
  .ai-tools-stage.ready{background:rgba(67,160,71,.16);color:#66bb6a;border-color:rgba(67,160,71,.4)}
  `;
  document.head.appendChild(s);
})();

const AI_TOOLS_MODULES=[
  {key:'scan',   ic:'📷', title:'AI Сканер шини',     d:'Аналіз 1–4 фото: марка, розмір, DOT, протектор, ремонти, стан, рішення.', stage:4},
  {key:'evaluate',ic:'💰',title:'AI Оцінка Б/У шини', d:'Ручна форма: стан 0–10, ризик, ліквідність, ціни покупки/продажу, прибуток.', stage:2},
  {key:'bargain',ic:'🔥', title:'AI Помічник торгу',  d:'Генерує готові аргументи для торгу з продавцем + копіювання.', stage:3},
  {key:'search', ic:'🗺', title:'AI Пошук шин',       d:'Пошук по Україні: OLX, Prom, Telegram, постачальники, склад.', stage:4},
  {key:'analytics',ic:'📈',title:'AI Бізнес-аналітика',d:'Прибуток, топ-бренди, середній прибуток, що закупити.', stage:4},
  {key:'voice',  ic:'🎙', title:'Голосовий помічник', d:'Голосом → заказ-наряд. Запуск тільки по кнопці «Слухати».', stage:4},
];

function renderAiTools(){
  const b=document.getElementById('aiToolsBody'); if(!b) return;
  gtEnsureDatalists();
  b.innerHTML=`
  <div class="ai-tools-wrap">
    <div class="ai-tools-hero">
      <h2>🧠 AI Tools</h2>
      <p>Окремий набір AI-інструментів. Працюють <b>тільки вручну</b> — жодних фонових процесів, автозапуску чи моніторингу. CRM (заказ-наряди, клієнти, склад, фінанси) не зачіпається.</p>
      <span class="ai-tools-badge">Етап 1 — каркас готовий</span>
    </div>
    <div class="ai-tools-grid">
      ${AI_TOOLS_MODULES.map(m=>`
        <div class="ai-tools-card" onclick="aiToolsOpen('${m.key}')">
          <span class="ai-tools-stage${m.stage===1?' ready':''}">Етап ${m.stage}</span>
          <div class="ai-tools-ic">${m.ic}</div>
          <h3>${m.title}</h3>
          <div class="d">${m.d}</div>
          <button class="ai-tools-run soon" onclick="event.stopPropagation();aiToolsOpen('${m.key}')">▶ Відкрити</button>
        </div>`).join('')}
    </div>
  </div>`;
}
function aiToolsOpen(key){
  const m=AI_TOOLS_MODULES.find(x=>x.key===key); if(!m) return;
  if(key==='evaluate'){ renderAiToolsEval(); return; }
  if(key==='bargain'){ renderAiToolsBargain(); return; }
  if(key==='analytics'){ renderAiToolsAnalytics(); return; }
  if(key==='search'){ renderAiToolsSearch(); return; }
  if(key==='voice'){ renderAiToolsVoice(); return; }
  if(key==='scan'){ renderAiToolsScan(); return; }
  openModal(`<div style="text-align:center">
    <div style="font-size:2.4rem">${m.ic}</div>
    <h3 style="margin:8px 0 4px">${m.title}</h3>
    <p style="font-size:.85rem;color:var(--text-dim)">${m.d}</p>
    <div style="margin-top:12px;font-size:.8rem;background:rgba(240,169,43,.12);border:1px solid rgba(240,169,43,.35);border-radius:12px;padding:10px;color:#f0a92b">
      Каркас AI Tools готовий (Етап 1). Цей модуль буде підключено в <b>Етапі ${m.stage}</b> — окремо й безпечно, без впливу на CRM.
    </div>
    <div class="gap-btns mt" style="justify-content:center"><button class="btn btn-dark" onclick="closeModal()">Зрозуміло</button></div>
  </div>`);
}

// ==================== 🧠 AI TOOLS — ЕТАП 2: Оцінка Б/У шини (локально, без API) ====================
function aiToolsDotYear(v){
  v=(''+(v||'')).trim(); if(!v) return null;
  if(/^\d{4}$/.test(v)){ const n=+v; if(n>=1990&&n<=2100) return n; return 2000+(+v.slice(2)); }
  if(/^\d{1,2}$/.test(v)){ return 2000+(+v); }
  const m=v.match(/\d{4}/); if(m) return aiToolsDotYear(m[0]);
  return null;
}
function aiToolsEvalLogic(d){
  const tread=Math.max(0,Math.min(100,+d.treadPercent||0));
  const ask=+d.askPrice||0, repairs=+d.repairs||0;
  const year=aiToolsDotYear(d.dot); const age=year?(new Date().getFullYear()-year):null;
  // стан 0–10
  let score=tread/10;
  if(age!=null){ if(age>8) score-=3; else if(age>5) score-=2; else if(age>3) score-=1; }
  score-=repairs*0.6;
  score=Math.max(0,Math.min(10,Math.round(score*10)/10));
  // ризик / ліквідність
  let risk = score>=7?'низький':(score>=4?'середній':'високий'); if(repairs>=3) risk='високий';
  let liq  = score>=7?'висока':(score>=4?'середня':'низька');
  // ціни (анкер — ціна продавця)
  const buyFactor = score>=8?0.70:(score>=6?0.62:(score>=4?0.55:0.45));
  const repPen=repairs*400;
  let recBuy=Math.max(0,Math.round(ask*buyFactor)-repPen);
  let maxBuy=Math.max(0,Math.min(ask,Math.round(ask*(buyFactor+0.08))-repPen));
  if(maxBuy<recBuy) maxBuy=recBuy;
  let recSell=ask;
  let profit=recSell-recBuy;
  let decision,dcls;
  if(score<3 || maxBuy<=0){ decision='🔴 Не рекомендується'; dcls='red'; }
  else if(score>=7 && risk!=='високий'){ decision='🟢 Купувати'; dcls='green'; }
  else { decision='🟡 Можна торгуватися'; dcls='yellow'; }
  return {score,risk,liq,recBuy,maxBuy,recSell,profit,ask,decision,dcls,age,tread,repairs};
}
function renderAiToolsEval(){
  const b=document.getElementById('aiToolsBody'); if(!b) return;
  b.innerHTML=`
  <div class="ai-tools-wrap">
    <div class="ai-tools-hero" style="background:linear-gradient(135deg,rgba(67,160,71,.18),rgba(20,20,24,.6))">
      <button class="btn btn-dark btn-sm" onclick="renderAiTools()" style="margin-bottom:8px">← AI Tools</button>
      <h2>💰 AI Оцінка Б/У шини</h2>
      <p>Ручна оцінка, локально (без API). Введи дані — отримаєш стан, ризик, ліквідність, ціни й прибуток.</p>
    </div>
    <div class="ai-tools-card" style="cursor:default">
      <div class="tai-grid">
        <div class="full"><label>Виробник</label><input id="aeBrand" list="gtBrands" placeholder="Michelin"></div>
        <div><label>Розмір *</label><input id="aeSize" placeholder="385/65 R22.5"></div>
        <div><label>DOT / рік</label><input id="aeDot" placeholder="2021 або 3521"></div>
        <div><label>Залишок протектора, % *</label><input id="aeTread" type="number" inputmode="numeric" placeholder="70"></div>
        <div><label>Кількість ремонтів</label><input id="aeRep" type="number" inputmode="numeric" value="0"></div>
        <div class="full"><label>Ціна продавця, ₴ *</label><input id="aeAsk" type="number" inputmode="numeric" placeholder="5000"></div>
      </div>
      <button class="ai-tools-run" style="margin-top:14px" onclick="aiToolsRunEval()">▶ Аналізувати</button>
    </div>
    <div id="aiEvalResult"></div>
  </div>`;
}
function aiToolsRunEval(){
  const g=id=>{const e=document.getElementById(id);return e?e.value.trim():'';};
  const n=id=>parseInt((document.getElementById(id)||{}).value)||0;
  const d={brand:g('aeBrand'),size:g('aeSize'),dot:g('aeDot'),treadPercent:n('aeTread'),repairs:n('aeRep'),askPrice:n('aeAsk')};
  if(!d.size||!d.treadPercent||!d.askPrice){ alert('Заповніть: розмір, залишок протектора (%) і ціну продавця'); return; }
  const r=aiToolsEvalLogic(d); window._aiEvalLast={d,r};
  const el=document.getElementById('aiEvalResult'); if(!el) return;
  el.innerHTML=`
  <div class="ai-tools-card" style="cursor:default;margin-top:12px">
    <div class="tai-decision tai-dec-${r.dcls}">${r.decision}</div>
    <div class="tai-res mt">
      <div class="tai-metric"><div class="v">${r.score}/10</div><div class="l">Стан</div></div>
      <div class="tai-metric"><div class="v">${r.risk}</div><div class="l">Ризик</div></div>
      <div class="tai-metric"><div class="v">${r.liq}</div><div class="l">Ліквідність</div></div>
      <div class="tai-metric"><div class="v">${r.tread}%</div><div class="l">Протектор${r.age!=null?' · '+r.age+'р':''}</div></div>
      <div class="tai-metric"><div class="v">${fmtMoney(r.recBuy)}</div><div class="l">Реком. покупка</div></div>
      <div class="tai-metric"><div class="v">${fmtMoney(r.maxBuy)}</div><div class="l">Макс. покупка</div></div>
      <div class="tai-metric"><div class="v">${fmtMoney(r.recSell)}</div><div class="l">Реком. продаж</div></div>
      <div class="tai-metric"><div class="v" style="color:${r.profit>=0?'var(--green)':'var(--accent)'}">${fmtMoney(r.profit)}</div><div class="l">Очік. прибуток</div></div>
    </div>
    <div class="tai-metric full mt" style="margin-top:10px">
      <div style="font-size:.82rem">Ціна продавця: ${fmtMoney(r.ask)}. ${r.ask<=r.recBuy?'Вже у межах рекомендованої — можна брати.':'Торгуйся до '+fmtMoney(r.recBuy)+' (макс '+fmtMoney(r.maxBuy)+').'}</div>
    </div>
    <div class="gap-btns mt" style="margin-top:12px">
      <button class="btn btn-green" onclick="aiToolsEvalAddStock()">＋ Додати в склад</button>
      <button class="btn btn-dark" onclick="renderAiToolsEval()">Очистити</button>
    </div>
  </div>`;
}
function aiToolsEvalAddStock(){
  if(!window._aiEvalLast || typeof taiUsedTireModal!=='function'){ return; }
  const {d,r}=window._aiEvalLast;
  const notes=`AI Tools оцінка: стан ${r.score}/10, ризик ${r.risk}, ліквідність ${r.liq}. Ціна продавця ${r.ask}₴.`;
  taiUsedTireModal(null,{
    dealType:'куплено', size:d.size, brand:d.brand, model:'', dotYear:d.dot,
    treadPercent:d.treadPercent, sidewallCond:'',
    purchasePrice:r.recBuy, recommendedSalePrice:r.recSell,
    status:'в наявності', source:'AI Tools оцінка', notes
  });
}

// ==================== 🧠 AI TOOLS — ЕТАП 3: Помічник торгу (локально) ====================
function renderAiToolsBargain(){
  const b=document.getElementById('aiToolsBody'); if(!b) return;
  const e=window._aiEvalLast; // підтягнути з останньої оцінки, якщо є
  const pre=(id,v)=>v?` value="${(''+v).replace(/"/g,'&quot;')}"`:'';
  b.innerHTML=`
  <div class="ai-tools-wrap">
    <div class="ai-tools-hero" style="background:linear-gradient(135deg,rgba(232,31,41,.2),rgba(20,20,24,.6))">
      <button class="btn btn-dark btn-sm" onclick="renderAiTools()" style="margin-bottom:8px">← AI Tools</button>
      <h2>🔥 AI Помічник торгу</h2>
      <p>Введи дані шини й свою ціну — отримаєш готові варіанти повідомлень продавцю. Копіюй і відправляй.</p>
    </div>
    <div class="ai-tools-card" style="cursor:default">
      <div class="tai-grid">
        <div><label>Рік / DOT</label><input id="abYear"${pre('abYear',e&&e.d.dot)}></div>
        <div><label>Залишок протектора</label><input id="abTread" placeholder="11 мм або 70%"${pre('abTread',e&&(e.d.treadPercent?e.d.treadPercent+'%':''))}></div>
        <div><label>Кількість ремонтів</label><input id="abRep" type="number" inputmode="numeric" value="${e?e.d.repairs:0}"></div>
        <div><label>Кількість шт</label><input id="abQty" type="number" inputmode="numeric" value="1"></div>
        <div><label>Ціна продавця, ₴</label><input id="abAsk" type="number" inputmode="numeric"${pre('abAsk',e&&e.d.askPrice)}></div>
        <div><label>Твоя ціна, ₴</label><input id="abOffer" type="number" inputmode="numeric"${pre('abOffer',e&&e.r.recBuy)}></div>
      </div>
      <button class="ai-tools-run" style="margin-top:14px" onclick="aiToolsGenBargain()">▶ Згенерувати аргументи</button>
    </div>
    <div id="aiBargainResult"></div>
  </div>`;
}
function aiToolsGenBargain(){
  const g=id=>{const x=document.getElementById(id);return x?x.value.trim():'';};
  const n=id=>parseInt((document.getElementById(id)||{}).value)||0;
  const year=g('abYear'), tread=g('abTread'), rep=n('abRep'), qty=n('abQty')||1, ask=n('abAsk');
  let offer=n('abOffer');
  if(!offer && ask){ offer=Math.round(ask*0.7); }
  if(!offer){ alert('Вкажи свою ціну (або ціну продавця — підкажу ~70%)'); return; }

  // факти-аргументи
  const facts=[];
  if(year) facts.push('шина '+year+' року');
  if(tread) facts.push('залишок протектора '+tread);
  if(rep>0) facts.push(rep+(rep===1?' ремонт':(rep<5?' ремонти':' ремонтів')));
  const F = facts.length ? (facts.join(', ').charAt(0).toUpperCase()+facts.join(', ').slice(1)) : '';
  const qtyTxt = qty>1 ? (' комплект '+qty+' шт') : '';

  const variants=[
    {label:'Ввічливий', text:
      (F?F+'. ':'')+`З урахуванням стану готовий взяти за ${offer} грн. Якщо домовимось — заберу сьогодні, гроші готівкою.`},
    {label:'Твердий', text:
      (F?F+'. ':'')+`Більше ${offer} грн не готовий платити. Ціна фінальна, гроші зараз.`},
    {label:qty>1?'Комплектом':'Швидка угода', text:
      `Цікавить${qtyTxt||' ця шина'}. `+(F?F+'. ':'')+`Якщо віддасте за ${offer} грн — заберу одразу, готівка на руках.`}
  ];
  window._aiBargainTexts=variants.map(v=>v.text);
  const el=document.getElementById('aiBargainResult'); if(!el) return;
  el.innerHTML=`<div style="margin-top:6px">${variants.map((v,i)=>`
    <div class="ai-tools-card" style="cursor:default;margin-top:12px">
      <div style="font-family:'Oswald';color:var(--red-light);margin-bottom:6px">${v.label}</div>
      <div style="font-size:.9rem;line-height:1.4">${v.text}</div>
      <button class="btn btn-dark btn-sm mt" style="margin-top:10px" onclick="aiToolsCopyBargain(${i},this)">📋 Копіювати</button>
    </div>`).join('')}
    ${ask&&offer?`<div style="font-size:.76rem;color:var(--text-dim);margin-top:8px">Продавець просить ${fmtMoney(ask)}, твоя ціна ${fmtMoney(offer)} — це ${Math.round(offer/ask*100)}% від запиту.</div>`:''}</div>`;
}
function aiToolsCopyBargain(i,btn){
  const t=(window._aiBargainTexts||[])[i]; if(t==null) return;
  try{ navigator.clipboard.writeText(t); }catch(e){}
  if(btn){ const o=btn.textContent; btn.textContent='✅ Скопійовано'; setTimeout(()=>{btn.textContent=o;},1500); }
}

// ==================== 🧠 AI TOOLS — ЕТАП 4: Аналітика / Пошук / Голос (локально) ====================

// ---------- 📈 Бізнес-аналітика (з даних Складу Б/У) ----------
function aiToolsAnalyticsData(){
  const list=(typeof usedTires!=='undefined')?usedTires:[];
  const sold=list.filter(t=>t.status==='продано');
  const inStock=list.filter(t=>t.status==='в наявності');
  const totalProfit=sold.reduce((s,t)=>s+(typeof taiProfitOf==='function'?taiProfitOf(t):0),0);
  const count=sold.length;
  const avg=count?Math.round(totalProfit/count):0;
  const invStock=inStock.reduce((s,t)=>s+(+t.purchasePrice||0),0);
  const bmap={};
  sold.forEach(t=>{const b=((t.brand||'').trim())||'—'; bmap[b]=bmap[b]||{count:0,profit:0}; bmap[b].count++; bmap[b].profit+=(typeof taiProfitOf==='function'?taiProfitOf(t):0);});
  const topBrands=Object.keys(bmap).map(b=>({brand:b,count:bmap[b].count,profit:bmap[b].profit})).sort((a,b)=>b.profit-a.profit).slice(0,5);
  const now=Date.now();
  const stale=inStock.map(t=>({t,days:Math.floor((now-(t.createdAt||now))/86400000)})).sort((a,b)=>b.days-a.days).slice(0,5);
  const inStockBrands={}; inStock.forEach(t=>{inStockBrands[((t.brand||'').trim().toLowerCase())]=1;});
  const restock=topBrands.filter(b=>!inStockBrands[b.brand.toLowerCase()]).slice(0,3);
  return {totalProfit,count,avg,invStock,topBrands,stale,restock,stockCount:inStock.length,allCount:list.length};
}
function renderAiToolsAnalytics(){
  const b=document.getElementById('aiToolsBody'); if(!b) return;
  const a=aiToolsAnalyticsData();
  const money=fmtMoney;
  let body;
  if(!a.allCount){ body=`<div class="ai-tools-card" style="cursor:default">Поки немає даних. Додавай шини у <b>Склад Б/У</b> і відмічай продані — тут зʼявиться аналітика прибутку.</div>`; }
  else body=`
    <div class="tai-res">
      <div class="tai-metric"><div class="v">${money(a.totalProfit)}</div><div class="l">Прибуток (продано)</div></div>
      <div class="tai-metric"><div class="v">${a.count}</div><div class="l">Продано шин</div></div>
      <div class="tai-metric"><div class="v">${money(a.avg)}</div><div class="l">Середній прибуток</div></div>
      <div class="tai-metric"><div class="v">${money(a.invStock)}</div><div class="l">Вкладено (в наявн.)</div></div>
    </div>
    <div class="ai-tools-card" style="cursor:default;margin-top:12px">
      <div style="font-family:'Oswald';color:var(--red-light);margin-bottom:6px">🏆 Найприбутковіші бренди</div>
      ${a.topBrands.length?a.topBrands.map(x=>`<div style="display:flex;justify-content:space-between;font-size:.85rem;padding:3px 0"><span>${x.brand} <span style="color:var(--text-dim)">×${x.count}</span></span><b style="color:var(--green)">${money(x.profit)}</b></div>`).join(''):'<div style="color:var(--text-dim);font-size:.85rem">Поки немає продажів.</div>'}
    </div>
    <div class="ai-tools-card" style="cursor:default;margin-top:12px">
      <div style="font-family:'Oswald';color:var(--red-light);margin-bottom:6px">🐌 Довго лежить (в наявності)</div>
      ${a.stale.length?a.stale.map(x=>`<div style="display:flex;justify-content:space-between;font-size:.85rem;padding:3px 0"><span>${[x.t.brand,x.t.size].filter(Boolean).join(' ')||'—'}</span><span style="color:${x.days>30?'var(--accent)':'var(--text-dim)'}">${x.days} дн</span></div>`).join(''):'<div style="color:var(--text-dim);font-size:.85rem">Складу немає.</div>'}
    </div>
    <div class="ai-tools-card" style="cursor:default;margin-top:12px">
      <div style="font-family:'Oswald';color:var(--red-light);margin-bottom:6px">🛒 Варто закупити (добре продавалось, нема в наявності)</div>
      ${a.restock.length?a.restock.map(x=>`<div style="font-size:.85rem;padding:3px 0">${x.brand} <span style="color:var(--text-dim)">— приносив ${money(x.profit)} з ${x.count} шт</span></div>`).join(''):'<div style="color:var(--text-dim);font-size:.85rem">Достатньо асортименту або мало даних.</div>'}
    </div>`;
  b.innerHTML=`<div class="ai-tools-wrap">
    <div class="ai-tools-hero" style="background:linear-gradient(135deg,rgba(58,123,255,.18),rgba(20,20,24,.6))">
      <button class="btn btn-dark btn-sm" onclick="renderAiTools()" style="margin-bottom:8px">← AI Tools</button>
      <h2>📈 AI Бізнес-аналітика</h2>
      <p>Аналіз твого Складу Б/У: прибуток, топ-бренди, що залежалось, що варто докупити. Лише по кнопці, без фону.</p>
    </div>${body}
  </div>`;
}

// ---------- 🗺 Пошук шин (готові посилання, без парсингу) ----------
function renderAiToolsSearch(){
  const b=document.getElementById('aiToolsBody'); if(!b) return;
  b.innerHTML=`<div class="ai-tools-wrap">
    <div class="ai-tools-hero" style="background:linear-gradient(135deg,rgba(240,169,43,.18),rgba(20,20,24,.6))">
      <button class="btn btn-dark btn-sm" onclick="renderAiTools()" style="margin-bottom:8px">← AI Tools</button>
      <h2>🗺 AI Пошук шин</h2>
      <p>Введи бренд і розмір — відкрию пошук на майданчиках України та покажу збіги у твоєму складі. Без автопарсингу й фону.</p>
    </div>
    <div class="ai-tools-card" style="cursor:default">
      <div class="tai-grid">
        <div><label>Бренд</label><input id="asBrand" list="gtBrands" placeholder="Michelin"></div>
        <div><label>Розмір *</label><input id="asSize" placeholder="385/65 R22.5"></div>
      </div>
      <button class="ai-tools-run" style="margin-top:14px" onclick="aiToolsSearchGo()">▶ Знайти</button>
    </div>
    <div id="aiSearchResult"></div>
  </div>`;
}
function aiToolsSearchGo(){
  const brand=(document.getElementById('asBrand')||{}).value||'';
  const size=(document.getElementById('asSize')||{}).value||'';
  const term=(brand+' '+size).trim();
  if(!size.trim()){ alert('Вкажи хоча б розмір'); return; }
  const q=encodeURIComponent(term);
  const sites=[
    {n:'OLX',u:'https://www.olx.ua/uk/list/q-'+q+'/'},
    {n:'Prom',u:'https://prom.ua/ua/search?search_term='+q},
    {n:'Rozetka',u:'https://rozetka.com.ua/ua/search/?text='+q},
    {n:'Telegram (через Google)',u:'https://www.google.com/search?q='+q+'+%D1%88%D0%B8%D0%BD%D0%B8+site:t.me'},
    {n:'Google Shopping',u:'https://www.google.com/search?q='+q+'+%D1%88%D0%B8%D0%BD%D0%B0+%D0%BA%D1%83%D0%BF%D0%B8%D1%82%D0%B8'}
  ];
  // власний склад
  const norm=s=>(s||'').toString().toLowerCase().replace(/\s+/g,' ').trim();
  const ns=norm(size), nb=norm(brand);
  const own=[];
  if(typeof usedTires!=='undefined') usedTires.forEach(t=>{ if(norm(t.size).indexOf(ns)>-1 && (!nb||norm(t.brand).indexOf(nb)>-1)) own.push({src:'Б/У',t}); });
  if(typeof tires!=='undefined') tires.forEach(t=>{ if(norm(t.size).indexOf(ns)>-1 && (!nb||norm(t.brand).indexOf(nb)>-1)) own.push({src:'склад',t}); });
  const el=document.getElementById('aiSearchResult'); if(!el) return;
  el.innerHTML=`
    <div class="ai-tools-card" style="cursor:default;margin-top:12px">
      <div style="font-family:'Oswald';color:var(--red-light);margin-bottom:8px">🔗 Відкрити пошук «${term}»</div>
      ${sites.map(s=>`<a href="${s.u}" target="_blank" rel="noopener" class="btn btn-dark" style="display:block;text-align:left;margin-bottom:8px;text-decoration:none">${s.n} ↗</a>`).join('')}
    </div>
    <div class="ai-tools-card" style="cursor:default;margin-top:12px">
      <div style="font-family:'Oswald';color:var(--red-light);margin-bottom:6px">📦 У твоєму складі (${own.length})</div>
      ${own.length?own.map(o=>`<div style="display:flex;justify-content:space-between;font-size:.85rem;padding:3px 0"><span>${[o.t.brand,o.t.model,o.t.size].filter(Boolean).join(' ')}</span><span style="color:var(--text-dim)">${o.src}${o.t.recommendedSalePrice?' · '+fmtMoney(o.t.recommendedSalePrice):(o.t.price?' · '+fmtMoney(o.t.price):'')}</span></div>`).join(''):'<div style="color:var(--text-dim);font-size:.85rem">Збігів немає.</div>'}
    </div>`;
}

// ---------- 🎙 Голосовий помічник (браузерне розпізнавання, локально) ----------
function renderAiToolsVoice(){
  const b=document.getElementById('aiToolsBody'); if(!b) return;
  const supported=('webkitSpeechRecognition' in window)||('SpeechRecognition' in window);
  b.innerHTML=`<div class="ai-tools-wrap">
    <div class="ai-tools-hero" style="background:linear-gradient(135deg,rgba(156,39,176,.2),rgba(20,20,24,.6))">
      <button class="btn btn-dark btn-sm" onclick="renderAiTools()" style="margin-bottom:8px">← AI Tools</button>
      <h2>🎙 Голосовий помічник</h2>
      <p>Натисни «Слухати» і продиктуй заказ. Заказ-наряд створиться лише після твого підтвердження.</p>
    </div>
    <div class="ai-tools-card" style="cursor:default">
      ${supported?'<button class="ai-tools-run" onclick="aiToolsVoiceListen(this)">🎤 Слухати</button>':'<div style="font-size:.8rem;color:var(--accent);margin-bottom:8px">⚠️ Браузер не підтримує мікрофон (часто у Brave). Введи/встав текст вручну нижче.</div>'}
      <label style="margin-top:10px;display:block">Текст заказу</label>
      <textarea id="avText" rows="3" placeholder="напр.: клієнт Іван 0671234567, DAF XF, AA1234BC, шиномонтаж 385/65 R22.5, сума 1200 грн, готівка"></textarea>
      <button class="ai-tools-run" style="margin-top:10px" onclick="aiToolsVoiceRecognize()">▶ Розпізнати</button>
      <div id="avPreview"></div>
    </div>
  </div>`;
}
function aiToolsVoiceListen(btn){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){ alert('Мікрофон недоступний у цьому браузері'); return; }
  const r=new SR(); r.lang='uk-UA'; r.interimResults=false; r.maxAlternatives=1;
  if(btn){ btn.textContent='🔴 Слухаю…'; }
  r.onresult=e=>{ const t=e.results[0][0].transcript; const ta=document.getElementById('avText'); if(ta) ta.value=t; aiToolsVoiceRecognize(); };
  r.onerror=()=>{ if(btn) btn.textContent='🎤 Слухати'; };
  r.onend=()=>{ if(btn) btn.textContent='🎤 Слухати'; };
  try{ r.start(); }catch(e){ if(btn) btn.textContent='🎤 Слухати'; }
}
function aiToolsVoiceParse(text){
  const o={notes:text};
  const phone=(text.match(/(?:\+?38)?0\d{9}/)||[''])[0]; if(phone) o.phone=phone;
  const plate=((text.match(/\b[A-ZА-ЯІЇЄ]{2}\s?\d{4}\s?[A-ZА-ЯІЇЄ]{2}\b/i)||[''])[0]||'').replace(/\s/g,''); if(plate&&plate.length>=6) o.plate=plate.toUpperCase();
  const car=((text.match(/\b(DAF|MAN|Volvo|Scania|Mercedes|Renault|Iveco|МАЗ|КамАЗ|КрАЗ|ГАЗ|Ford|VW|Volkswagen|Toyota|BMW|Audi|Hyundai|Kia)\b[\wА-Яа-я\-]{0,12}/i)||[''])[0]||'').trim(); if(car) o.car=car;
  if(/готівк/i.test(text)) o.paymentType='cash'; else if(/карт|безготів|термінал/i.test(text)) o.paymentType='cashless';
  const cm=text.match(/клієнт[аи]?\s+([А-ЯІЇЄ][а-яіїє'’]+)/i); if(cm) o.client=cm[1];
  const sm=text.match(/(?:сум[аи]|оплат[аи]|на)\D{0,6}(\d{2,6})\s*грн/i)||text.match(/(\d{3,6})\s*грн/i); if(sm) o.sum=parseInt(sm[1]);
  const sz=((text.match(/\d{3}\/\d{2}\s?R?\s?\d{2}(?:\.\d)?/i)||[''])[0]||'').replace(/\s+/g,''); if(sz) o.size=sz;
  return o;
}
function aiToolsVoiceRecognize(){
  const text=(document.getElementById('avText')||{}).value||'';
  if(!text.trim()){ alert('Введи або продиктуй текст заказу'); return; }
  const o=aiToolsVoiceParse(text); window._aiVoiceParsed=o;
  const row=(k,v)=>v?`<div style="display:flex;justify-content:space-between;font-size:.85rem;padding:2px 0"><span style="color:var(--text-dim)">${k}</span><b>${v}</b></div>`:'';
  const pay=o.paymentType==='cash'?'Готівка':(o.paymentType==='cashless'?'Безготівка':'');
  const el=document.getElementById('avPreview'); if(!el) return;
  el.innerHTML=`<div class="ai-tools-card" style="cursor:default;margin-top:12px">
    <div style="font-family:'Oswald';color:var(--red-light);margin-bottom:6px">Розпізнано (перевір і виправ у заказі)</div>
    ${row('Клієнт',o.client)||'<div style="font-size:.8rem;color:var(--text-dim)">Імʼя не розпізнано</div>'}
    ${row('Телефон',o.phone)}${row('Авто',o.car)}${row('Держномер',o.plate)}${row('Розмір',o.size)}${row('Сума',o.sum?o.sum+'₴':'')}${row('Оплата',pay)}
    <div style="font-size:.78rem;color:var(--text-dim);margin-top:6px">Послуги додаси в заказ-наряді вручну.</div>
    <button class="ai-tools-run" style="margin-top:10px" onclick="aiToolsVoiceToOrder()">▶ Створити заказ-наряд</button>
  </div>`;
}
function aiToolsVoiceToOrder(){
  const o=window._aiVoiceParsed; if(!o){ return; }
  if(typeof openNewOrder!=='function'){ alert('Форма заказу недоступна'); return; }
  openNewOrder();
  const set=(id,v)=>{const e=document.getElementById(id); if(e&&v!=null&&v!=='') e.value=v;};
  set('oClient',o.client||''); set('oPhone',o.phone||''); set('oCar',o.car||''); set('oPlate',o.plate||'');
  if(o.paymentType){ const pt=document.getElementById('oPayType'); if(pt) pt.value=o.paymentType; }
  set('oPaid',o.sum||''); set('oNotes',o.notes||'');
}

// ==================== 🧠 AI TOOLS — 📷 Сканер шини (Vision, через бекенд) ====================
function aiToolsScanEndpoint(){
  const saved=loadVal('scanEndpoint'); if(saved) return saved;
  return 'https://lxeswqlkereptdtwytbp.supabase.co/functions/v1/ai-scan-tire';
}
const AI_SCAN_SLOTS=[['s0','Протектор'],['s1','Боковина'],['s2','DOT'],['s3','Внутрішня']];
function renderAiToolsScan(){
  const b=document.getElementById('aiToolsBody'); if(!b) return;
  window._aiScanImgs=window._aiScanImgs||{};
  b.innerHTML=`<div class="ai-tools-wrap">
    <div class="ai-tools-hero" style="background:linear-gradient(135deg,rgba(0,150,136,.2),rgba(20,20,24,.6))">
      <button class="btn btn-dark btn-sm" onclick="renderAiTools()" style="margin-bottom:8px">← AI Tools</button>
      <h2>📷 AI Сканер шини</h2>
      <p>Завантаж 1–4 фото — AI визначить марку, DOT, протектор, стан і дасть оцінку. Запуск тільки по кнопці.</p>
    </div>
    <div class="ai-tools-card" style="cursor:default">
      <div class="ai-tools-grid">
        ${AI_SCAN_SLOTS.map(s=>`
          <label style="cursor:pointer;text-align:center">
            <div id="thumb_${s[0]}" style="height:90px;border-radius:12px;border:1px dashed rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;background-size:cover;background-position:center;font-size:.78rem;color:var(--text-dim)">＋ ${s[1]}</div>
            <input type="file" accept="image/*" style="display:none" onchange="aiToolsScanPhoto(this,'${s[0]}','${s[1]}')">
          </label>`).join('')}
      </div>
      <button class="ai-tools-run" style="margin-top:14px" onclick="aiToolsScanRun()">▶ Сканувати</button>
      <div id="aiScanStatus" style="font-size:.8rem;color:var(--accent);min-height:18px;margin-top:6px"></div>
    </div>
    <div id="aiScanResult"></div>
  </div>`;
  // restore thumbs
  Object.keys(window._aiScanImgs).forEach(k=>{ const t=document.getElementById('thumb_'+k); if(t&&window._aiScanImgs[k]){ t.style.backgroundImage='url('+window._aiScanImgs[k]+')'; t.textContent=''; } });
}
function aiToolsScanPhoto(input,slot,label){
  const t=document.getElementById('thumb_'+slot); if(t) t.textContent='…';
  taiCompressPhoto(input,dataUrl=>{
    window._aiScanImgs=window._aiScanImgs||{};
    if(dataUrl){ window._aiScanImgs[slot]=dataUrl; if(t){ t.style.backgroundImage='url('+dataUrl+')'; t.textContent=''; } }
    else if(t){ t.textContent='＋ '+label; }
  });
}
async function aiToolsScanRun(){
  const imgs=Object.values(window._aiScanImgs||{}).filter(Boolean);
  if(!imgs.length){ alert('Додай хоча б одне фото шини'); return; }
  const st=document.getElementById('aiScanStatus');
  if(st) st.textContent='⏳ AI аналізує фото…';
  try{
    const headers={'Content-Type':'application/json'};
    headers['x-app-key']=aiAppKey();
    const k=(typeof SUPA_CFG!=='undefined'&&SUPA_CFG.key)?SUPA_CFG.key():''; if(k){ headers['Authorization']='Bearer '+k; headers['apikey']=k; }
    const res=await fetch(aiToolsScanEndpoint(),{method:'POST',headers,body:JSON.stringify({images:imgs})});
    let data=null; try{ data=await res.json(); }catch(_){ }
    if(!res.ok){ const dt=data?((data.error||'')+(data.detail?(' — '+(''+data.detail).slice(0,300)):'')):('HTTP '+res.status); throw new Error(dt||('HTTP '+res.status)); }
    window._aiScanResult=data; aiToolsScanRender(data);
    if(st) st.textContent='';
    if(typeof aiLogs!=='undefined'){ aiLogs.push({id:uid(),type:'ai-scan',input:imgs.length+' фото',output:JSON.stringify(data).slice(0,300),createdAt:Date.now()}); save('aiLogs',aiLogs); }
  }catch(e){ if(st) st.innerHTML='❌ '+e.message; }
}
function aiToolsScanRender(d){
  const el=document.getElementById('aiScanResult'); if(!el) return;
  const dec=(d.decision||''); const dcls=/не\s*реком|не\s*купув/i.test(dec)?'red':(/торг/i.test(dec)?'yellow':(/купув/i.test(dec)?'green':'yellow'));
  const row=(k,v)=>v?`<div style="display:flex;justify-content:space-between;font-size:.85rem;padding:2px 0"><span style="color:var(--text-dim)">${k}</span><b style="text-align:right">${v}</b></div>`:'';
  el.innerHTML=`<div class="ai-tools-card" style="cursor:default;margin-top:12px">
    <div class="tai-decision tai-dec-${dcls}">${dec||'Оцінка'} ${d.score?('· '+d.score+'/10'):''}</div>
    <div style="margin-top:10px">
      ${row('Марка',d.brand)}${row('Розмір',d.size)}${row('DOT',d.dot)}${row('Тип',d.type)}
      ${row('Протектор',d.tread_mm?(d.tread_mm+' мм'):'')}${row('Ремонти',d.repairs)}${row('Пошкодження',d.damage)}${row('Стан',d.condition)}
    </div>
    ${d.comment?`<div style="font-size:.82rem;color:var(--text-dim);margin-top:8px">${d.comment}</div>`:''}
    <div class="gap-btns mt" style="margin-top:12px">
      <button class="btn btn-green" onclick="aiToolsScanAddStock()">＋ Додати в склад</button>
      <button class="btn btn-dark" onclick="renderAiToolsScan()">Очистити</button>
    </div>
    <div style="font-size:.74rem;color:var(--text-dim);margin-top:8px">⚠️ AI може помилятись — перевір дані перед збереженням.</div>
  </div>`;
}
function aiToolsScanAddStock(){
  const d=window._aiScanResult; if(!d || typeof taiUsedTireModal!=='function') return;
  const firstPhoto=Object.values(window._aiScanImgs||{}).filter(Boolean)[0]||'';
  const notes=['AI скан'+(d.decision?': '+d.decision:''),d.score?('оцінка '+d.score+'/10'):'',d.repairs?('ремонти: '+d.repairs):'',d.damage?('пошкодж.: '+d.damage):'',d.comment||''].filter(Boolean).join(' · ');
  taiUsedTireModal(null,{
    dealType:'куплено', size:d.size||'', brand:d.brand||'', model:'', dotYear:d.dot||'',
    treadMm:d.tread_mm||0, treadPercent:0, sidewallCond:'',
    purchasePrice:0, recommendedSalePrice:0,
    status:'в наявності', source:'AI скан', notes, photo:firstPhoto
  });
}

function aiAppKey(){ return loadVal('appKey') || 'gt_4845ad8fee157d3c0257d16a3049fb26'; }

// ==================== 🤖 OpenRouter — пряма AI-оцінка в CRM ====================
// Налаштування API (ключ НЕ жорстко в коді — лише з localStorage браузера).
const OPENROUTER_URL   = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL_DEFAULT = 'openai/gpt-4o-mini';
function oraiKey(){   return loadVal('orKey')   || ''; }
function oraiModel(){ return loadVal('orModel') || OPENROUTER_MODEL_DEFAULT; }

const ORAI_SRC_NEW=[['rozetka','Rozetka'],['prom','Prom.ua'],['olx','OLX'],['hotline','Hotline'],['google','Google'],['suppliers','Постачальники / склади'],['manual','Вручну додати джерело']];
const ORAI_SRC_USED=[['olx','OLX'],['prom','Prom.ua'],['fb','Facebook Marketplace'],['google','Google'],['ownstock','Власний склад Б/У'],['suppliers','Постачальники / склади'],['manual','Вручну додати джерело']];
const ORAI_DEFAULT_CHECKED={ rozetka:1, prom:1, olx:1, google:1, hotline:1, fb:1 };
function oraiMode(){ const u=document.getElementById('oraiModeUsed'); return (u&&u.checked)?'used':'new'; }
function oraiSourcesHTML(mode){
  const set = mode==='used'?ORAI_SRC_USED:ORAI_SRC_NEW;
  return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 12px">'+
    set.map(([k,label])=>`<label style="display:flex;align-items:center;gap:7px;font-size:.85rem;cursor:pointer">
      <input type="checkbox" id="orsrc_${k}" ${ORAI_DEFAULT_CHECKED[k]?'checked':''} style="width:auto;margin:0"> ${label}</label>`).join('')+
    '</div><input id="oraiManualSrc" placeholder="Інше джерело (вручну, через кому)" style="margin-top:8px">';
}
function oraiSetMode(){
  const box=document.getElementById('oraiSources'); if(box) box.innerHTML=oraiSourcesHTML(oraiMode());
  const uf=document.getElementById('oraiUsedFields'); if(uf) uf.style.display=(oraiMode()==='used')?'block':'none';
}
function oraiSelectedSources(){
  const set = oraiMode()==='used'?ORAI_SRC_USED:ORAI_SRC_NEW; const out=[];
  set.forEach(([k,label])=>{ const c=document.getElementById('orsrc_'+k);
    if(c&&c.checked){ if(k==='manual'){ const mv=(document.getElementById('oraiManualSrc')||{}).value||''; if(mv.trim()) out.push(mv.trim()); } else out.push(label); } });
  return out;
}
function oraiLinks(){
  const term=[_taiGet('mqBrand'),_taiGet('mqModel'),_taiGet('mqSize')].filter(Boolean).join(' ').trim();
  if(!term){ alert('Вкажіть бренд / модель / розмір'); return; }
  const q=encodeURIComponent(term);
  const links=[['OLX','https://www.olx.ua/uk/list/q-'+q+'/'],['Prom.ua','https://prom.ua/ua/search?search_term='+q],['Rozetka','https://rozetka.com.ua/ua/search/?text='+q],['Google','https://www.google.com/search?q='+q+'+%D1%88%D0%B8%D0%BD%D0%B0+%D1%86%D1%96%D0%BD%D0%B0']];
  const el=document.getElementById('oraiLinksBox');
  if(el) el.innerHTML='<div style="font-size:.8rem;color:var(--text-dim);margin:8px 0 6px">🔎 Пошук «'+term+'» (нова вкладка):</div>'+
    links.map(l=>'<a href="'+l[1]+'" target="_blank" rel="noopener" class="btn btn-dark" style="display:block;text-align:left;margin-bottom:6px;text-decoration:none">'+l[0]+' ↗</a>').join('');
}
// Блок налаштувань API (ховається у згорнутому <details>)
function oraiPanelHTML(){
  const k=oraiKey(), masked=k?(k.slice(0,7)+'••••'+k.slice(-4)):'';
  return `<label>🔑 OpenRouter API Key ${k?('<span style=\"color:var(--green);font-size:.75rem\">(збережено: '+masked+')</span>'):''}</label>
    <input id="oraiKeyInp" type="password" placeholder="ключ OpenRouter" autocomplete="off">
    <div class="tai-grid" style="margin-top:8px"><div class="full"><label>Модель</label><input id="oraiModelInp" value="${oraiModel()}" placeholder="${OPENROUTER_MODEL_DEFAULT}"></div></div>
    <div class="gap-btns mt">
      <button class="btn btn-green" onclick="oraiSaveKey()">💾 Зберегти ключ</button>
      <button class="btn btn-dark" onclick="oraiTest()">🧪 Перевірити API</button>
      <button class="btn btn-dark" onclick="oraiClearKey()">🗑 Очистити ключ</button>
    </div>
    <div id="oraiApiStatus" style="font-size:.82rem;color:var(--accent);min-height:18px;margin-top:6px"></div>`;
}
function oraiSaveKey(){
  const k=(document.getElementById('oraiKeyInp')||{}).value||'';
  const m=((document.getElementById('oraiModelInp')||{}).value||'').trim()||OPENROUTER_MODEL_DEFAULT;
  const st=document.getElementById('oraiApiStatus');
  if(!k.trim()){ if(st) st.innerHTML='🔑 Введіть ключ перед збереженням.'; return; }
  saveVal('orKey',k.trim()); saveVal('orModel',m);
  if(st) st.textContent='✅ Ключ і модель збережено (тільки у цьому браузері).';
  renderTaiMarket();
}
function oraiClearKey(){
  if(!confirm('Очистити збережений OpenRouter API ключ?')) return;
  saveVal('orKey','');
  const st=document.getElementById('oraiApiStatus'); if(st) st.textContent='🗑 Ключ очищено.';
  renderTaiMarket();
}
function oraiBuildPrompt(){
  const b=_taiGet('mqBrand'),m=_taiGet('mqModel'),s=_taiGet('mqSize');
  const srcs=oraiSelectedSources(); const today=new Date().toLocaleDateString('uk-UA');
  const tire=[b,m,s].filter(Boolean).join(' ');
  const srcLine = srcs.length?('Джерела (орієнтир): '+srcs.join(', ')+'.'):'Джерела: загальний ринок.';
  if(oraiMode()==='used'){
    const cond=_taiGet('oraiCond'),tread=_taiGet('oraiTread'),desc=_taiGet('oraiDesc');
    return 'Тип: Б/У шина. Шина: '+tire+'. Стан: '+(cond||'—')+'. Протектор: '+(tread||'—')+'.'+(desc?(' Опис: '+desc+'.'):'')+' '+srcLine+
      '\nВідповідь СТРОГО у форматі (грн, простий текст, кожне поле з нового рядка):\nОрієнтир ціни нової:\nСтан:\nПротектор:\nРекомендована ціна Б/У:\nМінімальна ціна продажу:\nРекомендований торг:\nКоментар:';
  }
  return 'Тип: нова шина. Шина: '+tire+'. '+srcLine+
    '\nВідповідь СТРОГО у форматі (грн, простий текст, кожне поле з нового рядка):\nМінімальна ціна нової:\nСередня ціна нової:\nРекомендована ціна продажу:\nДжерела:\nДата перевірки: '+today+'\nКоментар:';
}
const ORAI_SYS='Ти — експерт ринку шин в Україні (ціни у гривнях). Ти НЕ відкриваєш сайти напряму — даєш ринковий ОРІЄНТИР за типовими цінами. Відповідай простим текстом рівно за форматом із запиту користувача. Не пиши, що «перевірив сайт».';
function oraiHttpMsg(status,data){
  const det=(data&&data.error&&data.error.message)?(': '+data.error.message):'';
  if(status===401||status===403) return 'Невірний або відхилений API-ключ. Перевірте і збережіть знову.';
  if(status===402) return 'Недостатньо коштів на балансі OpenRouter.';
  if(status===429) return 'Перевищено ліміт запитів OpenRouter. Зачекайте трохи і спробуйте ще.';
  return 'OpenRouter помилка '+status+det;
}
async function oraiGet(){
  const st=document.getElementById('oraiStatus');
  if(!_taiGet('mqSize')&&!_taiGet('mqBrand')){ alert('Вкажіть хоча б розмір або бренд'); return; }
  const key=oraiKey();
  if(!key){ if(st) st.innerHTML='🔑 Додайте OpenRouter API ключ у налаштуваннях AI (блок «🔑 Налаштування AI API» нижче).'; return; }
  if(st) st.textContent='🤖 AI думає…';
  let res;
  try{
    res=await fetch(OPENROUTER_URL,{method:'POST',headers:{
      'Authorization':'Bearer '+key,'Content-Type':'application/json',
      'HTTP-Referer':(location&&location.origin)||'https://gt-tires','X-Title':'GT Tires CRM'
    },body:JSON.stringify({model:oraiModel(),temperature:0.3,messages:[{role:'system',content:ORAI_SYS},{role:'user',content:oraiBuildPrompt()}]})});
  }catch(netErr){ if(st) st.innerHTML='❌ Немає інтернету або сервіс недоступний. Перевірте звʼязок.'; return; }
  let data=null; try{ data=await res.json(); }catch(_){ }
  if(!res.ok){ if(st) st.innerHTML='❌ '+oraiHttpMsg(res.status,data); return; }
  const ans=(data&&data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||'';
  if(!ans.trim()){ if(st) st.innerHTML='❌ AI повернув порожню відповідь. Спробуйте ще раз.'; return; }
  const ta=document.getElementById('oraiAnswer'); if(ta) ta.value=ans.trim();
  window._oraiLast={ans:ans.trim(),mode:oraiMode()};
  if(st) st.textContent='✅ AI-оцінка за вибраними джерелами (орієнтир). Перевірте і збережіть.';
}
async function oraiTest(){
  const st=document.getElementById('oraiApiStatus');
  const typed=(document.getElementById('oraiKeyInp')||{}).value||''; const key=typed.trim()||oraiKey();
  if(!key){ if(st) st.innerHTML='🔑 Введіть ключ для перевірки.'; return; }
  if(st) st.textContent='🧪 Перевіряю ключ…';
  let res;
  try{
    res=await fetch(OPENROUTER_URL,{method:'POST',headers:{
      'Authorization':'Bearer '+key,'Content-Type':'application/json',
      'HTTP-Referer':(location&&location.origin)||'https://gt-tires','X-Title':'GT Tires CRM'
    },body:JSON.stringify({model:oraiModel(),max_tokens:5,messages:[{role:'user',content:'ping'}]})});
  }catch(netErr){ if(st) st.innerHTML='❌ Немає інтернету або сервіс недоступний.'; return; }
  let data=null; try{ data=await res.json(); }catch(_){ }
  if(res.ok){ if(st) st.innerHTML='✅ Ключ робочий. Модель: '+oraiModel(); }
  else { if(st) st.innerHTML='❌ '+oraiHttpMsg(res.status,data); }
}
function oraiSave(){
  const ans=(document.getElementById('oraiAnswer')||{}).value||'';
  if(!ans.trim()){ alert('Спочатку натисніть «🔎 Перевірити ціну»'); return; }
  if(!_taiGet('mqSize')){ alert('Вкажіть розмір шини'); return; }
  const set=(id,v)=>{const e=document.getElementById(id); if(e&&v) e.value=v;};
  set('mqMin', _taiPickNum(ans,'мінім')||'');
  set('mqAvg', _taiPickNum(ans,'середн')||_taiPickNum(ans,'орієнтир ціни нової')||'');
  set('mqRec', _taiPickNum(ans,'рекоменд')||_taiNum('mqAvg')||'');
  const src=_taiPickSources(ans); if(src) set('mqSources',src);
  const cm=(/коментар[^:\n]*:?\s*([^\n]+)/i.exec(ans)||[])[1]||'';
  set('mqComment', ((oraiMode()==='used'?'Б/У · ':'Нова · ')+(cm||'AI орієнтир')).slice(0,200));
  aiLogs.push({id:uid(),type:'openrouter-eval',input:[_taiGet('mqBrand'),_taiGet('mqModel'),_taiGet('mqSize')].filter(Boolean).join(' ')+' ['+oraiMode()+']',output:ans.slice(0,500),createdAt:Date.now()});
  save('aiLogs',aiLogs);
  taiMarketSave();
}
// 🧮 Використати в калькуляторі
function oraiToCalc(){
  const ans=(document.getElementById('oraiAnswer')||{}).value||'';
  const b=_taiGet('mqBrand'),m=_taiGet('mqModel'),s=_taiGet('mqSize');
  const newPrice=_taiPickNum(ans,'середн')||_taiPickNum(ans,'орієнтир ціни нової')||_taiPickNum(ans,'рекоменд')||0;
  taiSub='calc'; renderTireAI();
  const set=(id,v)=>{const e=document.getElementById(id); if(e&&v) e.value=v;};
  const sp=gtParseSize(s); set('cSzW',sp.w); set('cSzP',sp.p); set('cSzD',sp.d); gtSizeSync('cSz','cSize');
  set('cBrand',b); gtSetModels(b); set('cModel',m);
  if(newPrice) set('cNewPrice',newPrice);
}
// 📦 Додати в Б/У склад
function oraiToStock(){
  if(typeof taiUsedTireModal!=='function') return;
  const ans=(document.getElementById('oraiAnswer')||{}).value||'';
  const recBV=_taiPickNum(ans,'рекомендована ціна б')||0;
  const recSell=_taiPickNum(ans,'рекоменд')||0;
  taiUsedTireModal(null,{ dealType:'куплено', size:_taiGet('mqSize'), brand:_taiGet('mqBrand'), model:_taiGet('mqModel'),
    recommendedSalePrice:recBV||recSell, status:'в наявності', source:'AI оцінка',
    notes:('AI ('+oraiMode()+'): '+ans.replace(/\n/g,' ').slice(0,180)) });
}

// ==================== 🧩 Спрощене введення шин (спільні компоненти) ====================
const GT_BRANDS=['Michelin','Bridgestone','Continental','Goodyear','Dunlop','Pirelli','Hankook','Yokohama','Toyo','Kumho'];
const GT_BRAND_MODELS={
  michelin:['X Line Energy','X Multi','X MultiWay','X Works','X Coach','X Force'],
  bridgestone:['Ecopia','R-Steer','R-Drive','Duravis'],
  continental:['Hybrid','Conti EcoPlus','Scandinavia'],
  goodyear:['KMAX','FUELMAX'],
  hankook:['SmartFlex','SmartWork'],
  yokohama:['BluEarth','RY023'],
  kumho:['KRS03','KRD02']
};
const GT_SIZE_W=['385','315','295','275','265','245','235','215','205','195'];
const GT_SIZE_P=['65','70','75','80','60','55','50'];
const GT_SIZE_D=['17.5','19.5','22.5','24.5','16','17','18','19','20','21','22'];
const GT_AXIS=['','Рульова','Ведуча','Причіпна','Універсальна'];
const GT_COND=['','Нова','Добра','Є латки','Косметичний ремонт','Після ремонту','Під відновлення'];
const GT_TREAD_STEPS=[100,90,80,70,60,50,40,30];

// нормалізація розміру до формату 385/65/22.5 (прибирає R/r/пробіли)
function gtNormSize(s){
  s=(s==null?'':''+s);
  const nums=(s.replace(/,/g,'.').match(/\d+(?:\.\d+)?/g)||[]);
  if(nums.length>=3) return nums[0]+'/'+nums[1]+'/'+nums[2];
  if(nums.length) return nums.join('/');
  return s.replace(/[Rr\s]/g,'');
}
function gtParseSize(s){ const n=gtNormSize(s).split('/'); return {w:n[0]||'',p:n[1]||'',d:n[2]||''}; }

function gtEnsureDatalists(){
  if(typeof document==='undefined'||!document.body) return;
  if(document.getElementById('gtBrands')) return;
  const mk=(id,arr)=>{ const d=document.createElement('datalist'); d.id=id; d.innerHTML=arr.map(v=>'<option value="'+v+'">').join(''); document.body.appendChild(d); };
  mk('gtBrands',GT_BRANDS); mk('gtSizeW',GT_SIZE_W); mk('gtSizeP',GT_SIZE_P); mk('gtSizeD',GT_SIZE_D);
  const dm=document.createElement('datalist'); dm.id='gtModels'; document.body.appendChild(dm);
}
function gtModelsFor(brand){ const b=(brand||'').toLowerCase(); for(const k in GT_BRAND_MODELS){ if(b.indexOf(k)>-1) return GT_BRAND_MODELS[k]; } return []; }
function gtSetModels(brand){ const dm=document.getElementById('gtModels'); if(!dm) return; dm.innerHTML=gtModelsFor(brand).map(v=>'<option value="'+v+'">').join(''); }

// 3-польний віджет розміру. hiddenId — існуюче поле, яке читає стара логіка (uSize/cSize/mqSize).
function gtSizeWidget(prefix,hiddenId,sizeVal){
  const p=gtParseSize(sizeVal||''); const norm=gtNormSize(sizeVal||'');
  const cell=(sub,id,list,ph,val)=>`<div style="flex:1;min-width:0"><span style="font-size:.68rem;color:var(--text-dim)">${sub}</span><input id="${id}" list="${list}" inputmode="decimal" value="${val}" placeholder="${ph}" oninput="gtSizeSync('${prefix}','${hiddenId}')"></div>`;
  return `<div style="display:flex;align-items:flex-end;gap:6px">
    ${cell('Ширина',prefix+'W','gtSizeW','385',p.w)}<span style="padding-bottom:10px;font-weight:700">/</span>
    ${cell('Профіль',prefix+'P','gtSizeP','65',p.p)}<span style="padding-bottom:10px;font-weight:700">/</span>
    ${cell('Диск',prefix+'D','gtSizeD','22.5',p.d)}
    <input type="hidden" id="${hiddenId}" value="${norm}">
  </div>
  <div id="${prefix}Prev" style="font-size:.78rem;color:var(--accent);margin-top:4px">${norm?('Розмір: '+norm):''}</div>`;
}
function gtSizeSync(prefix,hiddenId){
  const g=id=>{const e=document.getElementById(id);return e?e.value.trim():'';};
  const cl=v=>v.replace(/[Rr\s]/g,'').replace(',','.');
  const w=cl(g(prefix+'W')),p=cl(g(prefix+'P')),d=cl(g(prefix+'D'));
  const combined=[w,p,d].filter(x=>x!=='').join('/');
  const norm=gtNormSize(combined);
  const h=document.getElementById(hiddenId); if(h) h.value=norm;
  const prev=document.getElementById(prefix+'Prev'); if(prev) prev.textContent=norm?('Розмір: '+norm):'';
}
function gtAxisSelect(id,val){ val=val||''; return `<select id="${id}">${GT_AXIS.map(a=>`<option value="${a}"${a===val?' selected':''}>${a||'—'}</option>`).join('')}</select>`; }
function gtCondSelect(id,val){ val=val||''; return `<select id="${id}">${GT_COND.map(a=>`<option value="${a}"${a===val?' selected':''}>${a||'—'}</option>`).join('')}</select>`; }
function gtTreadBtns(targetId){ return `<div style="display:flex;flex-wrap:wrap;gap:5px;margin:4px 0">${GT_TREAD_STEPS.map(p=>`<button type="button" class="btn btn-dark btn-sm" style="padding:4px 9px" onclick="gtSetTread('${targetId}',${p})">${p}%</button>`).join('')}</div>`; }
function gtSetTread(id,pct){ const e=document.getElementById(id); if(e) e.value=pct; }

// >>> GT TIRES MARKET AGENT MODULE START >>>
// ==================== 🛞 GT TIRES MARKET AGENT (додатковий модуль) ====================
// ВАЖЛИВО: усе НОВЕ, з префіксами tireMarket/gtMarket/marketAgent. Старий CRM не чіпається.
// Центральна база цін нових шин → живить калькулятор Б/У, склад, заказ, аналітику через
// існуючий масив marketPrices (через taiFindMarket) — БЕЗ зміни їхнього коду.

// --- Білий список постачальників (100 ШИН = пріоритет 1) ---
const TIRE_SUPPLIERS_DEFAULT = [
  { id:'s100shin', name:'100 ШИН',        phone:'',  website:'https://100shin.com.ua',  priority:1,  enabled:true,  favorite:true,  usedOnly:false },
  { id:'sasva',    name:'ASVA',           phone:'',  website:'https://asva.com.ua',     priority:2,  enabled:true,  favorite:false, usedOnly:false },
  { id:'sukrshina',name:'Укршина',        phone:'',  website:'https://ukrshina.com.ua', priority:3,  enabled:true,  favorite:false, usedOnly:false },
  { id:'stias',    name:'ТІАС Україна',   phone:'',  website:'https://tias.ua',         priority:4,  enabled:true,  favorite:false, usedOnly:false },
  { id:'saskania', name:'Асканія',        phone:'',  website:'https://askania.ua',      priority:5,  enabled:true,  favorite:false, usedOnly:false },
  { id:'stirua',   name:'TIR.UA',         phone:'',  website:'https://tir.ua',          priority:6,  enabled:true,  favorite:false, usedOnly:false },
  { id:'sstart',   name:'StartShina',     phone:'',  website:'https://startshina.com.ua',priority:7, enabled:true,  favorite:false, usedOnly:false },
  { id:'sshina',   name:'ShinaShina',     phone:'',  website:'https://shinashina.com.ua',priority:8, enabled:true,  favorite:false, usedOnly:false },
  { id:'sautoguma',name:'Autoguma',       phone:'',  website:'https://autoguma.com.ua', priority:9,  enabled:true,  favorite:false, usedOnly:false },
  { id:'solx',     name:'OLX',            phone:'',  website:'https://olx.ua',          priority:10, enabled:true,  favorite:false, usedOnly:true  }
];

// --- Стан (localStorage, окремі ключі — наявні дані недоторкані) ---
let tireMarketPrices       = load('tireMarketPrices');
let tireMarketPriceHistory = load('tireMarketPriceHistory');
let tireSuppliers          = (function(){ const s=load('tireSuppliers'); return (s&&s.length)?s:TIRE_SUPPLIERS_DEFAULT.slice(); })();
let tireMarketSub          = 'prices'; // 'prices' | 'suppliers'

function gtMarketSaveAll(){
  save('tireMarketPrices', tireMarketPrices);
  save('tireMarketPriceHistory', tireMarketPriceHistory);
  save('tireSuppliers', tireSuppliers);
}

// ============ ОБОВ'ЯЗКОВІ ФУНКЦІЇ ============

// 1) Нормалізація розміру (повторно використовує наявний gtNormSize)
function normalizeTireSize(size){
  try { return (typeof gtNormSize==='function') ? gtNormSize(size) : (size||'').toString().toLowerCase().replace(/\s+/g,''); }
  catch(e){ return (size||'').toString().toLowerCase().replace(/\s+/g,''); }
}

// 2) Унікальний ключ шини
function buildTireKey(brand, model, size){
  const b=(brand||'').toString().trim().toLowerCase();
  const m=(model||'').toString().trim().toLowerCase();
  const s=normalizeTireSize(size);
  return [b,m,s].filter(Boolean).join('|') || 'unknown';
}

function gtMarketSupplierByName(name){
  const n=(name||'').toString().trim().toLowerCase();
  return tireSuppliers.find(s=>s.name.toLowerCase()===n) || null;
}
function gtMarketSupplierPriority(name){
  const s=gtMarketSupplierByName(name);
  return s ? s.priority : 99; // невідомий постачальник — найнижчий пріоритет
}

// 8) Запис історії цін
function saveMarketHistory(priceData){
  if(!priceData) return;
  tireMarketPriceHistory.push({
    id: uid(),
    tireKey: priceData.tireKey || buildTireKey(priceData.brand, priceData.model, priceData.size),
    brand: priceData.brand||'', model: priceData.model||'', size: priceData.size||'',
    sellerName: priceData.sellerName||'', price: Number(priceData.price)||0,
    availability: priceData.availability||'', productUrl: priceData.productUrl||'',
    checkedAt: priceData.lastChecked || today()
  });
  // обмежимо історію, щоб localStorage не розпухав
  if(tireMarketPriceHistory.length>2000) tireMarketPriceHistory = tireMarketPriceHistory.slice(-2000);
}

// 3) Оновлення цін (єдина точка входу — від mock/demo, JSON/CSV або майбутніх парсерів)
// data = масив записів {brand,model,size,season,type,loadIndex,speedIndex,price,currency,
//        sellerName,sellerPhone,sellerWebsite,productUrl,city,availability,year}
function updateTireMarketPrices(data){
  if(!Array.isArray(data)) { try{ data=JSON.parse(data); }catch(e){ return {ok:false, error:'Невірний формат даних'}; } }
  if(!Array.isArray(data)) return {ok:false, error:'Очікувався масив записів'};
  let added=0, skipped=0;
  data.forEach(function(r){
    if(!r || (!r.size && !r.brand)) { skipped++; return; }
    const sup = gtMarketSupplierByName(r.sellerName);
    const rec = {
      id: uid(),
      brand: (r.brand||'').toString().trim(),
      model: (r.model||'').toString().trim(),
      size:  (r.size||'').toString().trim(),
      season: r.season||'', type: r.type||'',
      loadIndex: r.loadIndex||'', speedIndex: r.speedIndex||'',
      price: Number(r.price)||0,
      currency: r.currency||'грн',
      sellerName: r.sellerName||'',
      sellerPhone: r.sellerPhone || (sup?sup.phone:'') || '',
      sellerWebsite: r.sellerWebsite || (sup?sup.website:'') || '',
      productUrl: r.productUrl||'',
      city: r.city||'',
      availability: r.availability||'',
      year: r.year||'',
      sourcePriority: gtMarketSupplierPriority(r.sellerName),
      lastChecked: r.lastChecked || today(),
      isFavoriteSupplier: sup ? !!sup.favorite : false
    };
    rec.tireKey = buildTireKey(rec.brand, rec.model, rec.size);
    tireMarketPrices.push(rec);
    saveMarketHistory(rec);
    added++;
  });
  gtMarketSaveAll();
  // одразу синхронізуємо в систему (калькулятор/оцінка Б/У через marketPrices)
  try { syncMarketPricesToUsedCalculator(); } catch(e){}
  return {ok:true, added:added, skipped:skipped};
}

// внутрішнє: всі актуальні офери по ключу шини, відсортовані за пріоритетом джерела й ціною
function gtMarketOffersForKey(tireKey){
  return tireMarketPrices
    .filter(function(x){ return x.tireKey===tireKey && (Number(x.price)||0)>0; })
    .sort(function(a,b){
      if((a.sourcePriority||99)!==(b.sourcePriority||99)) return (a.sourcePriority||99)-(b.sourcePriority||99);
      return (a.price||0)-(b.price||0);
    });
}
// унікальні ключі шин, що є в базі (найсвіжіший запис як представник)
function gtMarketUniqueTires(){
  const map={};
  tireMarketPrices.forEach(function(x){
    if(!map[x.tireKey]) map[x.tireKey]={brand:x.brand,model:x.model,size:x.size,tireKey:x.tireKey,offers:0};
    map[x.tireKey].offers++;
  });
  return Object.keys(map).map(function(k){ return map[k]; });
}

// середня без аномалій (відкидаємо найнижчі/найвищі 15%, якщо вибірка ≥4)
function gtMarketAvgNoOutliers(prices){
  const arr=prices.filter(function(p){return p>0;}).sort(function(a,b){return a-b;});
  if(!arr.length) return 0;
  if(arr.length>=4){
    const cut=Math.floor(arr.length*0.15);
    const trimmed=arr.slice(cut, arr.length-cut);
    if(trimmed.length) { const s=trimmed.reduce(function(a,b){return a+b;},0); return Math.round(s/trimmed.length); }
  }
  const s=arr.reduce(function(a,b){return a+b;},0);
  return Math.round(s/arr.length);
}

// 4/5) min / рекомендована продажу
// 6) get ціни для конкретної шини (центральне API читання)
function getMarketPriceForTire(brand, model, size){
  const key=buildTireKey(brand, model, size);
  let offers=gtMarketOffersForKey(key);
  // фолбек: якщо точного збігу немає — пробуємо за брендом+розміром, потім лише розміром
  if(!offers.length){
    const ns=normalizeTireSize(size), nb=(brand||'').toString().trim().toLowerCase();
    offers=tireMarketPrices.filter(function(x){ return normalizeTireSize(x.size)===ns && (x.brand||'').toLowerCase()===nb && (Number(x.price)||0)>0; });
    if(!offers.length) offers=tireMarketPrices.filter(function(x){ return normalizeTireSize(x.size)===ns && (Number(x.price)||0)>0; });
    offers.sort(function(a,b){ if((a.sourcePriority||99)!==(b.sourcePriority||99)) return (a.sourcePriority||99)-(b.sourcePriority||99); return (a.price||0)-(b.price||0); });
  }
  if(!offers.length) return null;
  const prices=offers.map(function(o){ return Number(o.price)||0; });
  const marketMinPrice=Math.min.apply(null, prices);
  const marketAvgPrice=gtMarketAvgNoOutliers(prices);
  const recommendedSalePrice=calculateRecommendedSalePrice(marketAvgPrice);
  return {
    tireKey:key, brand:offers[0].brand, model:offers[0].model, size:offers[0].size,
    marketMinPrice:marketMinPrice, marketAvgPrice:marketAvgPrice, recommendedSalePrice:recommendedSalePrice,
    offersCount:offers.length, lastChecked:offers[0].lastChecked||'', offers:offers, best:offers[0]
  };
}

// 7) найкращий постачальник для шини (за пріоритетом джерела, потім ціною)
function getBestSupplierForTire(brand, model, size){
  const info=getMarketPriceForTire(brand, model, size);
  if(!info) return null;
  return info.best || null;
}

// recommendedSalePrice = avg + 7–12% (беремо ~10%)
function calculateRecommendedSalePrice(marketAvgPrice){
  const a=Number(marketAvgPrice)||0; if(!a) return 0;
  return Math.round(a*1.10/10)*10; // +10%, округлення до 10
}

// Оцінка Б/У шини за протектором × ціна нової − знижки
// tireData = {brand,model,size,treadPercent,year,repaired,cut,unevenWear,lowSegment,lowDemand}
function calculateUsedTireEstimate(tireData){
  tireData=tireData||{};
  const info=getMarketPriceForTire(tireData.brand, tireData.model, tireData.size);
  const usedBasePrice = info ? info.marketAvgPrice : (Number(tireData.newPrice)||0);
  if(!usedBasePrice) return { ok:false, error:'Немає ціни нової шини в базі — спочатку оновіть ціни', usedBasePrice:0, estimate:0 };
  const t=Number(tireData.treadPercent)||0;
  let lo,hi;
  if(t>=90){lo=0.75;hi=0.85;}
  else if(t>=80){lo=0.65;hi=0.75;}
  else if(t>=70){lo=0.55;hi=0.65;}
  else if(t>=60){lo=0.45;hi=0.55;}
  else if(t>=50){lo=0.35;hi=0.45;}
  else {lo=0.20;hi=0.30;} // <50%
  let mid=(lo+hi)/2;
  // знижки
  let penalties=0;
  if(tireData.year){ const age=(new Date().getFullYear())-(parseInt(tireData.year)||0); if(age>=6) penalties+=0.10; else if(age>=4) penalties+=0.05; }
  if(tireData.repaired)   penalties+=0.07;
  if(tireData.cut)        penalties+=0.10;
  if(tireData.unevenWear) penalties+=0.05;
  if(tireData.lowSegment) penalties+=0.05;
  if(tireData.lowDemand)  penalties+=0.05;
  let factor=Math.max(0.10, mid-penalties);
  const estimate=Math.round(usedBasePrice*factor/10)*10;
  return {
    ok:true, usedBasePrice:usedBasePrice, treadPercent:t,
    factor:Math.round(factor*100)/100, penalties:Math.round(penalties*100)/100,
    estimateMin:Math.round(usedBasePrice*Math.max(0.10,lo-penalties)/10)*10,
    estimateMax:Math.round(usedBasePrice*Math.max(0.10,hi-penalties)/10)*10,
    estimate:estimate
  };
}

// 11) sync → пушимо центральні ціни в наявний marketPrices, щоб калькулятор/оцінка Б/У
//     підхопили їх через taiFindMarket БЕЗ зміни їхнього коду.
function syncMarketPricesToUsedCalculator(){
  if(typeof marketPrices==='undefined') return 0;
  // приберемо попередні записи цього агента (мітка source='market-agent')
  marketPrices = marketPrices.filter(function(r){ return r.source!=='market-agent'; });
  const tires=gtMarketUniqueTires(); let n=0;
  tires.forEach(function(t){
    const info=getMarketPriceForTire(t.brand, t.model, t.size);
    if(!info) return;
    marketPrices.push({
      id:'ma_'+t.tireKey,
      brand:t.brand, model:t.model, size:t.size,
      minPrice:info.marketMinPrice, avgPrice:info.marketAvgPrice, recPrice:info.recommendedSalePrice,
      sources:'Market Agent ('+info.offersCount+' оф.)',
      checkedAt: info.lastChecked||today(),
      createdAt: Date.now(),
      source:'market-agent'
    });
    n++;
  });
  try { save('marketPrices', marketPrices); } catch(e){}
  return n;
}

// 12/13) sync до складу / заказів — центральне API готове; модулі читають через getMarketPriceForTire.
// Не переписуємо їхній код: повертаємо мапу ключ→рекомендована ціна для будь-якого споживача.
function syncMarketPricesToInventory(){
  const map={}; gtMarketUniqueTires().forEach(function(t){ const i=getMarketPriceForTire(t.brand,t.model,t.size); if(i) map[t.tireKey]={recommendedSalePrice:i.recommendedSalePrice, marketAvgPrice:i.marketAvgPrice, marketMinPrice:i.marketMinPrice}; }); return map;
}
function syncMarketPricesToOrders(){ return syncMarketPricesToInventory(); }

// ============ MOCK / DEMO ІМПОРТ ============
function marketAgentLoadDemo(){
  const demo=[
    {brand:'Michelin', model:'X Line Energy D', size:'315/80 R22.5', season:'літо', type:'ведуча', loadIndex:'156/150', speedIndex:'L', price:18900, currency:'грн', sellerName:'100 ШИН', city:'Київ', availability:'в наявності', year:'2024', productUrl:'https://100shin.com.ua'},
    {brand:'Michelin', model:'X Line Energy D', size:'315/80 R22.5', price:19500, sellerName:'ASVA', city:'Львів', availability:'в наявності', year:'2024'},
    {brand:'Michelin', model:'X Line Energy D', size:'315/80 R22.5', price:19200, sellerName:'Укршина', city:'Одеса', availability:'під замовлення', year:'2023'},
    {brand:'Bridgestone', model:'R-Drive 002', size:'315/80 R22.5', price:16500, sellerName:'100 ШИН', city:'Київ', availability:'в наявності', year:'2024', productUrl:'https://100shin.com.ua'},
    {brand:'Bridgestone', model:'R-Drive 002', size:'315/80 R22.5', price:17200, sellerName:'TIR.UA', city:'Харків', availability:'в наявності', year:'2024'},
    {brand:'Continental', model:'HDR2', size:'315/70 R22.5', price:15800, sellerName:'100 ШИН', city:'Київ', availability:'в наявності', year:'2024', productUrl:'https://100shin.com.ua'},
    {brand:'Continental', model:'HDR2', size:'315/70 R22.5', price:16400, sellerName:'Асканія', city:'Дніпро', availability:'в наявності', year:'2023'},
    {brand:'Goodyear', model:'KMAX D', size:'385/65 R22.5', price:21000, sellerName:'StartShina', city:'Київ', availability:'в наявності', year:'2024'},
    {brand:'Goodyear', model:'KMAX D', size:'385/65 R22.5', price:20500, sellerName:'100 ШИН', city:'Київ', availability:'в наявності', year:'2024', productUrl:'https://100shin.com.ua'},
    {brand:'Hankook', model:'AL10', size:'315/70 R22.5', price:13900, sellerName:'ShinaShina', city:'Запоріжжя', availability:'в наявності', year:'2024'}
  ];
  const res=updateTireMarketPrices(demo);
  renderTireMarketPanel();
  if(res.ok) alert('Demo-ціни завантажено: додано '+res.added+' оферів. Синхронізовано з калькулятором Б/У.');
}

// ============ JSON / CSV ІМПОРТ ============
function marketAgentImportJSON(){
  const txt=(document.getElementById('tmImportBox')||{}).value||'';
  if(!txt.trim()){ alert('Вставте JSON-масив записів'); return; }
  let data; try{ data=JSON.parse(txt); }catch(e){ alert('Помилка JSON: '+e.message); return; }
  const res=updateTireMarketPrices(data);
  if(res.ok){ renderTireMarketPanel(); alert('Імпортовано: +'+res.added+' (пропущено '+res.skipped+'). Синхронізовано.'); }
  else alert('Помилка: '+(res.error||'?'));
}
function marketAgentImportCSV(){
  const txt=(document.getElementById('tmImportBox')||{}).value||'';
  if(!txt.trim()){ alert('Вставте CSV (перший рядок — заголовки)'); return; }
  const lines=txt.split(/\r?\n/).filter(function(l){return l.trim();});
  if(lines.length<2){ alert('Потрібно щонайменше заголовок + 1 рядок'); return; }
  const heads=lines[0].split(/[;,\t]/).map(function(h){return h.trim().toLowerCase();});
  const map={brand:['brand','бренд'],model:['model','модель'],size:['size','розмір','размер'],price:['price','ціна','цена'],
    sellername:['sellername','seller','продавець','продавец'],city:['city','місто','город'],availability:['availability','наявність','наличие'],
    year:['year','рік','год'],producturl:['producturl','url','посилання','ссылка'],sellerphone:['sellerphone','phone','телефон'],
    season:['season','сезон'],type:['type','тип']};
  function idx(keys){ for(var i=0;i<heads.length;i++){ if(keys.indexOf(heads[i])>-1) return i; } return -1; }
  const ix={}; Object.keys(map).forEach(function(k){ ix[k]=idx(map[k]); });
  const data=[];
  for(var i=1;i<lines.length;i++){
    const c=lines[i].split(/[;,\t]/).map(function(x){return x.trim();});
    const g=function(k){ return ix[k]>-1 ? (c[ix[k]]||'') : ''; };
    data.push({brand:g('brand'),model:g('model'),size:g('size'),price:g('price'),sellerName:g('sellername'),
      city:g('city'),availability:g('availability'),year:g('year'),productUrl:g('producturl'),
      sellerPhone:g('sellerphone'),season:g('season'),type:g('type')});
  }
  const res=updateTireMarketPrices(data);
  if(res.ok){ renderTireMarketPanel(); alert('CSV імпортовано: +'+res.added+' (пропущено '+res.skipped+'). Синхронізовано.'); }
  else alert('Помилка: '+(res.error||'?'));
}

function marketAgentClearPrices(){
  if(!confirm('Очистити ВСІ ринкові ціни шин? (історія та постачальники лишаться)')) return;
  tireMarketPrices=[]; gtMarketSaveAll();
  try{ syncMarketPricesToUsedCalculator(); }catch(e){}
  renderTireMarketPanel();
}

// ============ ДІЇ КНОПОК ТАБЛИЦІ ПРОДАВЦІВ ============
function gtMarketCall(phone){ if(!phone){ alert('Телефон постачальника не вказаний (додайте у ⚙️ Постачальники)'); return; } location.href='tel:'+phone; }
function gtMarketOpenUrl(url){ if(!url){ alert('Пряме посилання на товар відсутнє'); return; } window.open(url,'_blank','noopener'); }
function gtMarketToggleFav(offerId){
  const o=tireMarketPrices.find(function(x){return x.id===offerId;}); if(!o) return;
  const sup=gtMarketSupplierByName(o.sellerName);
  if(sup){ sup.favorite=!sup.favorite; tireMarketPrices.forEach(function(x){ if(x.sellerName===sup.name) x.isFavoriteSupplier=sup.favorite; }); }
  else { o.isFavoriteSupplier=!o.isFavoriteSupplier; }
  gtMarketSaveAll(); renderTireMarketPanel();
}
function gtMarketToStock(offerId){
  const o=tireMarketPrices.find(function(x){return x.id===offerId;}); if(!o) return;
  if(typeof taiUsedTireModal!=='function'){ alert('Модуль складу недоступний'); return; }
  const info=getMarketPriceForTire(o.brand,o.model,o.size);
  taiUsedTireModal(null,{ dealType:'куплено', size:o.size, brand:o.brand, model:o.model,
    recommendedSalePrice: info?info.recommendedSalePrice:0, status:'в наявності',
    source:'Market Agent: '+(o.sellerName||''), notes:'Ринкова ціна нової: '+fmtMoney(o.price||0)+' ('+(o.sellerName||'')+')' });
}
function gtMarketToOrder(offerId){
  const o=tireMarketPrices.find(function(x){return x.id===offerId;}); if(!o) return;
  if(typeof openNewOrder!=='function'){ alert('Модуль заказ-нарядів недоступний'); return; }
  const info=getMarketPriceForTire(o.brand,o.model,o.size);
  window._gtMarketPrefillOrder={ name:[o.brand,o.model,o.size].filter(Boolean).join(' '), price: info?info.recommendedSalePrice:(o.price||0) };
  openNewOrder();
  // м'яка спроба підставити першу послугу (не ламаємо, якщо структура інша)
  setTimeout(function(){
    try{
      const sName=document.querySelector('#orderServices input, #svcName, [data-svc-name]');
      const sPrice=document.querySelector('#orderServices input[type=number], #svcPrice, [data-svc-price]');
      if(sName && !sName.value) sName.value=window._gtMarketPrefillOrder.name;
      if(sPrice && !sPrice.value) sPrice.value=window._gtMarketPrefillOrder.price;
    }catch(e){}
  },150);
}
function gtMarketEvalUsed(offerId){
  const o=tireMarketPrices.find(function(x){return x.id===offerId;}); if(!o) return;
  const tread=parseInt(prompt('Залишок протектора, % (напр. 70):','70')); if(isNaN(tread)) return;
  const est=calculateUsedTireEstimate({brand:o.brand,model:o.model,size:o.size,treadPercent:tread,year:o.year});
  if(!est.ok){ alert(est.error); return; }
  alert('♻️ Оцінка Б/У '+[o.brand,o.model,o.size].filter(Boolean).join(' ')+
    '\nЦіна нової (база): '+fmtMoney(est.usedBasePrice)+
    '\nПротектор: '+est.treadPercent+'%'+
    '\nРекомендована Б/У: '+fmtMoney(est.estimate)+
    '\nДіапазон: '+fmtMoney(est.estimateMin)+' – '+fmtMoney(est.estimateMax));
}

// ============ UI: вкладки ============
function tireMarketGo(sub){ tireMarketSub=sub; renderTireMarketPanel(); }
function renderTireMarketPanel(){
  const b=document.getElementById('tireMarketBody'); if(!b) return;
  const TABS=[['prices','🛞 Ціни шин'],['suppliers','⚙️ Постачальники']];
  const tabsHtml='<div id="tireMarketTabs" style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">'+
    TABS.map(function(t){ return '<button class="btn '+(tireMarketSub===t[0]?'btn-red':'btn-dark')+' btn-sm" onclick="tireMarketGo(\''+t[0]+'\')">'+t[1]+'</button>'; }).join('')+'</div>';
  if(tireMarketSub==='suppliers'){ b.innerHTML=tabsHtml+renderSupplierSettingsHTML(); return; }

  const tires=gtMarketUniqueTires();
  let cards='';
  if(!tires.length){
    cards='<div class="card"><div style="color:var(--text-dim);font-size:.9rem">Поки немає цін. Натисни <b>🛞 Оновити ціни шин</b> (demo) або імпортуй JSON/CSV нижче.</div></div>';
  } else {
    cards=tires.map(function(t){
      const info=getMarketPriceForTire(t.brand,t.model,t.size); if(!info) return '';
      const name=[t.brand,t.model,t.size].filter(Boolean).join(' ')||'—';
      return '<div class="card" style="margin-bottom:12px">'+
        '<div style="font-family:\'Oswald\';font-size:1.05rem;color:var(--text)">'+name+'</div>'+
        '<div style="font-size:.84rem;color:var(--text-dim);margin:4px 0 8px">'+
          'мін <b>'+fmtMoney(info.marketMinPrice)+'</b> · сер '+fmtMoney(info.marketAvgPrice)+
          ' · реком. продажу <b style="color:var(--green)">'+fmtMoney(info.recommendedSalePrice)+'</b>'+
          ' · перевірено '+(info.lastChecked||'')+'</div>'+
        renderSupplierTable(info.tireKey)+
        '</div>';
    }).join('');
  }

  const importBlock='<details class="card mt"><summary style="cursor:pointer;font-weight:700">📥 Імпорт цін (JSON / CSV)</summary>'+
    '<div style="font-size:.76rem;color:var(--text-dim);margin:8px 0">JSON: масив об\'єктів з полями brand, model, size, price, sellerName, city, availability, year, productUrl. CSV: перший рядок — заголовки.</div>'+
    '<textarea id="tmImportBox" rows="6" placeholder=\'[{"brand":"Michelin","model":"X Line","size":"315/80 R22.5","price":18900,"sellerName":"100 ШИН","city":"Київ","availability":"в наявності","year":"2024"}]\' style="font-size:.8rem"></textarea>'+
    '<div class="gap-btns mt">'+
      '<button class="btn btn-green" onclick="marketAgentImportJSON()">📥 Імпорт JSON</button>'+
      '<button class="btn btn-dark" onclick="marketAgentImportCSV()">📄 Імпорт CSV</button>'+
    '</div></details>';

  b.innerHTML=tabsHtml+
    '<div class="card" style="margin-bottom:14px">'+
      '<div style="font-size:.78rem;color:var(--text-dim);margin-bottom:10px">ℹ️ Центральна база цін нових шин. Пріоритет — білий список постачальників (100 ШИН №1). Зараз працює на demo/ручному імпорті — реальний парсинг сайтів підключимо пізніше (потрібен бекенд).</div>'+
      '<div class="gap-btns">'+
        '<button class="btn btn-red" style="flex:1;font-size:1rem;padding:13px" onclick="marketAgentLoadDemo()">🛞 Оновити ціни шин</button>'+
      '</div>'+
      '<div class="gap-btns mt">'+
        '<button class="btn btn-dark btn-sm" onclick="tireMarketGo(\'suppliers\')">⚙️ Постачальники</button>'+
        '<button class="btn btn-dark btn-sm" onclick="marketAgentClearPrices()">🗑 Очистити ціни</button>'+
      '</div>'+
      '<div style="font-size:.78rem;color:var(--text-dim);margin-top:8px">Унікальних шин у базі: <b>'+tires.length+'</b> · оферів усього: <b>'+tireMarketPrices.length+'</b></div>'+
    '</div>'+
    cards+importBlock;
}

// 10) Таблиця продавців по шині
function renderSupplierTable(tireKey){
  const offers=gtMarketOffersForKey(tireKey);
  if(!offers.length) return '<div style="color:var(--text-dim);font-size:.82rem">Немає оферів.</div>';
  const rows=offers.map(function(o){
    const fav=o.isFavoriteSupplier?' ⭐':'';
    return '<div style="border-top:1px solid rgba(255,255,255,.08);padding:8px 0">'+
      '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">'+
        '<div style="flex:1;min-width:140px">'+
          '<b>'+(o.sellerName||'—')+fav+'</b> <span style="font-size:.72rem;color:var(--text-dim)">#'+(o.sourcePriority||99)+'</span><br>'+
          '<span style="font-size:.8rem;color:var(--text-dim)">'+(o.city||'')+(o.availability?(' · '+o.availability):'')+(o.year?(' · '+o.year+'р'):'')+'</span>'+
        '</div>'+
        '<div style="text-align:right;font-weight:700;white-space:nowrap">'+fmtMoney(o.price||0)+'</div>'+
      '</div>'+
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">'+
        '<button class="btn btn-dark btn-sm" onclick="gtMarketCall(\''+(o.sellerPhone||'').replace(/'/g,'')+'\')">📞</button>'+
        '<button class="btn btn-dark btn-sm" onclick="gtMarketOpenUrl(\''+(o.productUrl||o.sellerWebsite||'').replace(/'/g,'')+'\')">🔗 Товар</button>'+
        '<button class="btn btn-dark btn-sm" onclick="gtMarketToggleFav(\''+o.id+'\')">⭐</button>'+
        '<button class="btn btn-dark btn-sm" onclick="gtMarketToStock(\''+o.id+'\')">📦 Склад</button>'+
        '<button class="btn btn-dark btn-sm" onclick="gtMarketToOrder(\''+o.id+'\')">🧾 Заказ</button>'+
        '<button class="btn btn-dark btn-sm" onclick="gtMarketEvalUsed(\''+o.id+'\')">♻️ Б/У</button>'+
      '</div>'+
    '</div>';
  }).join('');
  return '<div style="margin-top:4px"><div style="font-size:.74rem;color:var(--text-dim);display:flex;justify-content:space-between"><span>Продавець · Місто · Наявність · Рік</span><span>Ціна</span></div>'+rows+'</div>';
}

// ⚙️ Постачальники
function renderSupplierSettingsHTML(){
  const list=tireSuppliers.slice().sort(function(a,b){return (a.priority||99)-(b.priority||99);});
  const rows=list.map(function(s){
    return '<div class="card" style="margin-bottom:8px">'+
      '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center">'+
        '<div style="flex:1;min-width:160px"><b>'+s.name+'</b>'+(s.favorite?' ⭐':'')+(s.usedOnly?' <span style="font-size:.7rem;color:var(--text-dim)">(тільки Б/У)</span>':'')+'<br>'+
          '<span style="font-size:.78rem;color:var(--text-dim)">'+(s.website||'без сайту')+(s.phone?(' · '+s.phone):'')+'</span></div>'+
        '<div style="font-size:.78rem">Пріоритет <b>'+(s.priority||99)+'</b></div>'+
      '</div>'+
      '<div class="gap-btns mt" style="margin-top:8px">'+
        '<button class="btn btn-dark btn-sm" onclick="marketAgentEditSupplier(\''+s.id+'\')">✏️ Редагувати</button>'+
        '<button class="btn btn-dark btn-sm" onclick="marketAgentToggleSupplier(\''+s.id+'\')">'+(s.enabled?'🟢 Увімкнено':'⚪ Вимкнено')+'</button>'+
        '<button class="btn btn-dark btn-sm" onclick="marketAgentToggleFavSupplier(\''+s.id+'\')">'+(s.favorite?'⭐ Обраний':'☆ В обрані')+'</button>'+
      '</div></div>';
  }).join('');
  return '<div class="card" style="margin-bottom:12px"><div style="font-size:.84rem;color:var(--text-dim)">Білий список джерел цін. Чим менший пріоритет — тим вище в таблиці. 100 ШИН = №1.</div>'+
    '<div class="gap-btns mt"><button class="btn btn-green btn-sm" onclick="marketAgentAddSupplier()">➕ Додати постачальника</button></div></div>'+rows;
}
function marketAgentAddSupplier(){
  const name=prompt('Назва постачальника:'); if(!name||!name.trim()) return;
  const website=prompt('Сайт (необов\'язково):','')||'';
  const phone=prompt('Телефон (необов\'язково):','')||'';
  const pr=parseInt(prompt('Пріоритет (число, менше = вище):','11'))||11;
  tireSuppliers.push({ id:'s'+uid(), name:name.trim(), phone:phone.trim(), website:website.trim(), priority:pr, enabled:true, favorite:false, usedOnly:false });
  gtMarketSaveAll(); renderTireMarketPanel();
}
function marketAgentEditSupplier(id){
  const s=tireSuppliers.find(function(x){return x.id===id;}); if(!s) return;
  const phone=prompt('Телефон для '+s.name+':', s.phone||''); if(phone!==null) s.phone=phone.trim();
  const website=prompt('Сайт для '+s.name+':', s.website||''); if(website!==null) s.website=website.trim();
  const pr=prompt('Пріоритет для '+s.name+' (менше = вище):', s.priority||99); if(pr!==null){ const n=parseInt(pr); if(!isNaN(n)) s.priority=n; }
  // оновимо телефони/пріоритети у вже завантажених оферах
  tireMarketPrices.forEach(function(o){ if(o.sellerName===s.name){ o.sellerPhone=s.phone; o.sellerWebsite=o.sellerWebsite||s.website; o.sourcePriority=s.priority; } });
  gtMarketSaveAll(); renderTireMarketPanel();
}
function marketAgentToggleSupplier(id){ const s=tireSuppliers.find(function(x){return x.id===id;}); if(s){ s.enabled=!s.enabled; gtMarketSaveAll(); renderTireMarketPanel(); } }
function marketAgentToggleFavSupplier(id){
  const s=tireSuppliers.find(function(x){return x.id===id;}); if(!s) return;
  s.favorite=!s.favorite;
  tireMarketPrices.forEach(function(o){ if(o.sellerName===s.name) o.isFavoriteSupplier=s.favorite; });
  gtMarketSaveAll(); renderTireMarketPanel();
}

// test-аксесори (читання let-стану через замикання; не впливають на CRM)
function __sup(){ return tireSuppliers; }
function __clearTM(){ tireMarketPrices=[]; save('tireMarketPrices',[]); }
function __tmSub(s){ tireMarketSub=s; renderTireMarketPanel(); }

// <<< GT TIRES MARKET AGENT MODULE END <<<

function init(){
  if(topSecret){ document.body.classList.add('ts-active'); document.getElementById('tsToggle').textContent='🔒 Деактивувати'; document.getElementById('tsToggle').classList.add('btn-green'); document.getElementById('tsToggle').classList.remove('btn-red'); }
  renderCatTiles(); renderPrice();
  renderOrders();
  renderClients();
  renderTires();
  renderWarehouse();
  renderTireAI();
  renderAiTools();
  try{ syncMarketPricesToUsedCalculator(); renderTireMarketPanel(); }catch(e){console.warn('MarketAgent init',e);}
  renderCash();
  renderSalary();
  showReport('daily');
}
init();
// ==================== MODERN UI: menu / theme / background ====================
function toggleMenu(force){
  const open = (typeof force==='boolean') ? force : !document.body.classList.contains('nav-open');
  document.body.classList.toggle('nav-open', open);
}
function _hex2rgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return[(n>>16)&255,(n>>8)&255,n&255];}
function _mix(h,amt){const c=_hex2rgb(h);const t=amt>0?255:0;const p=Math.abs(amt);return '#'+c.map(v=>Math.max(0,Math.min(255,Math.round(v+(t-v)*p))).toString(16).padStart(2,'0')).join('');}
function applyThemeColor(hex){const r=document.documentElement.style;r.setProperty('--red',hex);r.setProperty('--red-light',_mix(hex,.22));r.setProperty('--red-dark',_mix(hex,-.25));r.setProperty('--accent',_mix(hex,.3));}
function setThemeColor(hex){applyThemeColor(hex);try{saveVal('themeColor',hex);}catch(e){}const ci=document.getElementById('themeColorInput');if(ci)ci.value=hex;}
function applyBg(url){const el=document.getElementById('appBg');if(!el)return;if(url){el.style.backgroundImage='url("'+url+'")';document.body.classList.add('has-bg');}else{el.style.backgroundImage='';document.body.classList.remove('has-bg');}}
function loadBgFile(input){const f=input.files&&input.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const max=1200;let w=im.width,h=im.height;if(w>max){h=Math.round(h*max/w);w=max;}const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,0,0,w,h);let data;try{data=c.toDataURL('image/jpeg',.72);}catch(e){data=r.result;}applyBg(data);try{saveVal('bgImage',data);}catch(e){alert('Фон показано, але не вдалось зберегти (завелике фото)');}};im.src=r.result;};r.readAsDataURL(f);}
function clearBg(){localStorage.removeItem(LS_KEY+'bgImage');applyBg('');}
(function(){
  if(window.innerWidth>860) document.body.classList.add('nav-open');
  document.querySelectorAll('.nav button').forEach(b=>b.addEventListener('click',()=>{ if(window.innerWidth<=860) toggleMenu(false); }));
  const sc=loadVal('themeColor'); if(sc) applyThemeColor(sc);
  const bg=loadVal('bgImage'); if(bg) applyBg(bg);
  const ci=document.getElementById('themeColorInput');
  if(ci){ ci.value = sc || (getComputedStyle(document.documentElement).getPropertyValue('--red').trim()||'#D32F2F'); ci.addEventListener('input',e=>setThemeColor(e.target.value)); }
})();

// ==================== SUPABASE SYNC (additive, offline-first) ====================
const SUPA_URL_DEFAULT='https://lxeswqlkereptdtwytbp.supabase.co';const SUPA_KEY_DEFAULT='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4ZXN3cWxrZXJlcHRkdHd5dGJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MzEyNDgsImV4cCI6MjA5NjQwNzI0OH0.CIkN-KAhlM6TgFzdkaCyUbnvTq4OmiNH953IHJR4x5E';const SUPA_CFG={url:()=>localStorage.getItem('gt_supa_url')||SUPA_URL_DEFAULT,key:()=>localStorage.getItem('gt_supa_key')||SUPA_KEY_DEFAULT};
let _supaClient=null;let _session=null;
function getSupa(){ if(_supaClient)return _supaClient; const u=SUPA_CFG.url(),k=SUPA_CFG.key(); if(!u||!k||!window.supabase)return null; try{_supaClient=window.supabase.createClient(u,k);}catch(e){_supaClient=null;} return _supaClient; }
const SYNC_Q_KEY='gt_tires_v4_syncQueue';
function _q(){ try{return JSON.parse(localStorage.getItem(SYNC_Q_KEY))||[];}catch(e){return[];} }
function _setQ(a){ try{localStorage.setItem(SYNC_Q_KEY,JSON.stringify(a.slice(-5000)));}catch(e){} }
function enqueue(table,rows){ const q=_q(); (Array.isArray(rows)?rows:[rows]).forEach(r=>q.push({table,row:r})); _setQ(q); updateSyncStatus(); }
function _rSize(n){ const m=(n||'').match(/R\s?(\d{1,2}(?:[.,]\d)?)/i); return m?('R'+m[1].replace(',','.')):''; }
function mapClient(c){ return {id:c.id,name:c.name||'',phone:c.phone||'',car:c.car||'',plate:c.plate||'',driver:c.driver||'',note:c.note||'',tire_size:c.tireSize||c.tire_size||'',created_at:c.date||c.created_at||new Date().toISOString(),updated_at:new Date().toISOString()}; }
function mapOrder(o){ const paid=(o.paidAmount!=null)?o.paidAmount:(o.status==='paid'?(o.total||0):(o.paid_amount||0)); return {id:o.id,order_number:o.order_number||o.orderNumber||null,client_id:o.client_id||o.clientId||null,client_name:o.clientName||o.client_name||'',phone:o.phone||'',car:o.car||'',plate:o.plate||'',driver:o.driver||'',status:o.status||'new',total:o.total||0,paid_amount:paid,debt:Math.max(0,(o.total||0)-paid),payment_type:o.payment_type||o.paymentType||null,comment:o.notes||o.comment||'',created_at:o.date||o.created_at||new Date().toISOString(),updated_at:new Date().toISOString()}; }
function mapItems(o){ return (o.services||o.items||[]).map((s,i)=>({id:o.id+'_'+i,order_id:o.id,name:s.name||'',category:s.category||null,qty:s.qty||1,unit:s.unit||'шт',price:s.price||0,total:(s.price||0)*(s.qty||1),created_at:o.date||new Date().toISOString()})); }
function mapServicesFromPrice(){ const out=[]; let cat=''; if(typeof PRICE_LIST!=='undefined'){ PRICE_LIST.forEach(it=>{ if(it&&it.cat!=null){ cat=(typeof CAT_META!=='undefined'&&CAT_META[it.cat])?CAT_META[it.cat].name:String(it.cat); return; } if(it&&it.id!=null&&it.name){ out.push({id:'svc_'+it.id,name:it.name,category:cat,type:null,size:_rSize(it.name),unit:'шт',price:effPrice(it),is_active:true,created_at:new Date().toISOString(),updated_at:new Date().toISOString()}); } }); } (customServices||[]).forEach(c=>{ out.push({id:'svc_'+c.id,name:c.name,category:'Власні',type:null,size:'',unit:'шт',price:effPrice(c),is_active:true,created_at:new Date().toISOString(),updated_at:new Date().toISOString()}); }); return out; }

/* Синхронізація прайсу CRM -> Mini App (app_prices).
   Mini App має власну таксономію категорій (тип авто клієнта), відмінну від
   технічних категорій CRM — мапимо тільки ті, що мають прямий відповідник.
   Рядки, синхронізовані звідси, позначені source='crm_sync' і безпечно
   перезаписуються щоразу; вручну додані адміном у Mini App рядки не чіпаються. */
const MINIAPP_CAT_MAP = { 0:'Легкові', 1:'Вантажні', 2:'С/Г та спецтехніка' };
async function syncPriceToMiniApp(){
  const s = getSupa();
  if(!s){ alert('Спочатку вкажіть URL і ключ Supabase'); return; }
  if(!navigator.onLine){ alert('Немає інтернету'); return; }
  const rows = [];
  let cat = -1, sort = 0;
  PRICE_LIST.forEach(it=>{
    if(it && it.id===undefined && it.cat!==undefined){ cat = it.cat; return; }
    if(!it || !it.id) return;
    const miniCat = MINIAPP_CAT_MAP[cat];
    if(!miniCat) return; // ця категорія CRM не має відповідника в Mini App — пропускаємо
    rows.push({
      id: crypto.randomUUID ? crypto.randomUUID() : ('crm-'+it.id+'-'+Date.now()),
      category: miniCat,
      subcategory: null,
      name: it.name,
      price: String(effPrice(it)),
      sort: sort++,
      source: 'crm_sync',
    });
  });
  if(!rows.length){ alert('Немає послуг для синхронізації (перевірте категорії Легкові/Вантажні/Сільгосп)'); return; }
  try{
    // Спочатку прибираємо старі синхронізовані рядки, щоб не накопичувались дублікати
    const { error: delErr } = await s.from('app_prices').delete().eq('source','crm_sync');
    if(delErr){ alert('Помилка очищення старого прайсу: '+delErr.message); return; }
    const { error: insErr } = await s.from('app_prices').insert(rows);
    if(insErr){ alert('Помилка вивантаження: '+insErr.message); return; }
    alert('✅ Синхронізовано '+rows.length+' позицій у Mini App (Легкові/Вантажні/Сільгосп).\nІнші категорії (латки, вентилі тощо) в Mini App не показуються — там немає для них місця в структурі клієнтського прайсу.');
  }catch(e){ alert('Помилка: '+e.message); }
}
function mapProducts(){ const out=[]; (typeof warehouse!=='undefined'?warehouse:[]).forEach(w=>out.push({id:w.id,name:w.name||'',category:'Матеріали',sku:w.sku||null,qty:w.qty||0,min_qty:w.min_qty||0,buy_price:w.buy_price||0,sell_price:w.price||w.sell_price||0,image:null,created_at:new Date().toISOString(),updated_at:new Date().toISOString()})); (typeof tires!=='undefined'?tires:[]).forEach(t=>out.push({id:t.id,name:((t.brand||'Шина')+' '+(t.size||'')).trim(),category:'Шини',sku:null,qty:t.qty||0,min_qty:0,buy_price:0,sell_price:t.price||0,image:null,created_at:new Date().toISOString(),updated_at:new Date().toISOString()})); return out; }
function mapCash(){ return (typeof cashbook!=='undefined'?cashbook:[]).map(c=>({id:c.id,type:c.type||'income',amount:c.amount||0,method:c.method||null,order_id:c.orderId||null,comment:c.desc||c.comment||'',created_at:c.date||new Date().toISOString()})); }
async function _upsert(table,rows,conflict){ const s=getSupa(); if(!s||!navigator.onLine){ enqueue(table,rows); return {queued:true}; } try{ const {error}=await s.from(table).upsert(rows,{onConflict:conflict||'id'}); if(error){ enqueue(table,rows); return {error}; } return {ok:true}; }catch(e){ enqueue(table,rows); return {error:e}; } }
async function saveClientToSupabase(c){ return _upsert('v4_clients',mapClient(c)); }
async function saveOrderToSupabase(o){ const r=await _upsert('v4_orders',mapOrder(o)); const it=mapItems(o); if(it.length)await _upsert('v4_order_items',it); return r; }
async function saveServiceToSupabase(s){ return _upsert('v4_services',s); }
async function saveProductToSupabase(p){ return _upsert('v4_products',p); }
async function savePaymentToSupabase(p){ return _upsert('v4_payments',p); }
async function flushQueue(){ const s=getSupa(); if(!s||!navigator.onLine||!_session){updateSyncStatus();return;} const q=_q(); if(!q.length){updateSyncStatus();return;} const byT={}; q.forEach(it=>{(byT[it.table]=byT[it.table]||[]).push(it.row);}); try{ for(const t in byT){ const {error}=await s.from(t).upsert(byT[t],{onConflict:'id'}); if(error)return; } _setQ([]); updateSyncStatus(); }catch(e){} }
async function syncToSupabase(){ const s=getSupa(); if(!s){alert('Спочатку вкажіть URL і ключ Supabase');return;} if(!_session){alert('Спочатку увійдіть у систему');return;} if(!navigator.onLine){alert('Немає інтернету');return;} const sb=document.getElementById('supaStatus'); if(sb)sb.textContent='Вивантаження…'; const steps=[['v4_clients',(clients||[]).map(mapClient)],['v4_services',mapServicesFromPrice()],['v4_products',mapProducts()],['v4_orders',(orders||[]).map(mapOrder)],['v4_order_items',[].concat(...(orders||[]).map(mapItems))],['v4_cash_operations',mapCash()]]; const log=[]; for(const [t,rows] of steps){ if(!rows.length){log.push(t+': 0');continue;} try{ const {error}=await s.from(t).upsert(rows,{onConflict:'id'}); log.push(t+': '+(error?('ПОМИЛКА '+error.message):rows.length)); }catch(e){ log.push(t+': ПОМИЛКА '+e.message); } } if(sb)sb.textContent='Готово'; updateSyncStatus(); alert('Вивантажено:\n'+log.join('\n')); }
async function loadFromSupabase(){ const s=getSupa(); if(!s){alert('Спочатку вкажіть URL і ключ Supabase');return;} if(!_session){alert('Спочатку увійдіть у систему');return;} if(!confirm("Завантажити дані з Supabase і обʼєднати з локальними? Локальні записи НЕ видаляються."))return; const mergeById=(local,cloud)=>{const m={};(local||[]).forEach(x=>m[x.id]=x);cloud.forEach(x=>m[x.id]={...m[x.id],...x});return Object.values(m);}; try{ const cl=((await s.from('v4_clients').select('*')).data)||[]; const or=((await s.from('v4_orders').select('*')).data)||[]; const oi=((await s.from('v4_order_items').select('*')).data)||[]; const ca=((await s.from('v4_cash_operations').select('*')).data)||[]; const pr=((await s.from('v4_products').select('*')).data)||[]; clients=mergeById(clients,cl.map(c=>({id:c.id,name:c.name,phone:c.phone,car:c.car,plate:c.plate,driver:c.driver,note:c.note,tireSize:c.tire_size,date:c.created_at}))); save('clients',clients); const ibo={}; oi.forEach(i=>{(ibo[i.order_id]=ibo[i.order_id]||[]).push({id:i.id,name:i.name,price:+i.price,qty:+i.qty,unit:i.unit});}); const cloudOrders=or.map(o=>({id:o.id,date:o.created_at,clientName:o.client_name,phone:o.phone,car:o.car,plate:o.plate,driver:o.driver,total:+o.total,notes:o.comment,status:o.status,services:ibo[o.id]||[]})); orders=mergeById(orders,cloudOrders); save('orders',orders); cashbook=mergeById((typeof cashbook!=='undefined'?cashbook:[]), ca.map(c=>({id:c.id,date:c.created_at,type:c.type||'income',amount:+c.amount,method:c.method,desc:c.comment,orderId:c.order_id}))); save('cash',cashbook); const prT=pr.filter(p=>p.category==='Шини').map(p=>({id:p.id,brand:p.name,size:'',qty:+p.qty||0,price:+p.sell_price||0})); const prW=pr.filter(p=>p.category!=='Шини').map(p=>({id:p.id,name:p.name,qty:+p.qty||0,unit:'шт',sku:p.sku,min_qty:+p.min_qty||0,buy_price:+p.buy_price||0,price:+p.sell_price||0})); tires=mergeById((typeof tires!=='undefined'?tires:[]),prT); save('tires',tires); warehouse=mergeById((typeof warehouse!=='undefined'?warehouse:[]),prW); save('warehouse',warehouse); if(typeof renderOrders==='function')renderOrders(); if(typeof renderClients==='function')renderClients(); if(typeof renderCash==='function')renderCash(); if(typeof renderTires==='function')renderTires(); if(typeof renderWarehouse==='function')renderWarehouse(); if(typeof renderHome==='function')renderHome(); updateSyncStatus(); alert('Завантажено: клієнтів '+cl.length+', заказів '+or.length+', позицій '+oi.length+', каса '+ca.length+', товари '+pr.length); }catch(e){ alert('Помилка завантаження: '+e.message); } }
let _sig={};
function _collSig(n,a){ return n+':'+(a?a.length:0)+':'+(a?JSON.stringify(a).length:0); }
async function gtAutoSync(){ if(!getSupa()||!navigator.onLine||!_session){updateSyncStatus();return;} await flushQueue(); await assignServerNumbers(); const colls={'v4_clients':(clients||[]).map(mapClient),'v4_products':mapProducts(),'v4_orders':(orders||[]).map(mapOrder),'v4_order_items':[].concat(...(orders||[]).map(mapItems)),'v4_cash_operations':mapCash()}; const s=getSupa(); for(const t in colls){ const sig=_collSig(t,colls[t]); if(sig!==_sig[t]&&colls[t].length){ try{ const {error}=await s.from(t).upsert(colls[t],{onConflict:'id'}); if(!error)_sig[t]=sig; }catch(e){} } else _sig[t]=sig; } updateSyncStatus(); }
function updateSyncStatus(){ const el=document.getElementById('supaStatus'); if(!el)return; const cfg=!!(SUPA_CFG.url()&&SUPA_CFG.key()); el.textContent=(navigator.onLine?'🟢 Online':'🔴 Offline')+' · '+(cfg?'налаштовано':'НЕ налаштовано')+' · у черзі: '+_q().length; }
function saveSupaCfg(){ const u=document.getElementById('supaUrl'),k=document.getElementById('supaKey'); localStorage.setItem('gt_supa_url',(u?u.value:'').trim()); localStorage.setItem('gt_supa_key',(k?k.value:'').trim()); _supaClient=null; getSupa(); updateSyncStatus(); flushQueue(); alert('Підключення збережено.'); }
window.addEventListener('online',()=>{flushQueue();updateSyncStatus();});
window.addEventListener('offline',updateSyncStatus);
async function doLogin(){
  const em=(document.getElementById('authEmail').value||'').trim();
  const pw=document.getElementById('authPass').value||'';
  const er=document.getElementById('authErr'); if(er)er.textContent='';
  const s=getSupa(); if(!s){ if(er)er.textContent='Немає звʼязку з сервером'; return; }
  const btn=document.getElementById('authBtn'); if(btn){btn.disabled=true;btn.textContent='Вхід…';}
  try{ const {data,error}=await s.auth.signInWithPassword({email:em,password:pw});
    if(error){ if(er)er.textContent='Невірний email або пароль'; }
    else { _session=data.session; showApp(); }
  }catch(e){ if(er)er.textContent='Помилка входу'; }
  if(btn){btn.disabled=false;btn.textContent='Увійти';}
}
async function doLogout(){ const s=getSupa(); if(s){ try{ await s.auth.signOut(); }catch(e){} } _session=null; document.body.classList.add('locked'); const p=document.getElementById('authPass'); if(p)p.value=''; const er=document.getElementById('authErr'); if(er)er.textContent=''; }
function showApp(){ document.body.classList.remove('locked'); updateSyncStatus(); flushQueue(); }
function _hasPersistedSession(){ try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&k.indexOf('-auth-token')>-1 && (localStorage.getItem(k)||'').length>20) return true; } }catch(e){} return false; }
function _previewBadge(txt){ if(document.getElementById('previewBadge'))return; const d=document.createElement('div'); d.id='previewBadge'; d.textContent=txt; d.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:10px;z-index:9998;background:rgba(211,47,47,.92);color:#fff;font-size:0.72rem;padding:6px 13px;border-radius:20px;box-shadow:0 4px 14px rgba(0,0,0,.5);max-width:92vw;text-align:center'; document.body.appendChild(d); }
async function initAuth(){
  // Спробувати відновити сесію з localStorage (auto-login)
  const s = getSupa();
  if(s){
    try{
      const { data } = await s.auth.getSession();
      if(data && data.session){
        _session = data.session;
        showApp();
        return;
      }
    }catch(e){}
  }
  // Якщо сесії немає — показати форму входу
  document.body.classList.add('locked');
  const lo=document.querySelector('.logout-wrap'); if(lo) lo.style.display='';
}
function setOrderBg(v){ document.documentElement.style.setProperty('--order-bg', v); localStorage.setItem(LS_KEY+'orderBg', v); }
function resetOrderBg(){ localStorage.removeItem(LS_KEY+'orderBg'); document.documentElement.style.setProperty('--order-bg','#1E1E1E'); var i=document.getElementById('orderBgInput'); if(i)i.value='#1e1e1e'; }
function applyOrderBg(){ var v=localStorage.getItem(LS_KEY+'orderBg'); if(v){ document.documentElement.style.setProperty('--order-bg', v); } var i=document.getElementById('orderBgInput'); if(i)i.value=(v||'#1e1e1e'); }
function applyHeader(){
  const t=localStorage.getItem(LS_KEY+'hdrTitle')||'';
  const img=localStorage.getItem(LS_KEY+'hdrImg')||'';
  const te=document.getElementById('hdrTitle'); if(te) te.textContent=t;
  document.body.classList.toggle('has-hdr-title', !!t);
  const ie=document.getElementById('hdrPhoto'); if(ie&&img) ie.src=img;
  document.body.classList.toggle('has-hdr-photo', !!img);
  if(localStorage.getItem(LS_KEY+'hdrCollapsed')==='1') document.body.classList.add('hdr-collapsed');
  const ti=document.getElementById('hdrTitleInput'); if(ti&&!ti.value) ti.value=t;
  const bt=document.getElementById('hdrToggle'); if(bt) bt.textContent=document.body.classList.contains('hdr-collapsed')?'▼':'▲';
}
function setHeaderTitle(v){ v=(v||'').trim(); localStorage.setItem(LS_KEY+'hdrTitle',v); const te=document.getElementById('hdrTitle'); if(te) te.textContent=v; document.body.classList.toggle('has-hdr-title',!!v); }
function loadHeaderPhoto(input){ const f=input.files&&input.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ const im=new Image(); im.onload=()=>{ const max=1000; let w=im.width,h=im.height; if(w>max){h=Math.round(h*max/w);w=max;} const c=document.createElement('canvas'); c.width=w;c.height=h; c.getContext('2d').drawImage(im,0,0,w,h); let data; try{data=c.toDataURL('image/jpeg',.78);}catch(e){data=r.result;} const ie=document.getElementById('hdrPhoto'); if(ie) ie.src=data; document.body.classList.add('has-hdr-photo'); try{localStorage.setItem(LS_KEY+'hdrImg',data);}catch(e){alert('Фото показано, але завелике для збереження');} }; im.src=r.result; }; r.readAsDataURL(f); }
function clearHeaderPhoto(){ localStorage.removeItem(LS_KEY+'hdrImg'); const ie=document.getElementById('hdrPhoto'); if(ie) ie.src=''; document.body.classList.remove('has-hdr-photo'); }
function toggleHeader(){ const c=document.body.classList.toggle('hdr-collapsed'); localStorage.setItem(LS_KEY+'hdrCollapsed', c?'1':'0'); const bt=document.getElementById('hdrToggle'); if(bt) bt.textContent=c?'▼':'▲'; }
const HOME_WIDGETS=[
 {k:'inc',t:'Дохід',ic:'💰'},{k:'exp',t:'Витрати',ic:'💸'},{k:'bal',t:'Баланс',ic:'⚖️'},
 {k:'cashm',t:'Готівка',ic:'💵'},{k:'cashless',t:'Безготівка',ic:'💳'},
 {k:'ordc',t:'Замовлень',ic:'📋'},{k:'debt',t:'Борг',ic:'⚠️'},{k:'cli',t:'Клієнтів',ic:'👥'},
 {k:'recent',t:'Останні замовлення',ic:'🕓'},{k:'newbtn',t:'Кнопка «Нове замовлення»',ic:'➕'}
];
const HOME_DEFAULT=['inc','exp','bal','cashm','ordc','debt','recent'];
let homeWidgets=(()=>{ const a=load('homeW'); return (a&&a.length)?a:HOME_DEFAULT.slice(); })();
let homeEdit=false;
let homePeriod='today';
function _inPeriod(ds,p){
  if(p==='all') return true;
  if(!ds) return false;
  const d=String(ds).slice(0,10), t=today();
  if(p==='today') return d===t;
  if(p==='month') return d.slice(0,7)===t.slice(0,7);
  if(p==='week'){ const diff=(new Date(t)-new Date(d))/86400000; return diff>=0 && diff<7; }
  return true;
}
function setHomePeriod(p){ homePeriod=p; renderHome(); }
function homeMetrics(){
  const p=homePeriod;
  const cb=(cashbook||[]).filter(c=>_inPeriod(c.date,p));
  const inc=cb.filter(c=>c.type==='income').reduce((s,c)=>s+c.amount,0);
  const exp=cb.filter(c=>c.type==='expense').reduce((s,c)=>s+c.amount,0);
  const cashm=cb.filter(c=>c.type==='income'&&(c.method||'cash')==='cash').reduce((s,c)=>s+c.amount,0);
  const cashless=cb.filter(c=>c.type==='income'&&c.method==='cashless').reduce((s,c)=>s+c.amount,0);
  const debt=(orders||[]).reduce((s,o)=>s+getOrderDebtAmount(o),0);
  const debtc=(orders||[]).filter(o=>getOrderDebtAmount(o)>0).length;
  const ordc=(orders||[]).filter(o=>_inPeriod(o.date,p)).length;
  return {inc,exp,bal:inc-exp,cashm,cashless,ordc,debt,debtc,cli:(clients||[]).length};
}
function _statCard(num,lbl,color){ return `<div class="stat-card"><div class="num"${color?` style="color:${color}"`:''}>${num}</div><div class="lbl">${lbl}</div></div>`; }
function _statCardOrder(k,num,lbl,color){ const ctrl=homeEdit?`<div class="reorder"><button onclick="event.stopPropagation();moveHomeWidget('${k}',-1)">◀</button><button onclick="event.stopPropagation();moveHomeWidget('${k}',1)">▶</button></div>`:''; return `<div class="stat-card" style="position:relative">${ctrl}<div class="num"${color?` style="color:${color}"`:''}>${num}</div><div class="lbl">${lbl}</div></div>`; }
function moveHomeWidget(k,dir){ const metrics=['inc','exp','bal','cashm','cashless','ordc','debt','cli']; const idxs=homeWidgets.map((x,i)=>metrics.includes(x)?i:-1).filter(i=>i>=0); const pos=homeWidgets.indexOf(k); const at=idxs.indexOf(pos); const sw=at+dir; if(sw<0||sw>=idxs.length) return; const a=idxs[at],b=idxs[sw]; const t=homeWidgets[a]; homeWidgets[a]=homeWidgets[b]; homeWidgets[b]=t; save('homeW',homeWidgets); renderHome(); }
function renderHome(){
  const c=document.getElementById('homeContent'); if(!c) return;
  const m=homeMetrics(); const on=k=>homeWidgets.includes(k);
  const PL={today:'Сьогодні',week:'Тиждень',month:'Місяць',all:'Все'};
  let pbar='<div class="hperiod">'+['today','week','month','all'].map(p=>`<button class="hperiod-btn${homePeriod===p?' active':''}" onclick="setHomePeriod('${p}')">${PL[p]}</button>`).join('')+'</div>';
  const M={inc:[fmtMoney(m.inc),'Дохід','var(--green)'],exp:[fmtMoney(m.exp),'Витрати','var(--accent)'],bal:[fmtMoney(m.bal),'Баланс',''],cashm:[fmtMoney(m.cashm),'💵 Готівка','var(--green)'],cashless:[fmtMoney(m.cashless),'💳 Безготівка','#42a5f5'],ordc:[m.ordc,'Замовлень',''],debt:[fmtMoney(m.debt),'Борг ('+m.debtc+')','var(--accent)'],cli:[m.cli,'Клієнтів','']};
  let cards='';
  homeWidgets.forEach(k=>{ if(M[k]){ const a=M[k]; cards+=_statCardOrder(k,a[0],a[1],a[2]); } });
  let html='';
  if(on('newbtn')) html+=`<button class="btn btn-red" style="width:100%;margin-bottom:12px" onclick="openNewOrder()">＋ Нове замовлення</button>`;
  if(cards) html+=`<div class="stats-grid">${cards}</div>`;
  if(on('recent')){
    const rec=[...(orders||[])].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
    html+=`<div class="card mt"><h3 style="margin-bottom:8px">🕓 Останні замовлення</h3>`;
    html+= rec.length? rec.map(o=>`<div class="flex-between" style="padding:7px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="viewOrder('${o.id}')"><span style="font-size:0.84rem">#${o.orderNumber||o.id.slice(-5).toUpperCase()} · ${o.clientName||'—'}</span><b style="font-family:'Oswald'">${fmtMoney(o.total||0)}</b></div>`).join('') : '<div style="color:var(--text-dim);font-size:0.84rem">Поки порожньо</div>';
    html+=`</div>`;
  }
  if(!html) html='<div class="card" style="text-align:center;color:var(--text-dim);padding:24px">Немає блоків. Натисни «✏️ Налаштувати».</div>';
  c.innerHTML=pbar+html;
}
function toggleHomeEdit(){
  homeEdit=!homeEdit; const p=document.getElementById('homeEditPanel'); if(!p) return;
  if(!homeEdit){ p.style.display='none'; return; }
  p.style.display='block';
  p.innerHTML='<div class="card"><h3 style="margin-bottom:8px">Які блоки показувати</h3>'+HOME_WIDGETS.map(w=>`<label style="display:flex;align-items:center;gap:10px;padding:7px 0;font-size:0.9rem;cursor:pointer"><input type="checkbox" ${homeWidgets.includes(w.k)?'checked':''} onchange="toggleHomeWidget('${w.k}',this.checked)" style="width:18px;height:18px"> ${w.ic} ${w.t}</label>`).join('')+'</div>';
}
function toggleHomeWidget(k,onv){
  if(onv){ if(!homeWidgets.includes(k)) homeWidgets.push(k); } else { homeWidgets=homeWidgets.filter(x=>x!==k); }
  save('homeW',homeWidgets); renderHome();
}
(function(){ const u=document.getElementById('supaUrl'),k=document.getElementById('supaKey'); if(u)u.value=SUPA_CFG.url(); if(k)k.value=SUPA_CFG.key(); updateSyncStatus(); applyHeader(); renderHome(); openNewOrder(); initOrderInteractions(); renderOrderListFilters(); applyOrderBg(); (function(){var _pet=document.getElementById('priceEditToggle'); if(_pet)_pet.checked=priceEditOn;})(); initAuth(); setInterval(gtAutoSync,30000); })();
