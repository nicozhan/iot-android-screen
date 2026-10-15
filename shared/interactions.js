/*!
 * VendSolution UI 原型 · 交互引擎（shared/interactions.js）
 * 声明式接线，页面只需加属性，无需重复写 JS：
 *   data-href="x.html"            点击跳转（自动记录来源卡片名称供排序页动态标题）
 *   data-act="goto-toast"         跳转并在落地页弹提示（配合 data-href + data-toast）
 *   data-close-hide               关闭当前弹窗（停留在本页，用于列表页上的弹窗）
 *   data-close-go="x.html"        “关闭弹窗”= 返回来源页（用于整页即弹窗的截图态页面）
 *   data-toast="提示"             点击弹 toast
 *   data-toggle="active"          点击切换自身类名
 *   data-step="+"/"-"             步进器加减（.stepper 内的 .st-num/.step-val）
 *   data-del                      删除所在 .pm-cat-row
 *   data-op="remove-tags|clear-sel"  标签管理底部操作
 * 自动接管：.np-key 数字键盘 / .vm-ctrl .sq 卡片加减 / .pm-sku 勾选 / .pm-chip 切换 / .pm-sort-list 拖拽排序 / .vs-overlay 点遮罩关闭
 */
(function () {
  'use strict';

  /* ---------- 样式注入 ---------- */
  var css = document.createElement('style');
  css.textContent =
    '.vs-toast{position:fixed;left:50%;bottom:64px;transform:translateX(-50%) translateY(16px);' +
      'background:#1A1A1A;color:#FFF;font-size:16px;font-weight:600;padding:13px 30px;border-radius:6px;' +
      'box-shadow:0 10px 28px rgba(0,0,0,.28);opacity:0;transition:opacity .22s ease,transform .22s ease;' +
      'z-index:99999;pointer-events:none;font-family:var(--sans,"PingFang SC","Microsoft YaHei",sans-serif);}' +
    '.vs-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}' +
    '[data-href]{cursor:pointer;}' +
    '.pm-sku,.pm-chip{cursor:pointer;}' +
    '.pm-sort-card.dragging{opacity:.4;}' +
    '.pm-sort-card.drop-target{outline:2px dashed var(--ink);outline-offset:-2px;}';
  document.head.appendChild(css);

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    if (!msg) return;
    var old = document.querySelector('.vs-toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.className = 'vs-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { t.remove(); }, 260);
    }, 1800);
  }

  /* ---------- 跨页提示（落地页弹出） ---------- */
  function goto(url, msg) {
    if (!url) return;
    if (msg) { try { sessionStorage.setItem('vs-pending-toast', msg); } catch (e) {} }
    location.href = url;
  }
  try {
    var early = sessionStorage.getItem('vs-pending-toast');
    if (early) {
      sessionStorage.removeItem('vs-pending-toast');
      setTimeout(function () { toast(early); }, 300);
    }
  } catch (e) {}

  /* ---------- 来源上下文（排序页动态标题） ---------- */
  function storeCtx(el) {
    try {
      var nameEl = el.querySelector('.pm-sort-name') || el.querySelector('.pm-cat-name');
      var cntEl = el.querySelector('.pm-cat-count');
      if (nameEl) {
        sessionStorage.setItem('vs-ctx', JSON.stringify({
          name: nameEl.textContent.trim(),
          count: cntEl ? cntEl.textContent.trim() : ''
        }));
      }
    } catch (e) {}
  }

  /* ---------- 弹窗关闭 ---------- */
  function doClose(el) {
    if (el.hasAttribute('data-close-go')) {
      location.href = el.getAttribute('data-close-go');
    } else {
      var ov = el.closest('.vs-overlay');
      if (ov) ov.style.display = 'none';
    }
    if (el.getAttribute('data-toast')) toast(el.getAttribute('data-toast'));
  }

  /* ---------- 步进器 ---------- */
  function step(el) {
    var box = el.closest('.stepper');
    if (!box) return;
    var num = box.querySelector('.st-num') || box.querySelector('.step-val');
    if (!num) return;
    var v = parseInt(num.textContent.replace(/[^\d-]/g, ''), 10);
    if (isNaN(v)) v = 0;
    v += (el.getAttribute('data-step') === '+' ? 1 : -1);
    if (v < 0) v = 0;
    num.textContent = v;
  }

  /* ---------- 货道卡片 +/- ---------- */
  function plusN(el) {
    var ctrl = el.closest('.vm-ctrl');
    if (!ctrl) return;
    var num = ctrl.querySelector('.plus-n');
    if (!num) return;
    var v = parseInt(num.textContent.replace(/[^\d-]/g, ''), 10);
    if (isNaN(v)) v = 0;
    v += (el.getAttribute('data-step') === '+' ? 1 : -1);
    if (v < 0) v = 0;
    num.textContent = '+' + v;
  }

  /* ---------- 数字键盘 ---------- */
  function npKey(el) {
    var modal = el.closest('.vs-modal');
    if (!modal) return;
    var disp = modal.querySelector('.np-display');
    if (!disp) return;
    var k = el.textContent.trim();
    var cur = disp.textContent.trim();
    if (k === '\u232B') {                       // ⌫ 退格
      disp.textContent = cur.length > 1 ? cur.slice(0, -1) : '0';
    } else if (k === '\u2212' || k === '-') {   // − 负号
      disp.textContent = cur.charAt(0) === '-' ? cur.slice(1) : '-' + cur;
    } else if (k === '.') {
      if (cur.indexOf('.') < 0) disp.textContent = cur + '.';
    } else {
      disp.textContent = (cur === '0' ? '' : cur) + k;
    }
  }

  /* ---------- 统一点击委托 ---------- */
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    if (!t || !t.closest) return;
    var el;

    /* 点弹窗遮罩 = 关闭 */
    if (t.classList && t.classList.contains('vs-overlay')) {
      var c = t.querySelector('[data-close-go]') || t.querySelector('[data-close-hide]');
      if (c) { doClose(c); return; }
    }

    if ((el = t.closest('.np-key'))) { npKey(el); return; }
    if ((el = t.closest('.vm-ctrl .sq'))) { plusN(el); return; }
    if ((el = t.closest('[data-step]'))) { step(el); return; }
    if ((el = t.closest('[data-del]'))) {
      var row = el.closest('.pm-cat-row');
      if (row) { row.style.display = 'none'; toast('已删除该分类'); }
      return;
    }
    if ((el = t.closest('[data-op]'))) {
      var kind = el.getAttribute('data-op');
      if (kind === 'remove-tags') {
        document.querySelectorAll('.pm-sku.on .pm-mini-tag').forEach(function (tag) { tag.remove(); });
        toast('已移除所选 SKU 的标签');
      } else if (kind === 'clear-sel') {
        document.querySelectorAll('.pm-sku.on').forEach(function (s) {
          s.classList.remove('on');
          var chk = s.querySelector('.pm-sku-check');
          if (chk) chk.textContent = '';
        });
        toast('已清除全部选择');
      }
      return;
    }
    if ((el = t.closest('.pm-sku'))) {
      el.classList.toggle('on');
      var chk = el.querySelector('.pm-sku-check');
      if (chk) chk.textContent = el.classList.contains('on') ? '\u2713' : '';
      return;
    }
    if ((el = t.closest('.pm-chip'))) { el.classList.toggle('on'); return; }

    if ((el = t.closest('[data-act="goto-toast"]'))) {
      goto(el.getAttribute('data-href'), el.getAttribute('data-toast'));
      return;
    }
    if ((el = t.closest('[data-close-go]')) || (el = t.closest('[data-close-hide]'))) { doClose(el); return; }
    if ((el = t.closest('[data-href]'))) {
      storeCtx(el);
      goto(el.getAttribute('data-href'), el.getAttribute('data-toast'));
      return;
    }
    if ((el = t.closest('[data-toast]'))) { toast(el.getAttribute('data-toast')); return; }
    if ((el = t.closest('[data-toggle]'))) { el.classList.toggle(el.getAttribute('data-toggle')); return; }
  });

  /* ---------- 排序拖拽（.pm-sort-list 内的 .pm-sort-card） ---------- */
  function renumber(list) {
    list.querySelectorAll('.pm-sort-no').forEach(function (no, i) {
      no.textContent = 'L' + (i + 1);
    });
  }
  document.querySelectorAll('.pm-sort-list').forEach(function (list) {
    var dragEl = null;
    list.querySelectorAll('.pm-sort-card').forEach(function (card) {
      card.setAttribute('draggable', 'true');
    });
    list.addEventListener('dragstart', function (e) {
      var card = e.target.closest ? e.target.closest('.pm-sort-card') : null;
      if (!card) return;
      dragEl = card;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', 'card'); } catch (err) {}
    });
    list.addEventListener('dragend', function () {
      if (dragEl) dragEl.classList.remove('dragging');
      list.querySelectorAll('.drop-target').forEach(function (c) { c.classList.remove('drop-target'); });
      dragEl = null;
      renumber(list);
    });
    list.addEventListener('dragover', function (e) {
      if (!dragEl) return;
      e.preventDefault();
      var over = e.target.closest ? e.target.closest('.pm-sort-card') : null;
      list.querySelectorAll('.drop-target').forEach(function (c) { c.classList.remove('drop-target'); });
      if (over && over !== dragEl) {
        over.classList.add('drop-target');
        var rect = over.getBoundingClientRect();
        var after = (e.clientY - rect.top) > rect.height / 2;
        if (after) over.parentNode.insertBefore(dragEl, over.nextSibling);
        else over.parentNode.insertBefore(dragEl, over);
      }
    });
    list.addEventListener('drop', function (e) { e.preventDefault(); });
  });
})();
