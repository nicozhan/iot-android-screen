/*!
 * VendSolution UI 原型 · 交互引擎（shared/interactions.js）
 * 声明式接线，页面只需加属性，无需重复写 JS：
 *   data-href="x.html"            点击跳转（自动记录来源卡片名称供排序页动态标题）
 *   data-act="goto-toast"         跳转并在落地页弹提示（配合 data-href + data-toast）
 *   data-close-hide               关闭当前浮层（停留在本页；堆叠链中=收起最上层）
 *   data-close-go="x.html"        “关闭”= 跳转（仅深链接/截图态页面使用）
 *   data-close-all                收拢整个浮层栈（终态确认按钮，配 data-toast）
 *   data-toast="提示"             点击弹 toast
 *   data-toggle="active"          点击切换自身类名
 *   data-menu="#id"               点击切换下拉菜单（点页面外部自动收起，如用户菜单）
 *   data-modal="#id"              打开页内浮层（无遮罩轻浮层：透明点击捕获层+投影浮卡）
 *   data-modal-stack              堆叠打开（链式弹窗：不收起下层浮层，如 补货→保质期→数字键盘）
 *   data-fill-lane[="前缀"]        浮层内占位：按触发卡片的货道号+商品名回填（"L3 · 糖浆"）
 *   data-fill-name                浮层内占位：按触发卡片的商品名回填
 *  浮层安全级：.vs-overlay[data-modal-safe] 点浮层空白处即收起；
 *   默认（危险操作：确认/表单/输入）只能通过按钮关闭，点空白处不关闭
 *   data-ship="#id"               测试出货：出货按钮（读同卡片货道号/商品名）打开二次确认弹窗
 *   data-ship-go / data-ship-stop / data-ship-done  开始出货（进度条约2.5s自动到完成）/ 终止 / 完成浮窗选择器
 *   data-step="+"/"-"             步进器加减（.stepper 内的 .st-num/.step-val）
 *   data-del                      删除所在 .pm-cat-row
 *   data-op="remove-tags|clear-sel"  标签管理底部操作
 *   data-kb[.ph|data-kb-mask|data-kb-max|data-kb-ph]     打开通用数字键盘（输入框用）
 *   data-kb-goto / data-kb-toast  键盘“确定”后跳转 / 提示（如登录 → 首页）
 * 通用数字键盘（data-kb）：点击输入框唤起屏上数字键盘，键盘输入掩码/明文回写到触发框，
 *   “确定”后可根据 data-kb-goto 跳转（如登录项，账号/口令纯数字场景）。
 * 自动接管：.np-key 数字键盘 / .vm-ctrl .sq 卡片加减 / .pm-sku 勾选 / .pm-chip 切换 /
 *   .pm-sort-list 拖拽排序 / .vs-radio 单选互斥 / .vs-overlay 点遮罩关闭
 * 动态标题：读取 sessionStorage vs-ctx 写入 .vs-section-title[data-ctx]（排序/分类子页）
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
    '[data-menu],[data-modal]{cursor:pointer;}' +
    '.vs-tab,.login-tab{cursor:pointer;}' +
    '.pm-sku,.pm-chip,.vs-radio{cursor:pointer;}' +
    '.pm-sort-card.dragging{opacity:.4;}' +
    '.pm-sort-card.drop-target{outline:2px dashed var(--ink);outline-offset:-2px;}' +
    /* ===== 通用数字键盘 ===== */
    '.vs-kb-overlay{position:fixed;inset:0;background:rgba(20,20,20,.42);display:none;align-items:flex-end;' +
      'justify-content:center;z-index:99998;}' +
    '.vs-kb-overlay.show{display:flex;}' +
    '.vs-kb{width:min(680px,94vw);background:#fff;border:1px solid var(--line,#d9d9d2);border-radius:10px;' +
      'margin-bottom:36px;overflow:hidden;box-shadow:0 -6px 40px rgba(0,0,0,.22);}' +
    '.vs-kb-disp{display:flex;align-items:center;justify-content:space-between;padding:22px 26px;' +
      'border-bottom:1px solid var(--line,#d9d9d2);}' +
    '.vs-kb-disp .np-display{font-family:var(--mono,"Roboto Mono",monospace);font-size:40px;font-weight:700;' +
      'color:var(--ink,#111);letter-spacing:2px;min-height:48px;}' +
    '.vs-kb-clear{font-size:15px;color:var(--aux,#7a7a72);cursor:pointer;}' +
    '.vs-kb-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line,#d9d9d2);}' +
    '.vs-kb-grid .np-key{height:76px;background:#fff;border:none;font-size:28px;font-weight:600;' +
      'color:var(--ink,#111);cursor:pointer;font-family:var(--sans,sans-serif);}' +
    '.vs-kb-grid .np-key:active{background:#f0f0eb;}' +
    '.vs-kb-grid .np-key.np-fn{color:var(--aux,#7a7a72);}' +
    '.vs-kb-actions{display:flex;}' +
    '.vs-kb-actions button{flex:1;height:64px;border:none;font-size:18px;font-weight:700;cursor:pointer;' +
      'font-family:var(--sans,sans-serif);}' +
    '.vs-kb-cancel{background:#fff;color:var(--ink,#111);border-top:1px solid var(--line,#d9d9d2);}' +
    '.vs-kb-done{background:var(--dark,#0f0f0f);color:#fff;}' +
    '.vs-kb-done:active{background:#000;}';
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
  /* 动态标题：读取 vs-ctx 写入 .vs-section-title[data-ctx]
     - data-ctx-noun / data-ctx-fallback：显示 “来源名 · N 个商品”，缺省回退文案（47/48）
     - data-ctx-fixed：显示 “来源名 · <fixed>”（49，固定“12 个SKU”） */
  (function applyCtxTitle() {
    var t = document.querySelector('.vs-section-title[data-ctx]');
    if (!t) return;
    try {
      var c = JSON.parse(sessionStorage.getItem('vs-ctx') || 'null');
      if (c && c.name) {
        if (t.hasAttribute('data-ctx-fixed')) {
          t.textContent = c.name + ' · ' + t.getAttribute('data-ctx-fixed');
        } else {
          var noun = t.getAttribute('data-ctx-noun') || '个商品';
          var fb = t.getAttribute('data-ctx-fallback') || '';
          var cnt = (c.count || '').replace(/个\s*$/, '').trim();   // “12 个”→“12”，避免拼出“12 个个商品”
          t.textContent = c.name + ' · ' + (cnt ? cnt + ' ' + noun : fb);
        }
      }
    } catch (e) {}
    try { sessionStorage.removeItem('vs-ctx'); } catch (e) {}
  })();

  /* ---------- 页面内浮层 · 工具 ---------- */
  var zTop = 60;                          // 浮层堆叠 z-index 种子（链式弹窗逐层 +1）
  var laneCtx = { lane: '', name: '' };   // 当前货道/商品上下文（浮层动态标题回填）

  function hideOverlay(ov) {
    if (!ov) return;
    ov.classList.remove('show');
    ov.style.display = 'none';
  }

  /* 从触发卡片读货道号+商品名（补货卡 / 货道卡 / 商品行） */
  function setLaneCtx(src) {
    var card = src && src.closest ? src.closest('.vm-card,.lane-card,.pm-lane-card,.pm-sort-card,.pm-row,.pm-sku') : null;
    if (!card) return;
    var no = card.querySelector('.vm-lid,.lane-id,.pm-lane-no,.pm-sort-no,.pm-sku-id');
    var nm = card.querySelector('.vm-name,.lane-name,.pm-lane-name,.pm-sort-name,.pm-name,.pm-sku-name');
    if (no) laneCtx.lane = no.textContent.trim();
    if (nm) laneCtx.name = nm.textContent.trim();
  }
  /* 回填浮层内占位：[data-fill-lane] → "L3 · 糖浆"（带属性值则 "前缀 · L3 糖浆"）；[data-fill-name] → 商品名 */
  function fillLane(ov) {
    if (!ov) return;
    if (laneCtx.lane || laneCtx.name) {
      ov.querySelectorAll('[data-fill-lane]').forEach(function (el) {
        var pre = el.getAttribute('data-fill-lane');
        el.textContent = pre ? pre + ' · ' + laneCtx.lane + ' ' + laneCtx.name
                             : laneCtx.lane + ' · ' + laneCtx.name;
      });
      ov.querySelectorAll('[data-fill-name]').forEach(function (el) {
        if (laneCtx.name) el.textContent = laneCtx.name;
      });
    }
  }

  /* ---------- 浮层关闭 ---------- */
  function doClose(el) {
    if (el.hasAttribute('data-close-go')) {           // 深链接态：关闭 = 跳转来源页
      location.href = el.getAttribute('data-close-go');
      return;
    }
    if (el.hasAttribute('data-close-all')) {          // 收拢整个浮层栈（终态确认）
      document.querySelectorAll('.vs-overlay.show').forEach(hideOverlay);
    } else {                                          // 只收最上层当前浮层
      hideOverlay(el.closest('.vs-overlay'));
    }
    if (el.getAttribute('data-toast')) toast(el.getAttribute('data-toast'));
  }

  /* ---------- 打开页内浮层（无遮罩轻浮层） ---------- */
  /* 默认互斥（收起其它已开浮层）；data-modal-stack 触发时堆叠（链式弹窗逐层叠） */
  function openModal(sel, opts) {
    opts = opts || {};
    var ov = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!ov || !ov.classList.contains('vs-overlay')) return;
    if (!opts.stack) {
      document.querySelectorAll('.vs-overlay.show').forEach(function (o) {
        if (o !== ov) hideOverlay(o);
      });
    }
    if (opts.src) setLaneCtx(opts.src);
    ov.style.display = '';                 // 清除 hideOverlay 留下的 display:none，交还给 .show 类
    ov.style.zIndex = String(++zTop);      // 后开的浮层居上
    ov.classList.add('show');
    fillLane(ov);
  }

  /* ---------- 下拉菜单（如用户菜单） ---------- */
  function closeMenus() {
    document.querySelectorAll('.vs-menu.show').forEach(function (m) { m.classList.remove('show'); });
  }
  function toggleMenu(sel) {
    var panel = sel ? document.querySelector(sel) : null;
    if (!panel) return;
    var wasOpen = panel.classList.contains('show');
    closeMenus();
    if (!wasOpen) panel.classList.add('show');
  }

  /* =====================================================================
   * 测试出货流程（data-ship）：货道卡片上的「出货」按钮 →
   *   二次确认弹窗 → 出货中（进度条 + 可终止）→ 出货完成
   * 页面约定（均可由 data-* 指定，以下为默认值）：
   *   [data-ship="#ship-confirm"]   出货按钮：从所属卡片读货道号(.pm-lane-no)与商品名(.pm-lane-name)，打开确认弹窗
   *   [data-ship-go="#ship-running"] 开始出货：打开出货中浮层并播进度条，约 2.5s 后自动打开完成浮层
   *   [data-ship-done="#ship-done"]  完成浮层选择器（可写在开始出货按钮上）
   *   [data-ship-stop="#ship-running"] 终止出货：停止计时、复位进度条、toast 提示
   *   [data-ship-text="confirm|running|done"] 浮层内文案占位，点击时按货道号/商品名回填
   * ===================================================================== */
  var shipCtx = { lane: '', name: '' };
  var shipTimer = null;
  function shipTexts() {
    document.querySelectorAll('[data-ship-text]').forEach(function (el) {
      var kind = el.getAttribute('data-ship-text');
      var lane = shipCtx.lane, name = shipCtx.name;
      if (kind === 'confirm') el.textContent = '确定要测试货道 ' + lane + '（' + name + '）出货吗？';
      else if (kind === 'running') el.textContent = '货道 ' + lane + '（' + name + '）正在出货，请稍候…';
      else if (kind === 'done') el.textContent = '货道 ' + lane + '（' + name + '）测试出货完成';
    });
  }
  function shipOpen(el) {
    var card = el.closest('.pm-lane-card') || el.closest('.pm-sort-card') || el.closest('.pm-row');
    shipCtx.lane = '';
    shipCtx.name = '';
    if (card) {
      var no = card.querySelector('.pm-lane-no') || card.querySelector('.pm-sort-no') || card.querySelector('.pm-sku-id');
      var nm = card.querySelector('.pm-lane-name') || card.querySelector('.pm-sort-name') || card.querySelector('.pm-name');
      if (no) shipCtx.lane = no.textContent.trim();
      if (nm) shipCtx.name = nm.textContent.trim();
    }
    shipTexts();
    openModal(el.getAttribute('data-ship') || '#ship-confirm');
    closeMenus();
  }
  function shipStart(el) {
    var runSel = (el && el.getAttribute('data-ship-go')) || '#ship-running';
    var doneSel = (el && el.getAttribute('data-ship-done')) || '#ship-done';
    shipTexts();
    openModal(runSel);
    var fill = document.querySelector(runSel + ' .ship-bar-fill');
    if (fill) {
      fill.style.transition = 'none';
      fill.style.width = '0%';
      void fill.offsetWidth;                       // 强制回流，保证过渡重新播放
      fill.style.transition = 'width 2.4s linear';
      fill.style.width = '100%';
    }
    clearTimeout(shipTimer);
    shipTimer = setTimeout(function () { openModal(doneSel); }, 2500);
  }
  function shipStop(el) {
    var runSel = (el && el.getAttribute('data-ship-stop')) || '#ship-running';
    clearTimeout(shipTimer);
    hideOverlay(document.querySelector(runSel));
    var fill = document.querySelector(runSel + ' .ship-bar-fill');
    if (fill) { fill.style.transition = 'none'; fill.style.width = '0%'; }
    toast('已终止出货' + (shipCtx.lane ? '（货道 ' + shipCtx.lane + '）' : ''));
  }

  /* ---------- 步进器 ---------- */
  function step(el) {
    var box = el.closest('.stepper') || el.closest('.pp-stepper');
    if (!box) return;
    var num = box.querySelector('.st-num') || box.querySelector('.step-val') || box.querySelector('.pp-val');
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

  /* ---------- 整页数字键盘（.np-key → .np-display）---------- */
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

  /* =====================================================================
   * 通用数字键盘（data-kb）：屏上键盘，供任意输入框唤起
   * ===================================================================== */
  var KB = null, kbSrc = null, kbMasked = false, kbMax = 0;
  function kbMask(s) {
    // 明文转掩码点（保留符号位提示：空则空）
    if (!s) return '';
    return s.replace(/[0-9]/g, '\u2022');
  }
  function kbRender() {
    if (!KB) return;
    var raw = KB.dataset.raw || '';
    var disp = KB.querySelector('.np-display');
    if (kbMasked) disp.textContent = kbMask(raw);
    else disp.textContent = raw || '0';
  }
  function kbPress(el) {
    if (!KB) return;
    var k = el.textContent.trim();
    var cur = KB.dataset.raw || '';
    if (k === '\u232B') {                                   // 退格
      cur = cur.slice(0, -1);
    } else if (k === '.' || k === '\u2212' || k === '-') { // 小数点（键盘含 .，口令牌不需要）
      if (k === '.' && cur.indexOf('.') < 0) cur = cur + '.';
    } else {
      var digits = cur.replace(/[^0-9]/g, '');
      if (kbMax && digits.length >= kbMax) return;         // 达到最大位数
      cur = cur + k;
    }
    KB.dataset.raw = cur;
    kbRender();
  }
  function buildKB() {
    var ov = document.createElement('div');
    ov.className = 'vs-kb-overlay';
    ov.id = 'vs-kb';
    var keys = ['1','2','3','4','5','6','7','8','9','.','0','\u232B'];
    var grid = keys.map(function (k) {
      var fn = (k === '.' || k === '\u232B') ? ' np-fn' : '';
      return '<button class="np-key' + fn + '">' + k + '</button>';
    }).join('');
    ov.innerHTML =
      '<div class="vs-modal vs-kb">' +
        '<div class="vs-kb-disp"><span class="np-display">0</span><span class="vs-kb-clear">清空</span></div>' +
        '<div class="vs-kb-grid">' + grid + '</div>' +
        '<div class="vs-kb-actions">' +
          '<button class="vs-kb-cancel" data-kb-cancel>取消</button>' +
          '<button class="vs-kb-done" data-kb-done>确定</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    KB = ov;
  }
  function openKB(src) {
    if (!KB) buildKB();
    kbSrc = src;
    kbMasked = src.hasAttribute('data-kb-mask');
    kbMax = parseInt(src.getAttribute('data-kb-max') || '0', 10) || 0;
    KB.dataset.raw = src.getAttribute('data-kb-value') || '';
    kbRender();
    KB.classList.add('show');
  }
  function closeKB() {
    if (KB) KB.classList.remove('show');
    kbSrc = null;
  }
  function kbDone() {
    var raw = KB ? (KB.dataset.raw || '') : '';
    var href = null, toastMsg = null;
    if (kbSrc) {
      // 回写到触发输入框（优先其内部 .ph 占位，否则自身）
      var target = kbSrc.querySelector('.ph') || kbSrc;
      var ph = kbSrc.getAttribute('data-kb-ph') || '';
      if (kbMasked) target.textContent = raw ? kbMask(raw) : ph;
      else target.textContent = raw || ph;
      kbSrc.setAttribute('data-kb-value', raw);
      href = kbSrc.getAttribute('data-kb-goto');
      toastMsg = kbSrc.getAttribute('data-kb-toast');
    }
    closeKB();
    if (href) goto(href, toastMsg);
    else if (toastMsg) toast(toastMsg);
  }

  /* ---------- 统一点击委托 ---------- */
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    if (!t || !t.closest) return;
    var el;

    /* 通用键盘（先于其它，避免与内层 np-key 混淆） */
    if ((el = t.closest('#vs-kb [data-kb-done]'))) { kbDone(); return; }
    if ((el = t.closest('#vs-kb [data-kb-cancel]'))) { closeKB(); return; }
    if ((el = t.closest('#vs-kb .vs-kb-clear'))) { if (KB) { KB.dataset.raw = ''; kbRender(); } return; }
    if ((el = t.closest('#vs-kb .np-key'))) { kbPress(el); return; }
    if ((el = t.closest('#' + 'vs-kb'))) { return; }         // 键盘区域空白不穿透

    /* ---- 下拉菜单：点外部自动收起 / data-menu 切换 / data-modal 打开页内浮层 ---- */
    if (!t.closest('[data-menu]') && !t.closest('.vs-menu')) closeMenus();
    if ((el = t.closest('[data-menu]'))) { toggleMenu(el.getAttribute('data-menu')); return; }
    if ((el = t.closest('[data-modal]'))) {
      openModal(el.getAttribute('data-modal'), {
        stack: el.hasAttribute('data-modal-stack'),
        src: el
      });
      closeMenus();
      return;
    }

    /* ---- 测试出货流程 ---- */
    if ((el = t.closest('[data-ship]'))) { shipOpen(el); return; }
    if ((el = t.closest('[data-ship-go]'))) { shipStart(el); return; }
    if ((el = t.closest('[data-ship-stop]'))) { shipStop(el); return; }

    /* 点浮层空白处：安全浮层（data-modal-safe）收起；危险浮层吞掉点击，只能按钮关闭 */
    if (t.classList && t.classList.contains('vs-overlay')) {
      if (t.hasAttribute('data-modal-safe')) hideOverlay(t);
      return;
    }

    /* 唤起通用键盘（输入框） */
    if ((el = t.closest('[data-kb]'))) { openKB(el); return; }

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

    /* 单选：带 data-href 视为模式切换（跳转），否则行内互斥（设置页）；
       带关闭/堆叠指令的单选项（如“按保质期时长”回上层浮层）交给关闭逻辑 */
    if ((el = t.closest('.vs-radio'))) {
      if (el.hasAttribute('data-close-go') || el.hasAttribute('data-close-hide') || el.hasAttribute('data-close-all')) {
        doClose(el);
        return;
      }
      if (el.hasAttribute('data-href')) {
        storeCtx(el);
        goto(el.getAttribute('data-href'), el.getAttribute('data-toast'));
        return;
      }
      var grp = el.closest('.vs-unit-row') || el.parentNode;
      if (grp) grp.querySelectorAll('.vs-radio').forEach(function (r) { r.classList.remove('on'); });
      el.classList.add('on');
      return;
    }

    if ((el = t.closest('[data-act="goto-toast"]'))) {
      goto(el.getAttribute('data-href'), el.getAttribute('data-toast'));
      return;
    }
    if ((el = t.closest('[data-close-go]')) || (el = t.closest('[data-close-hide]')) || (el = t.closest('[data-close-all]'))) { doClose(el); return; }
    if ((el = t.closest('[data-href]'))) {
      storeCtx(el);
      goto(el.getAttribute('data-href'), el.getAttribute('data-toast'));
      return;
    }
    if ((el = t.closest('[data-toast]'))) { toast(el.getAttribute('data-toast')); return; }
    if ((el = t.closest('[data-toggle]'))) { el.classList.toggle(el.getAttribute('data-toggle')); return; }
  });

  /* ---------- 排序拖拽（.pm-sort-list 内的 .pm-sort-card）---------- */
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
