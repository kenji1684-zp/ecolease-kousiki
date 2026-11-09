/* ============================================================
   エコリース site — shared interactions
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Theme ----------
     デザインは 案B「のびやか若葉」に決定（2026-10-30）。
     比較用の切り替えパネル（案A／案B）は廃止しました。
     各HTMLの <html data-theme="b"> で固定しています。 */
  document.documentElement.setAttribute('data-theme', 'b');
  try { localStorage.removeItem('eco-theme'); } catch (e) {}
  function buildDock() {}

  /* ---------- Header scroll state ---------- */
  function header() {
    var h = document.querySelector('.site-header');
    if (!h) return;
    var on = function () { h.classList.toggle('scrolled', window.scrollY > 30); };
    on(); window.addEventListener('scroll', on, { passive: true });
  }

  /* ---------- Mobile drawer ---------- */
  function drawer() {
    var burger = document.querySelector('.hamburger');
    var dr = document.querySelector('.drawer');
    if (!burger || !dr) return;
    var toggle = function () {
      var open = dr.classList.toggle('open');
      burger.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', toggle);
    dr.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        dr.classList.remove('open'); burger.classList.remove('open'); document.body.style.overflow = '';
      });
    });
  }

  /* ---------- Reveal on scroll (position-based; gated by a motion
     probe so content is never left hidden where CSS motion is paused) ---------- */
  function reveal() {
    var els = [].slice.call(document.querySelectorAll('.reveal'));
    if (!els.length) return;

    function startReveal() {
      document.documentElement.classList.add('anim');
      var list = els.slice();
      function vh() { return window.innerHeight || document.documentElement.clientHeight; }
      function check() {
        var h = vh();
        list = list.filter(function (e) {
          if (e.getBoundingClientRect().top < h * 0.92) { e.classList.add('in'); return false; }
          return true;
        });
        if (!list.length) detach();
      }
      var ticking = false;
      function onScroll() {
        if (ticking) return; ticking = true;
        requestAnimationFrame(function () { check(); ticking = false; });
      }
      function detach() {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      check();
      window.addEventListener('load', check);
      // safety net: never leave anything hidden
      setTimeout(function () { list.forEach(function (e) { e.classList.add('in'); }); detach(); }, 2600);
    }

    // Probe: does CSS motion actually advance here? If a transition
    // completes, enable the staged reveal; otherwise leave content visible.
    var p = document.createElement('div');
    p.style.cssText = 'position:fixed;left:-9999px;top:0;width:4px;height:4px;opacity:0.01;transition:opacity .06s linear;pointer-events:none';
    document.body.appendChild(p);
    var settled = false;
    function done(motion) {
      if (settled) return; settled = true;
      try { p.remove(); } catch (e) {}
      if (motion) startReveal();
    }
    p.addEventListener('transitionend', function () { done(true); });
    requestAnimationFrame(function () { p.style.opacity = '1'; });
    setTimeout(function () { p.style.opacity = '1'; }, 24);
    setTimeout(function () { done(false); }, 450); // no motion -> content stays visible
  }

  /* ---------- Shared field validation ---------- */
  function validateRow(row) {
    var f = row.querySelector('input,textarea,select');
    if (!f || !f.hasAttribute('data-required')) return true;
    var v = (f.value || '').trim();
    var ok = !!v;
    if (ok && f.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (ok && f.type === 'tel') ok = /^[0-9０-９\-\(\)\s]{8,}$/.test(v);
    row.classList.toggle('invalid', !ok);
    return ok;
  }

  /* ---------- Step wizard (お問い合わせ) ---------- */
  function wizardForm() {
    var wiz = document.getElementById('wizard');
    if (!wiz) return;
    var step1 = document.getElementById('step1');
    var step2 = document.getElementById('step2');
    var stepper = document.getElementById('stepper');
    var success = document.getElementById('formSuccess');

    // chip selection
    wiz.querySelectorAll('.chip-group').forEach(function (g) {
      var multi = g.dataset.multi === '1';
      g.querySelectorAll('.chip').forEach(function (c) {
        c.addEventListener('click', function () {
          if (multi) {
            c.classList.toggle('sel');
          } else {
            g.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('sel'); });
            c.classList.add('sel');
          }
          var block = g.closest('.field-block');
          if (block) block.classList.remove('err-show');
        });
      });
    });

    function groupSelected(id) {
      var g = document.getElementById(id);
      return g.querySelectorAll('.chip.sel').length > 0;
    }
    function scrollToWiz() {
      window.scrollTo({ top: wiz.getBoundingClientRect().top + window.scrollY - 110, behavior: 'smooth' });
    }

    // step 1 -> 2
    document.getElementById('toStep2').addEventListener('click', function () {
      var groups = [['fb-use', 'g-use'], ['fb-equip', 'g-equip'], ['fb-term', 'g-term']];
      var ok = true, firstBad = null;
      groups.forEach(function (pair) {
        var good = groupSelected(pair[1]);
        var block = document.getElementById(pair[0]);
        block.classList.toggle('err-show', !good);
        if (!good && !firstBad) firstBad = block;
        ok = ok && good;
      });
      if (!ok) {
        if (firstBad) window.scrollTo({ top: firstBad.getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' });
        return;
      }
      step1.classList.remove('on-step');
      step2.classList.add('on-step');
      document.getElementById('sp1').className = 'st done';
      document.getElementById('sp2').className = 'st on';
      stepper.classList.add('at2');
      scrollToWiz();
    });

    // back
    document.getElementById('backStep1').addEventListener('click', function () {
      step2.classList.remove('on-step');
      step1.classList.add('on-step');
      document.getElementById('sp1').className = 'st on';
      document.getElementById('sp2').className = 'st';
      stepper.classList.remove('at2');
      scrollToWiz();
    });

    // live re-validate
    step2.querySelectorAll('.form-row').forEach(function (row) {
      var f = row.querySelector('input,textarea,select');
      if (f) ['blur', 'input'].forEach(function (ev) {
        f.addEventListener(ev, function () { if (row.classList.contains('invalid')) validateRow(row); });
      });
    });
    var privacy = document.getElementById('privacy');
    if (privacy) privacy.addEventListener('change', function () {
      document.getElementById('privacyRow').classList.toggle('invalid', !privacy.checked);
    });

    // submit
    step2.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, first = null;
      step2.querySelectorAll('.form-row').forEach(function (row) {
        var v = validateRow(row);
        if (!v && !first) first = row;
        ok = ok && v;
      });
      var prow = document.getElementById('privacyRow');
      if (!privacy.checked) { prow.classList.add('invalid'); ok = false; if (!first) first = prow; }
      else prow.classList.remove('invalid');
      if (!ok) {
        if (first) window.scrollTo({ top: first.getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' });
        return;
      }
      wiz.style.display = 'none';
      if (success) {
        success.classList.add('show');
        window.scrollTo({ top: success.getBoundingClientRect().top + window.scrollY - 150, behavior: 'smooth' });
      }
    });
  }

  /* ---------- Footer year ---------- */
  function year() {
    var y = document.getElementById('yr');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- AI chat widget ---------- */
  /* ============================================================
     サイトガイド「ガイドに質問」（2026-10-30 AIチャットから変更）
     ・入力したキーワードから、サイト内の該当ページ／見出しへのリンクを返す
     ・索引は js/guide-index.js（tools/build-guide-index.py で自動生成）
       → 初めてガイドを開いたときに読み込むので、ページ表示は重くならない
     ・外部APIは使わない（公開サーバーでもそのまま動く）
     ・見出しへのリンクは「ページ.html#find=見出し」。開いたページで findJump() がその見出しまでスクロールして光らせる
     ============================================================ */
  /* ---- ガイドのリンク先：#find=見出し の位置までスクロールして光らせる ---- */
  function findJump() {
    var m = location.hash.match(/^#find=(.+)$/); if (!m) return;
    var key; try { key = decodeURIComponent(m[1]); } catch (e) { return; }
    var n = function (t) { return String(t || '').normalize('NFKC').replace(/\s+/g, ''); }, k = n(key);
    var el = [].slice.call(document.querySelectorAll('h1,h2,h3,h4,summary,dt,th')).filter(function (h) { return n(h.textContent).indexOf(k) > -1; })[0];
    if (!el) return;
    for (var p = el.parentElement; p; p = p.parentElement) if (p.tagName === 'DETAILS') p.open = true;   /* 折りたたみの中なら開く */
    var box = el.closest('.acc,.lic-card,.data-card,.iv,.sdg,.rl-step,.cyc-panel,.biz-row,.feat-card,.equip-card,.cell,.fl-item,.bo,article,section') || el;
    setTimeout(function () {
      var y = el.getBoundingClientRect().top + window.pageYOffset - Math.round(window.innerHeight * .22);
      if (window.__lenis && window.__lenis.scrollTo) window.__lenis.scrollTo(y, { duration: 1.1 }); else window.scrollTo({ top: y, behavior: 'smooth' });
      box.classList.add('gd-flash'); setTimeout(function () { box.classList.remove('gd-flash'); }, 2600);
    }, 700);
  }

  function aiChat() {
    if (document.querySelector('.chat-panel')) return;

    /* よくある質問：一致したら、リンクの前にひとこと回答を添える */
    var QUICK = [
      { k: ['リースとレンタル', 'リース レンタル', '違い', 'ちがい', '比較', 'どれ'], a: '長く使うならリース、数日〜数ヶ月なら レンタル、今ある建物の設備を守るならビルメンテナンスです。事業案内の「3つの事業を、ひと目で。」で違いを比べられます。', go: ['jigyo.html', '3つの事業を、ひと目で。'] },
      { k: ['電話', 'tel', '電話番号', '営業時間'], a: 'お電話は 088-672-0441（平日 9:00〜17:30）です。FAX は 088-672-3623。' },
      { k: ['見積', 'みつもり', '料金', '費用', '価格', 'いくら', '値段'], a: '「簡易見積り」で、設備・台数・期間を選ぶと概算を試算できます。正式なお見積りはお問い合わせください。' },
      { k: ['住所', 'アクセス', '場所', '所在地', '地図', '行き方'], a: '本社は 徳島県板野郡板野町川端字鶴ヶ須47-10 です。中部営業所・関西営業所もあります。' },
      { k: ['エリア', '全国', '対応地域', 'どこまで'], a: '全国44都道府県で施工実績があります（未実施は山形・秋田・沖縄の3県）。' }
    ];
    var SYN = {   /* 言い換え：左を入力すると右の語でも探す */
      'エアコン': ['空調'], 'クーラー': ['空調'], '冷房': ['空調'], 'トイレ': ['浄化槽'], '水': ['受水槽', '給排水'],
      '電気': ['キュービクル', '変圧器', '電気設備'], 'トランス': ['変圧器'], '借り': ['レンタル'], 'イベント': ['レンタル'],
      '直し': ['修理', '修繕'], '壊れ': ['故障', '修理'], '仕事': ['採用', '募集'], '求人': ['採用'], '働': ['採用'],
      '給料': ['資格手当', 'データ'], '休み': ['有給'], '先輩': ['インタビュー'], '会社': ['会社概要'],
      'エコ': ['環境', 'SDGs'], 'リサイクル': ['再リース', '再利用'], '個人情報': ['プライバシー'], 'ニュース': ['お知らせ']
    };
    var STOP = /(について|に関して|を教えて|教えて|ください|ありますか|ですか|したいです|したい|知りたい|見たい|探して|とは|って|の方法|方法|ページ|どこ|なに|何|ですが|ます|です|[をがはにでのとへやもかね？！?!。、,.・「」『』（）()\s]+)/g;

    function kata(s) { return s.replace(/[ぁ-ゖ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) + 0x60); }); }
    function norm(s) { return kata(String(s || '').normalize('NFKC').toLowerCase()).replace(/\s+/g, ''); }
    /* 検索語に重みを付ける：入力そのまま=1／言い換え=0.6／漢字1文字=0.35（タイトルとキーワードだけで照合） */
    function terms(q) {
      var raw = String(q || '').normalize('NFKC').replace(STOP, '|').split('|'), out = [], seen = {};
      function add(t, w, one) { t = norm(t); if (!t || seen[t]) return; seen[t] = 1; out.push({ t: t, w: w, one: !!one }); }
      raw.forEach(function (t) {
        t = t.trim(); if (!t) return;
        var verb = /[\u3041-\u3096]/.test(t);   /* ひらがなを含む＝「借りたい」など動作のことば → 名詞（浄化槽など）より軽く */
        if (t.length >= 2) add(t, verb ? .7 : 1); else if (/[\u4e00-\u9fff]/.test(t)) add(t, .35, true);
        Object.keys(SYN).forEach(function (k) { if (t.indexOf(k) > -1) SYN[k].forEach(function (w) { add(w, verb ? .25 : .6); }); });
      });
      return out;
    }

    var IDX = null, loading = null;
    function loadIndex() {
      if (IDX) return Promise.resolve(IDX);
      if (loading) return loading;
      loading = new Promise(function (res) {
        if (window.ECO_GUIDE_INDEX) { prep(); return res(IDX); }
        var s = document.createElement('script'); s.src = 'js/guide-index.js?v=2026110909';
        s.onload = function () { prep(); res(IDX); }; s.onerror = function () { res(null); };
        document.head.appendChild(s);
      });
      return loading;
    }
    function prep() {
      var d = window.ECO_GUIDE_INDEX; if (!d) return;
      d.pages.forEach(function (p) { p.nt = norm(p.t); p.nd = norm(p.d); p.nk = p.k.map(norm); });
      d.chunks.forEach(function (c) { c.nh = norm(c.h); c.nx = norm(c.x); });
      IDX = d;
    }

    function search(q) {
      var ts = terms(q); if (!IDX || !ts.length) return [];
      var score = IDX.pages.map(function () { return { s: 0, best: null, bs: 0, hit: '' }; });
      IDX.pages.forEach(function (p, i) {
        ts.forEach(function (o) {
          var t = o.t;
          if (p.nt.indexOf(t) > -1) { score[i].s += 12 * o.w; score[i].hit = score[i].hit || t; }
          if (p.nk.some(function (k) { return k === t || (t.length >= 2 && (k.indexOf(t) > -1 || (k.length >= 2 && t.indexOf(k) > -1))); })) score[i].s += 9 * o.w;
          if (!o.one && p.nd.indexOf(t) > -1) score[i].s += 3 * o.w;
        });
      });
      IDX.chunks.forEach(function (c) {
        var cs = 0, first = '';
        ts.forEach(function (o) {
          if (o.one) return;
          var t = o.t;
          if (c.nh && c.nh.indexOf(t) > -1) { cs += 7 * o.w; if (o.w === 1) first = first || t; }
          var n = c.nx.split(t).length - 1;
          if (n) { cs += (1.5 + Math.min(n, 3)) * o.w; if (o.w === 1) first = first || t; }
        });
        if (!cs) return;
        var sc = score[c.p]; sc.c = (sc.c || 0) + Math.min(cs, 10);   /* 本文の加点はページ全体で上限16（文章量の多いページが有利になりすぎないように） */
        if (cs > sc.bs && c.h) { sc.bs = cs; sc.best = c; sc.hit = first || sc.hit; }
      });
      var list = score.map(function (v, i) { return { p: IDX.pages[i], s: v.s + Math.min(v.c || 0, 16), best: v.best, hit: v.hit }; })
        .filter(function (r) { return r.s > 0; }).sort(function (a, b) { return b.s - a.s; });
      if (!list.length) return [];
      var top = list[0].s;   /* 1位の5割に満たないものは出さない（関係の薄いページを減らす） */
      return list.filter(function (r) { return r.s >= top * .5 && r.s >= 4; }).slice(0, 4);
    }

    var here = (location.pathname.split('/').pop() || 'index.html');
    function link(u, heading) {
      return u + (heading ? '#find=' + encodeURIComponent(heading.split(/[。！？]/)[0].slice(0, 40)) : '');
    }
    function snippet(c, hit) {
      if (!c) return '';
      var x = c.x, nx = c.nx, i = hit ? nx.indexOf(hit) : -1;
      if (i < 0) return x.slice(0, 58) + (x.length > 58 ? '…' : '');
      var a = Math.max(0, i - 18); return (a ? '…' : '') + x.slice(a, a + 62) + (x.length > a + 62 ? '…' : '');
    }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

    var ICON = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>';
    var fab = document.createElement('button');
    fab.className = 'chat-fab';
    fab.setAttribute('aria-label', 'サイトガイドを開く');
    fab.innerHTML = '<span class="av">' + ICON + '</span><span class="t">ガイドに質問</span>';
    document.body.appendChild(fab);

    var panel = document.createElement('div');
    panel.className = 'chat-panel guide';
    panel.setAttribute('data-lenis-prevent', '');
    panel.innerHTML =
      '<div class="chat-head"><span class="av">' + ICON + '</span>' +
      '<div class="ht"><b>エコリース サイトガイド</b><span>見たい内容を入力してください</span></div>' +
      '<button class="x" aria-label="閉じる">×</button></div>' +
      '<div class="chat-body" id="chatBody"></div>' +
      '<div class="chat-sugg" id="chatSugg"></div>' +
      '<form class="chat-input" id="chatForm"><input id="chatText" type="text" placeholder="例：浄化槽、見積り、採用、アクセス" autocomplete="off" enterkeyhint="search">' +
      '<button type="submit" aria-label="探す"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg></button></form>' +
      '<div class="chat-disc">サイト内の該当ページをご案内します。個別のご相談はお問い合わせへ。</div>';
    document.body.appendChild(panel);

    var body = panel.querySelector('#chatBody'), sugg = panel.querySelector('#chatSugg');
    var form = panel.querySelector('#chatForm'), input = panel.querySelector('#chatText');
    function scroll() { body.scrollTop = body.scrollHeight; }
    function bubble(cls, html) {
      var d = document.createElement('div'); d.className = 'chat-msg ' + cls; d.innerHTML = html; body.appendChild(d);
      if (cls === 'bot') body.scrollTop = Math.max(0, d.offsetTop - 12); else scroll();   /* 回答は先頭から読めるように */
      return d;
    }

    function cards(results) {
      return '<div class="gd-list">' + results.map(function (r) {
        var h = r.best && r.best.h && norm(r.best.h) !== norm(r.p.t) ? r.best.h : '';
        var cur = r.p.u === here ? '<em>このページ</em>' : '';
        return '<a class="gd-card" href="' + esc(link(r.p.u, h)) + '">' +
          '<span class="gd-cat">' + esc(r.p.c) + cur + '</span>' +
          '<b>' + esc(r.p.t) + '</b>' +
          (h ? '<span class="gd-sec">› ' + esc(h) + '</span>' : '') +
          '<span class="gd-snip">' + esc((function (t) { return t && t.replace(/…/g, '').length >= 14 ? t : r.p.d; })(snippet(r.best, r.hit))) + '</span>' +
          '<i class="gd-go" aria-hidden="true">→</i></a>';
      }).join('') + '</div>';
    }
    function sitemap() {
      var groups = {};
      IDX.pages.forEach(function (p) { (groups[p.c] = groups[p.c] || []).push(p); });
      return '<div class="gd-map">' + Object.keys(groups).map(function (g) {
        return '<div><span class="gd-cat">' + esc(g) + '</span>' + groups[g].map(function (p) {
          return '<a href="' + esc(p.u) + '"' + (p.u === here ? ' class="cur"' : '') + '>' + esc(p.t) + '</a>';
        }).join('') + '</div>';
      }).join('') + '</div>';
    }

    function answer(q) {
      var t = norm(q);
      if (/サイトマップ|ページ一覧|全ページ|メニュー|一覧/.test(t)) {
        bubble('bot', '<p>サイトのページ一覧です。</p>' + sitemap()); return;
      }
      var quick = null;
      QUICK.some(function (f) { if (f.k.some(function (k) { return t.indexOf(norm(k)) > -1; })) { quick = f; return true; } return false; });
      var res = search(q);
      if (quick && quick.go) {
        var p = IDX.pages.filter(function (x) { return x.u === quick.go[0]; })[0];
        if (p) {
          res = res.filter(function (r) { return r.p.u !== p.u; });
          var c = IDX.chunks.filter(function (x) { return IDX.pages[x.p] === p && x.h === quick.go[1]; })[0];
          res.unshift({ p: p, s: 99, best: c || { h: quick.go[1], x: '', nx: '' }, hit: '' });
          res = res.slice(0, 4);
        }
      }
      var html = '';
      if (quick) html += '<p>' + esc(quick.a) + '</p>';
      if (res.length) {
        html += '<p>' + (quick ? '関連するページです。' : '「' + esc(q) + '」に関するページが見つかりました。') + '</p>' + cards(res);
      } else if (!quick) {
        html += '<p>「' + esc(q) + '」に当てはまるページが見つかりませんでした。別のことばで試すか、下のページ一覧からお探しください。</p>' +
          '<div class="gd-list"><a class="gd-card" href="contact.html"><span class="gd-cat">お問い合わせ</span><b>直接たずねる</b><span class="gd-snip">フォーム、またはお電話 088-672-0441（平日 9:00〜17:30）</span><i class="gd-go">→</i></a></div>' +
          '<button type="button" class="gd-more" data-q="サイトマップ">ページ一覧を見る</button>';
      }
      bubble('bot', html);
    }

    function send(text) {
      text = (text || '').trim(); if (!text) return;
      panel.classList.add('used');   /* 質問後は候補ボタンを1行にたたむ */
      bubble('user', esc(text)); input.value = '';
      var t = document.createElement('div'); t.className = 'chat-typing'; t.innerHTML = '<i></i><i></i><i></i>'; body.appendChild(t); scroll();
      loadIndex().then(function () {
        setTimeout(function () {
          t.remove();
          if (!IDX) { bubble('bot', '<p>ガイドの読み込みに失敗しました。<a href="contact.html">お問い合わせ</a>からご連絡ください。</p>'); return; }
          answer(text);
        }, 280);
      });
    }

    ['リースとレンタルの違い', '浄化槽を借りたい', '見積りしたい', '採用情報', 'アクセス', 'SDGsの取り組み', 'サイトマップ'].forEach(function (s) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = s;
      b.addEventListener('click', function () { send(s); }); sugg.appendChild(b);
    });
    body.addEventListener('click', function (e) {
      var b = e.target.closest('.gd-more'); if (b) send(b.getAttribute('data-q'));
      var a = e.target.closest('a'); if (a && a.getAttribute('href').split('#')[0] === here) { close(); setTimeout(findJump, 50); }
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); send(input.value); });

    function open() {
      panel.classList.add('open'); fab.classList.add('hide'); loadIndex();
      if (!body.querySelector('.chat-msg')) {
        bubble('bot', '<p>サイトガイドです。<br>見たい内容やキーワードを入力すると、該当するページをご案内します。</p>');
      }
      setTimeout(function () { input.focus(); }, 300);
    }
    function close() { panel.classList.remove('open'); fab.classList.remove('hide'); }
    fab.addEventListener('click', open);
    panel.querySelector('.x').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) close(); });
  }


  /* ---- NEWS：カテゴリのジャバラ絞り込み ＋ もっと見る ---- */
  function news() {
    var list = document.getElementById('newsList');
    if (!list) return;
    var btn = document.getElementById('newsFilterBtn');
    var box = document.getElementById('newsCats');
    var cur = document.getElementById('newsCurCat');
    var more = document.getElementById('newsMore');
    var items = [].slice.call(list.querySelectorAll('.news-item'));
    var cats = [].slice.call(box.querySelectorAll('.news-cat'));
    var active = 'all', expanded = false;
    var full = list.hasAttribute('data-full');   /* 一覧ページは全件表示 */

    function openBox(on) {
      box.classList.toggle('open', on);
      box.style.maxHeight = on ? (box.scrollHeight + 'px') : '0px';
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    }
    function render() {
      var shown = 0, hit = 0;
      items.forEach(function (li) {
        var ok = (active === 'all') || (li.getAttribute('data-cat') === active);
        if (ok) hit++;
        var overflow = !full && !expanded && ok && shown >= 5;
        li.hidden = !ok || overflow;
        if (ok && !overflow) shown++;
      });
      var empty = list.querySelector('.news-empty');
      if (hit === 0) {
        if (!empty) {
          empty = document.createElement('li');
          empty.className = 'news-empty';
          empty.textContent = 'このカテゴリのお知らせはまだありません。';
          list.appendChild(empty);
        }
      } else if (empty) { empty.remove(); }
      if (more) {
        more.style.display = (!full && hit > 5) ? '' : 'none';
        more.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        more.firstChild.nodeValue = expanded ? '閉じる ' : 'もっと見る ';
      }
    }

    btn.addEventListener('click', function () { openBox(!box.classList.contains('open')); });
    cats.forEach(function (c) {
      c.addEventListener('click', function () {
        cats.forEach(function (o) { o.classList.remove('is-on'); });
        c.classList.add('is-on');
        active = c.getAttribute('data-cat');
        cur.textContent = c.textContent;
        expanded = false;
        render();
        openBox(false);   /* 選んだら畳んでコンパクトに */
      });
    });
    if (more) more.addEventListener('click', function () { expanded = !expanded; render(); });
    window.addEventListener('resize', function () { if (box.classList.contains('open')) box.style.maxHeight = box.scrollHeight + 'px'; });
    render();
  }


  /* ---- PR動画：クリックしてから読み込む（初期表示を軽くする） ---- */
  function movie() {
    var stage = document.getElementById('movieStage');
    if (!stage) return;
    var btn = stage.querySelector('.movie-play');
    btn.addEventListener('click', function () {
      if (stage.getAttribute('data-ready') !== '1') return;   /* 準備中は何もしない */
      var src = stage.getAttribute('data-src');
      var v = document.createElement('video');
      v.src = src; v.controls = true; v.autoplay = true; v.playsInline = true;
      v.setAttribute('preload', 'auto');
      v.setAttribute('poster', stage.querySelector('.movie-poster').getAttribute('src'));
      stage.appendChild(v);
      stage.classList.add('playing');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildDock(); header(); drawer(); reveal(); news(); movie(); wizardForm(); year(); aiChat(); findJump(); window.addEventListener('hashchange', findJump);
  });
})();
