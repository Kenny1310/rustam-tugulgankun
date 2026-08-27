/* =========================================================
   Ruslan Mavlyanov — tug'ilgan kun sahifasi
   Uslub: kirishda ochilgan kitobning ichi — qog'oz, siyoh, oltin.
   Sof JavaScript, tashqi kutubxonasiz.
   ========================================================= */

/* ---------------------------------------------------------
   SOZLAMALAR — asosan shu blokni tahrirlaysiz
   --------------------------------------------------------- */
const CONFIG = {
  ism: "Ruslan",
  familiya: "Mavlyanov",

  // Tug'ilgan sana. oy: 1 = yanvar, 12 = dekabr
  tugilgan: { kun: 27, oy: 8, yil: 1974 },

  // So'z boshi. *yulduzcha* ichidagi so'zlar yorqin rangda chiqadi.
  lead:
    "Bir jamoaning kuchi rahbarida bo'ladi. Sizning yoningizda ishlash — " +
    "har kuni bir nima *o'rganish* demak. Tug'ilgan kuningiz muborak bo'lsin: " +
    "mustahkam *sog'lik*, tinch kunlar va *biznesingizga omad* tilaymiz.",
};

/* Rasmlar tartibi = galereyadagi tartib.
   Fayllarni `img/` papkasiga shu nomlar bilan soling. */
const PHOTOS = [
  { src: "img/01.jpg", cap: "Katta davra",        tag: "Jamoa",   cls: "shot--a" },
  { src: "img/02.jpg", cap: "Ish kunidan bir on", tag: "Jamoa",   cls: "shot--b" },
  { src: "img/03.jpg", cap: "Yonma-yon",          tag: "Jamoa",   cls: "shot--c" },
  { src: "img/04.jpg", cap: "Bir safda",          tag: "Jamoa",   cls: "shot--d" },
  { src: "img/05.jpg", cap: "Hovlida",            tag: "Jamoa",   cls: "shot--e" },
  { src: "img/06.jpg", cap: "Yig'ilish",          tag: "Mehnat",  cls: "shot--g" },
  { src: "img/07.jpg", cap: "Bayram davrasi",     tag: "Davra",   cls: "shot--f" },
];

const STORE_KEY = "tabrik:ruslan-mavlyanov";
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const OYLAR = ["yanvar","fevral","mart","aprel","may","iyun",
               "iyul","avgust","sentabr","oktabr","noyabr","dekabr"];

/* Sozlamalardan kelib chiqadigan qiymatlar */
const BU_YIL = new Date().getFullYear();
const YOSH   = BU_YIL - CONFIG.tugilgan.yil;            // shu yil to'ladigan yosh
const SANA   = `${CONFIG.tugilgan.kun}-${OYLAR[CONFIG.tugilgan.oy - 1]}`;

/* =========================================================
   Yordamchi
   ========================================================= */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;   // matn har doim textContent orqali — xavfsiz
  return n;
}

/* =========================================================
   1. Kuzatuvchi — ekranga kirgan elementga `is-in` beradi
   ========================================================= */
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    });
  },
  { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
);

/* Zaxira: IntersectionObserver bo'lmasa hamma narsa darrov
   ko'rinadi. Aks holda eski brauzerda sahifa bo'm-bo'sh qolardi. */
const watch = (sel) => {
  const nodes = $$(sel);
  if (!("IntersectionObserver" in window)) {
    nodes.forEach((n) => n.classList.add("is-in"));
    return;
  }
  nodes.forEach((n) => io.observe(n));
};

/* =========================================================
   2. KIRISH — video → kitob yopiladi → muqova → "Oching"

   Bosqichlar:
     a) video ovozsiz o'ynaydi (brauzerlar ovozli avtomatik
        o'ynatishga ruxsat bermaydi — "Ovoz" tugmasi bor)
     b) video o'zining oxirgi kadrida — yozuvli muqovada — to'xtaydi,
        ustiga aynan o'sha kadrdan olingan rasm chiqadi. Video va
        rasm bir xil bo'lgani uchun almashish ko'rinmaydi.
     c) "Oching" bosiladi → sayt ochiladi va musiqa OVOZ BILAN
        yonadi. Ovoz aynan shu bosish tufayli mumkin bo'ladi.
   ========================================================= */

const Intro = (() => {
  const root  = $("#intro");
  const video = $("#introVideo");
  const skip  = $("#introSkip");
  const sound = $("#introSound");
  const open  = $("#coverOpen");
  const start = $("#introStart");

  const SEEN = "ruslan:kirish";
  let atCover = false;
  let entered = false;

  /* Muqova bosqichiga o'tish. Muqova rasmi videoning oxirgi kadri
     bo'lgani uchun bu yerda alohida o'tish animatsiyasi yo'q. */
  function toCover() {
    if (atCover) return;
    atCover = true;

    skip.hidden = true;
    sound.hidden = true;
    start.hidden = true;
    try { video.pause(); } catch {}

    root.classList.add("is-cover");
  }

  /* Kitob ochildi — sayt boshlanadi */
  function enter() {
    if (entered) return;
    entered = true;

    try { sessionStorage.setItem(SEEN, "1"); } catch {}

    root.classList.add("is-gone");
    document.body.classList.remove("is-locked");

    Music.start();     // bosish bo'ldi — endi ovozga ruxsat bor
    playHero();

    setTimeout(() => { root.hidden = true; }, 900);
  }

  function init() {
    open.addEventListener("click", enter);
    skip.addEventListener("click", () => toCover());

    sound.addEventListener("click", () => {
      video.muted = !video.muted;
      sound.classList.toggle("is-on", !video.muted);
      sound.setAttribute("aria-pressed", String(!video.muted));
      if (!video.muted) video.play().catch(() => {});
    });

    // Kirish faqat SHU tab ochiq turganda takrorlanmaydi:
    // sahifani yangilagan odam 14 soniya kutib o'tirmaydi. Havolani
    // qaytadan ochgan har bir odam esa kirishni to'liq ko'radi —
    // kirish saytning eng muhim joyi, uni yashirib qo'yish noto'g'ri.
    // Manzil oxiriga ?kirish qo'shilsa — har doim to'liq ko'rsatiladi.
    const majburiy = /[?&#]kirish/.test(location.href);
    let korilgan = false;
    if (!majburiy) {
      try { korilgan = sessionStorage.getItem(SEEN) === "1"; } catch {}
    }

    if (korilgan || (REDUCED && !majburiy)) { toCover(); return; }

    video.addEventListener("ended", () => toCover());
    video.addEventListener("error", () => toCover());

    // Zaxira taymer: "ended" ba'zi brauzerlarda kelmay qoladi.
    // U faqat video ROSTDAN o'ynayotganda ishga tushadi — aks holda
    // "Boshlash" tugmasini o'qib ulgurmagan odamni muqovaga
    // sudrab ketardi.
    let guard = null;
    const armGuard = () => {
      clearTimeout(guard);
      const qoldi = Math.max(0, (video.duration || 6) - video.currentTime) * 1000 + 900;
      guard = setTimeout(() => toCover(), qoldi);
    };
    video.addEventListener("playing", armGuard);
    video.addEventListener("pause", () => clearTimeout(guard));

    // Video umuman yuklanmasa (sekin internet, buzuq fayl) muqovaga
    // o'tamiz. "Boshlash" chiqib turgan bo'lsa — kutamiz, u yerda
    // qaror odamniki.
    setTimeout(() => {
      if (!atCover && start.hidden && video.paused) toCover();
    }, 8000);

    // Avtomatik o'ynash to'silsa muqovaga sakrab o'tmaymiz —
    // "Boshlash" tugmasini chiqaramiz. Bosish bo'lgani uchun
    // video hatto OVOZI bilan ochiladi, ya'ni yomon holat
    // yaxshisiga aylanadi.
    start.addEventListener("click", () => {
      start.hidden = true;
      video.muted = false;
      sound.classList.add("is-on");
      sound.setAttribute("aria-pressed", "true");
      video.play().catch(() => { video.muted = true; video.play().catch(() => toCover()); });
    });

    const p = video.play();
    if (p && p.catch) {
      p.catch(() => { if (!atCover) start.hidden = false; });
    }

    setTimeout(() => {
      if (atCover) return;
      skip.hidden = false;
      sound.hidden = false;
    }, 1000);
  }

  return { init };
})();

/* =========================================================
   3. Hero — sarlavhani harflarga bo'lish
   ========================================================= */
function buildTitle() {
  let n = 0;
  $$("#heroTitle .mask").forEach((mask) => {
    const word = mask.dataset.word || "";
    [...word].forEach((c) => {
      const s = el("span", c === " " ? "ch ch--space" : "ch", c === " " ? " " : c);
      s.style.transitionDelay = (n++ * 0.045).toFixed(3) + "s";
      mask.appendChild(s);
    });
  });
}

function playHero() {
  $("#titul").classList.add("is-in");
  $$("#heroTitle .ch").forEach((c) => (c.style.transform = "none"));
}

/* =========================================================
   4. So'z boshi — so'zlab chiqadi
   ========================================================= */
function buildLead() {
  const box = $("#lead");
  // *yulduzcha* ichidagilar — yorqin
  CONFIG.lead.split(/\s+/).forEach((raw, i) => {
    const hi = raw.startsWith("*") || raw.endsWith("*") || /\*/.test(raw);
    const word = raw.replace(/\*/g, "");
    const s = el("span", hi ? "w w--hi" : "w", word);
    s.style.transitionDelay = (i * 0.028).toFixed(3) + "s";
    box.append(s, document.createTextNode(" "));
  });

  // Ko'ringanda so'zlar navbat bilan chiqsin
  new IntersectionObserver((entries, obs) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      $$(".w", box).forEach((w) => w.classList.add("is-in"));
      obs.disconnect();
    });
  }, { threshold: 0.25 }).observe(box);
}

/* =========================================================
   4b. Raqamlar: yosh, yashab o'tilgan kunlar, tug'ilgan yil
   ========================================================= */

/* 14245 → "14 245" (ingichka bo'shliq bilan) */
const raqam = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009");

/* Tug'ilgan kundan bugungacha necha kun o'tgani */
function yashagan() {
  const t = CONFIG.tugilgan;
  const boshi = new Date(t.yil, t.oy - 1, t.kun);
  return Math.max(0, Math.floor((Date.now() - boshi) / 86400000));
}

function countTo(node, to, dur, fmt) {
  if (REDUCED) { node.textContent = fmt(to); return; }

  const start = performance.now();
  (function tick(now) {
    const t = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    node.textContent = fmt(Math.round(to * eased));
    if (t < 1) requestAnimationFrame(tick);
  })(start);

  // Sahifa fonda bo'lsa rAF to'xtaydi — raqam yarim yo'lda qolmasin
  setTimeout(() => { node.textContent = fmt(to); }, dur + 1500);
}

function initFacts() {
  new IntersectionObserver((entries, obs) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countTo($("#factYears"), YOSH, 1200, String);
      countTo($("#factDays"),  yashagan(), 1900, raqam);
      countTo($("#factFrom"),  CONFIG.tugilgan.yil, 1600, String);
      obs.disconnect();
    });
  }, { threshold: 0.4 }).observe($("#raqamlar"));
}

/* =========================================================
   6. Galereya
   ========================================================= */
/* Ochila olgan rasmlar. Lightbox faqat shular bo'ylab yuradi —
   fayl hali qo'yilmagan katak o'tkazib yuboriladi. */
const ok = new Set();
const visiblePhotos = () => PHOTOS.filter((_, i) => ok.has(i));

function buildGallery() {
  const grid = $("#grid");

  PHOTOS.forEach((p, i) => {
    const fig   = el("figure", "shot " + p.cls);
    const frame = el("div", "shot__frame");
    frame.dataset.file = p.src;

    const img = el("img");
    img.src = p.src;
    img.alt = p.cap;
    img.loading = i < 2 ? "eager" : "lazy";
    img.decoding = "async";

    img.addEventListener("load", () => {
      ok.add(i);
      frame.addEventListener("click", () => Lightbox.open(i));
    });
    img.addEventListener("error", () => {
      frame.classList.add("is-empty");
      img.remove();
    });

    const cap = el("figcaption");
    cap.append(el("span", null, p.cap), el("b", null, p.tag));

    frame.append(img);
    fig.append(frame, cap);
    grid.append(fig);
  });

  watch(".shot");
}

/* =========================================================
   7. Lightbox
   ========================================================= */
const Lightbox = (() => {
  const box  = $("#lightbox");
  const img  = $("#lbImg");
  const cap  = $("#lbCap");
  let list = [];
  let i = 0;

  function show(n) {
    if (!list.length) return;
    i = (n + list.length) % list.length;
    const p = list[i];
    img.src = p.src;
    img.alt = p.cap;
    cap.textContent = `${p.cap} — ${p.tag}`;
  }

  /** photoIdx — PHOTOS massividagi o'rin */
  function open(photoIdx) {
    list = visiblePhotos();
    const n = list.findIndex((p) => p.src === PHOTOS[photoIdx].src);
    if (n < 0) return;

    show(n);
    box.hidden = false;
    requestAnimationFrame(() => box.classList.add("is-open"));
    document.body.classList.add("is-locked");
  }

  function close() {
    box.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    setTimeout(() => { box.hidden = true; }, 420);
  }

  $("#lbClose").addEventListener("click", close);
  $("#lbPrev").addEventListener("click", () => show(i - 1));
  $("#lbNext").addEventListener("click", () => show(i + 1));
  box.addEventListener("click", (e) => { if (e.target === box) close(); });

  document.addEventListener("keydown", (e) => {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(i - 1);
    if (e.key === "ArrowRight") show(i + 1);
  });

  return { open };
})();

/* =========================================================
   8. Mehmonlar daftari

   Tilaklar serverda (Netlify Blobs) turadi — shuning uchun bir
   odam yozganini hamma ko'radi. Brauzer xotirasi faqat zaxira:
   server javob bermasa oxirgi ko'rilgan ro'yxat qolaveradi.
   ========================================================= */
const API = "/.netlify/functions/tilak";

const Wishes = (() => {
  const box   = $("#wishes");
  const count = $("#wishCount");

  // Manzilga ?admin=... qo'shilsa har bir tilak ostida o'chirish
  // tugmasi chiqadi. Kalitning to'g'riligini server tekshiradi.
  const ADMIN = new URLSearchParams(location.search).get("admin");

  function sana(ts) {
    const d = new Date(ts);
    return `${d.getDate()}-${OYLAR[d.getMonth()]}`;
  }

  function node(w, delay = 0) {
    const item = el("article", "wish");
    item.style.animationDelay = delay + "s";

    const who = el("div", "wish__who", w.ism);
    who.append(el("span", "wish__when", sana(w.vaqt)));

    item.append(who, el("p", "wish__text", w.matn));

    if (ADMIN && w.id) {
      const btn = el("button", "wish__del", "O'chirish");
      btn.type = "button";
      btn.addEventListener("click", () => ochir(w.id, btn));
      item.append(btn);
    }
    return item;
  }

  function render(list) {
    const arr = Array.isArray(list) ? list : [];
    box.textContent = "";

    count.textContent = arr.length
      ? `${arr.length} kishi tabrikladi`
      : "Hali hech kim yozmagan — birinchi bo'ling";

    // Eng yangisi tepada
    arr.slice().reverse().forEach((w, i) => box.append(node(w, Math.min(i, 8) * 0.06)));
    saqla(arr);
  }

  const saqla = (list) => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch {}
  };
  const zaxira = () => {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
    catch { return []; }
  };

  /** Sahifa ochilganda serverdan olib keladi */
  async function load() {
    render(zaxira());                 // avval oxirgi ko'rilganini ko'rsatamiz
    try {
      const res = await fetch(API, { headers: { Accept: "application/json" } });
      if (!res.ok) return;
      const data = await res.json();
      if (data && Array.isArray(data.tilaklar)) render(data.tilaklar);
    } catch {
      /* sayt lokal ochilgan — funksiya yo'q, zaxira qolaveradi */
    }
  }

  async function ochir(id, btn) {
    btn.disabled = true;
    try {
      const res = await fetch(
        `${API}?id=${encodeURIComponent(id)}&kalit=${encodeURIComponent(ADMIN)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data && data.ok) { render(data.tilaklar); return; }
    } catch {}
    btn.disabled = false;
    btn.textContent = "O'chmadi";
  }

  /** Server ishlamasa tilak hech bo'lmasa shu telefonda ko'rinsin */
  function localAdd(ism, matn) {
    const list = zaxira();
    list.push({ id: "local-" + Date.now(), ism, matn, vaqt: Date.now() });
    render(list);
  }

  return { render, load, localAdd };
})();

/* =========================================================
   9. Forma
   ========================================================= */
/** Tilakni serverdagi funksiyaga uzatamiz, u Telegram'ga yuboradi.
    Sayt lokal ochilgan bo'lsa funksiya yo'q — shunda ham xato chiqmaydi,
    tilak baribir sahifada ko'rinadi. */
async function yubor(ism, matn, hp) {
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ism, matn, website: hp }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;                 // lokal ochilgan yoki internet yo'q
  }
}

function initForm() {
  const form  = $("#wishForm");
  const name  = $("#fName");
  const text  = $("#fText");
  const count = $("#charCount");
  const btn   = $("#submitBtn");
  const btnTx = $("#submitText");
  const note  = $("#formNote");
  const hp    = $("#fSite");

  text.addEventListener("input", () => { count.textContent = text.value.length; });

  const markError = (input, bad) =>
    input.closest(".field").classList.toggle("is-error", bad);

  [name, text].forEach((inp) =>
    inp.addEventListener("input", () => markError(inp, false))
  );

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const ism  = name.value.trim();
    const matn = text.value.trim();
    const hpVal = hp.value;

    markError(name, ism.length < 2);
    markError(text, matn.length < 3);
    if (ism.length < 2 || matn.length < 3) return;

    btn.disabled = true;
    btnTx.textContent = "Yuborilmoqda";
    note.className = "form__note is-in";
    note.textContent = "Yozilmoqda...";

    const javob = await yubor(ism, matn, hpVal);
    const yetdi = Boolean(javob && javob.ok);

    if (yetdi) Wishes.render(javob.tilaklar);
    else       Wishes.localAdd(ism, matn);   // hech bo'lmasa shu telefonda

    form.reset();
    count.textContent = "0";
    btn.disabled = false;
    btnTx.textContent = "Daftarga yozish";

    note.className = "form__note is-in " + (yetdi ? "is-ok" : "is-warn");
    note.textContent = yetdi
      ? "Rahmat! Yozganingiz daftarda turibdi."
      : "Yozganingiz shu telefonda saqlandi (serverga yetmadi).";

    const birinchi = $("#wishes").firstElementChild;
    if (birinchi) {
      birinchi.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "center" });
    }
  });
}

/* =========================================================
   10. Scroll chizig'i va hero yorug'ligi
   ========================================================= */
function initScrollBits() {
  const bar = $("#progress");
  let ticking = false;

  addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.body.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      ticking = false;
    });
  }, { passive: true });
}

/* =========================================================
   10b. Musiqa
   Brauzerlar tovushni o'z-o'zidan yoqishga ruxsat bermaydi —
   shuning uchun birinchi bosishdan keyin yumshoq kirib keladi.
   ========================================================= */
const Music = (() => {
  const audio = $("#track");
  const btn   = $("#musicBtn");
  const MAX   = 0.32;          // to'liq ovoz emas — fon uchun yetarli
  let fadeId  = null;
  let stopId  = null;
  let yoqilgan = false;        // foydalanuvchi musiqani xohlaydimi

  if (!audio || !btn) return { init() {}, start() {} };

  audio.volume = 0;

  /* Ovozni sekin ko'tarish/tushirish */
  function fade(to, dur = 900, keyin) {
    cancelAnimationFrame(fadeId);
    const from = audio.volume;
    const start = performance.now();

    (function tick(now) {
      const t = Math.min((now - start) / dur, 1);
      audio.volume = Math.max(0, Math.min(1, from + (to - from) * t));
      if (t < 1) fadeId = requestAnimationFrame(tick);
      else if (keyin) keyin();
    })(start);
  }

  async function play() {
    try {
      await audio.play();
    } catch {
      return false;             // brauzer ruxsat bermadi
    }
    yoqilgan = true;
    clearTimeout(stopId);
    btn.setAttribute("aria-pressed", "true");
    btn.setAttribute("aria-label", "Musiqani o'chirish");
    btn.classList.remove("is-hint");

    fade(MAX);
    // Zaxira: sahifa fonda bo'lsa requestAnimationFrame muzlaydi va
    // ovoz 0 da qolib ketadi. setTimeout esa ishlayveradi.
    setTimeout(() => { if (yoqilgan && audio.volume < MAX) audio.volume = MAX; }, 1200);

    return true;
  }

  function pause() {
    yoqilgan = false;
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", "Musiqani yoqish");

    fade(0, 450);
    // To'xtatishni fade'ning tugashiga bog'lamaymiz: fonda u tugamasligi
    // mumkin va musiqa jimgina chalinaverar edi.
    clearTimeout(stopId);
    stopId = setTimeout(() => { audio.pause(); audio.volume = 0; }, 480);
  }

  const toggle = () => (audio.paused ? play() : pause());

  function init() {
    // Fayl bor va o'qildi — tugmani ko'rsatamiz
    audio.addEventListener("loadedmetadata", () => {
      btn.hidden = false;
      btn.classList.add("is-hint");
    });

    // Fayl yo'q yoki buzuq — tugma ko'rinmaydi, sayt bemalol ishlayveradi
    audio.addEventListener("error", () => { btn.hidden = true; });

    btn.addEventListener("click", toggle);

    // Musiqani kitob ochilganda Intro boshlaydi — shuning uchun
    // bu yerda "birinchi bosishda o'zi yonsin" degan qoida yo'q.

    // Boshqa ilovaga o'tilsa — pauza, qaytilsa davom etadi.
    // Bu yerda audio.paused ga qaramaymiz: pauza o'zimiz qo'ygan bo'lishi
    // mumkin, shunda qaytganda musiqa boshlanmay qolardi.
    document.addEventListener("visibilitychange", () => {
      if (!yoqilgan) return;
      if (document.hidden) audio.pause();
      else audio.play().catch(() => {});
    });
  }

  return { init, start: play };
})();

/* =========================================================
   11. Ishga tushirish
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("is-locked");

  // Matnlarni sozlamalardan joylaymiz
  $$("#heroTitle .mask")[0].dataset.word = CONFIG.ism;
  $$("#heroTitle .mask")[1].dataset.word = CONFIG.familiya;

  $("#heroTitle").setAttribute("aria-label", `${CONFIG.ism} ${CONFIG.familiya}`);
  $("#heroDate").textContent   = `${SANA} ${CONFIG.tugilgan.yil}`;
  $("#heroAge").textContent    = `${YOSH} yosh`;
  $("#footerYear").textContent = BU_YIL;
  document.title = `${CONFIG.ism} ${CONFIG.familiya} — Tug'ilgan kun`;

  buildTitle();
  buildLead();
  buildGallery();
  initFacts();
  Wishes.load();
  initForm();
  initScrollBits();
  Music.init();

  watch("[data-reveal]");

  Intro.init();
});
