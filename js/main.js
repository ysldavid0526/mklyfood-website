// 手機選單
document.querySelectorAll('.nav-toggle').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var nav = document.getElementById('site-nav');
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
});

// 詢價表單
// FORM_ENDPOINT 填入 Google Apps Script 部署網址後，詢價會直接寄出美化版 Email 並記錄到試算表；
// 還沒設定時，退回「開啟客戶的 Email 程式」的做法。
var FORM_ENDPOINT = '';

var form = document.getElementById('inquiry-form');
if (form) {
  var openedAt = Date.now();
  var show = function (id) {
    ['form-done', 'form-mail', 'form-error'].forEach(function (x) {
      var el = document.getElementById(x); if (el) el.hidden = x !== id;
    });
  };
  var mailtoFallback = function (d, lang) {
    var zh = lang === 'zh';
    var L = zh
      ? ['店名／公司：', '聯絡人：', '電話：', 'Email：', '地區：', '店型：', '每日豆漿用量：', '有興趣的產品：', '需要試用品：', '其他說明：']
      : ['Company: ', 'Contact: ', 'Phone: ', 'Email: ', 'Country: ', 'Business type: ', 'Estimated volume: ', 'Products: ', 'Samples: ', 'Message:'];
    var lines = [
      L[0] + d.get('shop'), L[1] + d.get('name'), L[2] + (d.get('phone') || ''), L[3] + (d.get('email') || ''),
      L[4] + d.get('area'), L[5] + d.get('type'), L[6] + d.get('volume'),
      L[7] + d.getAll('product').join(zh ? '、' : ', '), L[8] + (d.get('sample') ? (zh ? '是' : 'Yes') : (zh ? '否' : 'No')),
      '', L[9], d.get('message') || ''
    ];
    var subject = (zh ? '【網站詢價】' : '[Website inquiry] ') + d.get('shop') + '（' + d.get('area') + '）';
    window.location.href = 'mailto:mkly@mklyfood.com?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(lines.join('\n'));
    show('form-mail');
  };

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(form);
    var lang = form.dataset.lang || 'zh';
    if (!FORM_ENDPOINT) { mailtoFallback(d, lang); return; }

    var body = new URLSearchParams();
    ['shop', 'name', 'phone', 'email', 'area', 'type', 'volume', 'message', 'website'].forEach(function (k) {
      body.append(k, d.get(k) || '');
    });
    body.append('products', d.getAll('product').join('、'));
    body.append('sample', d.get('sample') ? 'yes' : '');
    body.append('lang', lang);
    body.append('page', location.href);
    body.append('elapsed', String(Date.now() - openedAt));

    var btn = form.querySelector('button[type=submit]');
    var label = btn.textContent;
    btn.disabled = true; btn.textContent = btn.dataset.sending || '…';
    fetch(FORM_ENDPOINT, { method: 'POST', body: body })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.error || 'failed');
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
