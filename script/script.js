//--------------------------------------------------------------------------
// Atualiza ano do rodapé
//--------------------------------------------------------------------------
document.getElementById("year").textContent = new Date().getFullYear();

//--------------------------------------------------------------------------
// Scroll suave para âncoras
//--------------------------------------------------------------------------
function smoothScrollTo(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 80;
  window.scrollTo({ top: y, behavior: "smooth" });
}

document.querySelectorAll("[data-scroll]").forEach(function (el) {
  el.addEventListener("click", function (e) {
    e.preventDefault();
    const target = el.getAttribute("data-scroll");
    smoothScrollTo(target);
    // Fecha menu mobile se estiver aberto
    navLinks.classList.remove("open");
  });
});

//--------------------------------------------------------------------------
// Navbar mobile melhorado
//--------------------------------------------------------------------------
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    navToggle.classList.toggle('active');
  });

  // Fecha menu ao clicar em link
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('active');
    });
  });

  // Fecha ao rolar
  window.addEventListener('scroll', () => {
    if (navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      navToggle.classList.remove('active');
    }
  });
}

//--------------------------------------------------------------------------
// Entrada animada do mockup
//--------------------------------------------------------------------------
const heroMedia = document.getElementById("heroMedia");
function animateHero() {
  const rect = heroMedia.getBoundingClientRect();
  const trigger = window.innerHeight * 0.85;
  if (rect.top < trigger) {
    heroMedia.dataset.animate = "in";
    window.removeEventListener("scroll", animateHero);
  }
}
window.addEventListener("scroll", animateHero);
window.addEventListener("load", animateHero);

//--------------------------------------------------------------------------
// Anima feature cards
//--------------------------------------------------------------------------
const featureCards = document.querySelectorAll(".feature-card");
function animateFeatures() {
  const trigger = window.innerHeight * 0.9;
  featureCards.forEach(function (card) {
    if (card.dataset.animate === "in") return;
    const rect = card.getBoundingClientRect();
    if (rect.top < trigger) {
      card.dataset.animate = "in";
    }
  });
}
window.addEventListener("scroll", animateFeatures);
window.addEventListener("load", animateFeatures);


//--------------------------------------------------------------------------
// CARROSSEL CORRIGIDO - LOOP INFINITO
//--------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
  const carousel = document.getElementById('demoCarousel');
  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll('.demo-slide'));
  const prevBtn = document.getElementById('demoPrev');
  const nextBtn = document.getElementById('demoNext');
  const dots = Array.from(document.querySelectorAll('#demoDots .demo-dot'));

  if (!slides.length) return;

  let currentSlide = 0;
  let autoPlay;

  function showSlide(index) {
    if (index < 0) {
      currentSlide = slides.length - 1;
    } else if (index >= slides.length) {
      currentSlide = 0;
    } else {
      currentSlide = index;
    }

    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === currentSlide);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlide);
    });
  }

  function nextSlide() {
    showSlide(currentSlide + 1);
  }

  function prevSlide() {
    showSlide(currentSlide - 1);
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      nextSlide();
      resetAutoPlay();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      prevSlide();
      resetAutoPlay();
    });
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', function () {
      showSlide(index);
      resetAutoPlay();
    });
  });

  function startAutoPlay() {
    autoPlay = setInterval(() => {
      nextSlide();
    }, 5000);
  }

  function stopAutoPlay() {
    clearInterval(autoPlay);
  }

  function resetAutoPlay() {
    stopAutoPlay();
    startAutoPlay();
  }

  carousel.addEventListener('mouseenter', stopAutoPlay);
  carousel.addEventListener('mouseleave', startAutoPlay);

  carousel.addEventListener('touchstart', stopAutoPlay, { passive: true });
  carousel.addEventListener('touchend', startAutoPlay);

  showSlide(0);
  startAutoPlay();
});

//--------------------------------------------------------------------------
// clique na imagem grande abre o modal
//--------------------------------------------------------------------------
slides.forEach(slide => {
  slide.addEventListener("click", function () {
    const img = slide.getAttribute("data-img");
    const title = slide.getAttribute("data-title") || "Tela do sistema";
    const desc = slide.getAttribute("data-desc") || "";
    modalImg.src = img;
    modalTitle.textContent = title;
    modalDesc.textContent = desc;
    modalBackdrop.dataset.open = "true";
  });
});

modalClose.addEventListener("click", function () {
  modalBackdrop.dataset.open = "false";
});

modalBackdrop.addEventListener("click", function (e) {
  if (e.target === modalBackdrop) {
    modalBackdrop.dataset.open = "false";
  }
});

//--------------------------------------------------------------------------
// Envio do formulário via WhatsApp
//--------------------------------------------------------------------------
const leadForm = document.getElementById("leadForm");
const ctaSuccess = document.getElementById("ctaSuccess");

leadForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const nome = document.getElementById("nome").value.trim();
  const whatsapp = document.getElementById("whatsapp").value.trim();
  const tipo = document.getElementById("tipo").value.trim();
  const mensagem = document.getElementById("mensagem").value.trim();

  let texto = "Olá! Tenho interesse em conhecer o Sistema PDV Balcão.%0A%0A";
  if (nome) texto += "*Nome:* " + encodeURIComponent(nome) + "%0A";
  if (whatsapp) texto += "*WhatsApp:* " + encodeURIComponent(whatsapp) + "%0A";
  if (tipo) texto += "*Tipo de comércio:* " + encodeURIComponent(tipo) + "%0A";
  if (mensagem) texto += "%0A*Mensagem:* " + encodeURIComponent(mensagem);

  // Troque pelo seu número com DDI/DDD, exemplo: 5548999999999
  const numeroWhatsApp = "48991358913";
  const url = "https://wa.me/" + 48991358913 + "?text=" + texto;

  window.open(url, "_blank");
  ctaSuccess.style.display = "block";
});

//--------------------------------------------------------------------------
// Simulação simples de atualização no painel de chamados
//--------------------------------------------------------------------------
(function () {
  const btnShuffle = document.getElementById("callsShuffle");
  if (!btnShuffle) return;

  const rows = Array.from(
    document.querySelectorAll("#callsDemo .calls-row:not(.calls-row-head)")
  );

  btnShuffle.addEventListener("click", function () {
    if (rows.length === 0) return;

    // alterna aleatoriamente status entre PRONTO e PREPARANDO
    rows.forEach(function (row) {
      const statusEl = row.querySelector(".badge");
      if (!statusEl) return;

      const isReady = statusEl.classList.contains("badge-ready");
      if (Math.random() > 0.5) {
        // troca
        if (isReady) {
          statusEl.classList.remove("badge-ready");
          statusEl.classList.add("badge-prep");
          statusEl.textContent = "Preparando";
        } else {
          statusEl.classList.remove("badge-prep");
          statusEl.classList.add("badge-ready");
          statusEl.textContent = "Pronto";
        }
      }
    });
  });
})();


//--------------------------------------------------------------------------
// FAQ - abre/fecha perguntas
//--------------------------------------------------------------------------
function toggleFaq(el) {
  // el = botão clicado (this)
  const item = el.closest('.faq-item');
  if (!item) return;

  const isActive = item.classList.contains('active');

  // fecha todos
  document.querySelectorAll('.faq-item').forEach(function (i) {
    i.classList.remove('active');
  });

  // reabre o clicado, se não estava ativo
  if (!isActive) {
    item.classList.add('active');
  }
}

