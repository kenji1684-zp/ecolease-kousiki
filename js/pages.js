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
