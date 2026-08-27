# Rustam Mavlyanov — tug'ilgan kun sayti

27-avgust 1974. Sof HTML/CSS/JS, hech qanday kutubxona yo'q.

## Kirish qanday ishlaydi

1. `video/kirish.mp4` — 8 soniya, ovozsiz boshlanadi (chap yuqorida
   "Ovoz", o'ngda "O'tkazib yuborish" tugmalari bor):
   kamera suratga yaqinlashadi → surat charm kitobga aylanadi →
   muqovada ism paydo bo'ladi.
2. Video oxirgi kadrida to'xtaydi va uning ustiga `img/cover.jpg`
   chiqadi. Bu rasm — **o'sha videoning aynan oxirgi kadri**, shuning
   uchun almashish ko'zga tashlanmaydi.
3. Muqovadagi yozuv videoning ichida. Sayt ustidan hech narsa
   yozmaydi — aks holda ikkita bo'lib ko'rinardi.
4. **Butun muqova bosiladi** — halqani aniq nishonga olish shart emas.
   Bosilganda sayt ochiladi va musiqa OVOZ BILAN yonadi: brauzerlar
   bosishsiz tovushga ruxsat bermaydi, shu bosish o'sha ruxsatni beradi.

Video yaqinda ko'rilgan bo'lsa (6 soat ichida) qayta ko'rsatilmaydi —
sahifani yangilagan odam 8 soniya kutib o'tirmaydi. 6 soatdan keyin
belgi kuchdan qoladi va kirish yana to'liq ishlaydi.

Avtomatik o'ynash to'silsa (Telegram brauzerida ba'zan bo'ladi)
o'rtada "Boshlash" tugmasi chiqadi — u bosilgani uchun video
o'sha zahoti OVOZI bilan ochiladi.

## Nimani qayerdan o'zgartirasiz

| Nima | Qayerda |
|---|---|
| Ism, familiya, sana, so'z boshi | `js/main.js` — eng yuqoridagi `CONFIG` |
| Suratlar tartibi va izohlari | `js/main.js` — `PHOTOS` ro'yxati |
| Muqovadagi yozuv | videoning ichida — Veo'da qayta chiqariladi |
| Kirish videosi | `video/kirish.mp4` ni almashtiring |
| Yopiq muqova | `img/cover.jpg` ni almashtiring |
| Fon musiqasi | `audio/fon.m4a` ni almashtiring |

Videoni almashtirsangiz, `img/cover.jpg` ni ham yangi videoning
oxirgi kadridan olishingiz kerak — aks holda video tugagan joyda
kadr sakraydi. Bosishni kutayotgan to'lqin halqasining o'rni
`css/style.css` dagi `.cover__pulse` ning `left/top/width` foizlari
bilan rostlanadi.

## Netlify'ga qo'yish

1. Yangi sayt yarating, shu papkani tashlang
2. **Environment variables** ga ikkitasini qo'shing — tilaklar
   Telegram'ga shular orqali keladi:
   - `TELEGRAM_BOT_TOKEN` — @BotFather bergan token
   - `TELEGRAM_CHAT_ID` — xabar keladigan chat
   - `ADMIN_KALIT` — ixtiyoriy, o'zingiz o'ylab topasiz (masalan `rustam2026`)

   Bu qiymatlar hech qachon brauzerga tushmaydi, faqat serverda turadi.
   **O'zgaruvchi qo'shgandan keyin albatta qayta deploy qiling** —
   Netlify ularni allaqachon qurilgan deploy'ga qo'shmaydi.
3. **Sayt manzili ma'lum bo'lgach `index.html` dagi uchta manzilni
   yangilang** — `og:url`, `og:image`, `twitter:image`. Hozir ular
   `https://rustam-tabrik.netlify.app/` deb turibdi. Yangilanmasa
   Telegramdagi havola kartochkasi rasmsiz chiqadi.

## Mehmonlar daftari

Tilaklar **serverda** (Netlify Blobs) saqlanadi, shuning uchun bir
odam yozganini hamma ko'radi — dadangiz ham. Brauzer xotirasi faqat
zaxira: server javob bermasa oxirgi ko'rilgan ro'yxat qolaveradi.

Nomaqbul yozuv chiqib qolsa: manzil oxiriga `?admin=KALIT` qo'shib
oching (`ADMIN_KALIT` da yozgan kalitingiz) — har bir tilak ostida
"O'chirish" tugmasi chiqadi. Kalitning to'g'riligini server tekshiradi,
ya'ni tugmani brauzerda "ochib olib" bo'lmaydi.

## Sinash

```
python -m http.server 5181
```

Telefonda, Telegram ichidagi brauzerda ham albatta sinab ko'ring —
video va ovoz o'sha yerda injiqroq.
