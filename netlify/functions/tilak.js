/* =========================================================
   Mehmonlar daftari.

   Uch ish qiladi:
     GET    — saytda ko'rsatish uchun barcha tilaklarni beradi
     POST   — yangi tilakni saqlaydi va Telegram'ga yuboradi
     DELETE — kalit bilan bitta tilakni o'chiradi

   Tilaklar Netlify Blobs'da turadi — bu saytning o'z omborxonasi,
   tashqi xizmat ham, alohida hisob ham kerak emas. Brauzer xotirasi
   bunga yaramaydi: u har bir telefonda alohida bo'ladi, ya'ni bir
   odam yozganini boshqasi ko'rmaydi.

   Qiymatlar Netlify panelidagi "Environment variables" bo'limidan
   olinadi:

     TELEGRAM_BOT_TOKEN   — @BotFather bergan token
     TELEGRAM_CHAT_ID     — xabar keladigan chat (siz yoki guruh)
     ADMIN_KALIT          — ixtiyoriy: shu kalit bilan tilak o'chiriladi

   Tokenni hech qachon kod ichiga yozmang va git'ga qo'shmang.
   ========================================================= */

import { getStore } from "@netlify/blobs";

const LIMIT = { ismMin: 2, ismMax: 40, matnMin: 3, matnMax: 400 };
const KALIT = "royxat";        // omborxonadagi yozuvning nomi
const KOP   = 300;             // shundan ortig'i saqlanmaydi

/* Telegram HTML rejimi uchun xavfli belgilarni to'sib qo'yamiz */
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const javob = (code, data) =>
  new Response(JSON.stringify(data), {
    status: code,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

const ombor = () => getStore("tilaklar");

async function royxat() {
  try {
    return (await ombor().get(KALIT, { type: "json" })) || [];
  } catch {
    return [];
  }
}

/* Saytga faqat kerakli maydonlarni beramiz */
const tozala = (t) => ({ id: t.id, ism: t.ism, matn: t.matn, vaqt: t.vaqt });

export default async (req) => {
  const url = new URL(req.url);

  /* ---------- Tilaklarni berish ---------- */
  if (req.method === "GET") {
    const list = await royxat();
    return javob(200, { ok: true, tilaklar: list.map(tozala) });
  }

  /* ---------- Tilakni o'chirish ---------- */
  if (req.method === "DELETE") {
    const ADMIN = process.env.ADMIN_KALIT;
    const kalit = url.searchParams.get("kalit");
    const id    = url.searchParams.get("id");

    if (!ADMIN || kalit !== ADMIN) {
      return javob(403, { ok: false, xato: "Ruxsat yo'q" });
    }

    const list = (await royxat()).filter((t) => t.id !== id);
    await ombor().setJSON(KALIT, list);
    return javob(200, { ok: true, tilaklar: list.map(tozala) });
  }

  if (req.method !== "POST") {
    return javob(405, { ok: false, xato: "Faqat GET, POST yoki DELETE" });
  }

  /* ---------- Yangi tilak ---------- */
  let data;
  try {
    data = await req.json();
  } catch {
    return javob(400, { ok: false, xato: "Noto'g'ri so'rov" });
  }

  // Robotlar uchun yashirin maydon. To'ldirilgan bo'lsa — bu bot.
  // Unga "hammasi joyida" deb javob qaytaramiz, lekin saqlamaymiz.
  if (data.website) return javob(200, { ok: true, tilaklar: [] });

  const ism  = String(data.ism  || "").trim().slice(0, LIMIT.ismMax);
  const matn = String(data.matn || "").trim().slice(0, LIMIT.matnMax);

  if (ism.length < LIMIT.ismMin || matn.length < LIMIT.matnMin) {
    return javob(400, { ok: false, xato: "Ism yoki matn o'lchami noto'g'ri" });
  }

  let list = await royxat();

  // Tugma ikki marta bosilsa yoki so'rov takrorlansa — ikkinchi
  // nusxasini qo'shmaymiz.
  const oxirgi = list[list.length - 1];
  const takror = oxirgi && oxirgi.ism === ism && oxirgi.matn === matn &&
                 Date.now() - oxirgi.vaqt < 60000;

  if (!takror) {
    list.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      ism,
      matn,
      vaqt: Date.now(),
    });
    if (list.length > KOP) list = list.slice(-KOP);

    try {
      await ombor().setJSON(KALIT, list);
    } catch (e) {
      console.error("Saqlab bo'lmadi:", e);
      return javob(500, { ok: false, xato: "Saqlab bo'lmadi" });
    }
  }

  /* ---------- Telegram ---------- */
  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT  = process.env.TELEGRAM_CHAT_ID;

  // Telegram sozlanmagan bo'lsa ham tilak saqlangan va saytda
  // ko'rinadi — butun ishni to'xtatib qo'yish noto'g'ri bo'lardi.
  if (!TOKEN || !CHAT) {
    console.error("TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID sozlanmagan");
    return javob(200, {
      ok: true,
      telegram: false,
      token: Boolean(TOKEN),
      chat: Boolean(CHAT),
      tilaklar: list.map(tozala),
    });
  }

  // Sayt nomi ataylab yozilyapti: bitta botni bir nechta tabriknoma
  // bilan ishlatsangiz, qaysi saytdan kelganini darrov bilasiz.
  const xabar =
    `🎉 <b>Yangi tilak</b> — Ruslan Mavlyanov\n\n` +
    `👤 ${esc(ism)}\n\n` +
    `${esc(matn)}`;

  let yetdi = false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT,
        text: xabar,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    yetdi = res.ok;
    if (!res.ok) console.error("Telegram javobi:", res.status, await res.text());
  } catch (e) {
    console.error("Yuborishda xato:", e);
  }

  return javob(200, { ok: true, telegram: yetdi, tilaklar: list.map(tozala) });
};
