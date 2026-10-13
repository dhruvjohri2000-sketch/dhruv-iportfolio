(() => {
  const sidebar = document.getElementById('sidebar');
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = [...document.querySelectorAll('.nav-link')];
  const backTop = document.getElementById('backTop');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Interactive ambient particle field. Particles drift gently, connect nearby dots,
  // and react softly to the pointer without blocking clicks or scrolling.
  const backgroundCanvas = document.getElementById('interactiveBackground');
  if (backgroundCanvas && !reduceMotion) {
    const ctx = backgroundCanvas.getContext('2d', { alpha: true });
    let width = 0, height = 0, dpr = 1, particles = [], rafId = 0;
    const pointer = { x: -1000, y: -1000, active: false };
    const colors = [[83, 126, 243], [91, 195, 180], [157, 139, 238]];
    const makeParticles = () => {
      const count = Math.min(95, Math.max(32, Math.floor((width * height) / 18000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width, y: Math.random() * height,
        vx: (Math.random() - .5) * .32, vy: (Math.random() - .5) * .32,
        radius: .8 + Math.random() * 1.6, color: colors[Math.floor(Math.random() * colors.length)],
        phase: Math.random() * Math.PI * 2
      }));
    };
    const resizeCanvas = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.7);
      width = window.innerWidth; height = window.innerHeight;
      backgroundCanvas.width = Math.floor(width * dpr);
      backgroundCanvas.height = Math.floor(height * dpr);
      backgroundCanvas.style.width = width + 'px'; backgroundCanvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeParticles();
    };
    const drawParticles = (time = 0) => {
      ctx.clearRect(0, 0, width, height);
      const linkDistance = width < 700 ? 88 : 125;
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -12) p.x = width + 12; if (p.x > width + 12) p.x = -12;
        if (p.y < -12) p.y = height + 12; if (p.y > height + 12) p.y = -12;
        if (pointer.active) {
          const dx = p.x - pointer.x, dy = p.y - pointer.y, dist = Math.hypot(dx, dy);
          if (dist < 115 && dist > 0) { const force = (115 - dist) / 115; p.x += dx / dist * force * .65; p.y += dy / dist * force * .65; }
        }
        const [r,g,b] = p.color;
        const pulse = .55 + (Math.sin(time * .0007 + p.phase) + 1) * .16;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${.48 * pulse})`; ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j], dx = p.x - q.x, dy = p.y - q.y, dist = Math.hypot(dx, dy);
          if (dist < linkDistance) {
            const alpha = (1 - dist / linkDistance) * .16;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(100,139,205,${alpha})`; ctx.lineWidth = .7; ctx.stroke();
          }
        }
        if (pointer.active) {
          const dist = Math.hypot(p.x - pointer.x, p.y - pointer.y);
          if (dist < 150) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(pointer.x, pointer.y); ctx.strokeStyle = `rgba(91,153,205,${(1-dist/150)*.18})`; ctx.lineWidth = .8; ctx.stroke(); }
        }
      });
      rafId = window.requestAnimationFrame(drawParticles);
    };
    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('pointermove', event => { pointer.x = event.clientX; pointer.y = event.clientY; pointer.active = true; }, { passive: true });
    window.addEventListener('pointerleave', () => { pointer.active = false; }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { window.cancelAnimationFrame(rafId); }
      else if (!reduceMotion) { rafId = window.requestAnimationFrame(drawParticles); }
    });
    resizeCanvas();
    rafId = window.requestAnimationFrame(drawParticles);
  }
  document.getElementById('year').textContent = new Date().getFullYear();

  mobileToggle.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    mobileToggle.setAttribute('aria-expanded', String(open));
    mobileToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    mobileToggle.innerHTML = open ? '<i class="bi bi-x-lg"></i>' : '<i class="bi bi-list"></i>';
  });
  navLinks.forEach(link => link.addEventListener('click', () => {
    sidebar.classList.remove('open');
    mobileToggle.setAttribute('aria-expanded', 'false');
    mobileToggle.setAttribute('aria-label', 'Open navigation');
    mobileToggle.innerHTML = '<i class="bi bi-list"></i>';
  }));
  document.addEventListener('click', e => {
    if (window.innerWidth <= 900 && sidebar.classList.contains('open') && !sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
      sidebar.classList.remove('open'); mobileToggle.setAttribute('aria-expanded','false'); mobileToggle.innerHTML='<i class="bi bi-list"></i>';
    }
  });

  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
    }), {threshold: 0.12, rootMargin: '0px 0px -35px 0px'});
    revealEls.forEach(el => revealObserver.observe(el));
  } else revealEls.forEach(el => el.classList.add('visible'));

  const sections = [...document.querySelectorAll('[data-section]')];
  const updateScroll = () => {
    const y = window.scrollY + window.innerHeight * .32;
    let current = sections[0]?.id || 'home';
    sections.forEach(section => { if (section.offsetTop <= y) current = section.id; });
    navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${current}`));
    backTop.classList.toggle('show', window.scrollY > 450);
  };
  window.addEventListener('scroll', updateScroll, {passive:true}); updateScroll();
  backTop.addEventListener('click', () => window.scrollTo({top:0, behavior:reduceMotion?'auto':'smooth'}));

  document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach(item => item.classList.toggle('active', item === button));
    const filter = button.dataset.filter;
    document.querySelectorAll('.project-card').forEach((card, index) => {
      const show = filter === 'all' || card.dataset.category === filter;
      card.hidden = !show;
      if (show && !reduceMotion) {
        card.animate([{opacity:0, transform:'translateY(10px)'},{opacity:1, transform:'translateY(0)'}], {duration:350, delay:index*35, easing:'cubic-bezier(.2,.7,.2,1)'});
      }
    });
  }));

  const typed = document.getElementById('typedText');
  const phrases = ['Artificial Intelligence', 'Machine Learning', 'Python Development', 'Useful software'];
  if (!reduceMotion) {
    let phraseIndex = 0, charIndex = phrases[0].length, deleting = true;
    const typeLoop = () => {
      const phrase = phrases[phraseIndex];
      if (deleting) { charIndex--; typed.textContent = phrase.slice(0, Math.max(0,charIndex)); }
      else { charIndex++; typed.textContent = phrase.slice(0,charIndex); }
      let delay = deleting ? 38 : 68;
      if (deleting && charIndex <= 0) { deleting = false; phraseIndex = (phraseIndex + 1) % phrases.length; delay = 300; }
      else if (!deleting && charIndex >= phrases[phraseIndex].length) { deleting = true; delay = 1500; }
      window.setTimeout(typeLoop, delay);
    };
    window.setTimeout(typeLoop, 1800);
  }

  // Gentle pointer tilt on larger screens only.
  const codeCard = document.querySelector('.code-card');
  if (codeCard && !reduceMotion && window.matchMedia('(pointer:fine)').matches && window.innerWidth > 900) {
    const visual = document.querySelector('.hero-visual');
    visual.addEventListener('pointermove', e => {
      const rect = visual.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - .5;
      const y = (e.clientY - rect.top) / rect.height - .5;
      codeCard.style.animation = 'none';
      codeCard.style.transform = `perspective(900px) rotateY(${x*7-2}deg) rotateX(${-y*5}deg) translateY(-3px)`;
    });
    visual.addEventListener('pointerleave', () => { codeCard.style.animation = ''; codeCard.style.transform = ''; });
  }
})();
