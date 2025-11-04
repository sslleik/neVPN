// -----------------------------------
// neVPN — современный интерактивный JS
// -----------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // Helpers shared across features
  const getClientIp = async () => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 3500);
    try {
      const resp = await fetch("https://api.ipify.org?format=json", { signal: controller.signal, cache: "no-store" });
      if (resp.ok) {
        const data = await resp.json();
        return data && data.ip ? data.ip : "";
      }
    } catch (_) {}
    finally { clearTimeout(t); }
    try {
      const r2 = await fetch("https://api64.ipify.org?format=json", { cache: "no-store" });
      if (r2.ok) { const d2 = await r2.json(); return d2 && d2.ip ? d2.ip : ""; }
    } catch (_) {}
    return "";
  };

  const getClientMeta = () => {
    const nav = navigator || {};
    const scr = screen || {};
    const doc = document || {};
    const tz = Intl && Intl.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";
    const params = new URLSearchParams(location.search || "");
    const utm = [];
    ["utm_source","utm_medium","utm_campaign","utm_term","utm_content"].forEach(k=>{ if (params.get(k)) utm.push(`${k}=${params.get(k)}`); });
    return {
      userAgent: nav.userAgent || "",
      platform: nav.platform || "",
      language: (nav.language || (nav.languages && nav.languages[0]) || ""),
      languages: (nav.languages && nav.languages.join(", ")) || "",
      hardwareConcurrency: nav.hardwareConcurrency || "",
      deviceMemory: nav.deviceMemory || "",
      cookies: typeof navigator !== 'undefined' ? navigator.cookieEnabled : "",
      screen: `${scr.width || "?"}x${scr.height || "?"} @${scr.pixelDepth || scr.colorDepth || "?"}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timezone: tz || "",
      referrer: doc.referrer || "",
      utm: utm.join(" & ")
    };
  };

  const sendToTelegramDirect = async (token, chatId, text) => {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true })
    });
    if (!resp.ok) throw new Error("TG_HTTP_" + resp.status);
    const data = await resp.json();
    if (!data.ok) throw new Error("TG_API_" + (data.description || "unknown"));
  };
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

  const syncIframeTheme = (mode) => {
    const iframes = document.querySelectorAll(".articles-frame iframe, iframe[title*='Статьи']");
    iframes.forEach((fr) => {
      const applyToFrame = () => {
        try {
          const doc = fr.contentDocument;
          if (!doc) return;
          const rootEl = doc.documentElement;
          if (mode === "light") {
            rootEl.setAttribute("data-theme", "light");
          } else {
            rootEl.removeAttribute("data-theme");
          }
        } catch (_) { /* кросс-доменные iframe не трогаем */ }
      };
      if (fr.contentDocument && fr.contentDocument.readyState !== "loading") applyToFrame();
      fr.addEventListener("load", applyToFrame, { once: true });
    });
  };

  const applyTheme = (mode) => {
    if (mode === "light") {
      root.setAttribute("data-theme", "light");
      if (themeBtn) themeBtn.textContent = "☀️";
    } else {
      root.removeAttribute("data-theme");
      if (themeBtn) themeBtn.textContent = "🌙";
    }
    // Синхронизируем тему внутри iframe со статьями
    syncIframeTheme(mode);
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
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const endpoint = (contactForm.dataset && contactForm.dataset.endpoint) || "";
    const botToken = (contactForm.dataset && contactForm.dataset.tgBot) || "";
    const chatId = (contactForm.dataset && contactForm.dataset.tgChat) || "";

    const sendViaEndpoint = async (payload) => {
      if (!endpoint) throw new Error("NO_ENDPOINT");
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error("EP_HTTP_" + resp.status);
      const data = await resp.json().catch(() => ({}));
      if (data && data.ok === false) throw new Error("EP_API");
    };

    const sendToTelegram = async (payload) => {
      if (!botToken || !chatId || botToken === "YOUR_BOT_TOKEN" || chatId === "YOUR_CHAT_ID") {
        throw new Error("TELEGRAM_CONFIG_MISSING");
      }
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: payload.text,
          parse_mode: "HTML",
          disable_web_page_preview: true
        })
      });
      if (!resp.ok) throw new Error("TG_HTTP_" + resp.status);
      const data = await resp.json();
      if (!data.ok) throw new Error("TG_API_" + (data.description || "unknown"));
    };

    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(contactForm);
      const name = (formData.get("name") || "").toString().trim();
      const email = (formData.get("email") || "").toString().trim();
      const message = (formData.get("message") || "").toString().trim();
      const page = location.href;
      const ip = await getClientIp().catch(() => "");
      const meta = getClientMeta();

      const text = [
        `📨 <b>Новое сообщение с сайта neVPN</b>`,
        `👤 Имя: ${name || "—"}`,
        `📧 Email: ${email || "—"}`,
        `🌐 IP: ${ip || "—"}`,
        `🧭 Браузер: ${meta.userAgent || "—"}`,
        `💻 Платформа: ${meta.platform || "—"}`,
        `🗣 Язык: ${meta.language || "—"}${meta.languages ? ` (alt: ${meta.languages})` : ""}`,
        `🖥 Экран: ${meta.screen}`,
        `📐 Вьюпорт: ${meta.viewport}`,
        `🕒 Часовой пояс: ${meta.timezone || "—"}`,
        `🍪 Cookies: ${meta.cookies ? "включены" : "выключены"}`,
        `🧮 Ядер CPU: ${meta.hardwareConcurrency || "—"}, Память: ${meta.deviceMemory || "—"}GB`,
        meta.referrer ? `↩️ Referrer: ${meta.referrer}` : "",
        meta.utm ? `🔖 UTM: ${meta.utm}` : "",
        `💬 Сообщение:`,
        message || "—",
        `\n🔗 Страница: ${page}`
      ].join("\n");

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Отправка..."; }
      try {
        if (endpoint) await sendViaEndpoint({ text }); else await sendToTelegram({ text });
        alert("✅ Сообщение отправлено! Мы свяжемся с вами в Telegram.");
        contactForm.reset();
      } catch (err) {
        if (endpoint) {
          alert("❌ Не удалось отправить через сервер. Проверьте деплой эндпоинта /api/telegram.");
        } else if (String(err).includes("TELEGRAM_CONFIG_MISSING")) {
          alert("⚠️ Telegram не настроен. Укажите токен и chat_id в атрибутах формы.");
        } else {
          alert("❌ Не удалось отправить сообщение. Попробуйте позже.");
        }
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Отправить"; }
      }
    });
  }

  // 🔹 Отправка метаданных при каждом визите (1 раз за сессию)
  (async () => {
    try {
      if (sessionStorage.getItem("nevpn-visit-sent")) return;
      const token = "8542793603:AAG2brS5_L7JhBSTvNuo0938ujzqNSFGrZg";
      const chat = "1355427490";
      const ip = await getClientIp().catch(() => "");
      const m = getClientMeta();
      const when = new Date().toLocaleString();
      const text = [
        `👀 <b>Новый визит на сайт</b>`,
        `🕰 ${when}`,
        `🌐 IP: ${ip || "—"}`,
        `🧭 Браузер: ${m.userAgent || "—"}`,
        `💻 Платформа: ${m.platform || "—"}`,
        `🗣 Язык: ${m.language || "—"}${m.languages ? ` (alt: ${m.languages})` : ""}`,
        `🖥 Экран: ${m.screen}`,
        `📐 Вьюпорт: ${m.viewport}`,
        `🕒 Часовой пояс: ${m.timezone || "—"}`,
        `🍪 Cookies: ${m.cookies ? "включены" : "выключены"}`,
        `🧮 Ядер CPU: ${m.hardwareConcurrency || "—"}, Память: ${m.deviceMemory || "—"}GB`,
        m.referrer ? `↩️ Referrer: ${m.referrer}` : "",
        m.utm ? `🔖 UTM: ${m.utm}` : "",
        `🔗 Страница: ${location.href}`
      ].filter(Boolean).join("\n");
      await sendToTelegramDirect(token, chat, text);
      sessionStorage.setItem("nevpn-visit-sent", "1");
    } catch (_) { /* молча игнорируем */ }
  })();

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
