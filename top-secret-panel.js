/* ============================================================
   top_secret — права висувна панель адміністратора
   ------------------------------------------------------------
   Окремий файл. app.js НЕ чіпається.
   Підключається ПІСЛЯ app.js у gt-tires-v4-supabase-ready.html

   ЯК ЗМІНИТИ ПІН       → TS_PIN нижче
   ЯК ДОДАТИ ПУНКТ МЕНЮ → додати блок у TS_MENU
   ============================================================ */

(function () {
  'use strict';

  /* ---------- НАЛАШТУВАННЯ ---------- */

  var TS_PIN = '2606';              // ← ПІН-КОД ВХОДУ. Зміни на свій.
  var TS_LOCK_AFTER_MIN = 30;       // через скільки хвилин бездіяльності знову питати пін

  /* ---------- ПУНКТИ МЕНЮ ----------
     Щоб додати новий пункт — скопіюй блок { ... } і зміни поля.

       title  — назва
       desc   — підпис дрібним
       icon   — емодзі або символ
       href   — куди веде (відкриється у новій вкладці)
       run    — АБО функція, якщо потрібна дія замість посилання
       group  — заголовок розділу (додається перед пунктом)
       soon   — true = показати як «скоро», клік не працює
  ------------------------------------ */

  var TS_MENU = [

    { group: 'Продажі' },

    {
      title: 'Тарифи',
      desc:  'Ціни, тріал, знижка за рік',
      icon:  '💳',
      href:  'top-secret.html'
    },
    {
      title: 'Сторінка продажу',
      desc:  'Як її бачить клієнт',
      icon:  '🌐',
      href:  'pricing.html?v=9'
    },

    { group: 'Клієнти системи' },

    {
      title: 'Ліцензії',
      desc:  'Хто платив, коли спливає',
      icon:  '🔑',
      soon:  true
    },
    {
      title: 'Підключити клієнта',
      desc:  'Видати доступ новій точці',
      icon:  '➕',
      soon:  true
    },

    { group: 'Дані' },

    {
      title: 'Резервна копія',
      desc:  'Вивантажити все у файл',
      icon:  '💾',
      run:   function () {
        if (typeof window.exportData === 'function') { window.exportData(); return; }
        tsDumpLocalStorage();
      }
    },
    {
      title: 'Розмір бази',
      desc:  'Скільки займає localStorage',
      icon:  '📊',
      run:   function () { tsShowSize(); }
    }

  ];

  /* ============================================================
     Далі — механіка. Редагувати не обов'язково.
     ============================================================ */

  var LS_OK = 'gt_ts_panel_ok';
  var built = false;

  /* ---------- розмітка ---------- */

  function build() {
    if (built) return;
    built = true;

    var back = document.createElement('div');
    back.className = 'ts-backdrop';
    back.id = 'tsBackdrop';
    back.onclick = function () { toggle(false); };
    document.body.appendChild(back);

    var side = document.createElement('aside');
    side.className = 'ts-wrap';
    side.id = 'tsPanel';
    side.innerHTML =
      '<div class="ts-brand">top_secret<span>панель адміністратора</span></div>' +

      '<div class="ts-gate" id="tsGate">' +
        '<div class="ts-gate-ico">🔒</div>' +
        '<div class="ts-gate-txt">Введи пін-код</div>' +
        '<input class="ts-pin" id="tsPin" type="password" inputmode="numeric" ' +
               'autocomplete="off" placeholder="••••">' +
        '<button class="ts-btn ts-btn-red" id="tsPinGo">Відкрити</button>' +
        '<div class="ts-err" id="tsErr"></div>' +
      '</div>' +

      '<div class="ts-body" id="tsBody" hidden></div>' +

      '<div class="ts-foot" id="tsFoot" hidden>' +
        '<button class="ts-btn" id="tsLock">Замкнути</button>' +
      '</div>';

    document.body.appendChild(side);

    document.getElementById('tsPinGo').onclick = tryPin;
    document.getElementById('tsPin').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') tryPin();
    });
    document.getElementById('tsLock').onclick = lock;

    var btn = document.createElement('button');
    btn.className = 'ts-toggle';
    btn.id = 'tsToggle';
    btn.title = 'top_secret';
    btn.textContent = '🔒';
    btn.onclick = function () { toggle(); };
    document.body.appendChild(btn);

    renderMenu();
  }

  function renderMenu() {
    var body = document.getElementById('tsBody');
    if (!body) return;
    body.innerHTML = '';

    TS_MENU.forEach(function (it) {

      if (it.group) {
        var g = document.createElement('div');
        g.className = 'ts-group';
        g.textContent = it.group;
        body.appendChild(g);
        return;
      }

      var row = document.createElement(it.href && !it.soon ? 'a' : 'button');
      row.className = 'ts-item' + (it.soon ? ' ts-soon' : '');

      if (it.href && !it.soon) {
        row.href = it.href;
        row.target = '_blank';
        row.rel = 'noopener';
      }

      row.innerHTML =
        '<span class="ts-ico">' + (it.icon || '•') + '</span>' +
        '<span class="ts-txt">' +
          '<span class="ts-t">' + esc(it.title) + '</span>' +
          (it.desc ? '<span class="ts-d">' + esc(it.desc) + '</span>' : '') +
        '</span>' +
        (it.soon ? '<span class="ts-badge">скоро</span>' : '');

      if (it.soon) {
        row.onclick = function (e) { e.preventDefault(); };
      } else if (typeof it.run === 'function') {
        row.onclick = function (e) { e.preventDefault(); it.run(); };
      }

      body.appendChild(row);
    });
  }

  /* ---------- відкриття / пін ---------- */

  function toggle(force) {
    build();
    var open = (typeof force === 'boolean')
      ? force
      : !document.body.classList.contains('ts-open');

    if (open) {
      if (typeof window.toggleMenu === 'function') { try { window.toggleMenu(false); } catch (e) {} }
      if (unlocked()) showBody(); else showGate();
    }
    document.body.classList.toggle('ts-open', open);

    if (open && !unlocked()) {
      setTimeout(function () {
        var p = document.getElementById('tsPin');
        if (p) { p.value = ''; p.focus(); }
      }, 260);
    }
  }

  function unlocked() {
    try {
      var t = parseInt(sessionStorage.getItem(LS_OK) || '0', 10);
      if (!t) return false;
      if (Date.now() - t > TS_LOCK_AFTER_MIN * 60000) {
        sessionStorage.removeItem(LS_OK);
        return false;
      }
      sessionStorage.setItem(LS_OK, String(Date.now()));
      return true;
    } catch (e) { return false; }
  }

  function tryPin() {
    var p = document.getElementById('tsPin');
    var e = document.getElementById('tsErr');
    if (!p) return;
    if (p.value.trim() === TS_PIN) {
      try { sessionStorage.setItem(LS_OK, String(Date.now())); } catch (x) {}
      e.textContent = '';
      p.value = '';
      showBody();
    } else {
      e.textContent = 'Невірний код';
      p.value = '';
      p.focus();
    }
  }

  function lock() {
    try { sessionStorage.removeItem(LS_OK); } catch (e) {}
    showGate();
    toggle(false);
  }

  function showGate() {
    q('tsGate').hidden = false;
    q('tsBody').hidden = true;
    q('tsFoot').hidden = true;
  }

  function showBody() {
    q('tsGate').hidden = true;
    q('tsBody').hidden = false;
    q('tsFoot').hidden = false;
  }

  /* ---------- дії пунктів ---------- */

  function tsDumpLocalStorage() {
    var out = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('gt_tires_v4_') === 0) out[k] = localStorage.getItem(k);
      }
    } catch (e) { alert('Не вдалося прочитати дані: ' + e.message); return; }

    var blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gt-tires-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  function tsShowSize() {
    var bytes = 0, n = 0;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('gt_tires_v4_') === 0) {
          bytes += k.length + (localStorage.getItem(k) || '').length;
          n++;
        }
      }
    } catch (e) { alert('Не вдалося порахувати: ' + e.message); return; }

    alert('Ключів: ' + n + '\n' +
          'Розмір: ' + (bytes / 1024).toFixed(1) + ' КБ\n' +
          'Ліміт браузера: ~5000 КБ');
  }

  /* ---------- утиліти ---------- */

  function q(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- старт ---------- */

  function init() {
    build();
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('ts-open')) toggle(false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.toggleTopSecret = toggle;

})();
