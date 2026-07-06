// ==================== PRINT (винесено з app.js) ====================
// showOrderPrint, printOrderNariad — друк заказ-наряду (з ORDERS-регіону)
// printSection — генерик-друк секції (кличеться з inline onclick розмітки)

function showOrderPrint(o){
  window._printOrder=o;
  let svcRows = (o.services||[]).map(s=>`
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #ddd;font-size:0.85rem">${s.name}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:center">${s.qty}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:right;font-weight:600">${fmtMoney(s.price)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:right;font-weight:700">${fmtMoney(s.price*s.qty)}</td>
    </tr>`).join('');
  const masterRow = topSecret ? `<div style="text-align:right;color:#b8860b;font-size:0.9rem;margin-top:4px">Майстер 35%: ${fmtMoney(Math.round((o.total||0)*0.35))}</div>` : '';
  openModal(`
    <div id="orderPrintArea">
      <div style="text-align:center;margin-bottom:12px">
        <div style="font-family:'Oswald';font-size:1.3rem;font-weight:700">GT TIRES SERVICE</div>
        <div style="font-size:0.75rem;color:#888">ЗАКАЗ-НАРЯД</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.82rem;margin-bottom:12px;padding:8px;background:rgba(255,255,255,0.03);border-radius:8px">
        <div><b>№:</b> ${o.orderNumber||o.id.slice(-6).toUpperCase()}</div>
        <div><b>Дата:</b> ${fmtDate(o.date)}</div>
        <div><b>Клієнт:</b> ${o.clientName||'—'}</div>
        <div><b>Тел:</b> ${o.phone||'—'}</div>
        <div style="grid-column:1/-1"><b>Авто:</b> ${o.car||'—'}</div>
        <div><b>Держномер:</b> ${o.plate||'—'}</div>
        <div><b>Оплата:</b> ${o.paymentType==='cashless'?'Безготівка':o.paymentType==='cash'?'Готівка':'—'}</div>
        <div><b>Оплачено:</b> ${fmtMoney(o.paidAmount!=null?o.paidAmount:(o.total||0))}</div>
        <div><b>Борг:</b> ${fmtMoney(o.debt||0)}</div>
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
      ${o.notes?'<div style="margin-top:8px;font-size:0.8rem;color:var(--text-dim)">📝 '+o.notes+'</div>':''}
      <div style="display:flex;gap:30px;margin-top:24px;font-size:0.75rem;color:#888">
        <div style="flex:1;border-top:1px solid #555;padding-top:4px">Підпис клієнта</div>
        <div style="flex:1;border-top:1px solid #555;padding-top:4px">Підпис майстра</div>
      </div>
    </div>
    <div class="gap-btns mt no-print">
      <button class="btn btn-red" onclick="printOrderNariad()">🖨️ Роздрукувати</button>
      <button class="btn btn-dark" onclick="openEditOrder('${o.id}')">✏️ Редагувати</button>
      <button class="btn btn-dark" onclick="closeModal()">Закрити</button>
    </div>
  `);
}

function printOrderNariad(){
  const o=window._printOrder; if(!o){ alert('Немає даних для друку'); return; }
  const rows=(o.services||[]).map(sv=>`<tr><td class="svc">${sv.name}</td><td class="c">${sv.qty}</td><td class="c b">${fmtMoney(sv.price)}</td><td class="c b">${fmtMoney(sv.price*sv.qty)}</td></tr>`).join('');
  const pay=o.paymentType==='cashless'?'БЕЗГОТІВКА':'ГОТІВКА';
  const paid=o.paidAmount!=null?o.paidAmount:(o.total||0);
  const debt=o.debt||0;
  const num=o.orderNumber||(o.id?o.id.slice(-6).toUpperCase():'');
  const masterRow=topSecret?`<div class="mrow">Майстер 35%: <b>${fmtMoney(Math.round((o.total||0)*0.35))}</b></div>`:'';
  const debtRows=debt>0?`<div class="prow"><span>Оплачено:</span><span>${fmtMoney(paid)}</span></div><div class="prow dbt"><span>Борг:</span><span>${fmtMoney(debt)}</span></div>`:'';
  const QR='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZgAAAGYAQMAAABF9WYWAAAABlBMVEUaGhr///8SYIb4AAAC0UlEQVR42u1cQW7EQAiz+v8/U+1mwCZRVW0P0IPTQzdK5oIFeIwziM8veM3gGlxX3V7/wWevG+ibX/j88pq/rSlALngTnYTlQFO/3q84brP4MPZBPAKVSe/skjcdtxV8qoydKgfWuUww47OLzyluWeISsYLI+Oz1n8KCzUigk+ZkfGbxYR799mf+toAPqXaiEJAad9W9oguvy3Ebrm9IbIKsGn3vI3sj4zNc33p7wUmYaHSh+ByMz0Z9Q3GCU9SUbieNOFA6bvP8WusXGqUmtcu0ctxm86czuShW0J7WJtX4LNS32qAeoiZPqO9kHXTchvHJtFFBR9BTpmf9YByflivJ33gLUU/D9W2DX2f16jJcUgRRsy+q4LhN84ND2CAtqBKrKdvW3xbyB7csCTLu/F3k2vufHX0nogsJOd9O4ELmqI7btH7dBVCZlpI/yCbWcdvoP0REgKqqVnYR47PQf3qxo3MnokkIJ9Mct/H9KRlCzYGKdIueAM8XVvgBagREfLKckSLkC47bsH6QjA1xF+Gk7TCjHLcF/0GbNDz0H+hkyHEb9+8oZavSJo+K31l/m8cH9FsXRBS1cweU6Bif6fomfUdNikyv24jVcZv3h+BOrZsYx+ZkfWeBv4nLLZphEXSWCrFz3Mb7D+kzaXRIdoWSBsdtvP/U1wmUEeqTBfpL7U9c2p9K9aKNKgSuZuRx3Mb7T9Ovo+k6Qf3A/oO1+lYINEJ3b0rm1yv4lKsKIRy7mUaC3cn4DNc3MjYOsUUy0GGq+dtK/2lpow6raN81nDvHbcO/IwaReIgLIHcwPsP5006qCJHbIG2JFh/jM54/7ENlU2xCnPrjzK/H9Z1QRwh+sMlLRjluS+eHtLRhbxKnvPnbGj7ysUKfMlCYO0KP47aTP4+dqHwdpGKp47ZyflXoMWLRRqrdpuC4rZwfArUhalmLWyty3FbOD/G5hv9wzTeIDDPu5g+wyAAAAABJRU5ErkJggg==';
  const html=`<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Заказ-наряд №${num}</title><style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{background:#fff}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a1a;padding:14px 18px}
    .sheet{max-width:760px;margin:0 auto;border:2px solid #d22730;border-radius:18px;padding:18px 22px 20px}
    .red{color:#d22730}
    svg{display:block}
    /* header */
    .hdr{display:flex;justify-content:space-between;align-items:center;border:2px solid #d22730;border-radius:14px;padding:10px 18px;position:relative;overflow:hidden}
    .hdr::before{content:"";position:absolute;top:-30px;left:-30px;width:90px;height:90px;background:#d22730;transform:rotate(45deg);-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .hdr-left{display:flex;align-items:center;gap:14px;z-index:1}
    .brand .b1{font-size:30px;font-weight:800;font-style:italic;letter-spacing:1px;line-height:.95}
    .brand .b2{font-size:13px;font-weight:700;letter-spacing:7px;color:#d22730;margin-top:2px}
    .hdr-right{text-align:right;font-size:13px}
    .hdr-right .ph{display:flex;align-items:center;gap:8px;justify-content:flex-end;font-size:21px;font-weight:800;color:#d22730}
    .hdr-right .ad{display:flex;align-items:center;gap:6px;justify-content:flex-end;color:#444;margin-top:6px;font-size:12.5px}
    /* features */
    .feats{display:flex;border:2px solid #d22730;border-radius:14px;margin-top:10px;overflow:hidden}
    .feat{flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;padding:10px 6px;border-right:1px solid #f0c9cc}
    .feat:last-child{border-right:none}
    .feat .ft{margin-top:6px;font-size:12px;line-height:1.25}
    .feat .ft b{display:block;color:#1a1a1a;font-weight:800}
    .feat .ft span{color:#777}
    /* title */
    .ttl{font-size:27px;font-weight:800;font-style:italic;margin:18px 2px 12px;letter-spacing:.5px}
    .ttl .num{border-bottom:2px solid #1a1a1a;padding:0 30px}
    /* info */
    .info{display:flex;align-items:flex-start;gap:18px;font-size:14px;margin-bottom:14px}
    .info .col{flex:1;display:flex;flex-direction:column;gap:7px}
    .info .col span{color:#888}
    .pay{border:2px solid #d22730;border-radius:10px;padding:7px 14px;display:flex;align-items:center;gap:10px}
    .pay .pt{font-size:12px;color:#888;font-weight:700;line-height:1.2}
    .pay .pt b{display:block;color:#1a1a1a;font-size:14px}
    /* table */
    table{width:100%;border-collapse:collapse;margin-bottom:4px}
    thead th{background:#d22730;color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-size:13px;font-weight:700;padding:11px 14px;text-align:left}
    thead th:first-child{border-radius:8px 0 0 8px}
    thead th:last-child{border-radius:0 8px 8px 0}
    thead th.c{text-align:center}
    tbody td{padding:11px 14px;font-size:14px;border-bottom:1px solid #eee}
    tbody td.svc{font-weight:500}
    tbody td.c{text-align:center}
    tbody td.b{font-weight:700}
    .dash{border-top:2px dashed #e08a90;margin:6px 0 10px}
    /* total */
    .totwrap{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:30px}
    .paybox{display:flex;flex-direction:column;gap:4px;font-size:13px;color:#555}
    .prow{display:flex;gap:16px;justify-content:space-between;min-width:180px}
    .prow.dbt{color:#d22730;font-weight:700}
    .mrow{color:#b8860b;font-size:12px}
    .grand{margin-left:auto;font-size:24px;font-weight:800;font-style:italic;display:flex;align-items:baseline;gap:14px}
    .grand .gsum{color:#d22730;font-size:30px}
    /* signs */
    .signs{display:flex;gap:50px;margin-bottom:18px}
    .signs .sg{flex:1}
    .signs .sg span{font-size:13px;color:#444}
    .signs .sg .line{border-bottom:1px solid #1a1a1a;height:26px}
    /* contact box */
    .cbox{display:flex;justify-content:space-between;align-items:center;border:2px solid #ddd;border-radius:14px;padding:14px 20px;margin-bottom:14px}
    .cbox-l{display:flex;align-items:center;gap:16px}
    .cbox-l .cnum{font-size:26px;font-weight:800;color:#d22730;line-height:1}
    .cbox-l .csub{font-size:13px;color:#777;font-style:italic;margin-top:3px}
    .cbox-r{display:flex;align-items:center;gap:12px}
    .cbox-r .qr{width:74px;height:74px;border:2px solid #d22730;border-radius:6px;padding:2px}
    .cbox-r .qrtxt{font-size:13px;color:#555;line-height:1.3}
    /* terms */
    .terms{display:flex;flex-direction:column;gap:8px}
    .term{display:flex;align-items:flex-start;gap:10px;font-size:12.5px;color:#444}
    .term svg{flex:none;margin-top:1px}
    @media print{body{padding:0}.sheet{border:none}}
  </style></head><body>
  <div class="sheet">
    <div class="hdr">
      <div class="hdr-left">
        <svg width="56" height="56" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="46" fill="#d22730"/><circle cx="50" cy="50" r="34" fill="#fff"/><circle cx="50" cy="50" r="11" fill="#d22730"/><g fill="#d22730"><circle cx="50" cy="22" r="4"/><circle cx="74" cy="38" r="4"/><circle cx="74" cy="62" r="4"/><circle cx="50" cy="78" r="4"/><circle cx="26" cy="62" r="4"/><circle cx="26" cy="38" r="4"/></g><g stroke="#d22730" stroke-width="3"><line x1="50" y1="50" x2="50" y2="30"/><line x1="50" y1="50" x2="69" y2="42"/><line x1="50" y1="50" x2="62" y2="66"/><line x1="50" y1="50" x2="38" y2="66"/><line x1="50" y1="50" x2="31" y2="42"/></g></svg>
        <div class="brand"><div class="b1">GT TIRES</div><div class="b2">SERVICE</div></div>
      </div>
      <div class="hdr-right">
        <div class="ph"><svg width="22" height="22" viewBox="0 0 24 24" fill="#d22730"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1l-2.2 2.2z"/></svg> +38 068 259 01 96</div>
        <div class="ad"><svg width="14" height="14" viewBox="0 0 24 24" fill="#d22730"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z"/></svg> с. Велика Димерка, вул. Соборна 106</div>
      </div>
    </div>
    <div class="feats">
      <div class="feat"><svg width="34" height="34" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="20" stroke="#d22730" stroke-width="3"/><circle cx="24" cy="24" r="9" stroke="#d22730" stroke-width="3"/><g stroke="#d22730" stroke-width="2"><line x1="24" y1="4" x2="24" y2="15"/><line x1="24" y1="33" x2="24" y2="44"/><line x1="4" y1="24" x2="15" y2="24"/><line x1="33" y1="24" x2="44" y2="24"/></g></svg><div class="ft"><b>ЯКІСНИЙ</b><span>ШИНОМОНТАЖ</span></div></div>
      <div class="feat"><svg width="34" height="34" viewBox="0 0 48 48" fill="#d22730"><path d="M24 4l16 6v11c0 9.5-6.5 18.4-16 21-9.5-2.6-16-11.5-16-21V10l16-6z"/><path d="M21 30l-5-5 2.4-2.4 2.6 2.6 7-7L30.4 21z" fill="#fff"/></svg><div class="ft"><b>ГАРАНТІЯ НА</b><span>РОБОТИ</span></div></div>
      <div class="feat"><svg width="34" height="34" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="20" stroke="#d22730" stroke-width="3"/><path d="M24 12v12l8 5" stroke="#d22730" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><div class="ft"><b>ШВИДКЕ</b><span>ОБСЛУГОВУВАННЯ</span></div></div>
      <div class="feat"><svg width="34" height="34" viewBox="0 0 48 48" fill="#d22730"><path d="M14 20h-5a2 2 0 00-2 2v18a2 2 0 002 2h5V20z"/><path d="M16 20l8-15c2.5 0 4 2 3.5 4.5L26 16h12a3 3 0 013 3.5l-3 16a4 4 0 01-4 3.5H16V20z"/></svg><div class="ft"><b>ДОСВІД ТА</b><span>ПРОФЕСІОНАЛІЗМ</span></div></div>
    </div>
    <div class="ttl">ЗАКАЗ-НАРЯД №&nbsp;<span class="num">${num}</span></div>
    <div class="info">
      <div class="col"><div><span>Клієнт:</span> ${o.clientName||'—'}</div><div><span>Авто:</span> ${o.car||'—'}</div></div>
      <div class="col"><div><span>Тел:</span> ${o.phone||'—'}</div><div><span>Номер авто:</span> ${o.plate||'—'}</div></div>
      <div class="pay"><svg width="30" height="30" viewBox="0 0 48 48" fill="none"><rect x="5" y="13" width="38" height="22" rx="3" stroke="#d22730" stroke-width="2.5"/><circle cx="24" cy="24" r="6" stroke="#d22730" stroke-width="2.5"/></svg><div class="pt">ОПЛАТА:<b>${pay}</b></div></div>
    </div>
    <table><thead><tr><th>ПОСЛУГА</th><th class="c">К-ть</th><th class="c">ЦІНА</th><th class="c">СУМА</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="dash"></div>
    <div class="totwrap">
      <div class="paybox">${debtRows}${masterRow}</div>
      <div class="grand"><span>ВСЬОГО:</span><span class="gsum">${fmtMoney(o.total||0)}</span></div>
    </div>
    <div class="signs">
      <div class="sg"><span>Підпис клієнта</span><div class="line"></div></div>
      <div class="sg"><span>Підпис майстра</span><div class="line"></div></div>
    </div>
    <div class="cbox">
      <div class="cbox-l"><svg width="46" height="46" viewBox="0 0 48 48" fill="#d22730"><circle cx="24" cy="24" r="24" opacity="0.12"/><path d="M16 14c3 6 8 11 14 14l3-3c.4-.4 1-.5 1.5-.3 1.4.5 3 .8 4.5.8v5c0 .8-.7 1.5-1.5 1.5C24.5 32 12 19.5 12 6.5 12 5.7 12.7 5 13.5 5h5c0 1.5.3 3.1.8 4.5.2.5.1 1.1-.3 1.5l-3 3z" transform="translate(2 4) scale(0.78)"/></svg><div><div class="cnum">+38 068 259 01 96</div><div class="csub">Мобільний та Viber</div></div></div>
      <div class="cbox-r"><img class="qr" src="${QR}" alt="QR"><div class="qrtxt">Відскануйте<br>для швидкого<br>зв'язку</div></div>
    </div>
    <div class="terms">
      <div class="term"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#d22730" stroke-width="2"/><path d="M8 12l3 3 5-6" stroke="#d22730" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Після пробігу 50 км водій зобов'язаний перевірити затяжку гайок.</div>
      <div class="term"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#d22730" stroke-width="2"/><path d="M8 12l3 3 5-6" stroke="#d22730" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> У зв'язку з низькою якістю доріг претензії щодо дисбалансу розглядаються протягом трьох днів.</div>
      <div class="term"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#d22730" stroke-width="2"/><path d="M8 12l3 3 5-6" stroke="#d22730" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Шини, залишені клієнтом, будуть утилізовані через 14 днів.</div>
    </div>
  </div>
  </body></html>`;
  let frame=document.getElementById('printFrame');
  if(!frame){ frame=document.createElement('iframe'); frame.id='printFrame'; frame.style.cssText='position:fixed;top:-9999px;left:-9999px;width:800px;height:600px;border:none;'; document.body.appendChild(frame); }
  const doc=frame.contentDocument||frame.contentWindow.document;
  doc.open(); doc.write(html); doc.close();
  setTimeout(()=>{ try{frame.contentWindow.focus();}catch(e){} frame.contentWindow.print(); }, 350);
}

function printSection(id){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('print-target'));
  document.getElementById(id).classList.add('print-target');
  window.print();
  setTimeout(()=>document.getElementById(id).classList.remove('print-target'),500);
}
