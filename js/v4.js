/* =========================================================
   ecolease site v4 — bettei.co.jp 参照レイヤー
   js/script.js → js/motion.js → js/v3.js → js/v4.js の順で読み込みます。
   ・円周テキスト付き再生ボタンの生成
   ・右下の固定CTA（フッターに重なったら引っ込む）
   ・画像のワイプ表示
   ========================================================= */
(function () {
  'use strict';

  var M = window.Motion || {};
  var animate = M.animate, inView = M.inView;
  var hasMotion = typeof animate === 'function';
  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     円周テキスト付きの丸い再生ボタンをつくる
     label: 円周に回す文字（短い英字を推奨）
     --------------------------------------------------------- */
  function circle(label, href) {
    var id = 'v4circ' + Math.random().toString(36).slice(2, 8);
    var tag = href ? 'a' : 'button';
    var el = document.createElement(tag);
    el.className = 'v4-circle';
    if (href) { el.setAttribute('href', href); } else { el.setAttribute('type', 'button'); }
    el.setAttribute('aria-label', label);
    el.innerHTML =
      '<svg class="ring" viewBox="0 0 160 160" aria-hidden="true" focusable="false">' +
        '<defs><path id="' + id + '" fill="none" d="M80,80 m-62,0 a62,62 0 1,1 124,0 a62,62 0 1,1 -124,0"></path></defs>' +
        '<text><textPath href="#' + id + '" startOffset="0" textLength="389" lengthAdjust="spacing">' + label + '</textPath></text>' +
      '</svg>' +
      '<span class="core" aria-hidden="true"></span>';
    return el;
  }

  /* ---------------------------------------------------------
     1. ヒーロー（TOP）に「会社紹介ムービー」への円形ボタン
     --------------------------------------------------------- */
  function heroCircle() {
    var hero = document.querySelector('.hero');
    if (!hero || document.querySelector('.hero .v4-circle')) return;
    if (!document.querySelector('.bizstage')) return;      /* TOPページのみ */
    var c = circle('ECO LEASE MOVIE ・ ECO LEASE MOVIE ・', 'company.html#movie');
    hero.appendChild(c);
    if (hasMotion && !REDUCE) {
      c.style.opacity = '0';
      animate(c, { opacity: [0, 1], scale: [.85, 1] }, { duration: .9, delay: 1.1, ease: [.22, .61, .36, 1] });
    }
  }

  /* ---------------------------------------------------------
     2. 会社概要の動画再生ボタンを円形に置き換え
        （data-ready="0" の間は再生しない挙動はそのまま）
     --------------------------------------------------------- */
  function movieCircle() {
    var stage = document.getElementById('movieStage');
    if (!stage || stage.querySelector('.v4-circle')) return;
    var c = circle('PLAY MOVIE ・ ECO LEASE ・ PLAY MOVIE ・ ECO LEASE ・');
    stage.appendChild(c);
    stage.classList.add('has-circle');
    c.addEventListener('click', function () {
      var btn = stage.querySelector('.movie-play');
      if (btn) btn.click();           /* 既存の再生処理をそのまま使う */
    });
  }

  /* ---------------------------------------------------------
     3. 右下の固定CTA（フッターに重なったら引っ込む）
     --------------------------------------------------------- */
  function cta() {
    if (document.querySelector('.v4-cta')) return;
    var a = document.createElement('a');
    a.className = 'v4-cta';
    a.href = 'contact.html';
    a.innerHTML =
      '<span class="t"><b>資料請求・ご相談のお申込み</b><em>Contact form</em></span>' +
      '<span class="dot" aria-hidden="true"></span>';
    document.body.appendChild(a);

    /* 問い合わせページでは出さない */
    if (/contact\.html$/.test(location.pathname)) { a.remove(); return; }

    var footer = document.querySelector('.site-footer');
    if (footer && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { a.classList.toggle('is-hidden', e.isIntersecting); });
      }, { threshold: 0.02 }).observe(footer);
    }

    if (hasMotion && !REDUCE) {
      a.style.transform = 'translateY(112%)';
      animate(a, { y: ['112%', '0%'] }, { duration: .7, delay: .9, ease: [.22, .61, .36, 1] })
        .finished.then(function () { a.style.transform = ''; });
    }
  }

  /* ---------------------------------------------------------
     4. 画像のワイプ表示
     --------------------------------------------------------- */
  function wipe() {
    if (!hasMotion || REDUCE || typeof inView !== 'function') return;
    /* .movie-stage は v5 側のスクラブ演出に任せる（クリック判定を塞がないため） */
    var els = document.querySelectorAll('.split-media, .rel-media, .biz-media, .art-fig img');
    var vh0 = window.innerHeight;
    Array.prototype.forEach.call(els, function (el) {
      /* 読み込み時点で画面に入っているものは、そのまま見せる
         （一度隠してから開くと“チカッ”と見えてしまうため） */
      if (el.getBoundingClientRect().top < vh0 * .95) return;
      el.classList.add('v4-wipe');
      el.style.clipPath = 'inset(0 0 100% 0)';
      inView(el, function () {
        animate(el, { clipPath: ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'] },
          { duration: 1.05, ease: [.76, 0, .24, 1] });
      }, { amount: .2 });
    });
    /* 保険：画面に入っているのに閉じたままの要素があれば開く（10秒間、2秒おき） */
    var guard = setInterval(function () {
      var vh = window.innerHeight, open = 0;
      Array.prototype.forEach.call(document.querySelectorAll('.v4-wipe'), function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh * .9 && r.bottom > 0 && /100%|97|9[0-9]%/.test(el.style.clipPath || '')) {
          el.style.clipPath = 'inset(0 0 0% 0)'; open++;
        }
      });
      return open;
    }, 2000);
    setTimeout(function () { clearInterval(guard); }, 10000);
  }

  function boot() {
    heroCircle();
    movieCircle();
    cta();
    wipe();
  }

  /* v3のオープニングが終わるのを少し待ってから */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 60); });
  } else {
    setTimeout(boot, 60);
  }
})();
