/* =========================================================
   ecolease site v5 — スクロールの質感（bettei.co.jp 参照）
   js/lenis.js（慣性スクロール）を先に読み込んでください。
     1. Lenis による慣性スクロール
     2. 画像のスクラブ・パララックス（1本のrAFで一括処理）
     3. 巨大マーキーのスクロール速度連動
     4. 取扱設備の横スクロールレール
   ========================================================= */
(function () {
  'use strict';

  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lenis = null;
  var velocity = 0;

  /* ---------------------------------------------------------
     1. 慣性スクロール
     --------------------------------------------------------- */
  function smooth() {
    if (REDUCE || typeof window.Lenis !== 'function') return;
    lenis = new window.Lenis({
      lerp: 0.085,              /* 小さいほど“重い”動き。0.06〜0.12で調整 */
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,         /* スマホは端末本来のスクロールに任せる */
      autoRaf: true
    });
    lenis.on('scroll', function (e) { velocity = e.velocity || 0; });
    window.__lenis = lenis;

    /* ページ内アンカーも慣性で移動 */
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      lenis.scrollTo(t, { offset: -80, duration: 1.4 });
    });
  }

  /* ---------------------------------------------------------
     2. スクラブ・パララックス
        対象に --p（0→1）を書き込むだけ。見え方はCSS側で決める。
     --------------------------------------------------------- */
  var tracked = [];

  function collect() {
    tracked = [];
    /* 画像：枠に .v5-media を付け、中の img を動かす */
    var mediaSel = [
      '.equip-card', '.split-media', '.biz-media', '.rel-media',
      '.art-fig', '.hero-figs .f', '.footer-brand'
    ].join(',');
    Array.prototype.forEach.call(document.querySelectorAll(mediaSel), function (el) {
      if (!el.querySelector('img')) return;
      if (el.classList.contains('footer-brand')) return;
      el.classList.add('v5-media');
      tracked.push(el);
    });
    /* 動画のポスターは暗い側のベール */
    var ms = document.querySelector('.movie-stage');
    if (ms) { ms.classList.add('v5-media', 'is-dark'); tracked.push(ms); }

    /* ゆっくり持ち上がるテキストブロック */
    Array.prototype.forEach.call(document.querySelectorAll('.v5-rise'), function (el) {
      tracked.push(el);
    });
  }

  /* ---------------------------------------------------------
     3. 巨大マーキー
     --------------------------------------------------------- */
  var marquees = [];
  function initMarquee() {
    Array.prototype.forEach.call(document.querySelectorAll('.v5-marquee .mq-track'), function (track) {
      var item = track.querySelector('.mq-item');
      if (!item) return;
      /* 画面幅を埋めるまで複製（最低2周ぶん） */
      var w = item.getBoundingClientRect().width;
      var need = Math.ceil((window.innerWidth * 2) / Math.max(w, 1)) + 1;
      for (var i = 1; i < need; i++) track.appendChild(item.cloneNode(true));
      marquees.push({ el: track, w: w, x: 0 });
    });
  }

  /* ---------------------------------------------------------
     4. 取扱設備の横スクロールレール
     --------------------------------------------------------- */
  function rail() {
    var r = document.querySelector('.v5-rail');
    if (!r) return;
    r.setAttribute('data-lenis-prevent', '');

    var wrap = r.closest('.v5-railwrap');
    var prev = wrap.querySelector('.rail-prev');
    var next = wrap.querySelector('.rail-next');
    var bar = wrap.querySelector('.v5-railbar span');

    function step() {
      var c = r.querySelector('*');
      return c ? c.getBoundingClientRect().width + 20 : 300;
    }
    function update() {
      var max = r.scrollWidth - r.clientWidth;
      var p = max > 0 ? r.scrollLeft / max : 1;
      if (bar) bar.style.width = Math.max(12, p * 100) + '%';
      if (prev) prev.disabled = r.scrollLeft <= 2;
      if (next) next.disabled = r.scrollLeft >= max - 2;
    }
    prev && prev.addEventListener('click', function () { r.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next && next.addEventListener('click', function () { r.scrollBy({ left: step(), behavior: 'smooth' }); });
    r.addEventListener('scroll', update, { passive: true });
    update();

    /* ドラッグでも動かせるように */
    var down = false, sx = 0, sl = 0, moved = 0;
    r.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return;
      down = true; moved = 0; sx = e.clientX; sl = r.scrollLeft;
      r.setPointerCapture(e.pointerId);
    });
    r.addEventListener('pointermove', function (e) {
      if (!down) return;
      var d = e.clientX - sx;
      moved = Math.abs(d);
      if (moved > 4) r.classList.add('dragging');
      r.scrollLeft = sl - d;
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      r.addEventListener(ev, function () { down = false; setTimeout(function () { r.classList.remove('dragging'); }, 10); });
    });
    r.addEventListener('click', function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
  }


  /* ---------------------------------------------------------
     5. ピン留めステートメント
        背景は留まり、文字だけが浮かんで消える（bettei.co.jp 参照）
        対象： [data-pin-statement]
     --------------------------------------------------------- */
  var pins = [];
  function collectPins() {
    pins = Array.prototype.slice.call(document.querySelectorAll('[data-pin-statement]'));
  }
  function smoothstep(x) {
    x = x < 0 ? 0 : x > 1 ? 1 : x;
    return x * x * (3 - 2 * x);
  }
  function updatePins() {
    var vh = window.innerHeight;
    for (var i = 0; i < pins.length; i++) {
      var el = pins[i];
      var r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      var total = r.height - vh;
      var p = total > 0 ? (-r.top) / total : 0;
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      /* 文字：0.08→0.30 で浮かび上がり、0.62→0.82 で消える */
      var t = Math.min(smoothstep((p - 0.08) / 0.22), 1 - smoothstep((p - 0.62) / 0.20));
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      el.style.setProperty('--p', p.toFixed(4));
      el.style.setProperty('--t', t.toFixed(4));
      el.style.setProperty('--v', (0.22 + 0.72 * t).toFixed(4));
    }
  }


  /* ---------------------------------------------------------
     6. The Cycle — カードが下から上へ積み上がる
        対象： [data-cycle-stack]（中に .cyc-panel が並ぶ）
     --------------------------------------------------------- */
  var stacks = [];
  function collectStacks() {
    stacks = [];
    Array.prototype.forEach.call(document.querySelectorAll('[data-cycle-stack]'), function (st) {
      var panels = Array.prototype.slice.call(st.querySelectorAll('.cyc-panel'));
      var rails = Array.prototype.slice.call(st.querySelectorAll('.cyc-rail .r'));
      if (!panels.length) return;
      var on = window.matchMedia('(min-width: 901px)').matches && !REDUCE;
      st.classList.toggle('stack-on', on);
      if (on) {
        st.style.height = (panels.length * 84 + 30) + 'vh';
        panels.forEach(function (el, i) { el.style.zIndex = String(10 + i); });
      } else {
        st.style.height = '';
        panels.forEach(function (el) { el.style.transform = ''; el.style.opacity = ''; });
        rails.forEach(function (r) { r.classList.remove('on'); });
      }
      stacks.push({ el: st, panels: panels, rails: rails, on: on, cur: -1 });
    });
  }

  function updateStacks() {
    var vh = window.innerHeight;
    for (var s = 0; s < stacks.length; s++) {
      var st = stacks[s];
      if (!st.on) continue;
      var r = st.el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      var total = r.height - vh;
      var p = total > 0 ? (-r.top) / total : 0;
      p = p < 0 ? 0 : p > 1 ? 1 : p;

      var n = st.panels.length;
      /* 先頭は最初から見えているように、0.5枚ぶん進めた位置から始める */
      var raw = p * (n - 0.35) + 0.65;
      var fi = Math.floor(raw);
      var active = (raw - fi) > 0.4 ? fi : fi - 1;
      active = Math.min(n - 1, Math.max(0, active));

      for (var i = 0; i < n; i++) {
        var el = st.panels[i];
        var t = raw - i;                 /* <0:まだ下 / 0〜1:せり上がり中 / >1:奥へ */
        var y, sc = 1, op = 1;
        if (t <= 0) {
          y = 110;                        /* 画面の下に待機 */
          op = t > -1 ? 1 : 0;            /* 覗かせるのは次の1枚だけ */
        } else if (t < 1) {
          var e = 1 - Math.pow(1 - t, 3); /* ease-out */
          y = (1 - e) * 110;
        } else {
          var d = Math.min(t - 1, 3);
          y = -d * 3.4;                   /* 少しだけ上にずらして重なりを見せる */
          sc = 1 - d * 0.035;
          op = 1 - d * 0.22;
        }
        el.style.transform = 'translate(-50%, calc(-50% + ' + y.toFixed(2) + '%)) scale(' + sc.toFixed(3) + ')';
        el.style.opacity = op < 0 ? '0' : op.toFixed(3);
      }

      if (active !== st.cur) {
        st.cur = active;
        for (var k = 0; k < st.rails.length; k++) st.rails[k].classList.toggle('on', k === active);
      }
    }
  }

  /* ---------------------------------------------------------
     1本のrAFで全部まわす
     --------------------------------------------------------- */
  var last = performance.now();
  function tick(now) {
    var dt = Math.min((now - last) / 1000, .05); last = now;
    var vh = window.innerHeight;

    for (var i = 0; i < tracked.length; i++) {
      var el = tracked[i];
      var r = el.getBoundingClientRect();
      if (r.bottom < -240 || r.top > vh + 240) continue;
      var p = (vh - r.top) / (vh + r.height);
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      el.style.setProperty('--p', p.toFixed(4));
    }

    for (var j = 0; j < marquees.length; j++) {
      var m = marquees[j];
      m.x -= (34 + Math.abs(velocity) * 7) * dt;      /* スクロールが速いほど速く流れる */
      if (m.w > 0 && m.x <= -m.w) m.x += m.w;
      m.el.style.transform = 'translate3d(' + m.x.toFixed(2) + 'px,0,0)';
    }

    updatePins();
    updateStacks();

    velocity *= 0.92;
    requestAnimationFrame(tick);
  }

  function boot() {
    smooth();
    collect();
    collectPins();
    collectStacks();
    if (!REDUCE) { initMarquee(); requestAnimationFrame(tick); }
    rail();

    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(function () { collect(); collectPins(); collectStacks(); }, 250);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 80); });
  } else {
    setTimeout(boot, 80);
  }
})();
