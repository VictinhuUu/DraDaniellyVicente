/* ===========================================================
   DRA. DANIELLY VICENTE — SCRIPT.JS
   ===========================================================
   1. Loader inicial
   2. Header com efeito de rolagem
   3. Menu mobile (hambúrguer)
   4. Rolagem suave + link ativo no menu
   5. Animação "reveal" ao rolar a página
   6. Ano automático no rodapé
   =========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* =========================================================
     1. LOADER INICIAL
     Esconde o loader assim que a página termina de carregar.
     ========================================================= */
  const loader = document.getElementById('loader');
  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('loader-hidden');
    }, 350);
  });
  // Segurança: caso o evento "load" demore, esconde após 2.5s
  setTimeout(() => loader && loader.classList.add('loader-hidden'), 2500);


  /* =========================================================
     2. HEADER — muda o fundo ao rolar a página
     ========================================================= */
  const header = document.getElementById('siteHeader');
  const onScrollHeader = () => {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader);


  /* =========================================================
     3. MENU MOBILE (HAMBÚRGUER)
     ========================================================= */
  const hamburger = document.getElementById('hamburger');
  const mainNav = document.getElementById('mainNav');

  function closeMenu() {
    hamburger.classList.remove('active');
    mainNav.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function toggleMenu() {
    const isOpen = mainNav.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  hamburger.addEventListener('click', toggleMenu);

  // Fecha o menu mobile ao clicar em qualquer link
  document.querySelectorAll('.nav-link, .btn-nav-cta').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Fecha o menu ao apertar ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });


  /* =========================================================
     4. LINK ATIVO NO MENU CONFORME A SEÇÃO VISÍVEL
     ========================================================= */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, {
    rootMargin: '-45% 0px -45% 0px',
    threshold: 0
  });

  sections.forEach(section => sectionObserver.observe(section));


  /* =========================================================
     5. ANIMAÇÃO "REVEAL" AO ROLAR A PÁGINA
     Qualquer elemento com atributo data-reveal aparece
     suavemente quando entra na tela.
     ========================================================= */
  const revealElements = document.querySelectorAll('[data-reveal]');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -60px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));


  /* =========================================================
     6. ANO AUTOMÁTICO NO RODAPÉ
     ========================================================= */
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

});
