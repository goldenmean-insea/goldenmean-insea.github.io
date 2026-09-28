/* ═══════════════════════════════════════════════════════════════════
   js/main.js — تفاعلات الموقع (Vanilla JS فقط)
   ───────────────────────────────────────────────────────────────────
   الميزات:
   1) قائمة الموبايل (فتح/إغلاق)      5) عدّادات الأرقام المتحركة
   2) تبويبات صفحة الأنشطة            6) ظهور تدريجي عند التمرير
   3) فلترة الموارد + معرض الصور       7) زر العودة إلى الأعلى
   4) أكورديون الأسئلة الشائعة        8) الوضع الداكن (localStorage)
   + بناء المحتوى الديناميكي من js/data.js (كائن CLUB)
   يعمل كل شيء تلقائيًا حسب العناصر الموجودة في الصفحة الحالية.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ---------- أدوات صغيرة ---------- */
  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* تحديث أيقونات Lucide بعد أي تعديل على الـ DOM */
  function refreshIcons() {
    if (window.lucide) { try { window.lucide.createIcons(); } catch (e) { /* تجاهل */ } }
  }

  /* ---------- مراقبة الظهور التدريجي (تُستدعى بعد كل إضافة ديناميكية) ---------- */
  var revealObserver = null;
  function observeReveals() {
    var els = $$('.reveal:not(.visible)');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('visible'); obs.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    }
    els.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ═══ 1) تحديد الرابط النشط في القائمة ═══ */
  function setActiveNav() {
    var page = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '');
    $$('[data-nav]').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-nav') === page);
    });
  }

  /* ═══ 2) قائمة الموبايل ═══ */
  function setupMobileMenu() {
    var btn = $('#menuBtn'), menu = $('#mobileMenu');
    if (!btn || !menu) return;
    var iconOpen = $('#iconMenu'), iconClose = $('#iconClose');

    function setOpen(open) {
      menu.classList.toggle('hidden', !open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'إغلاق قائمة التنقل' : 'فتح قائمة التنقل');
      if (iconOpen)  iconOpen.classList.toggle('hidden', open);
      if (iconClose) iconClose.classList.toggle('hidden', !open);
    }

    btn.addEventListener('click', function () { setOpen(menu.classList.contains('hidden')); });

    /* إغلاق عند النقر على أي رابط داخل القائمة */
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });

    /* إغلاق عند الضغط خارج القائمة أو على Escape */
    document.addEventListener('click', function (e) {
      if (!menu.classList.contains('hidden') && !menu.contains(e.target) && !btn.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  }

  /* ═══ 3) الوضع الداكن (يُحفظ في localStorage) ═══ */
  function setupThemeToggle() {
    $$('.theme-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var dark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('gm-theme', dark ? 'dark' : 'light');
      });
    });
  }

  /* ═══ 4) زر العودة إلى الأعلى ═══ */
  function setupBackToTop() {
    var btn = $('#toTop');
    if (!btn) return;
    function onScroll() { btn.classList.toggle('show', window.scrollY > 380); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* ═══ 5) العدّادات المتحركة (تقرأ القيم من CLUB.stats) ═══ */
  function animateNumber(el, target) {
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1600, t0 = performance.now();
    function step(now) {
      var p = Math.min((now - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); /* easeOutCubic */
      el.textContent = Math.round(target * eased).toLocaleString('en-US') + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = '0' + suffix;
    requestAnimationFrame(step);
  }

  function setupCounters() {
    var els = $$('[data-stat]');
    if (!els.length) return;
    var stats = (window.CLUB && CLUB.stats) || {};
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) {
        el.textContent = (stats[el.getAttribute('data-stat')] || 0) + (el.getAttribute('data-suffix') || '');
      });
      return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        obs.unobserve(en.target);
        animateNumber(en.target, Number(stats[en.target.getAttribute('data-stat')]) || 0);
      });
    }, { threshold: 0.35 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ═══ 6) التبويبات (صفحة الأنشطة) ═══ */
  function setupTabs() {
    var btns = $$('[data-tab]');
    if (!btns.length) return;
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var name = btn.getAttribute('data-tab');
        btns.forEach(function (b) {
          var on = (b === btn);
          b.classList.toggle('active', on);
          b.setAttribute('aria-selected', String(on));
        });
        $$('[data-tabpane]').forEach(function (pane) {
          pane.hidden = (pane.getAttribute('data-tabpane') !== name);
        });
      });
    });
  }

  /* ═══ 7) أكورديون الأسئلة الشائعة ═══ */
  function setupAccordion() {
    $$('.faq-item').forEach(function (item) {
      var btn = $('.faq-question', item), ans = $('.faq-answer', item);
      if (!btn || !ans) return;
      btn.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');
        /* إغلاق بقية العناصر المفتوحة (سلوك أكورديون) */
        $$('.faq-item.open').forEach(function (other) {
          if (other === item) return;
          other.classList.remove('open');
          var a = $('.faq-answer', other), b = $('.faq-question', other);
          if (a) a.style.maxHeight = '0px';
          if (b) b.setAttribute('aria-expanded', 'false');
        });
        item.classList.toggle('open', !isOpen);
        btn.setAttribute('aria-expanded', String(!isOpen));
        ans.style.maxHeight = isOpen ? '0px' : (ans.scrollHeight + 'px');
      });
    });
  }

  /* ═══ 8) نموذج التواصل (تجريبي — بلا خادم) ═══ */
  function setupContactForm() {
    var form = $('#contactForm'), success = $('#formSuccess');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault(); /* نموذج عرضي: نعرض رسالة النجاح فقط */
      if (!success) return;
      form.classList.add('hidden');
      success.classList.remove('hidden');
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    var resetBtn = $('#resetFormBtn');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      form.reset();
      success.classList.add('hidden');
      form.classList.remove('hidden');
    });
  }

  /* ═══════════ البناء الديناميكي من data.js ═══════════ */

  /* نصوص قسم البطل في الرئيسية */
  function fillHeroTexts() {
    if (!window.CLUB) return;
    var t = $('#heroTitle');
    if (t) t.textContent = (CLUB.heroTitles && CLUB.heroTitles[0]) || CLUB.tagline || t.textContent;
    var s = $('#heroSubtitle');
    if (s && CLUB.heroSubtitle) s.textContent = CLUB.heroSubtitle;
  }

  /* بطاقات الأنشطة الأسبوعية */
  function renderWeekly() {
    var grid = $('#weeklyGrid');
    if (!grid || !window.CLUB || !CLUB.weekly) return;
    grid.innerHTML = CLUB.weekly.map(function (a, i) {
      return '' +
        '<article class="card card-hover reveal flex flex-col p-6" style="transition-delay:' + (i * 90) + 'ms">' +
          '<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-gold dark:bg-gold/20"><i data-lucide="' + (a.icon || 'book-open') + '" class="h-6 w-6"></i></div>' +
          '<h3 class="font-amiri text-xl font-bold text-pine dark:text-gold">' + a.name + '</h3>' +
          '<p class="mt-2 flex-1 text-sm leading-7 text-cocoa/75 dark:text-sand/65">' + a.desc + '</p>' +
          '<div class="mt-4 flex flex-wrap gap-2">' +
            '<span class="meta-chip"><i data-lucide="calendar" class="h-3.5 w-3.5"></i>' + a.day + '</span>' +
            '<span class="meta-chip"><i data-lucide="map-pin" class="h-3.5 w-3.5"></i>' + a.place + '</span>' +
          '</div>' +
        '</article>';
    }).join('');
    observeReveals(); refreshIcons();
  }

  /* بطاقات الأنشطة الموسمية */
  function renderSeasonal() {
    var grid = $('#seasonalGrid');
    if (!grid || !window.CLUB || !CLUB.seasonal) return;
    grid.innerHTML = CLUB.seasonal.map(function (s, i) {
      var ramadan = s.season.indexOf('رمضان') !== -1;
      return '' +
        '<article class="card card-hover reveal p-6" style="transition-delay:' + ((i % 3) * 90) + 'ms">' +
          '<div class="mb-4 flex items-start justify-between gap-3">' +
            '<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-gold dark:bg-gold/20"><i data-lucide="' + (s.icon || 'sparkles') + '" class="h-6 w-6"></i></div>' +
            '<span class="season-badge' + (ramadan ? ' ramadan' : '') + '">' + s.season + '</span>' +
          '</div>' +
          '<h3 class="font-amiri text-xl font-bold text-pine dark:text-gold">' + s.name + '</h3>' +
          '<p class="mt-2 text-sm leading-7 text-cocoa/75 dark:text-sand/65">' + s.desc + '</p>' +
        '</article>';
    }).join('');
    observeReveals(); refreshIcons();
  }

  /* مشروع مهندس حافظ */
  function renderHafiz() {
    if (!window.CLUB || !CLUB.hafiz) return;
    var t = $('#hafizTitle'); if (t) t.textContent = CLUB.hafiz.title;
    var d = $('#hafizDesc'); if (d) d.textContent = CLUB.hafiz.desc;
    var wrap = $('#hafizTracks');
    if (!wrap) return;
    wrap.innerHTML = CLUB.hafiz.tracks.map(function (tr) {
      return '' +
        '<div class="flex items-center gap-4 rounded-xl border border-gold/25 bg-white/5 px-5 py-4">' +
          '<i data-lucide="badge-check" class="h-5 w-5 shrink-0 text-gold"></i>' +
          '<div>' +
            '<h4 class="font-bold text-white">' + tr.name + '</h4>' +
            '<p class="text-sm text-cream/70">' + tr.detail + '</p>' +
          '</div>' +
        '</div>';
    }).join('');
    refreshIcons();
  }

  /* الأسئلة الشائعة (ثم يربطها setupAccordion) */
  function renderFaq() {
    var list = $('#faqList');
    if (!list || !window.CLUB || !CLUB.faq) return;
    list.innerHTML = CLUB.faq.map(function (f, i) {
      return '' +
        '<div class="faq-item card mb-3 overflow-hidden">' +
          '<button type="button" class="faq-question flex w-full items-center justify-between gap-3 px-5 py-4 text-right font-semibold" aria-expanded="false" aria-controls="faqAns' + i + '">' +
            '<span>' + f.q + '</span>' +
            '<i data-lucide="chevron-down" class="faq-chevron h-5 w-5 shrink-0 text-gold"></i>' +
          '</button>' +
          '<div class="faq-answer" id="faqAns' + i + '">' +
            '<p class="px-5 pb-5 text-sm leading-7 text-cocoa/75 dark:text-sand/65">' + f.a + '</p>' +
          '</div>' +
        '</div>';
    }).join('');
    refreshIcons();
  }

  /* استمارة الانضمام (iframe + زر النافذة الجديدة) */
  function setupJoinForm() {
    if (!window.CLUB) return;
    var iframe = $('#joinFrame'), alt = $('#openFormBtn'), warn = $('#embedWarning');
    if (alt && CLUB.joinFormUrl) alt.href = CLUB.joinFormUrl;
    if (iframe && CLUB.joinFormEmbed) {
      iframe.src = CLUB.joinFormEmbed;
      /* تنبيه لطيف إذا بقي FORM_ID دون استبدال */
      if (warn && /FORM_ID/i.test(CLUB.joinFormEmbed)) warn.classList.remove('hidden');
    }
  }

  function setupContactFormEmbed() {
    if (!window.CLUB) return;
    var frame = $('#contactFrame');
    var alt   = $('#openContactFormBtn');
    var warn  = $('#embedWarning');
    if (alt && CLUB.contactFormUrl) alt.href = CLUB.contactFormUrl;
    if (frame && CLUB.contactFormEmbed) {
      frame.src = CLUB.contactFormEmbed;
      if (warn && /FORM_ID/i.test(CLUB.contactFormEmbed)) warn.classList.remove('hidden');
    }
  }

  /* مكتبة الموارد + الفلترة بالتصنيف */
  function setupResources() {
    var grid = $('#resourcesGrid'), wrap = $('#resourceFilters');
    if (!grid || !window.CLUB || !CLUB.resources) return;

    var current = 'الكل';
    var cats = ['الكل'];
    CLUB.resources.forEach(function (r) { if (cats.indexOf(r.category) === -1) cats.push(r.category); });

    function render() {
      var items = CLUB.resources.filter(function (r) { return current === 'الكل' || r.category === current; });
      grid.innerHTML = items.length ? items.map(function (r, i) {
        return '' +
        '<article class="card card-hover reveal p-5" style="transition-delay:' + (i * 60) + 'ms">' +
          '<div class="flex items-start gap-4">' +
            '<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-600/10 text-red-600 dark:text-red-400"><i data-lucide="file-text" class="h-6 w-6"></i></div>' +
            '<div class="min-w-0 flex-1">' +
              '<h3 class="font-amiri text-lg font-bold text-pine dark:text-gold">' + r.title + '</h3>' +
              '<p class="mt-1 text-sm leading-6 text-cocoa/70 dark:text-sand/60">' + r.desc + '</p>' +
              '<div class="mt-4 flex flex-wrap items-center justify-between gap-3">' +
                '<span class="meta-chip">' + r.category + ' · ' + r.size + '</span>' +
                '<a href="' + r.file + '" download class="btn btn-green btn-sm"><i data-lucide="download" class="h-4 w-4"></i> تنزيل</a>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</article>';
      }).join('') : '<p class="col-span-full py-10 text-center text-cocoa/60 dark:text-sand/50">لا توجد ملفات في هذا التصنيف بعد.</p>';
      observeReveals(); refreshIcons();
    }

    wrap.innerHTML = cats.map(function (c, i) {
      return '<button type="button" class="chip' + (i === 0 ? ' active' : '') + '" data-filter="' + c + '">' + c + '</button>';
    }).join('');

    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-filter]');
      if (!btn || btn.classList.contains('active')) return;
      current = btn.getAttribute('data-filter');
      $$('button', wrap).forEach(function (b) { b.classList.toggle('active', b === btn); });
      render();
    });

    render();
  }

    /* ═══ 9) معرض الصور + الفلترة ═══
     ضع صورك في ./resources/img بمساراتٍ مطابقة لـ CLUB.gallery.
     قبل رفع الصور: تُخفى الوسوم الفاشلة تلقائيًا (onerror)
     وتبقى خلفيةٌ زخرفية + أيقونة — placeholder أنيق جاهز للاستبدال. */
  function setupGallery() {
    var grid = $('#galleryGrid'), wrap = $('#galleryFilters');
    if (!grid || !window.CLUB || !CLUB.gallery) return;

    var current = 'الكل';
    var cats = ['الكل'];
    CLUB.gallery.forEach(function (g) { if (cats.indexOf(g.category) === -1) cats.push(g.category); });

    function render() {
      var items = CLUB.gallery.filter(function (g) { return current === 'الكل' || g.category === current; });
      grid.innerHTML = items.length ? items.map(function (g, i) {
        return '' +
        '<figure class="card card-hover reveal overflow-hidden" style="transition-delay:' + ((i % 4) * 70) + 'ms">' +
          '<div class="relative aspect-[4/3] bg-gradient-to-br from-pine to-pine-deep">' +
            '<div class="absolute inset-0 bg-pattern-light opacity-[0.13]" aria-hidden="true"></div>' +
            '<div class="absolute inset-0 flex items-center justify-center text-gold-light/60" aria-hidden="true"><i data-lucide="' + (g.icon || 'image') + '" class="h-10 w-10"></i></div>' +
            /* الصورة الفعلية: إن لم تُرفع بعد تُخفى تلقائيًا وتبقى الخلفية الزخرفية */
            '<img src="' + g.img + '" alt="' + g.title + '" loading="lazy" class="absolute inset-0 h-full w-full object-cover" onerror="this.style.display=\'none\'" />' +
          '</div>' +
          '<figcaption class="flex items-center justify-between gap-2 px-4 py-3">' +
            '<span class="truncate text-sm font-semibold text-cocoa dark:text-sand">' + g.title + '</span>' +
            '<span class="season-badge shrink-0">' + g.category + '</span>' +
          '</figcaption>' +
        '</figure>';
      }).join('') : '<p class="col-span-full py-10 text-center text-cocoa/60 dark:text-sand/50">لا توجد صور في هذا التصنيف بعد.</p>';
      observeReveals(); refreshIcons();
    }

    wrap.innerHTML = cats.map(function (c, i) {
      return '<button type="button" class="chip' + (i === 0 ? ' active' : '') + '" data-filter="' + c + '">' + c + '</button>';
    }).join('');

    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-filter]');
      if (!btn || btn.classList.contains('active')) return;
      current = btn.getAttribute('data-filter');
      $$('button', wrap).forEach(function (b) { b.classList.toggle('active', b === btn); });
      render();
    });

    render();
  }

  /* ═══ 10) المقاطع المرئية + نافذة المشاهدة ═══ */

  /* استخراج معرّف يوتيوب من أي شكل رابط شائع (watch / youtu.be / embed / shorts) */
  function youtubeId(url) {
    var m = String(url || '').match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : '';
  }

  function renderVideos() {
    var grid = $('#videosGrid');
    if (!grid || !window.CLUB || !CLUB.videos) return;
    grid.innerHTML = CLUB.videos.map(function (v, i) {
      var id = youtubeId(v.url);
      var thumb = id
        ? '<img src="https://i.ytimg.com/vi/' + id + '/hqdefault.jpg" alt="" loading="lazy" class="absolute inset-0 h-full w-full object-cover" onerror="this.style.display=\'none\'">'
        : '';
      return '' +
        '<article class="video-card card card-hover reveal group relative cursor-pointer overflow-hidden" data-video-url="' + v.url + '" data-video-title="' + v.title + '" style="transition-delay:' + ((i % 4) * 70) + 'ms">' +
          '<div class="relative aspect-video bg-gradient-to-br from-pine-deep to-pine">' +
            '<div class="absolute inset-0 bg-pattern-light opacity-[0.1]" aria-hidden="true"></div>' +
            thumb +
            '<div class="absolute inset-0 flex items-center justify-center">' +
              '<span class="flex h-12 w-12 items-center justify-center rounded-full bg-gold text-pine-deep shadow-lg transition-transform group-hover:scale-110"><i data-lucide="play" class="h-6 w-6"></i></span>' +
            '</div>' +
          '</div>' +
          '<div class="p-4">' +
            '<h3 class="font-amiri text-base font-bold text-pine dark:text-gold">' + v.title + '</h3>' +
            '<p class="mt-1 text-xs text-cocoa/60 dark:text-sand/50">' + v.channel + '</p>' +
          '</div>' +
          '<button type="button" class="absolute inset-0 z-10" aria-label="تشغيل المقطع: ' + v.title + '"></button>' +
        '</article>';
    }).join('');
    observeReveals(); refreshIcons();
  }

  function setupVideoModal() {
    var grid = $('#videosGrid'), modal = $('#videoModal');
    if (!grid || !modal) return;
    var frame = $('#videoFrame'), titleEl = $('#videoModalTitle'), closeBtn = $('#videoModalClose');
    var lastFocus = null;

    function open(url, t) {
      var id = youtubeId(url);
      if (!id) { window.open(url, '_blank', 'noopener'); return; } /* احتياط: فتح مباشر */
      if (titleEl) titleEl.textContent = t || 'مقطع مرئي';
      /* youtube-nocookie: وضع الخصوصية المحسّن */
      if (frame) frame.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      lastFocus = document.activeElement;
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.body.style.overflow = 'hidden'; /* منع تمرير الصفحة خلف النافذة */
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      if (frame) frame.src = 'about:blank'; /* إيقاف التشغيل */
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    grid.addEventListener('click', function (e) {
      var card = e.target.closest('.video-card');
      if (card) open(card.getAttribute('data-video-url'), card.getAttribute('data-video-title'));
    });

    if (closeBtn) closeBtn.addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); }); /* نقرة الخلفية */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) close();
    });
  }

  function setupSocialLinks() {
    if (!window.CLUB || !CLUB.social) return;
    $$('[data-social]').forEach(function (el) {
      var key = el.getAttribute('data-social');
      var val = CLUB.social[key];
      if (!val || val === '#') {
        el.classList.add('opacity-40', 'pointer-events-none');
        el.setAttribute('title', 'لم يُضبط بعد — عدّله في js/data.js');
        return;
      }
      if (key === 'email') {
        el.href = /^mailto:/i.test(val) ? val : 'mailto:' + val;
        if (el.hasAttribute('data-email-text')) el.textContent = val;
      } else {
        el.href = val;
        el.target = '_blank';
        el.rel = 'noopener';
      }
    });
  }

  /* copyrith year increment auto*/
  function setupYear() {
    var y = String(new Date().getFullYear());
    $$('[data-year]').forEach(function (el) { el.textContent = y; });
  }

  function init() {
    setActiveNav();
    setupMobileMenu();
    setupThemeToggle();
    setupBackToTop();
    setupCounters();
    setupTabs();

    fillHeroTexts();
    renderWeekly();
    renderSeasonal();
    renderHafiz();
    renderFaq();        /* قبل الأكورديون: يبني العناصر أولًا ثم يربطها */
    setupAccordion();

    setupJoinForm();
    setupContactFormEmbed();
    setupResources();
    setupGallery();
    renderVideos();
    setupVideoModal();
    setupSocialLinks();
    setupYear();
    setupContactForm();

    observeReveals();  /* التقاط عناصر .reveal المتبقية في الصفحة */
    refreshIcons();    /* تحويل أيقونات HTML الثابتة إلى SVG */
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})(); /* ═══ نهاية main.js ═══ */