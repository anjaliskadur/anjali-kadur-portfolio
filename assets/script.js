document.addEventListener('DOMContentLoaded', () => {
  // ---------- Visitor mode: "Which are you?" (Recruiter vs Just exploring) ----------
  (function visitorMode() {
    const STORAGE_KEY = 'visitorType';
    // Sections a recruiter should NOT see. Everything else stays visible.
    const RECRUITER_BLOCKED = ['project-management', 'event-planning', 'lighting-design', 'hobbies'];

    function homeHref() {
      // The logo already links to the site root from wherever this page lives.
      const logo = document.querySelector('.logo');
      return (logo && logo.getAttribute('href')) || 'index.html';
    }

    function isBlockedHref(href) {
      if (!href) return false;
      return RECRUITER_BLOCKED.some((slug) => href.indexOf(slug + '/') !== -1);
    }

    function currentPageBlocked() {
      const path = window.location.pathname;
      return RECRUITER_BLOCKED.some((slug) => path.indexOf('/' + slug + '/') !== -1);
    }

    function resetChoice() {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      // If a recruiter is deep in the site, send them home so the full nav is coherent.
      window.location.href = homeHref();
    }

    function addSwitchPill() {
      if (document.querySelector('.visitor-switch')) return;
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'visitor-switch';
      pill.innerHTML = 'Recruiter view · <strong>See everything</strong>';
      pill.addEventListener('click', resetChoice);
      document.body.appendChild(pill);
    }

    function renumberVisibleTiles() {
      let n = 0;
      document.querySelectorAll('.home-tile').forEach((tile) => {
        if (tile.classList.contains('is-hidden-recruiter')) return;
        n += 1;
        const num = tile.querySelector('.tile-num');
        if (num) num.textContent = String(n).padStart(2, '0');
      });
    }

    function applyMode(type) {
      document.body.classList.remove('mode-recruiter', 'mode-explorer');
      if (type === 'recruiter') {
        document.body.classList.add('mode-recruiter');
        if (currentPageBlocked()) {
          window.location.replace(homeHref());
          return;
        }
        document.querySelectorAll('.nav-links a, .home-tile').forEach((el) => {
          if (isBlockedHref(el.getAttribute('href'))) el.classList.add('is-hidden-recruiter');
        });
        renumberVisibleTiles();
        addSwitchPill();
      } else {
        document.body.classList.add('mode-explorer');
      }
    }

    function showModal() {
      const overlay = document.createElement('div');
      overlay.className = 'visitor-modal';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'visitor-modal-title');
      overlay.innerHTML =
        '<div class="visitor-modal-card">' +
        '  <p class="visitor-modal-eyebrow">Welcome</p>' +
        '  <h2 id="visitor-modal-title">Which are you?</h2>' +
        '  <p class="visitor-modal-sub">So I can show you what matters most.</p>' +
        '  <div class="visitor-modal-actions">' +
        '    <button type="button" class="btn-visitor" data-type="recruiter">Recruiter</button>' +
        '    <button type="button" class="btn-visitor btn-visitor-alt" data-type="explorer">Just exploring</button>' +
        '  </div>' +
        '</div>';
      document.body.appendChild(overlay);
      document.body.classList.add('modal-open');
      requestAnimationFrame(() => overlay.classList.add('is-visible'));

      overlay.querySelectorAll('.btn-visitor').forEach((btn) => {
        btn.addEventListener('click', () => {
          const type = btn.getAttribute('data-type');
          try { localStorage.setItem(STORAGE_KEY, type); } catch (e) {}
          overlay.classList.remove('is-visible');
          document.body.classList.remove('modal-open');
          setTimeout(() => overlay.remove(), 250);
          applyMode(type);
        });
      });
    }

    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}

    if (saved === 'recruiter' || saved === 'explorer') {
      applyMode(saved);
    } else {
      showModal();
    }
  })();

  // ---------- Lighting Design: under construction notice ----------
  (function lightingDesignConstruction() {
    if (!/\/lighting-design(\/|$)/.test(window.location.pathname)) return;

    function showConstructionModal() {
      if (document.querySelector('.construction-modal')) return;

      const overlay = document.createElement('div');
      overlay.className = 'visitor-modal construction-modal';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'construction-modal-title');
      overlay.innerHTML =
        '<div class="visitor-modal-card">' +
        '  <p class="visitor-modal-eyebrow">Lighting Design</p>' +
        '  <h2 id="construction-modal-title">Under construction</h2>' +
        '  <p class="visitor-modal-sub">This section is still being built. Check back soon for lighting plots, mood boards, and production photos.</p>' +
        '  <div class="visitor-modal-actions">' +
        '    <button type="button" class="btn-visitor" data-action="dismiss">Got it</button>' +
        '    <button type="button" class="btn-visitor btn-visitor-alt" data-action="home">Back to home</button>' +
        '  </div>' +
        '</div>';

      function closeModal() {
        overlay.classList.remove('is-visible');
        document.body.classList.remove('modal-open');
        setTimeout(() => overlay.remove(), 250);
      }

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });

      overlay.querySelector('[data-action="dismiss"]').addEventListener('click', closeModal);
      overlay.querySelector('[data-action="home"]').addEventListener('click', () => {
        const logo = document.querySelector('.logo');
        window.location.href = (logo && logo.getAttribute('href')) || '../';
      });

      document.addEventListener('keydown', function onKey(e) {
        if (e.key === 'Escape') {
          closeModal();
          document.removeEventListener('keydown', onKey);
        }
      });

      document.body.appendChild(overlay);
      document.body.classList.add('modal-open');
      requestAnimationFrame(() => overlay.classList.add('is-visible'));
    }

    if (document.querySelector('.visitor-modal')) {
      const observer = new MutationObserver(() => {
        if (!document.querySelector('.visitor-modal')) {
          observer.disconnect();
          showConstructionModal();
        }
      });
      observer.observe(document.body, { childList: true });
    } else {
      showConstructionModal();
    }
  })();

  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
    });
  }

  // Collapse the nav into the hamburger the moment the links stop fitting.
  // We measure in the expanded (row) layout, then decide — all within one
  // synchronous pass so the browser only ever paints the final state.
  const siteNav = document.querySelector('.site-nav');
  const navWrap = siteNav && siteNav.querySelector('.wrap');
  if (siteNav && navWrap && links && toggle) {
    let navRaf = 0;

    const measureNav = () => {
      navRaf = 0;
      // Temporarily drop the collapsed styling so the links lay out as a row.
      const wasCollapsed = document.body.classList.contains('nav-collapsed');
      document.body.classList.remove('nav-collapsed');
      // Compare the space the row needs against the space available.
      const overflowing = navWrap.scrollWidth > navWrap.clientWidth + 1;
      if (overflowing) {
        document.body.classList.add('nav-collapsed');
      } else if (wasCollapsed) {
        links.classList.remove('open');
      }
    };

    const scheduleMeasure = () => {
      if (navRaf) return;
      navRaf = requestAnimationFrame(measureNav);
    };

    measureNav();
    window.addEventListener('resize', scheduleMeasure, { passive: true });
    window.addEventListener('load', measureNav);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measureNav).catch(() => {});
    }
  }

  document.querySelectorAll('.carousel').forEach((carousel, carouselIndex) => {
    const track = carousel.querySelector('.carousel-track');
    const slides = track ? Array.from(track.children) : [];
    if (!track || slides.length <= 1) return;

    let index = 0;
    const dots = carousel.querySelectorAll('.carousel-dot');
    const prevBtn = carousel.querySelector('.carousel-btn.prev');
    const nextBtn = carousel.querySelector('.carousel-btn.next');

    function update() {
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === index));
    }

    function go(delta) {
      index = (index + delta + slides.length) % slides.length;
      update();
    }

    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); go(-1); });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); go(1); });
    dots.forEach((dot, i) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        index = i;
        update();
      });
    });

    if (carousel.dataset.autoplay === 'true') {
      // Vary interval + start delay per carousel so previews don't all flip in unison.
      const interval = 3000 + (carouselIndex % 5) * 450;
      const startDelay = 900 + ((carouselIndex * 1100) % interval);
      setTimeout(() => {
        go(1);
        setInterval(() => go(1), interval);
      }, startDelay);
    }
  });

  // ---------- Scroll-driven 3D effects ----------
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    // 1) Content blocks tip up into place as they enter the viewport.
    const revealSelector = [
      '.card', '.home-tile', '.page-header', '.detail-figure', '.detail-body',
      '.gallery-item', '.entry-block', '.about-photo', '.about-text', '.skills-group',
      '.testimonial-grid .testimonial-card', '.about-resume', '.contact',
      '.tutoring-section', '.tutoring-section-head'
    ].join(', ');
    const revealEls = Array.from(document.querySelectorAll(revealSelector));
    revealEls.forEach((el) => el.classList.add('reveal-3d'));

    // Stagger neighbours inside grids so they cascade instead of popping together.
    document.querySelectorAll('.card-grid, .home-grid, .skills-groups').forEach((grid) => {
      Array.from(grid.children).forEach((child, i) => {
        child.style.setProperty('--reveal-delay', (i % 6) * 70 + 'ms');
      });
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('in-view');
        io.unobserve(el);
        // Drop the 3D classes once the intro finishes so native hover/transitions return.
        el.addEventListener('transitionend', function done(e) {
          if (e.propertyName !== 'transform') return;
          el.classList.remove('reveal-3d', 'in-view');
          el.style.removeProperty('--reveal-delay');
          el.removeEventListener('transitionend', done);
        });
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => io.observe(el));

    // 2) Decorative elements rotate / drift continuously with scroll position.
    const spinEls = Array.from(document.querySelectorAll('.sprig svg'));
    const parallaxEls = Array.from(document.querySelectorAll('.blob'));
    let ticking = false;
    const applyScroll = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      spinEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
        el.style.setProperty('--spin', (progress * 120).toFixed(2) + 'deg');
      });
      parallaxEls.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
        const dir = i % 2 === 0 ? 1 : -1;
        el.style.setProperty('--py', (progress * -36 * dir).toFixed(1) + 'px');
        el.style.setProperty('--pr', (progress * 18 * dir).toFixed(1) + 'deg');
      });
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(applyScroll);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    applyScroll();
  }

  // ---------- Interactive 3D: pointer-driven tilt + ambient parallax ----------
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!reduceMotion && finePointer) {
    const MAX_TILT = 8; // degrees

    document.querySelectorAll('.home-tile, .card, .testimonial-grid .testimonial-card').forEach((el) => {
      let raf = 0;
      let pending = null;

      const render = () => {
        raf = 0;
        if (!pending) return;
        const { rx, ry, mx, my } = pending;
        el.style.transform =
          `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-6px)`;
        el.style.setProperty('--mx', mx.toFixed(1) + '%');
        el.style.setProperty('--my', my.toFixed(1) + '%');
      };

      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;   // 0 → 1 (left → right)
        const py = (e.clientY - r.top) / r.height;   // 0 → 1 (top → bottom)
        pending = {
          ry: (px - 0.5) * 2 * MAX_TILT,
          rx: -(py - 0.5) * 2 * MAX_TILT,
          mx: px * 100,
          my: py * 100,
        };
        el.classList.add('is-tilting');
        if (!raf) raf = requestAnimationFrame(render);
      });

      el.addEventListener('pointerleave', () => {
        pending = null;
        el.classList.remove('is-tilting');
        el.style.transform = '';
      });
    });

    // Background shapes drift opposite the pointer for a subtle sense of depth.
    const shapes = document.querySelector('.floating-shapes');
    if (shapes) {
      let sRaf = 0;
      let sTarget = null;
      const renderShapes = () => {
        sRaf = 0;
        if (!sTarget) return;
        shapes.style.transform = `translate3d(${sTarget.x}px, ${sTarget.y}px, 0)`;
      };
      window.addEventListener('pointermove', (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        sTarget = { x: (-nx * 22).toFixed(1), y: (-ny * 22).toFixed(1) };
        if (!sRaf) sRaf = requestAnimationFrame(renderShapes);
      }, { passive: true });
    }
  }

  // ---------- Infinite testimonials carousel (homepage) ----------
  (function initTestimonialMarquee() {
    const root = document.querySelector('[data-marquee]');
    if (!root) return;

    const track = root.querySelector('.testimonial-marquee-track');
    if (!track) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const GAP = 24;
    const SPEED = 38; // px per second

    // Clone the original set once so the loop can hand off seamlessly.
    const originals = Array.from(track.children);
    originals.forEach((card) => {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });

    function layout() {
      if (reduceMotion) {
        root.classList.remove('is-ready');
        return;
      }

      const visible = root.clientWidth < 760 ? 1 : 2;
      const cardWidth = (root.clientWidth - GAP * (visible - 1)) / visible;
      const count = originals.length;

      track.querySelectorAll('.testimonial-card').forEach((card) => {
        card.style.flex = '0 0 ' + cardWidth + 'px';
        card.style.width = cardWidth + 'px';
      });

      // Exact distance from the start of set A to the start of set B
      // (includes the gap after the last card of set A).
      const distance = count * (cardWidth + GAP);
      const duration = Math.max(distance / SPEED, 20);

      track.style.setProperty('--marquee-distance', distance + 'px');
      track.style.setProperty('--marquee-duration', duration + 's');
      root.classList.add('is-ready');
    }

    layout();
    window.addEventListener('resize', layout);
  })();

  // Pre-fill "Why are you contacting me?" from the current section.
  // HTML also sets `selected` per page; this re-applies after form reset
  // and covers any path quirks (local server, trailing files, etc.).
  const CONTACT_REASON_BY_SECTION = {
    'software-engineering': 'Software Engineering',
    'tutoring': 'Tutoring',
    'project-management': 'Project Management',
    'event-planning': 'Event Planning',
    'lighting-design': 'Lighting Design',
    'silambam-houston': 'Silambam Houston',
    'hobbies': 'Hobbies',
  };

  function sectionContactReason() {
    const activeNav = document.querySelector('.nav-links a.active');
    const haystack = [
      window.location.pathname,
      window.location.href,
      activeNav ? (activeNav.getAttribute('href') || '') : '',
    ].join(' ').toLowerCase();

    for (const [slug, reason] of Object.entries(CONTACT_REASON_BY_SECTION)) {
      if (haystack.indexOf(slug) !== -1) return reason;
    }
    return null;
  }

  function preselectContactReason() {
    const select = document.getElementById('contact-reason');
    if (!select) return;
    const reason = sectionContactReason();
    if (!reason) return;

    Array.from(select.options).forEach((opt) => {
      opt.selected = opt.value === reason;
    });
    select.value = reason;
  }

  preselectContactReason();

  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const status = document.getElementById('contact-status');
    const submitBtn = contactForm.querySelector('button[type="submit"]');

    function setStatus(message, type) {
      if (!status) return;
      status.textContent = message;
      status.classList.remove('is-success', 'is-error');
      if (type) status.classList.add('is-' + type);
    }

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setStatus('Sending…', null);
      if (submitBtn) submitBtn.disabled = true;

      const payload = Object.fromEntries(new FormData(contactForm).entries());

      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setStatus('Thanks! Your message has been sent — I\'ll get back to you soon.', 'success');
          contactForm.reset();
          preselectContactReason();
        } else {
          setStatus(data.message || 'Something went wrong. Please try again, or email me directly.', 'error');
        }
      } catch (err) {
        setStatus('Network error — please try again, or email me directly.', 'error');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
});
