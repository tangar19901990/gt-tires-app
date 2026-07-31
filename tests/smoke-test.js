/**
 * GT Tires CRM — smoke-test.js
 * -----------------------------------------------------------
 * Автоматична перевірка критичної бізнес-логіки ПЕРЕД тим, як
 * заливати зміни на GitHub Pages. Не замінює ручну перевірку
 * на телефоні, але ловить типові регресії за секунди:
 *   - розсинхрон номерів категорій (CAT_META vs PRICE_LIST vs CAT_ICONS)
 *   - биті/дублікатні id послуг
 *   - поламаний розрахунок ціни при додаванні послуги в замовлення
 *   - зникнення ключових функцій після рефакторингу
 *
 * ЗАПУСК (з папки з app.js та index.html):
 *   node smoke-test.js
 *
 * Вихід: exit code 0 = все ок, 1 = знайдено проблему (текст помилки в консолі).
 * -----------------------------------------------------------
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const DIR = __dirname;
let failed = 0;
const ok = (label) => console.log(`  ✅ ${label}`);
const fail = (label, detail) => { failed++; console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`); };

function section(title){ console.log(`\n${title}`); }

async function main(){
  console.log('GT Tires CRM — smoke test\n' + '='.repeat(40));

  // ---- Завантажуємо реальний HTML + app.js у jsdom ----
  let html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf-8');
  // Прибираємо зовнішні ресурси (шрифти/Supabase CDN/CSS) — тест не має мережі і вони не потрібні для логіки
  html = html
    .replace(/<link[^>]*fonts\.googleapis[^>]*>/g, '')
    .replace(/<script[^>]*supabase[^>]*><\/script>/g, '')
    .replace(/<link[^>]*styles\.css[^>]*>/g, '')
    .replace(/<script[^>]*print\.js[^>]*><\/script>/g, '')
    .replace(/<script[^>]*app\.js[^>]*><\/script>/g, ''); // app.js підключимо вручну нижче, без мережі

  const dom = new JSDOM(html, {
    url: 'https://tangar19901990.github.io/gt-tires-app/',
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
  });
  const { window } = dom;

  // Заглушки для речей, яких немає в jsdom / не повинні реально спрацьовувати в тесті
  window.localStorage.clear();
  window.fetch = async () => ({ ok:false, json: async () => ({}) }); // без реальних запитів до Supabase
  window.navigator.vibrate = () => {};
  window.alert = () => {};
  window.confirm = () => true;
  window.supabase = { createClient: () => ({ from: () => ({ select:()=>({data:[],error:null}), upsert:()=>({data:[],error:null}) }) }) };

  // Підключаємо app.js напряму з локального файлу (без мережі)
  const appJsSrc = fs.readFileSync(path.join(DIR, 'app.js'), 'utf-8');
  const scriptEl = window.document.createElement('script');
  scriptEl.textContent = appJsSrc;
  window.document.body.appendChild(scriptEl);

  // print.js — окремий файл з друком рахунку, теж критичний
  const printJsPath = path.join(DIR, 'print.js');
  if (fs.existsSync(printJsPath)) {
    const printJsSrc = fs.readFileSync(printJsPath, 'utf-8');
    const printScriptEl = window.document.createElement('script');
    printScriptEl.textContent = printJsSrc;
    window.document.body.appendChild(printScriptEl);
  }

  // Дати скриптам у HTML (включно з app.js) відпрацювати
  await new Promise(res => setTimeout(res, 300));

  const w = window;
  // CAT_META / PRICE_LIST / CAT_ICONS оголошені через const у app.js — вони НЕ стають window.XXX
  // (особливість JS: top-level const/let не потрапляють у властивості window). Дістаємо через eval
  // у контексті самої сторінки, де ці ідентифікатори видимі як глобальні лексичні біндинги.
  const getGlobal = (name) => { try { return w.eval(name); } catch(e){ return undefined; } };

  // ==================== 1. КАТЕГОРІЇ ====================
  section('1. Категорії (CAT_META / PRICE_LIST / CAT_ICONS)');
  if (!Array.isArray(getGlobal("CAT_META"))) {
    fail('CAT_META існує і є масивом');
  } else {
    ok(`CAT_META знайдено (${getGlobal("CAT_META").length} категорій)`);

    // Зібрати всі {cat:N} маркери, реально використані в PRICE_LIST
    const usedCats = new Set();
    getGlobal("PRICE_LIST").forEach(it => { if (it.id === undefined && it.cat !== undefined) usedCats.add(it.cat); });

    const maxUsed = Math.max(...usedCats);
    if (maxUsed >= getGlobal("CAT_META").length) {
      fail('Усі {cat:N} в PRICE_LIST вказують на існуючу категорію',
        `PRICE_LIST посилається на cat:${maxUsed}, а в CAT_META лише ${getGlobal("CAT_META").length} елементів (0..${getGlobal("CAT_META").length-1})`);
    } else {
      ok(`Усі {cat:N} в межах діапазону CAT_META (макс. використаний: ${maxUsed})`);
    }

    // Кожна категорія з CAT_META має хоч одну послугу
    const emptyCats = getGlobal("CAT_META").map((c,i)=>i).filter(i => !usedCats.has(i));
    if (emptyCats.length) {
      fail('Немає категорій без жодної послуги', `порожні індекси: ${emptyCats.join(', ')}`);
    } else {
      ok('Кожна категорія з CAT_META має хоча б одну послугу');
    }

    // CAT_ICONS не виходить за межі CAT_META
    if (typeof getGlobal("CAT_ICONS") === 'object') {
      const badIcons = Object.keys(getGlobal("CAT_ICONS")).map(Number).filter(k => k >= getGlobal("CAT_META").length);
      if (badIcons.length) {
        fail('CAT_ICONS не має "зайвих" ключів поза CAT_META', `зайві ключі: ${badIcons.join(', ')}`);
      } else {
        ok(`CAT_ICONS узгоджений з CAT_META (${Object.keys(getGlobal("CAT_ICONS")).length} картинок)`);
      }
    }
  }

  // ==================== 2. ПОСЛУГИ (id) ====================
  section('2. Цілісність списку послуг (PRICE_LIST)');
  const items = getGlobal("PRICE_LIST").filter(it => it.id !== undefined);
  ok(`Знайдено ${items.length} послуг`);

  const ids = items.map(it => it.id);
  const dupIds = ids.filter((id,i) => ids.indexOf(id) !== i);
  if (dupIds.length) {
    fail('Немає дублікатів id серед послуг', `дублікати: ${[...new Set(dupIds)].join(', ')}`);
  } else {
    ok('Дублікатів id немає');
  }

  const badPrice = items.filter(it => typeof it.price !== 'number' || it.price < 0 || isNaN(it.price));
  if (badPrice.length) {
    fail('У всіх послуг коректна ціна (число ≥ 0)', `проблемні id: ${badPrice.map(x=>x.id).join(', ')}`);
  } else {
    ok('У всіх послуг коректна ціна');
  }

  const emptyName = items.filter(it => !it.name || !it.name.trim());
  if (emptyName.length) {
    fail('У всіх послуг є назва', `id без назви: ${emptyName.map(x=>x.id).join(', ')}`);
  } else {
    ok('У всіх послуг є назва');
  }

  // ==================== 3. КЛЮЧОВІ ФУНКЦІЇ ====================
  section('3. Наявність критичних функцій');
  const requiredFns = [
    'findSvc', 'addOrderSvc', 'removeOrderSvc', 'renderOrderPickList',
    'renderOrderCatBtns', 'saveNewOrder', 'openNewOrder', 'renderSelectedSvcs',
    'renderOrderPaySummary', 'printOrderNariad', 'openModal', 'closeModal',
  ];
  requiredFns.forEach(fn => {
    if (typeof w[fn] === 'function') ok(`${fn}() існує`);
    else fail(`${fn}() існує`, 'ФУНКЦІЯ ВІДСУТНЯ — можливо, випадково видалена при редагуванні');
  });

  // ==================== 4. СИМУЛЯЦІЯ ЗАМОВЛЕННЯ ====================
  section('4. Симуляція: додавання послуги в замовлення');
  try {
    w.openNewOrder();
    const testItem = items[0];
    w.addOrderSvc(testItem.id);
    const added = w._orderSvcs.find(s => s.id === testItem.id);
    if (!added) {
      fail('Послуга додається в window._orderSvcs', `id ${testItem.id} не знайдено після addOrderSvc`);
    } else if (added.price !== testItem.price) {
      fail('Ціна доданої послуги збігається з прайсом', `очікував ${testItem.price}, отримав ${added.price}`);
    } else {
      ok(`Послуга "${testItem.name}" додається з правильною ціною (${testItem.price}₴)`);
    }

    // Додати ще раз — має збільшитись qty, а не задублюватись
    w.addOrderSvc(testItem.id);
    const added2 = w._orderSvcs.find(s => s.id === testItem.id);
    if (added2.qty !== 2) {
      fail('Повторне додавання збільшує кількість (qty), а не дублює рядок', `qty = ${added2.qty}, очікував 2`);
    } else {
      ok('Повторне додавання коректно збільшує кількість');
    }
  } catch (e) {
    fail('Симуляція замовлення виконується без помилок', e.message);
  }

  // ==================== ПІДСУМОК ====================
  section('='.repeat(40));
  if (failed === 0) {
    console.log(`✅ УСІ ПЕРЕВІРКИ ПРОЙДЕНО (0 проблем)\n`);
    process.exit(0);
  } else {
    console.log(`❌ ЗНАЙДЕНО ПРОБЛЕМ: ${failed}\n`);
    process.exit(1);
  }
}

main().catch(e => { console.error('Тест впав із помилкою:', e); process.exit(1); });
