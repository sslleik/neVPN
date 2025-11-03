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

  // 🔹 Тест скорости сети + рикролл
  const speedBtn = document.getElementById("speedTestBtn");
  if (speedBtn) {
    const showToast = (text) => {
      let toast = document.getElementById("speedToast");
      if (!toast) {
        toast = document.createElement("div");
        toast.id = "speedToast";
        toast.style.position = "fixed";
        toast.style.left = "50%";
        toast.style.bottom = "24px";
        toast.style.transform = "translateX(-50%)";
        toast.style.zIndex = "2000";
        toast.style.background = "rgba(0,0,0,0.7)";
        toast.style.color = "#fff";
        toast.style.padding = "10px 14px";
        toast.style.borderRadius = "10px";
        toast.style.backdropFilter = "blur(6px)";
        document.body.appendChild(toast);
      }
      toast.textContent = text;
      toast.style.opacity = "1";
      clearTimeout(toast._h);
      toast._h = setTimeout(() => { toast.style.opacity = "0"; }, 4000);
    };

    const testSpeed = async () => {
      const TEST_URL = "https://speed.hetzner.de/100MB.bin"; // публичный файл для замера
      const controller = new AbortController();
      const timeoutMs = 6000; // ограничим до ~6 секунд
      const start = performance.now();
      let loaded = 0;

      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const resp = await fetch(TEST_URL, { signal: controller.signal, cache: "no-store" });
        if (!resp.ok || !resp.body) throw new Error("Network error");
        const reader = resp.body.getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          loaded += value.byteLength;
          if (loaded > 8 * 1024 * 1024) { // 8MB достаточно
            controller.abort();
          }
        }
      } catch (_) {
        // abort ожидаем
      } finally {
        clearTimeout(timeout);
      }

      const elapsed = (performance.now() - start) / 1000; // сек
      const mbps = (loaded * 8) / (elapsed * 1e6);
      return { mbps };
    };

    speedBtn.addEventListener("click", async () => {
      if (speedBtn.disabled) return;
      const prevText = speedBtn.textContent;
      speedBtn.disabled = true;
      speedBtn.textContent = "Измерение...";
      try {
        const { mbps } = await testSpeed();
        const rounded = Math.max(0, mbps).toFixed(1);
        showToast(`Скорость: ${rounded} Мбит/с`);
        // Рикролл — откроем в новой вкладке
        window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "_blank", "noopener,noreferrer");
      } catch (e) {
        showToast("Не удалось измерить скорость");
        window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "_blank", "noopener,noreferrer");
      } finally {
        speedBtn.textContent = prevText;
        speedBtn.disabled = false;
      }
    });
  }
});
