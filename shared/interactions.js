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
 *   data-del                      点击删除所在 .pm-cat-row，先弹二次确认（通用确认浮层），确认后才隐藏
 *   data-op="remove-tags|clear-sel"  标签管理底部操作；remove-tags 先弹二次确认（#vs-confirm-tags），
 *                                  确认后才移除标签；页面可监听 'vs-remove-tags-ask'（可取消）整体接管
 *   data-kb[.ph|data-kb-mask|data-kb-max|data-kb-ph]     打开屏上键盘（输入框用）
 *   data-kb-type="text"              全键盘：26 字母 + 标点 + 数字（Shift 大小写 / 退格 / 空格）；
 *                                    缺省为数字键盘（纯数字场景，如口令）
 *   data-kb-goto / data-kb-toast  键盘“确定”后跳转 / 提示（如登录 → 首页）
 * 键盘行为：点击输入框唤起；键盘开着时点空白处若落点是另一个 data-kb 输入框，
 *   则切换键盘目标（原框内容自动回写不丢失）；确定=回写并派发 'kb-done' 事件
 *   （页面可监听接管，如 46 页新建分组）；取消=放弃本次输入。
 * 自动接管：.np-key 数字键盘 / .vm-ctrl .sq 卡片加减 / .pm-sku 勾选 / .pm-chip（筛选条单选、标签选择多选）/
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
    '.vs-kb-done:active{background:#000;}' +
    /* ===== 通用全键盘（data-kb-type="text"）===== */
    '.vs-kb-body{padding:12px;background:var(--line,#d9d9d2);}' +
    '.vs-kb-body-inner{display:flex;flex-direction:column;gap:8px;}' +
    '.vs-kb-row{display:flex;gap:8px;}' +
    '.vs-kb-row .kb-key{flex:1;min-width:0;height:76px;border:none;border-radius:8px;background:#FFFFFF;' +
      'font-size:24px;font-weight:600;color:var(--ink,#111);cursor:pointer;font-family:var(--sans,sans-serif);}' +
    '.vs-kb-row .kb-key:active{background:#DEDED6;}' +
    '.vs-kb-row .kb-key.kb-fn{background:#E9E9E1;color:var(--sub,#55554e);font-size:20px;}' +
    '.vs-kb-row .kb-key.kb-fn:active{background:#D8D8CE;}' +
    '.vs-kb-row .kb-key.kb-shift.on{background:var(--dark,#0f0f0f);color:#FFFFFF;}' +
    '.vs-kb-row .kb-key.kb-wide{flex:3;font-size:15px;color:var(--sub,#55554e);}';
  document.head.appendChild(css);

  /* ---------- 双语（shared/i18n.js，若页面未引入则降级为原文） ---------- */
  function T(x) { return window.I18N ? window.I18N.t(x) : x; }
  /* 出货流程文案模板：[中文, English]，%s = 货道号 / 商品名 */
  var SHIP_TPL = {
    confirm: ['确定要测试货道 %s（%s）出货吗？', 'Start test dispensing for lane %s (%s)?'],
    running: ['货道 %s（%s）正在出货，请稍候…', 'Lane %s (%s) is dispensing, please wait…'],
    done:    ['货道 %s（%s）测试出货完成', 'Lane %s (%s) test dispensing complete']
  };
  function shipT(key, lane, name) {
    var pair = SHIP_TPL[key]; if (!pair) return '';
    var isEn = !!(window.I18N && window.I18N.get() === 'en');
    var tpl = isEn ? pair[1] : pair[0];
    return tpl.replace('%s', lane).replace('%s', isEn ? T(name) : name);
  }

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    if (!msg) return;
    var old = document.querySelector('.vs-toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.className = 'vs-toast';
    t.textContent = T(msg);
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
          t.textContent = T(c.name) + ' · ' + T(t.getAttribute('data-ctx-fixed'));
        } else {
          var noun = T(t.getAttribute('data-ctx-noun') || '个商品');
          var fb = T(t.getAttribute('data-ctx-fallback') || '');
          var cnt = (c.count || '').replace(/个\s*$/, '').trim();   // “12 个”→“12”，避免拼出“12 个个商品”
          t.textContent = T(c.name) + ' · ' + (cnt ? cnt + ' ' + noun : fb);
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
        el.textContent = pre ? T(pre) + ' · ' + laneCtx.lane + ' ' + T(laneCtx.name)
                             : laneCtx.lane + ' · ' + T(laneCtx.name);
      });
      ov.querySelectorAll('[data-fill-name]').forEach(function (el) {
        if (laneCtx.name) el.textContent = T(laneCtx.name);
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

  /* ---------- 通用二次确认（data-del / data-op="remove-tags"）→ 复用页内浮层 ---------- */
  /* 危险操作：默认仅按钮可关（非 data-modal-safe），确认后才执行；
     文案按触发动态填充（text 可含 %s，由 count 替换），确认动作由 confirmOnOk 承接 */
  var confirmOnOk = null;                 // 确认后执行的动作（每次打开重新绑定）
  function buildConfirm(id) {
    if (document.getElementById(id)) return;
    var host = document.querySelector('.vs-canvas') || document.body;
    var ov = document.createElement('div');
    ov.className = 'vs-overlay';
    ov.id = id;
    ov.innerHTML =
      '<div class="vs-modal" style="width:420px">' +
        '<div class="vs-modal-head"><div class="vs-modal-title" data-cf="title"></div>' +
          '<button class="vs-modal-close" data-close-hide>&#10005;</button></div>' +
        '<div class="vs-modal-body"><div class="pm-note" data-cf="text"></div></div>' +
        '<div class="md-foot">' +
          '<button class="md-btn md-btn-line" data-close-hide data-cf="cancel"></button>' +
          '<button class="md-btn md-btn-red" data-confirm-del data-cf="ok"></button>' +
        '</div>' +
      '</div>';
    host.appendChild(ov);
  }
  /* cfg: {title, text(可含 %s), count, okText, onOk}；文案经 T() 按当前语言填充；
     text 含参时把模板与参数登记到 data-i18n-tpl/args，切语言由 i18n.apply 重填 */
  function openConfirm(id, cfg) {
    buildConfirm(id);
    var ov = document.getElementById(id);
    if (!ov) return;
    var text = T(cfg.text);
    if (cfg.count != null) text = text.split('%s').join(cfg.count);
    var textEl = ov.querySelector('[data-cf="text"]');
    if (cfg.count != null) {
      textEl.setAttribute('data-i18n-tpl', cfg.text);
      textEl.setAttribute('data-i18n-args', String(cfg.count));
    } else {
      textEl.removeAttribute('data-i18n-tpl');
      textEl.removeAttribute('data-i18n-args');
    }
    textEl.textContent = text;
    ov.querySelector('[data-cf="title"]').textContent = T(cfg.title);
    ov.querySelector('[data-cf="ok"]').textContent = T(cfg.okText);
    ov.querySelector('[data-cf="cancel"]').textContent = T('取消');
    confirmOnOk = cfg.onOk || null;
    openModal('#' + id);
  }

  /* ---------- 自定义时间范围（data-op="custom-range"）→ 复用页内浮层 ---------- */
  /* 年/月/日 + 时/分 各一组（开始/结束），应用于全部统计页的“自定义”时间选择 */
  var customTrigger = null;                 // 触发自定义时间范围的按钮（应用后回填其文案）
  function crOpt(v) { return '<option>' + v + '</option>'; }
  function crVal(ov, k) { var s = ov.querySelector('[data-cr="' + k + '"]'); return s ? s.value : ''; }
  function crFmt(ov, p) {
    return crVal(ov, p + 'y') + '/' + crVal(ov, p + 'm') + '/' + crVal(ov, p + 'd') + ' ' +
           crVal(ov, p + 'h') + ':' + crVal(ov, p + 'min');
  }
  function crFill(ov) {
    var years = ['2025', '2026'];
    var pad = function (n) { return ('0' + n).slice(-2); };
    var months = [], days = [], hours = [], mins = [];
    for (var m = 1; m <= 12; m++) months.push(pad(m));
    for (var d = 1; d <= 31; d++) days.push(pad(d));
    for (var h = 0; h <= 23; h++) hours.push(pad(h));
    for (var mi = 0; mi <= 59; mi++) mins.push(pad(mi));
    function set(k, arr, def) {
      var s = ov.querySelector('[data-cr="' + k + '"]');
      s.innerHTML = arr.map(crOpt).join('');
      s.value = def;
    }
    set('sy', years, '2026'); set('sm', months, '08'); set('sd', days, '01');
    set('sh', hours, '00'); set('smin', mins, '00');
    set('ey', years, '2026'); set('em', months, '08'); set('ed', days, '31');
    set('eh', hours, '23'); set('emin', mins, '59');
  }
  function crPreview(ov) {
    ov.querySelector('[data-cr="preview"]').textContent = crFmt(ov, 's') + '  ~  ' + crFmt(ov, 'e');
  }
  function buildCustomTime() {
    if (document.getElementById('stats-custom-time')) return;
    var host = document.querySelector('.vs-canvas') || document.body;
    var ov = document.createElement('div');
    ov.className = 'vs-overlay';
    ov.id = 'stats-custom-time';
    ov.innerHTML =
      '<div class="vs-modal" style="width:660px">' +
        '<div class="vs-modal-head"><div class="vs-modal-title" data-cr="title">自定义时间范围</div>' +
          '<button class="vs-modal-close" data-close-hide>&#10005;</button></div>' +
        '<div class="vs-modal-body">' +
          '<div class="cr-block"><div class="cr-label" data-cr="startL">开始时间</div>' +
            '<div class="cr-units"><span>年</span><span>月</span><span>日</span><span>时</span><span>分</span></div>' +
            '<div class="cr-dt">' +
              '<select class="cr-sel" data-cr="sy"></select>' +
              '<select class="cr-sel" data-cr="sm"></select>' +
              '<select class="cr-sel" data-cr="sd"></select>' +
              '<select class="cr-sel" data-cr="sh"></select>' +
              '<select class="cr-sel" data-cr="smin"></select>' +
            '</div></div>' +
          '<div class="cr-block"><div class="cr-label" data-cr="endL">结束时间</div>' +
            '<div class="cr-units"><span>年</span><span>月</span><span>日</span><span>时</span><span>分</span></div>' +
            '<div class="cr-dt">' +
              '<select class="cr-sel" data-cr="ey"></select>' +
              '<select class="cr-sel" data-cr="em"></select>' +
              '<select class="cr-sel" data-cr="ed"></select>' +
              '<select class="cr-sel" data-cr="eh"></select>' +
              '<select class="cr-sel" data-cr="emin"></select>' +
            '</div></div>' +
          '<div class="cr-preview" data-cr="preview">请选择起止时间</div>' +
        '</div>' +
        '<div class="md-foot">' +
          '<button class="md-btn md-btn-line" data-cr-cancel>取消</button>' +
          '<button class="md-btn md-btn-dark" data-cr-apply>应用</button>' +
        '</div>' +
      '</div>';
    ov.querySelector('[data-cr="title"]').textContent = T('自定义时间范围');
    ov.querySelector('[data-cr="startL"]').textContent = T('开始时间');
    ov.querySelector('[data-cr="endL"]').textContent = T('结束时间');
    ov.querySelector('[data-cr="preview"]').textContent = T('请选择起止时间');
    ov.querySelector('[data-cr-apply]').textContent = T('应用');
    ov.querySelector('[data-cr-cancel]').textContent = T('取消');
    crFill(ov);
    crPreview(ov);
    ov.querySelectorAll('.cr-sel').forEach(function (s) {
      s.addEventListener('change', function () { crPreview(ov); });
    });
    host.appendChild(ov);
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
      if (kind === 'confirm') el.textContent = shipT('confirm', lane, name);
      else if (kind === 'running') el.textContent = shipT('running', lane, name);
      else if (kind === 'done') el.textContent = shipT('done', lane, name);
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
    toast(shipCtx.lane ? T('已终止出货（货道 %s）').replace('%s', shipCtx.lane) : T('已终止出货'));
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
  var KB = null, kbSrc = null, kbMasked = false, kbMax = 0, kbType = 'num', kbUpper = false;
  function kbMask(s, all) {
    // 明文转掩码点（all=true 时全部字符打点，用于密码；否则仅数字，保留符号提示）
    if (!s) return '';
    if (all) return s.replace(/[^]/g, '\u2022');
    return s.replace(/[0-9]/g, '\u2022');
  }
  function kbRender() {
    if (!KB) return;
    var raw = KB.dataset.raw || '';
    var disp = KB.querySelector('.np-display');
    if (kbType === 'text' && !raw) {
      disp.style.color = '#B3B3AE';
      disp.style.letterSpacing = 'normal';
      disp.textContent = T(kbSrc ? (kbSrc.getAttribute('data-kb-ph') || '') : '');
      return;
    }
    disp.style.color = '';
    disp.style.letterSpacing = kbType === 'text' ? 'normal' : '2px';
    if (kbMasked) disp.textContent = kbMask(raw, kbType === 'text');
    else disp.textContent = kbType === 'text' ? raw : (raw || '0');
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
  function numKeyboardEl() {
    var keys = ['1','2','3','4','5','6','7','8','9','.','0','\u232B'];
    var grid = keys.map(function (k) {
      var fn = (k === '.' || k === '\u232B') ? ' np-fn' : '';
      return '<button class="np-key' + fn + '">' + k + '</button>';
    }).join('');
    var g = document.createElement('div');
    g.className = 'vs-kb-grid';
    g.innerHTML = grid;
    return g;
  }
  /* 全键盘（data-kb-type="text"）：数字 + QWERTY + 标点 + Shift + 空格 */
  function textKeyboardEl() {
    var L = kbUpper;
    var html = '<div class="vs-kb-body-inner">';
    html += '<div class="vs-kb-row">' + '1234567890'.split('').map(function (k) {
      return '<button class="kb-key" data-k="' + k + '">' + k + '</button>';
    }).join('') + '</div>';
    ['qwertyuiop','asdfghjkl'].forEach(function (s) {
      html += '<div class="vs-kb-row">' + s.split('').map(function (k) {
        return '<button class="kb-key" data-k="' + k + '">' + (L ? k.toUpperCase() : k) + '</button>';
      }).join('') + '</div>';
    });
    html += '<div class="vs-kb-row">' +
      '<button class="kb-key kb-fn kb-shift' + (L ? ' on' : '') + '" data-k="shift">&#8679;</button>' +
      'zxcvbnm'.split('').map(function (k) {
        return '<button class="kb-key" data-k="' + k + '">' + (L ? k.toUpperCase() : k) + '</button>';
      }).join('') +
      '<button class="kb-key kb-fn" data-k="\u232B">&#9003;</button>' +
      '</div>';
    html += '<div class="vs-kb-row">' +
      ['-','_','.','@',',','/'].map(function (k) {
        return '<button class="kb-key" data-k="' + k + '">' + k + '</button>';
      }).join('') +
      '<button class="kb-key kb-wide" data-k=" ">' + T('空格') + '</button>' +
      '</div>';
    html += '</div>';
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    return wrap.firstChild;
  }
  function renderKBBody() {
    if (!KB) return;
    var body = KB.querySelector('#vs-kb-body');
    if (!body) return;
    body.innerHTML = '';
    body.appendChild(kbType === 'text' ? textKeyboardEl() : numKeyboardEl());
  }
  function kbPressText(el) {
    if (!KB) return;
    if (el.classList.contains('kb-shift')) {
      kbUpper = !kbUpper;
      renderKBBody();
      return;
    }
    var k = el.getAttribute('data-k');
    var cur = KB.dataset.raw || '';
    if (k === '\u232B') {                                   // 退格
      cur = cur.slice(0, -1);
    } else if (k) {
      if (k !== ' ' && kbMax && cur.length >= kbMax) return;  // 达到最大长度
      var ch = (k.length === 1 && k >= 'a' && k <= 'z' && kbUpper) ? k.toUpperCase() : k;
      cur += ch;
      if (kbUpper) { kbUpper = false; renderKBBody(); }      // 打一个大写后自动回小写
    }
    KB.dataset.raw = cur;
    kbRender();
  }
  function buildKB() {
    var ov = document.createElement('div');
    ov.className = 'vs-kb-overlay';
    ov.id = 'vs-kb';
    ov.innerHTML =
      '<div class="vs-modal vs-kb">' +
        '<div class="vs-kb-disp"><span class="np-display">0</span><span class="vs-kb-clear" data-kb-clear>' + T('清空') + '</span></div>' +
        '<div class="vs-kb-body" id="vs-kb-body"></div>' +
        '<div class="vs-kb-actions">' +
          '<button class="vs-kb-cancel" data-kb-cancel>' + T('取消') + '</button>' +
          '<button class="vs-kb-done" data-kb-done>' + T('确定') + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    KB = ov;
  }
  function openKB(src) {
    if (!KB) buildKB();
    kbSrc = src;
    kbType = src.getAttribute('data-kb-type') === 'text' ? 'text' : 'num';
    kbMasked = src.hasAttribute('data-kb-mask');
    kbMax = parseInt(src.getAttribute('data-kb-max') || '0', 10) || 0;
    kbUpper = false;
    KB.dataset.raw = src.getAttribute('data-kb-value') || '';
    renderKBBody();
    var _c = KB.querySelector('.vs-kb-clear'); if (_c) _c.textContent = T('清空');
    var _x = KB.querySelector('[data-kb-cancel]'); if (_x) _x.textContent = T('取消');
    var _o = KB.querySelector('[data-kb-done]'); if (_o) _o.textContent = T('确定');
    kbRender();
    KB.classList.add('show');
  }
  function closeKB() {
    if (KB) KB.classList.remove('show');
    kbSrc = null;
  }
  function kbWriteBack(fireEvent) {
    // 把键盘当前内容回写到触发输入框（fireEvent=true 时派发 kb-done，供页面监听接管）
    var raw = KB ? (KB.dataset.raw || '') : '';
    if (kbSrc) {
      // 回写到触发输入框（优先其内部 .ph 占位，否则自身）
      var target = kbSrc.querySelector('.ph') || kbSrc;
      var ph = T(kbSrc.getAttribute('data-kb-ph') || '');
      if (kbMasked) target.textContent = raw ? kbMask(raw, kbType === 'text') : ph;
      else target.textContent = raw || ph;
      kbSrc.setAttribute('data-kb-value', raw);
      if (fireEvent) {
        try { kbSrc.dispatchEvent(new CustomEvent('kb-done', { bubbles: true })); } catch (e) {}
      }
    }
    return raw;
  }
  function kbDone() {
    var href = null, toastMsg = null;
    if (kbSrc) {
      href = kbSrc.getAttribute('data-kb-goto');
      toastMsg = kbSrc.getAttribute('data-kb-toast');
    }
    kbWriteBack(true);          // 回写 + 派发 kb-done（必须在 closeKB 置空 kbSrc 之前）
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
    /* 全键盘按键（data-kb-type="text"） */
    if ((el = t.closest('#vs-kb .kb-key'))) { kbPressText(el); return; }
    /* 键盘内层数字键（先于 .np-key，避免与补货数字键盘混淆） */
    if ((el = t.closest('#vs-kb .np-key'))) { kbPress(el); return; }
    if ((el = t.closest('#' + 'vs-kb'))) {
      // 键盘开着时点空白处：若落点是另一个 data-kb 输入框，切换键盘目标（原框内容先回写，不丢失）
      if (KB && KB.classList.contains('show') && t.classList && t.classList.contains('vs-kb-overlay')
          && typeof ev.clientX === 'number') {
        try {
          KB.style.visibility = 'hidden';
          var under = document.elementFromPoint(ev.clientX, ev.clientY);
          KB.style.visibility = '';
          var kb2 = under && under.closest ? under.closest('[data-kb]') : null;
          if (kb2 && kb2 !== kbSrc) { kbWriteBack(false); openKB(kb2); return; }
        } catch (e) {}
      }
      return;         // 键盘区域空白不穿透
    }

    /* ---- 语言切换（先于 .vs-radio 等，保证单选控件可切语言） ---- */
    if ((el = t.closest('[data-act="set-lang"]'))) {
      var _l = el.getAttribute('data-lang');
      var lang = (_l === 'en' || _l === 'zh-TW') ? _l : 'zh';
      if (window.I18N) window.I18N.set(lang);
      toast(T(lang === 'en' ? '已切换为英文' : (lang === 'zh-TW' ? '已切换为繁体中文' : '已切换为中文')));
      return;
    }

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
      if (row) {
        openConfirm('vs-confirm-del', {
          title: '删除分类', text: '确定删除该分类吗？', okText: '删除',
          onOk: function () { row.style.display = 'none'; toast(T('已删除该分类')); }
        });
      }
      return;
    }
    if ((el = t.closest('[data-confirm-del]'))) {
      var fn = confirmOnOk;
      confirmOnOk = null;
      hideOverlay(el.closest('.vs-overlay'));
      if (fn) fn();
      return;
    }
    if ((el = t.closest('[data-op]'))) {
      var kind = el.getAttribute('data-op');
      if (kind === 'custom-range') {
        customTrigger = el;
        buildCustomTime();
        openModal('#stats-custom-time', { src: el });
        return;
      } else if (kind === 'remove-tags') {
        /* 页面可整体接管（如 46 页：按数据层处理，含被左导航筛掉的已选项） */
        var ask = new CustomEvent('vs-remove-tags-ask', { bubbles: true, cancelable: true });
        if (!document.dispatchEvent(ask)) return;
        var nSel = document.querySelectorAll('.pm-sku.on').length;
        if (!nSel) { toast(T('请先选择 SKU')); return; }
        /* 文案可经 data-op-title/data-op-text(可含 %s)/data-op-ok/data-op-done 覆盖：
           缺省为“标签”（50 页用；46 页由脚本整体接管，改用“分组”措辞，用不到缺省） */
        openConfirm('vs-confirm-tags', {
          title: el.getAttribute('data-op-title') || '移出标签',
          text: el.getAttribute('data-op-text') || '确定将所选 %s 个 SKU 的全部标签移出吗？',
          count: nSel,
          okText: el.getAttribute('data-op-ok') || '确认移出',
          onOk: function () {
            document.querySelectorAll('.pm-sku.on .pm-mini-tag').forEach(function (tag) { tag.remove(); });
            toast(T(el.getAttribute('data-op-done') || '已为所选 SKU 移出标签'));
          }
        });
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
    /* 自定义时间范围弹窗：应用 / 取消 */
    if ((el = t.closest('[data-cr-apply]'))) {
      var ovA = document.getElementById('stats-custom-time');
      if (!ovA) return;
      var sa = crFmt(ovA, 's'), ea = crFmt(ovA, 'e');
      if (sa > ea) { toast(T('开始时间不能晚于结束时间')); return; }
      crPreview(ovA);
      if (customTrigger) customTrigger.innerHTML = sa.slice(0, 10) + '  →  ' + ea.slice(0, 10) + ' &#9662;';
      hideOverlay(ovA);
      toast(T('已应用自定义时间范围'));
      return;
    }
    if ((el = t.closest('[data-cr-cancel]'))) {
      var ovC = document.getElementById('stats-custom-time');
      if (ovC) hideOverlay(ovC);
      var rr = document.getElementById('rangeRow');
      if (rr) {
        rr.querySelectorAll('.rg-btn').forEach(function (x) { x.classList.remove('on'); });
        var firstBtn = rr.querySelector('.rg-btn');
        if (firstBtn) firstBtn.classList.add('on');
      }
      return;
    }
    if ((el = t.closest('.pm-sku'))) {
      el.classList.toggle('on');
      var chk = el.querySelector('.pm-sku-check');
      if (chk) chk.textContent = el.classList.contains('on') ? '\u2713' : '';
      return;
    }
    if ((el = t.closest('.pm-chip'))) {
      if (el.closest('.pm-filter-bar')) {
        /* 筛选条：单选（互斥）——同一组只能选中一个 */
        el.parentElement.querySelectorAll('.pm-chip').forEach(function (c) { c.classList.remove('on'); });
        el.classList.add('on');
      } else {
        /* 添加标签弹窗内的标签选择：可多选 */
        el.classList.toggle('on');
      }
      return;
    }

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

  /* 对外暴露少量工具（供页面级脚本复用，避免重复实现 toast/跳转/确认浮层） */
  window.VS = { toast: toast, goto: goto, confirm: openConfirm };

})();
