/* =========================================================
   ecolease site v3 — motion layer
   Motion (motion.dev / 旧 Framer Motion) v14 の vanilla API を使用
   js/motion.js（UMD・window.Motion）を先に読み込んでください。

   ・JSが動かない環境では何も挿入されず、内容はそのまま読めます
   ・OSの「視差効果を減らす」設定を尊重します
   ========================================================= */
(function () {
  'use strict';

  var M = window.Motion || {};
  var animate = M.animate, inView = M.inView, scroll = M.scroll, stagger = M.stagger;
  var hasMotion = typeof animate === 'function';
  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* 1回のセッションでオープニングを出すのは最初の1回だけ。
     毎回出したい場合は下の行を  var FIRST_VISIT = true;  に変更してください。 */
  var FIRST_VISIT = !sessionStorage.getItem('ecolease_v3_intro');

  /* ---------------------------------------------------------
     1. オープニング（ロゴのみ出現 → 幕が上がる）
     --------------------------------------------------------- */
  function loader(done) {
    var el = document.getElementById('v3Loader');
    /* オープニングはTOPページだけ（HTMLに #v3Loader があるページだけ）。
       他のページで暗転が入ると“チカッ”と光って見えるため。 */
    if (!el || !hasMotion || REDUCE || !FIRST_VISIT) {
      if (el) el.remove();
      root.classList.remove('v3-loading');
      done();
      return;
    }
    try { sessionStorage.setItem('ecolease_v3_intro', '1'); } catch (e) {}

    root.classList.add('v3-loading');

    /* HTMLに直書きされたローダーをそのまま使う（最初の描画からロゴが見える） */
    el.classList.add('js-took-over');

    var logo = el.querySelector('.v3-logo');
    var bar = el.querySelector('.v3-bar span');

    animate(logo, { opacity: [0, 1], scale: [1.08, 1], filter: ['blur(10px)', 'blur(0px)'] },
      { duration: .8, ease: [.22, .61, .36, 1] });
    animate(bar, { scaleX: [0, 1] }, { duration: .95, delay: .2, ease: [.4, 0, .2, 1] })
      .finished.then(function () {
        return animate(el.querySelector('.v3-loader-inner'),
          { opacity: [1, 0], y: [0, -18] }, { duration: .38, ease: [.65, 0, .35, 1] }).finished;
      })
      .then(function () {
        return animate(el, { y: ['0%', '-102%'] }, { duration: .75, ease: [.76, 0, .24, 1] }).finished;
      })
      .then(function () {
        el.remove();
        root.classList.remove('v3-loading');
        done();
      })
      .catch(function () { el.remove(); root.classList.remove('v3-loading'); done(); });

    /* 保険：3.5秒で必ず解除 */
    setTimeout(function () {
      if (document.body.contains(el)) { el.remove(); root.classList.remove('v3-loading'); done(); }
    }, 3500);
  }

  /* ---------------------------------------------------------
     2. ヒーロー（幕が上がってから文字を立ち上げ直す）
     --------------------------------------------------------- */
  function hero() {
    var copy = document.querySelector('.hero .hero-copy');
    if (copy) {
      copy.classList.remove('in');
      void copy.offsetWidth;
      copy.classList.add('in');
    }
    var h = document.querySelector('.hero');
    if (!h || document.querySelector('.v3-scrollcue')) return;
    var cue = document.createElement('div');
    cue.className = 'v3-scrollcue';
    cue.innerHTML = '<span>Scroll</span><i></i>';
    h.appendChild(cue);

    if (hasMotion && !REDUCE && typeof scroll === 'function') {
      scroll(function (p) {
        var v = Math.min(p * 2.2, 1);
        copy && (copy.style.opacity = String(1 - v * .9));
        copy && (copy.style.transform = 'translateY(' + (v * -40) + 'px)');
        cue.style.opacity = String(1 - Math.min(p * 6, 1));
      }, { target: h, offset: ['start start', 'end start'] });
    }
  }

  /* ---------------------------------------------------------
     3. スクロール進捗バー
     --------------------------------------------------------- */
  function progress() {
    if (!hasMotion || REDUCE || typeof scroll !== 'function') return;
    var bar = document.createElement('div');
    bar.className = 'v3-progress';
    document.body.appendChild(bar);
    scroll(animate(bar, { scaleX: [0, 1] }, { ease: 'linear' }));
  }

  /* ---------------------------------------------------------
     4. 見出しのマスクアップ
     --------------------------------------------------------- */
  function headings() {
    if (!hasMotion || REDUCE || typeof inView !== 'function') return;
    var targets = document.querySelectorAll('.sec-head .jp, .bizstage-head h2, .page-hero h1, .art-title');
    Array.prototype.forEach.call(targets, function (el) {
      if (el.dataset.v3mask) return;
      el.dataset.v3mask = '1';
      var span = document.createElement('span');
      while (el.firstChild) span.appendChild(el.firstChild);
      el.appendChild(span);
      el.classList.add('v3-mask');
      span.style.transform = 'translateY(105%)';
      inView(el, function () {
        animate(span, { y: ['105%', '0%'] }, { duration: .85, ease: [.22, .61, .36, 1] });
      }, { amount: .2 });
    });
  }

  /* ---------------------------------------------------------
     5. 3つの事業 — スクロール連動ステージ
     --------------------------------------------------------- */
  function bizStage() {
    var stage = document.querySelector('.bizstage');
    if (!stage) return;
    var track = stage.querySelector('.bizstage-track');
    var panels = Array.prototype.slice.call(stage.querySelectorAll('.bizpanel'));
    var rails = Array.prototype.slice.call(stage.querySelectorAll('.bizstage-rail .r'));
    if (!track || !panels.length) return;

    var mq = window.matchMedia('(min-width: 861px)');
    var stop = null, current = -1;

    function showAll() {
      panels.forEach(function (p) { p.classList.add('is-on'); });
    }

    function enterPanel(i) {
      if (i === current) return;
      current = i;
      panels.forEach(function (p, n) { p.classList.toggle('is-on', n === i); });
      rails.forEach(function (r, n) { r.classList.toggle('on', n === i); });
      if (!hasMotion) return;
      var items = panels[i].querySelectorAll('.bizpanel-inner > *');
      animate(items, { opacity: [0, 1], y: [26, 0] },
        { duration: .62, delay: stagger ? stagger(.07) : 0, ease: [.22, .61, .36, 1] });
      var img = panels[i].querySelector('.bizpanel-bg img');
      if (img) animate(img, { scale: [1.12, 1], opacity: [.18, .42] }, { duration: 1.3, ease: [.22, .61, .36, 1] });
    }

    function enable() {
      if (stop) { stop(); stop = null; }
      stage.classList.remove('stage-on');
      current = -1;

      if (!hasMotion || REDUCE || typeof scroll !== 'function' || !mq.matches) { showAll(); return; }

      stage.classList.add('stage-on');
      panels.forEach(function (p) { p.classList.remove('is-on'); });
      enterPanel(0);

      stop = scroll(function (p) {
        var n = panels.length;
        var raw = Math.min(Math.max(p, 0), .9999) * n;
        var idx = Math.floor(raw);
        var local = raw - idx;                       /* そのパネル内での進み具合 0→1 */
        enterPanel(idx);
        var ghost = panels[idx].querySelector('.bizpanel-ghost');
        if (ghost) ghost.style.transform = 'translate(' + (6 - local * 16) + 'vw, -50%)';
        var inner = panels[idx].querySelector('.bizpanel-inner');
        if (inner) inner.style.transform = 'translateY(' + (local * -26) + 'px)';
      }, { target: track, offset: ['start start', 'end end'] });
    }

    enable();
    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(enable, 220);
    });
  }

  /* ---------------------------------------------------------
     6. ページ遷移の幕
     --------------------------------------------------------- */
  function pageVeil() {
    if (!hasMotion || REDUCE) return;
    var veil = document.createElement('div');
    veil.className = 'v3-veil';
    document.body.appendChild(veil);

    /* 到着時はベールを出さない（一瞬暗くなる“チカッ”の原因になるため）。
       ベールは次のページへ移るときだけ使う。 */
    veil.style.opacity = '0';

    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#' || a.target === '_blank' || a.hasAttribute('download')) return;
      if (/^(https?:|mailto:|tel:)/.test(href) && a.host !== location.host) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      if (!/\.html?(\?|#|$)/.test(href)) return;

      e.preventDefault();
      veil.classList.add('on');
      var go = function () { location.href = href; };
      animate(veil, { opacity: [0, 1] }, { duration: .34, ease: [.65, 0, .35, 1] })
        .finished.then(go).catch(go);
      setTimeout(go, 700);   /* 保険 */
    });

    window.addEventListener('pageshow', function (ev) {
      if (ev.persisted) { veil.classList.remove('on'); veil.style.opacity = '0'; }
    });
  }

  /* ---------------------------------------------------------
     7. 画像のふわっと表示（カード・記事画像）
     --------------------------------------------------------- */
  function media() {
    if (!hasMotion || REDUCE || typeof inView !== 'function') return;
    var els = document.querySelectorAll('.biz-media, .split-media, .rel-media, .art-fig, .movie-stage, .hero-figs');
    Array.prototype.forEach.call(els, function (el) {
      el.classList.add('v3-zoom');
      inView(el, function () {
        animate(el, { opacity: [0, 1], scale: [.97, 1] }, { duration: .8, ease: [.22, .61, .36, 1] });
      }, { amount: .25 });
    });
  }

  /* --------------------------------------------------------- */
  function boot() {
    loader(function () {
      hero();
      progress();
      headings();
      bizStage();
      media();
      pageVeil();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
