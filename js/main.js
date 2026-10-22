// 手機選單
document.querySelectorAll('.nav-toggle').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var nav = document.getElementById('site-nav');
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
});

// 詢價表單：送出後自動寄到業務信箱，不會開啟客戶的 Email 程式
// 預設用 FormSubmit 寄到 INQUIRY_TO；若之後裝好 Google Apps Script（有 logo 的美化信），
// 把部署網址填進 FORM_ENDPOINT 就會改用它。
var INQUIRY_TO = 'mklysale@mklyfood.com';
var FORM_ENDPOINT = '';

var form = document.getElementById('inquiry-form');
if (form) {
  var openedAt = Date.now();
  var show = function (id) {
    ['form-done', 'form-mail', 'form-error'].forEach(function (x) {
      var el = document.getElementById(x); if (el) el.hidden = x !== id;
    });
  };

  var collect = function () {
    var d = new FormData(form);
    var lang = form.dataset.lang || 'zh';
    var v = function (k) { return (d.get(k) || '').toString().trim(); };
    return {
      shop: v('shop'), name: v('name'), phone: v('phone'), email: v('email'), area: v('area'),
      type: v('type'), volume: v('volume'), message: v('message'), website: v('website'),
      products: d.getAll('product').join('、'), sample: d.get('sample') ? 'yes' : '',
      lang: lang, page: location.href, elapsed: String(Date.now() - openedAt)
    };
  };

  var LANG_LABEL = { zh: '繁體中文', en: 'English', ja: '日本語', ko: '한국어' };
  var subjectOf = function (x) {
    var s = '【網站詢價】' + [x.shop, x.area, x.type].filter(Boolean).join('｜');
    if (x.sample) s = '🎁 要試用品 ' + s;
    if (x.lang !== 'zh') s = '🌐 ' + LANG_LABEL[x.lang] + ' ' + s;
    return s;
  };

  var sendAppsScript = function (x) {
    var body = new URLSearchParams();
    Object.keys(x).forEach(function (k) { body.append(k, x[k]); });
    return fetch(FORM_ENDPOINT, { method: 'POST', body: body })
      .then(function (r) { return r.json(); })
      .then(function (res) { if (!res.ok) throw new Error(res.error || 'failed'); });
  };

  var sendFormSubmit = function (x) {
    var payload = {
      '店名／公司': x.shop, '聯絡人': x.name, '電話': x.phone, 'Email': x.email, '地區': x.area,
      '店型': x.type, '每日用量': x.volume, '有興趣產品': x.products,
      '試用品': x.sample ? '需要' : '不需要', '留言': x.message,
      '網站語言': LANG_LABEL[x.lang], '來源頁面': x.page,
      _subject: subjectOf(x), _template: 'table', _captcha: 'false', _honey: x.website
    };
    if (x.email) payload._replyto = x.email;
    return fetch('https://formsubmit.co/ajax/' + INQUIRY_TO, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json(); })
      .then(function (res) { if (String(res.success) !== 'true') throw new Error(res.message || 'failed'); });
  };

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var x = collect();
    // 防垃圾：隱藏欄位被填或 3 秒內送出，直接當作成功但不寄
    if (x.website || Number(x.elapsed) < 3000) { show('form-done'); return; }

    var btn = form.querySelector('button[type=submit]');
    var label = btn.textContent;
    btn.disabled = true; btn.textContent = btn.dataset.sending || '…';
    (FORM_ENDPOINT ? sendAppsScript(x) : sendFormSubmit(x))
      .then(function () {
        form.querySelectorAll('input, select, textarea').forEach(function (el) {
          if (el.type === 'checkbox') el.checked = false; else if (el.tagName !== 'SELECT') el.value = '';
        });
        show('form-done');
      })
      .catch(function () { show('form-error'); })
      .then(function () { btn.disabled = false; btn.textContent = label; });
  });
}

// 首頁輪播：自動播放、箭頭、圓點、手機滑動
var hero = document.querySelector('.hero .slides');
if (hero) {
  var slides = hero.querySelectorAll('.slide');
  var dots = document.querySelectorAll('.slider-dots button');
  var current = 0, timer = null;

  function show(i) {
    current = (i + slides.length) % slides.length;
    slides.forEach(function (s, n) {
      s.classList.toggle('is-active', n === current);
      s.setAttribute('aria-hidden', n === current ? 'false' : 'true');
    });
    dots.forEach(function (d, n) { d.classList.toggle('is-active', n === current); });
  }
  function play() { stop(); timer = setInterval(function () { show(current + 1); }, 5000); }
  function stop() { clearInterval(timer); }

  document.querySelector('.slider-arrow.prev').addEventListener('click', function () { show(current - 1); play(); });
  document.querySelector('.slider-arrow.next').addEventListener('click', function () { show(current + 1); play(); });
  dots.forEach(function (d, n) { d.addEventListener('click', function () { show(n); play(); }); });

  var startX = null;
  hero.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; stop(); }, { passive: true });
  hero.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    startX = null; play();
  });

  play();
}

// 配色預覽：網址加 ?theme=green / charcoal / navy（定案後可移除）
var theme = new URLSearchParams(location.search).get('theme');
if (theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('a[href$=".html"]').forEach(function (a) {
    if (!/^https?:/.test(a.getAttribute('href'))) a.href = a.getAttribute('href') + '?theme=' + theme;
  });
}
