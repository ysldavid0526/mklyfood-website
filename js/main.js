// 手機選單
document.querySelectorAll('.nav-toggle').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var nav = document.getElementById('site-nav');
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
});

// 詢價表單：目前沒有後端，送出時開啟 Email 並帶入填寫內容
var form = document.getElementById('inquiry-form');
if (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(form);
    if (form.dataset.lang) {
      var en = [
        'Company: ' + d.get('shop'), 'Contact: ' + d.get('name'), 'Email / Phone: ' + d.get('phone'),
        'Country: ' + d.get('area'), 'Business type: ' + d.get('type'), 'Estimated volume: ' + d.get('volume'),
        'Products: ' + d.getAll('product').join(', '), 'Samples: ' + (d.get('sample') ? 'Yes' : 'No'),
        '', 'Message:', d.get('message') || ''
      ];
      window.location.href = 'mailto:mkly@mklyfood.com?subject=' +
        encodeURIComponent('[Website inquiry] ' + d.get('shop') + ' (' + d.get('area') + ')') +
        '&body=' + encodeURIComponent(en.join('\n'));
      document.getElementById('form-done').hidden = false;
      return;
    }
    var lines = [
      '店名／公司：' + d.get('shop'),
      '聯絡人：' + d.get('name'),
      '電話：' + d.get('phone'),
      '地區：' + d.get('area'),
      '店型：' + d.get('type'),
      '每日豆漿用量：' + d.get('volume'),
      '有興趣的產品：' + d.getAll('product').join('、'),
      '需要試用品：' + (d.get('sample') ? '是' : '否'),
      '',
      '其他說明：',
      d.get('message') || ''
    ];
    var subject = '【網站詢價】' + d.get('shop') + '（' + d.get('area') + '）';
    window.location.href = 'mailto:mkly@mklyfood.com?subject=' +
      encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
    document.getElementById('form-done').hidden = false;
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
