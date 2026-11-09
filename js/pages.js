/* =========================================================
   ecolease site v5 — 旧サイト引き継ぎページ用スクリプト（2026-10-30 追加）
   読み込み順： script.js → … → v5.js → pages.js
     1. 続きを読む（.more）
     2. 折りたたみの「すべて開く／閉じる」（[data-acc-all]）
     3. グラフの出現アニメ（.donut / .bars / .cmp）
     4. RE-LEASE 循環図とステップの連動（[data-rl]）
     5. SDGs 17目標の絞り込み（[data-sdg-filter]）
     6. 印刷時は折りたたみを全部開く
   ========================================================= */
(function () {
  'use strict';
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* 1. 続きを読む */
  $$('.more').forEach(function (box) {
    var body = box.querySelector('.more-body');
    var btn = box.querySelector('.more-btn');
    if (!body || !btn) return;
    var label = btn.querySelector('span');
    // 折る必要がない短文はボタンを消す
    requestAnimationFrame(function () {
      if (body.scrollHeight <= body.clientHeight + 4) { btn.style.display = 'none'; box.classList.add('open'); body.style.maxHeight = 'none'; }
    });
    btn.addEventListener('click', function () {
      var open = box.classList.toggle('open');
      body.style.maxHeight = open ? body.scrollHeight + 'px' : '';
      if (label) label.textContent = open ? '閉じる' : '続きを読む';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* 2. すべて開く／閉じる */
  $$('[data-acc-all]').forEach(function (btn) {
    var scope = document.querySelector(btn.getAttribute('data-acc-all'));
    if (!scope) return;
    btn.addEventListener('click', function () {
      var items = $$('details', scope);
      var anyClosed = items.some(function (d) { return !d.open; });
      items.forEach(function (d) { d.open = anyClosed; });
      btn.querySelector('span').textContent = anyClosed ? 'すべて閉じる' : 'すべて開く';
    });
  });

  /* 3. グラフの出現 */
  var charts = $$('.donut, .bars, .cmp');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .35 });
    charts.forEach(function (c) { io.observe(c); });
  } else { charts.forEach(function (c) { c.classList.add('in'); }); }

  /* 4. RE-LEASE：図のノードと右のステップを相互にハイライト */
  $$('[data-rl]').forEach(function (root) {
    var nodes = $$('.node', root), steps = $$('.rl-step', root);
    function on(i) {
      nodes.forEach(function (n) { n.classList.toggle('on', +n.getAttribute('data-i') === i); });
      steps.forEach(function (s) { s.classList.toggle('on', +s.getAttribute('data-i') === i); });
    }
    nodes.forEach(function (n) {
      n.addEventListener('mouseenter', function () { on(+n.getAttribute('data-i')); });
      n.addEventListener('click', function () { on(+n.getAttribute('data-i')); });
    });
    steps.forEach(function (s) { s.addEventListener('mouseenter', function () { on(+s.getAttribute('data-i')); }); });
    // 自動で順番に光らせる（操作したら止める）
    var i = 0, auto = setInterval(function () { on(i); i = (i + 1) % steps.length; }, 2200);
    root.addEventListener('mouseenter', function () { clearInterval(auto); }, { once: true });
    root.addEventListener('touchstart', function () { clearInterval(auto); }, { once: true, passive: true });
  });

  /* 5. SDGs 絞り込み */
  $$('[data-sdg-filter]').forEach(function (bar) {
    var grid = document.querySelector(bar.getAttribute('data-sdg-filter'));
    $$('button', bar).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('button', bar).forEach(function (x) { x.classList.toggle('on', x === b); });
        var f = b.getAttribute('data-f');
        $$('.sdg', grid).forEach(function (s) {
          s.classList.toggle('hide', f !== 'all' && (s.getAttribute('data-t') || '').indexOf(f) < 0);
        });
      });
    });
  });

  /* 目次・ページ内リンクで折りたたみを開く */
  function openHash(id) {
    var el = id && document.getElementById(id);
    if (el && el.tagName === 'DETAILS') el.open = true;
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function () { openHash(a.getAttribute('href').slice(1)); });
  });
  openHash(location.hash.slice(1));


  /* 7. TOP「The Cycle」：左の循環図＋右のカードがせり上がる（[data-rl-pin]）
        ・901px以上かつ「視差効果を減らす」OFFのときだけピン留め
        ・RL_PIN_VH：カード1枚ぶんのスクロール量（vh） */
  var RL_PIN_VH = 62;
  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $$('[data-rl-pin]').forEach(function (pin) {
    var cards = $$('.rl-card', pin), nodes = $$('.node', pin), dots = $$('.rl-dots i', pin);
    var n = cards.length, on = false, cur = -1;
    function setActive(k) {
      if (k === cur) return; cur = k;
      var id = String(k + 1);
      nodes.forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-i') === id); });
      dots.forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-i') === id); });
    }
    var sticky = pin.querySelector('.rl-pin-sticky'), stTop = 90;
    function layout() {
      on = window.matchMedia('(min-width: 901px)').matches && !REDUCE;
      pin.classList.toggle('pin-on', on);
      cards.forEach(function (c, i) { c.style.transform = ''; c.style.opacity = ''; c.style.zIndex = on ? String(10 + i) : ''; });
      if (!on) { pin.style.height = ''; sticky.style.top = ''; nodes.forEach(function (x) { x.classList.remove('on'); }); cur = -1; return; }
      // 固定エリアは中身の高さだけ。画面の上下中央（ヘッダー分は避ける）に止める
      var sh = sticky.offsetHeight;
      stTop = Math.max(84, Math.round((window.innerHeight - sh) / 2 + 20));
      sticky.style.top = stTop + 'px';
      pin.style.height = (sh + (n - 1) * window.innerHeight * RL_PIN_VH / 100) + 'px';
    }
    function progress() {
      var r = pin.getBoundingClientRect(), total = pin.offsetHeight - sticky.offsetHeight;
      var p = total > 0 ? (stTop - r.top) / total : 0;
      return p < 0 ? 0 : p > 1 ? 1 : p;
    }
    function update() {
      if (!on) return;
      var r = pin.getBoundingClientRect();
      if (r.bottom < -50 || r.top > window.innerHeight + 50) return;
      var raw = progress() * (n - 1) + 1;          // 1枚目は最初から表示
      var active = Math.min(n - 1, Math.max(0, Math.round(raw - 1 + 0.15)));
      for (var i = 0; i < n; i++) {
        var t = raw - i, y, sc = 1, op = 1;
        if (t <= 0) { y = 115; op = 0; }
        else if (t < 1) { var e = 1 - Math.pow(1 - t, 3); y = (1 - e) * 115; op = 1; }
        else { var d = Math.min(t - 1, 3); y = -d * 5; sc = 1 - d * 0.04; op = d > 2 ? 0 : 1; }
        cards[i].style.transform = 'translateY(' + y.toFixed(2) + '%) scale(' + sc.toFixed(3) + ')';
        cards[i].style.opacity = op < 0 ? '0' : op.toFixed(3);
      }
      setActive(active);
    }
    // 図の丸をクリック → その工程のカード位置までスクロール
    nodes.forEach(function (nd) {
      nd.addEventListener('click', function () {
        var k = (+nd.getAttribute('data-i')) - 1;
        if (!on) { var c = cards[k]; if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
        var top = pin.getBoundingClientRect().top + window.pageYOffset - stTop;
        var total = pin.offsetHeight - sticky.offsetHeight;
        var y = top + total * (k / (n - 1));
        if (window.__lenis && window.__lenis.scrollTo) window.__lenis.scrollTo(y, { duration: 1.2 });
        else window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });
    layout(); update();
    window.addEventListener('resize', function () { layout(); update(); });
    window.addEventListener('load', function () { layout(); update(); });
    (function loop() { update(); requestAnimationFrame(loop); })();
  });


  /* 8. 事業案内「3つの事業を、ひと目で。」タブ（[data-bo]）
        ・BO_DUR ミリ秒ごとに次のタブへ自動で進む（マウスを乗せると一時停止）
        ・画面外にあるときは進めない */
  var BO_DUR = 7000;
  $$('[data-bo]').forEach(function (bo) {
    var tabs = $$('.bo-tab', bo), panels = $$('.bo-panel', bo), idx = 0, timer = null, hover = false, visible = false;
    bo.style.setProperty('--bo-dur', (BO_DUR / 1000) + 's');
    function show(i) {
      idx = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, k) {
        t.classList.toggle('on', k === idx); t.setAttribute('aria-selected', k === idx ? 'true' : 'false');
        var p = t.querySelector('.prog'); if (p) { p.style.animation = 'none'; void p.offsetWidth; p.style.animation = ''; }
      });
      panels.forEach(function (p, k) {
        p.classList.remove('on');
        if (k === idx) { void p.offsetWidth; p.classList.add('on'); }   // アニメーションを最初から再生
      });
      restart();
    }
    function restart() {
      clearTimeout(timer);
      if (hover || !visible || REDUCE) return;
      timer = setTimeout(function () { show(idx + 1); }, BO_DUR);
    }
    tabs.forEach(function (t, k) { t.addEventListener('click', function () { show(k); }); });
    bo.addEventListener('mouseenter', function () { hover = true; bo.classList.add('paused'); clearTimeout(timer); });
    bo.addEventListener('mouseleave', function () { hover = false; bo.classList.remove('paused'); restart(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { var was = visible; visible = e.isIntersecting; if (visible && !was) show(idx); if (!visible) clearTimeout(timer); });
      }, { threshold: .35 }).observe(bo);
    } else { visible = true; restart(); }
  });



  /* 9. TOP オールインワン・サイクル（[data-ac]）
        ・リング上をリース品の箱が一周 AC_LAP ミリ秒でめぐり、近くの工程が光る
        ・工程（図の丸／右の一覧）をクリックすると、その工程の説明に切り替わり、箱もそこから再開
        ・画面外では止める。「視差効果を減らす」設定では動かさない */
  var AC_LAP = 21000;
  $$('[data-ac]').forEach(function (root) {
    var data; try { data = JSON.parse(document.getElementById('acData').textContent); } catch (e) { return; }
    var N = data.length, R = 262, C = 400;
    var crate = root.querySelector('.ac-crate'), trail = root.querySelector('.ac-trail');
    var sts = $$('.ac-st', root), lbls = $$('.ac-lbl', root), lis = $$('.ac-list li', root);
    var det = root.querySelector('.ac-detail'), dn = det.querySelector('.ac-d-n'), dt = det.querySelector('.ac-d-t'), dp = det.querySelector('.ac-d-p');
    var cur = -1, t0 = performance.now(), offset = 0, visible = false, raf = null;
    function select(i) {
      if (i === cur) return; cur = i;
      sts.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      lbls.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      lis.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      dn.textContent = ('0' + (i + 1)).slice(-2) + ' — ' + data[i].en.toUpperCase();
      dt.textContent = data[i].t;
      if (data[i].pw) { dp.innerHTML = data[i].pw; } else { dp.textContent = data[i].p; }   // pw = 文節改行（<wbr>）入り。tools/budoux-wbr.py が生成
      det.classList.remove('swap'); void det.offsetWidth; det.classList.add('swap');
    }
    function place(frac) {   // frac: 0〜1（0 = 真上の01）
      var a = -Math.PI / 2 + frac * Math.PI * 2;
      crate.setAttribute('transform', 'translate(' + (C + R * Math.cos(a)).toFixed(1) + ' ' + (C + R * Math.sin(a)).toFixed(1) + ')');
      trail.style.strokeDasharray = (frac * 1000).toFixed(1) + ' 1000';
      select(Math.min(N - 1, Math.floor((frac + .5 / N) * N) % N));
    }
    function tick(now) {
      raf = null; if (!visible) return;
      var frac = (((now - t0) / AC_LAP) + offset) % 1;
      place(frac); raf = requestAnimationFrame(tick);
    }
    function start() { if (!raf && visible && !REDUCE) raf = requestAnimationFrame(tick); }
    function jump(i) {
      offset = i / N; t0 = performance.now(); place(offset);
    }
    sts.forEach(function (s, i) {
      s.addEventListener('click', function () { jump(i); });
      s.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jump(i); } });
    });
    lis.forEach(function (li, i) { li.addEventListener('click', function () { jump(i); }); });
    place(0);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          var was = visible; visible = e.isIntersecting;
          if (visible && !was) { t0 = performance.now() - ((offset % 1) * 0); start(); }
          if (!visible && raf) { cancelAnimationFrame(raf); raf = null; offset = ((performance.now() - t0) / AC_LAP + offset) % 1; t0 = performance.now(); }
        });
      }, { threshold: .2 }).observe(root);
    } else { visible = true; start(); }
  });

  /* ① ワンストップ：図とフローの出現 */
  (function () {
    var els = $$('.os-hub, .os-flow');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .3 });
    els.forEach(function (e) { io.observe(e); });
  })();

  /* 6. 印刷 */
  window.addEventListener('beforeprint', function () { $$('details').forEach(function (d) { d.open = true; }); });
})();

/* メンテナンス ABOUT のイラスト：画面に入ったら建物が順に立ち上がる */
(function () {
  var els = document.querySelectorAll('[data-mi]');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.3 });
  els.forEach(function (e) { io.observe(e); });
})();

/* リース ABOUT：トラックが設備を回収 → 倉庫で洗浄・点検 → 次の現場へ再リース（16秒で1周）
   ・画面外では止める。「視差効果を減らす」設定では、再リース完了の場面で止めて表示する */
(function () {
  var root = document.querySelector('[data-lz]');
  if (!root) return;
  var svg = root.querySelector('svg');
  var truck = svg.querySelector('.lz-truck'), cu = svg.querySelector('.lz-cu');
  var back = svg.querySelector('.lz-back'), front = svg.querySelector('.lz-layer-front');
  var shutter = svg.querySelector('.lz-shutter');
  var lbl = {}; [].forEach.call(svg.querySelectorAll('.lz-lbl'), function (g) { lbl[g.getAttribute('data-lbl')] = g; });
  var sta = {}; [].forEach.call(svg.querySelectorAll('.lz-st'), function (g) { sta[g.getAttribute('data-st')] = g; });
  function stage(k, on) { lbl[k].classList.toggle('on', on); if (sta[k]) sta[k].classList.toggle('on', on); }
  var C = 0.8660254, S = 0.5;
  function P(x, y, z) { return [(x - y) * C, (x + y) * S - (z || 0)]; }
  function tr(el, x, y, z) { var p = P(x, y, z); el.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')'); }
  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function seg(t, a, b) { return Math.max(0, Math.min(1, (t - a) / (b - a))); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  // 位置（アイソメ座標）
  var TY = 124, BED = { dx: 8, dy: TY + 6, z: 14 };
  var PAD_L = [112, 78, 2], PAD_R = [398, 78, 2], DOOR_X = 257, IN = [DOOR_X, 52, 0];
  var STOP_L = PAD_L[0] - BED.dx, STOP_W = DOOR_X - BED.dx, STOP_R = PAD_R[0] - BED.dx;
  var LAP = 16000;
  function setShutter(open) {          // open: 0（閉）〜1（開）
    var z0 = 44 * open, pts = [[250, 100, z0], [290, 100, z0], [290, 100, 44], [250, 100, 44]];
    shutter.setAttribute('points', pts.map(function (q) { var p = P(q[0], q[1], q[2]); return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '));
  }
  var slot = svg.querySelector('.lz-bedslot');
  function layer(mode) {              // back＝倉庫の中／truck＝荷台（運転席より奥）／front＝手前
    var want = mode === 'back' ? back : mode === 'truck' ? slot : front;
    if (cu.parentNode !== want) want.appendChild(cu);
  }
  function flag(cls, on) { root.classList.toggle(cls, !!on); }
  function render(t) {
    // トラックの位置
    var tx, op = 1;
    if (t < 1800) { var k = ease(seg(t, 0, 1800)); tx = lerp(-12, STOP_L, k); op = seg(t, 0, 450); }
    else if (t < 2900) tx = STOP_L;
    else if (t < 4700) tx = lerp(STOP_L, STOP_W, ease(seg(t, 2900, 4700)));
    else if (t < 9300) tx = STOP_W;
    else if (t < 11300) tx = lerp(STOP_W, STOP_R, ease(seg(t, 9300, 11300)));
    else if (t < 12500) tx = STOP_R;
    else { var k2 = seg(t, 12500, 14600); tx = lerp(STOP_R, 548, k2 * k2); op = 1 - seg(t, 13900, 14600); }
    tr(truck, tx, 0, 0); truck.style.opacity = op;
    // 設備の位置
    var bed = [tx + BED.dx, BED.dy, BED.z], c, inside = false, dirty = true, ok = false, cop = 1;
    function arc(a, b, k) { k = ease(k); return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k) + Math.sin(k * Math.PI) * 26]; }
    if (t < 1800) c = PAD_L;
    else if (t < 2900) c = arc(PAD_L, bed, seg(t, 1800, 2900));
    else if (t < 5000) c = bed;
    else if (t < 5900) { c = arc(bed, IN, seg(t, 5000, 5900)); c[2] = Math.max(0, c[2] - 26 * Math.sin(seg(t, 5000, 5900) * Math.PI)); inside = c[1] < 104; }
    else if (t < 8300) { c = IN; inside = true; }
    else if (t < 9200) { var k3 = seg(t, 8300, 9200); c = [DOOR_X, lerp(IN[1], bed[1], ease(k3)), lerp(0, BED.z, ease(k3))]; inside = c[1] < 104; }
    else if (t < 11300) c = bed;
    else if (t < 12400) c = arc(bed, PAD_R, seg(t, 11300, 12400));
    else c = PAD_R;
    if (t >= 7300) dirty = false;
    if (t >= 8300) ok = true;
    if (t >= 14600) { var f = seg(t, 14600, 15100); cop = 1 - f; if (t >= 15100) { c = PAD_L; dirty = true; ok = false; cop = seg(t, 15200, 15800); } }
    var onBed = c === bed;
    if (onBed) tr(cu, BED.dx, BED.dy, BED.z); else tr(cu, c[0], c[1], c[2]);
    layer(inside ? 'back' : onBed ? 'truck' : 'front');
    cu.classList.toggle('dirty', dirty); cu.classList.toggle('ok', ok && !dirty); cu.style.opacity = cop;
    // シャッター
    var sh = 0;
    if (t >= 4500 && t < 5000) sh = seg(t, 4500, 5000); else if (t >= 5000 && t < 5900) sh = 1;
    else if (t >= 5900 && t < 6300) sh = 1 - seg(t, 5900, 6300);
    else if (t >= 7900 && t < 8300) sh = seg(t, 7900, 8300); else if (t >= 8300 && t < 9200) sh = 1;
    else if (t >= 9200 && t < 9600) sh = 1 - seg(t, 9200, 9600);
    setShutter(sh);
    flag('wash', t >= 6300 && t < 7900);
    flag('lit', t >= 12400 && t < 14800);
    // 工程の札と建物を同時に光らせる（a＝回収／b＝洗浄・点検／c＝再リース）
    stage('a', t >= 1200 && t < 3600);
    stage('b', t >= 4600 && t < 9400);
    stage('c', t >= 11000 && t < 14800);
  }
  setShutter(0); render(0);
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { root.classList.add('in', 'run'); render(13200); root.classList.remove('lit'); return; }
  var visible = false, raf = null, t0 = 0, elapsed = 0, started = false;
  function loop(now) {
    if (!visible) { raf = null; return; }
    if (!t0) t0 = now - elapsed;
    elapsed = now - t0;
    render(elapsed % LAP);
    raf = requestAnimationFrame(loop);
  }
  function start() { if (raf) return; t0 = 0; raf = requestAnimationFrame(loop); }
  if (!('IntersectionObserver' in window)) { root.classList.add('in', 'run'); visible = true; start(); return; }
  new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      visible = e.isIntersecting;
      if (visible && !started) {          // 初回：建物が立ち上がってからトラックが走り出す
        started = true; root.classList.add('in');
        setTimeout(function () { root.classList.add('run'); start(); }, 1700);
      } else if (visible && started && root.classList.contains('run')) start();
    });
  }, { threshold: 0.25 }).observe(root);
})();

/* レンタル ABOUT：トラックで機器を素早く設置 → 必要な期間だけ稼働（時計・期間バー）→ すぐ撤去（14秒で1周）
   ・札（設置／使用期間／撤去）が緑になると同時に、その場所（設置エリア／会場テント／トラック）も光る
   ・画面外では止める。「視差効果を減らす」設定では稼働中の場面で止めて表示する */
(function () {
  var root = document.querySelector('[data-rz]');
  if (!root) return;
  var svg = root.querySelector('svg');
  var truck = svg.querySelector('.rz-truck'), slot = svg.querySelector('.lz-bedslot'), front = svg.querySelector('.lz-layer-front');
  var units = [].slice.call(svg.querySelectorAll('.rz-u'));
  var hh = svg.querySelector('.rz-hh'), mh = svg.querySelector('.rz-mh'), fill = svg.querySelector('.rz-fill');
  var lbl = {}, sta = {};
  [].forEach.call(svg.querySelectorAll('.lz-lbl'), function (g) { lbl[g.getAttribute('data-lbl')] = g; });
  [].forEach.call(svg.querySelectorAll('.lz-st'), function (g) { sta[g.getAttribute('data-st')] = g; });
  function stage(k, on) { lbl[k].classList.toggle('on', on); if (sta[k]) sta[k].classList.toggle('on', on); }
  var C = 0.8660254, S = 0.5;
  function P(x, y, z) { return [(x - y) * C, (x + y) * S - (z || 0)]; }
  function tr(el, x, y, z) { var p = P(x, y, z); el.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')'); }
  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function seg(t, a, b) { return Math.max(0, Math.min(1, (t - a) / (b - a))); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  var TY = 146, STOP = 230, LAP = 14000;
  var BED = [[4, TY + 4, 14], [26, TY + 4, 14], [48, TY + 3, 14], [70, TY + 6, 14]];
  var SLOT = [[222, 52, 2], [252, 52, 2], [300, 30, 2], [346, 82, 2]];
  var IN0 = 1300, OUT0 = 10000, STEP = 600, DUR = 520;
  function render(t) {
    var tx, op = 1;
    if (t < 1300) { tx = lerp(-14, STOP, ease(seg(t, 0, 1300))); op = seg(t, 0, 400); }
    else if (t < 4200) tx = STOP;
    else if (t < 5400) { var k = seg(t, 4200, 5400); tx = lerp(STOP, 500, k * k); op = 1 - seg(t, 5000, 5400); }
    else if (t < 8800) { tx = -14; op = 0; }
    else if (t < 10000) { tx = lerp(-14, STOP, ease(seg(t, 8800, 10000))); op = seg(t, 8800, 9200); }
    else if (t < 12600) tx = STOP;
    else { var k2 = seg(t, 12600, 13700); tx = lerp(STOP, 500, k2 * k2); op = 1 - seg(t, 13300, 13700); }
    tr(truck, tx, 0, 0); truck.style.opacity = op;
    lbl.c.style.opacity = t >= 8800 ? 1 : 0;   // 「撤去」の札はトラックと一緒に動き、回収に戻ってきたときだけ出す
    units.forEach(function (u, i) {
      var b = BED[i], s = SLOT[i], bedAbs = [tx + b[0], b[1], b[2]];
      var a0 = IN0 + i * STEP, r0 = OUT0 + (units.length - 1 - i) * STEP, pos, onBed = false;
      function arc(A, B, k) { k = ease(k); return [lerp(A[0], B[0], k), lerp(A[1], B[1], k), lerp(A[2], B[2], k) + Math.sin(k * Math.PI) * 30]; }
      if (t < a0) onBed = true;
      else if (t < a0 + DUR) pos = arc(bedAbs, s, seg(t, a0, a0 + DUR));
      else if (t < r0) pos = s;
      else if (t < r0 + DUR) pos = arc(s, bedAbs, seg(t, r0, r0 + DUR));
      else onBed = true;
      var want = onBed ? slot : front;
      if (u.parentNode !== want) {
        if (onBed) { var nxt = null; for (var j = i + 1; j < units.length; j++) if (units[j].parentNode === slot) { nxt = units[j]; break; } slot.insertBefore(u, nxt); }
        else front.appendChild(u);
        if (!onBed) units.forEach(function (v) { if (v.parentNode === front) front.appendChild(v); });
      }
      if (onBed) tr(u, b[0], b[1], b[2]); else tr(u, pos[0], pos[1], pos[2]);
    });
    // 稼働（使用期間）：時計が回り、期間バーが進む
    var run = seg(t, 4800, 9200);
    root.classList.toggle('go', t >= 4600 && t < 9600);
    mh.setAttribute('transform', 'rotate(' + (run * 1080).toFixed(1) + ')');
    hh.setAttribute('transform', 'rotate(' + (run * 90).toFixed(1) + ')');
    fill.style.transform = 'scaleX(' + (t >= 9600 ? Math.max(0, 1 - seg(t, 12600, 13600)) : run).toFixed(3) + ')';
    stage('a', t >= 1000 && t < 4500);
    stage('b', t >= 4700 && t < 9200);
    stage('c', t >= 9200 && t < 13600);
  }
  render(0);
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { root.classList.add('in', 'run'); render(7000); return; }
  var visible = false, raf = null, t0 = 0, elapsed = 0, started = false;
  function loop(now) {
    if (!visible) { raf = null; return; }
    if (!t0) t0 = now - elapsed;
    elapsed = now - t0; render(elapsed % LAP);
    raf = requestAnimationFrame(loop);
  }
  function start() { if (raf) return; t0 = 0; raf = requestAnimationFrame(loop); }
  if (!('IntersectionObserver' in window)) { root.classList.add('in', 'run'); visible = true; start(); return; }
  new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      visible = e.isIntersecting;
      if (visible && !started) { started = true; root.classList.add('in'); setTimeout(function () { root.classList.add('run'); start(); }, 1500); }
      else if (visible && started && root.classList.contains('run')) start();
    });
  }, { threshold: 0.25 }).observe(root);
})();

/* 会社概要 PHILOSOPHY：設備を回収・再生するたびに会社が成長し（棟が増える・再生台数が増える）、
   CO₂メーターが下がってもやが晴れ、木が増えていく（3回で1周・16秒）
   ・札（回収・再生／CO₂削減／緑が増える）が緑になると同時に、倉庫／CO₂メーター／木が光る */
(function () {
  var root = document.querySelector('[data-cz]');
  if (!root) return;
  var svg = root.querySelector('svg');
  var truck = svg.querySelector('.lz-truck'), cu = svg.querySelector('.lz-cu');
  var back = svg.querySelector('.lz-back'), front = svg.querySelector('.lz-layer-front'), slot = svg.querySelector('.lz-bedslot');
  var shutter = svg.querySelector('.lz-shutter'), co2 = svg.querySelector('.cz-co2'), num = svg.querySelector('.cz-num'), sun = svg.querySelector('.cz-sun');
  var wings = [].slice.call(svg.querySelectorAll('.cz-wing')), trees = [].slice.call(svg.querySelectorAll('.cz-tree, .cz-bed')), smog = [].slice.call(svg.querySelectorAll('.cz-smog'));
  var lbl = {}, sta = {};
  [].forEach.call(svg.querySelectorAll('.lz-lbl'), function (g) { lbl[g.getAttribute('data-lbl')] = g; });
  [].forEach.call(svg.querySelectorAll('.lz-st'), function (g) { var k = g.getAttribute('data-st'); (sta[k] = sta[k] || []).push(g); });
  function stage(k, on) { lbl[k].classList.toggle('on', on); (sta[k] || []).forEach(function (g) { g.classList.toggle('on', on); }); }
  var C = 0.8660254, S = 0.5;
  function P(x, y, z) { return [(x - y) * C, (x + y) * S - (z || 0)]; }
  function tr(el, x, y, z) { var p = P(x, y, z); el.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')'); }
  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function seg(t, a, b) { return Math.max(0, Math.min(1, (t - a) / (b - a))); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  var TY = 166, BED = [8, TY + 6, 14], DOOR = 238, IN = [DOOR, 84, 0], STOP = DOOR - 8, CYC = 4400, N = 3, LAP = 16000;
  function setShutter(open) {
    var z0 = 44 * open, pts = [[230, 120, z0], [272, 120, z0], [272, 120, 44], [230, 120, 44]];
    shutter.setAttribute('points', pts.map(function (q) { var p = P(q[0], q[1], q[2]); return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '));
  }
  function render(t) {
    var k = Math.min(N - 1, Math.floor(t / CYC)), tc = t - k * CYC, active = t < N * CYC;
    // 成長の進み具合（再生した台数）
    var count = 0; for (var i = 0; i < N; i++) if (t >= i * CYC + 2600) count++;
    if (t >= 15000) count = 0;                                   // 1周の終わりで最初の状態に戻す
    var grown = 0; for (var j = 0; j < N; j++) if (t >= j * CYC + 3500 && t < 15000) grown++;
    wings.forEach(function (w) { w.classList.toggle('on', +w.getAttribute('data-w') < count); });
    trees.forEach(function (g) { g.classList.toggle('on', +g.getAttribute('data-k') < grown); });
    num.textContent = count;
    co2.style.transform = 'scaleY(' + (1 - count * 0.27).toFixed(2) + ')';
    smog.forEach(function (s, i) { s.style.opacity = Math.max(0, 1 - count * 0.3 - (i % 3) * 0.05 * count).toFixed(2); });
    sun.style.opacity = (count / N).toFixed(2);
    // トラックと設備
    var tx = -12, op = 0;
    if (active) {
      if (tc < 1000) { tx = lerp(-12, STOP, ease(seg(tc, 0, 1000))); op = seg(tc, 0, 350); }
      else if (tc < 2900) { tx = STOP; op = 1; }
      else { var q = seg(tc, 2900, 3900); tx = lerp(STOP, 548, q * q); op = 1 - seg(tc, 3550, 3900); }
    }
    tr(truck, tx, 0, 0); truck.style.opacity = op;
    var c = null, inside = false, dirty = true, ok = false;
    function arc(A, B, kk) { kk = ease(kk); return [lerp(A[0], B[0], kk), lerp(A[1], B[1], kk), lerp(A[2], B[2], kk) + Math.sin(kk * Math.PI) * 22]; }
    var bedAbs = [tx + BED[0], BED[1], BED[2]];
    if (!active || tc < 1000) c = null;
    else if (tc < 1600) { c = arc(bedAbs, IN, seg(tc, 1000, 1600)); inside = c[1] < 124; }
    else if (tc < 2300) { c = IN; inside = true; }
    else if (tc < 2900) { c = arc(IN, bedAbs, seg(tc, 2300, 2900)); inside = c[1] < 124; }
    if (active && tc >= 2000) { dirty = false; ok = tc >= 2300; }
    var want = c ? (inside ? back : front) : slot;
    if (cu.parentNode !== want) want.appendChild(cu);
    if (c) tr(cu, c[0], c[1], c[2]); else tr(cu, BED[0], BED[1], BED[2]);
    cu.classList.toggle('dirty', dirty); cu.classList.toggle('ok', ok);
    var sh = 0;
    if (active) {
      if (tc >= 800 && tc < 1000) sh = seg(tc, 800, 1000); else if (tc >= 1000 && tc < 1600) sh = 1;
      else if (tc >= 1600 && tc < 1800) sh = 1 - seg(tc, 1600, 1800);
      else if (tc >= 2100 && tc < 2300) sh = seg(tc, 2100, 2300); else if (tc >= 2300 && tc < 2900) sh = 1;
      else if (tc >= 2900 && tc < 3100) sh = 1 - seg(tc, 2900, 3100);
    }
    setShutter(sh);
    root.classList.toggle('wash', active && tc >= 1700 && tc < 2300);
    stage('a', active && tc >= 800 && tc < 2600);
    stage('b', active && tc >= 2600 && tc < 3500);
    stage('c', active && tc >= 3500 && tc < 4400);
  }
  setShutter(0); render(0);
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { root.classList.add('in', 'run'); render(14000); return; }
  var visible = false, raf = null, t0 = 0, elapsed = 0, started = false;
  function loop(now) {
    if (!visible) { raf = null; return; }
    if (!t0) t0 = now - elapsed;
    elapsed = now - t0; render(elapsed % LAP);
    raf = requestAnimationFrame(loop);
  }
  function start() { if (raf) return; t0 = 0; raf = requestAnimationFrame(loop); }
  if (!('IntersectionObserver' in window)) { root.classList.add('in', 'run'); visible = true; start(); return; }
  new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      visible = e.isIntersecting;
      if (visible && !started) { started = true; root.classList.add('in'); setTimeout(function () { root.classList.add('run'); start(); }, 1200); }
      else if (visible && started && root.classList.contains('run')) start();
    });
  }, { threshold: 0.25 }).observe(root);
})();
