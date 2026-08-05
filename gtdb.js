/* ============================================================
   GT Tires — спільний доступ до Supabase
   ------------------------------------------------------------
   Використовується сторінкою тарифів (заявки) та панеллю
   top_secret (ліцензії).

   anon-ключ публічний за задумом — захист у правилах RLS на
   стороні бази, не в приховуванні ключа. Усе, що змінює
   ліцензії, працює лише через функції з паролем адміністратора.
   ============================================================ */

(function () {
  'use strict';

  var URL = 'https://lxeswqlkereptdtwytbp.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4ZXN3cWxrZXJlcHRkdHd5dGJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MzEyNDgsImV4cCI6MjA5NjQwNzI0OH0.CIkN-KAhlM6TgFzdkaCyUbnvTq4OmiNH953IHJR4x5E';

  function headers(extra) {
    var h = {
      'apikey': KEY,
      'Authorization': 'Bearer ' + KEY,
      'Content-Type': 'application/json'
    };
    for (var k in (extra || {})) h[k] = extra[k];
    return h;
  }

  /* Вставка рядка в таблицю */
  function insert(table, row) {
    return fetch(URL + '/rest/v1/' + table, {
      method: 'POST',
      headers: headers({ 'Prefer': 'return=minimal' }),
      body: JSON.stringify(row)
    }).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (t) {
          throw new Error(readableError(r.status, t));
        });
      }
      return true;
    });
  }

  /* Виклик функції адмінки (перший аргумент — пароль) */
  function rpc(fn, args) {
    return fetch(URL + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(args || {})
    }).then(function (r) {
      return r.text().then(function (t) {
        if (!r.ok) throw new Error(readableError(r.status, t));
        try { return t ? JSON.parse(t) : null; } catch (e) { return t; }
      });
    });
  }

  function readableError(status, body) {
    var msg = body;
    try {
      var j = JSON.parse(body);
      msg = j.message || j.error || j.hint || body;
    } catch (e) {}

    if (/Невірний пароль/.test(msg)) return 'Невірний пароль';
    if (status === 401 || status === 403) return 'Немає доступу';
    if (status === 0) return 'Немає зв\'язку з сервером';
    return msg || ('Помилка ' + status);
  }

  window.GTDB = {
    url: URL,
    insert: insert,
    rpc: rpc
  };

})();
