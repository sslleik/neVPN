// -----------------------------------
// neVPN — современный интерактивный JS
// -----------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // 🔹 Анимация появления секций
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.15 });

  document.querySelectorAll("section").forEach(sec => observer.observe(sec));

  // 🔹 Счётчики статистики
  const counters = document.querySelectorAll(".stat-number");
  counters.forEach(counter => {
    const update = () => {
      const target = +counter.dataset.target;
      const val = +counter.innerText;
      const step = Math.ceil(target / 50);
      if (val < target) {
        counter.innerText = val + step;
        requestAnimationFrame(update);
      } else {
        counter.innerText = target;
      }
    };
    update();
  });

  // 🔹 Кнопка "вверх"
  const scrollUp = document.querySelector(".scroll-up");
  window.addEventListener("scroll", () => {
    scrollUp.style.display = window.scrollY > 300 ? "grid" : "none";
  });

  // 🔹 Переключение темы с сохранением
  const root = document.documentElement;
  const themeBtn = document.getElementById("themeToggle");
  const THEME_KEY = "nevpn-theme";

  const applyTheme = (mode) => {
    if (mode === "light") {
      root.setAttribute("data-theme", "light");
      if (themeBtn) themeBtn.textContent = "☀️";
    } else {
      root.removeAttribute("data-theme");
      if (themeBtn) themeBtn.textContent = "🌙";
    }
  };

  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") {
    applyTheme(stored);
  } else {
    const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    applyTheme(prefersLight ? "light" : "dark");
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const isLight = root.getAttribute("data-theme") === "light";
      const next = isLight ? "dark" : "light";
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  // 🔹 Мобильное меню
  const menuBtn = document.getElementById("menuToggle");
  const nav = document.querySelector(".nav");
  if (menuBtn && nav) {
    // ARIA: навигации зададим id, если отсутствует
    if (!nav.id) nav.id = "primary-nav";

    menuBtn.addEventListener("click", () => {
      const opened = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(opened));
    });

    // Закрывать меню при клике по ссылке
    nav.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => {
        if (nav.classList.contains("open")) {
          nav.classList.remove("open");
          menuBtn.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  // 🔹 Демонстрационная форма
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", e => {
      e.preventDefault();
      alert("✅ Сообщение отправлено! Мы свяжемся с вами в Telegram.");
      contactForm.reset();
    });
  }
});
