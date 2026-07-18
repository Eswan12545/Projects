# 🤖 Akatsuki — بوت ديسكورد (تذاكر / إعلانات / ترحيب / تحقق)

بوت متكامل مبني بـ Discord.js v14، تخزين JSON، فويس 24/7، إحصائيات تذاكر، نظام إعلانات، نظام ترحيب، ونظام تحقق.

---

## 📁 هيكلة المشروع

```
akatsuki-bot/
├── index.js                 # نقطة البداية
├── deploy-commands.js        # سكربت يرسل الأوامر السلاشية لديسكورد
├── config.js                 # كل الإعدادات (الإيموجيات، أنواع التذاكر، خيارات الإعلانات...)
├── .env.example               # نموذج متغيرات البيئة
├── package.json
├── commands/                  # أوامر السلاش (/setup-tickets, /setup-ads...)
├── events/                    # معالجات الأحداث (ready, interactionCreate...)
├── utils/                     # المنطق الأساسي (ticketManager, voiceManager...)
└── data/                      # قاعدة بيانات JSON (tickets.json, verified.json)
```

---

## 🚀 التثبيت (خطوة بخطوة)

### 1. انسخ المشروع
انسخ كل الملفات لسيرفرك (VPS، Replit، Railway، أو جهازك).

### 2. تثبيت المكتبات
```bash
npm install
```

### 3. سوي بوت في Discord Developer Portal
1. روح لـ https://discord.com/developers/applications
2. **New Application** → سميه "Akatsuki"
3. قسم **Bot** → **Add Bot** → انسخ **TOKEN** (بتحتاجه في `.env`)
4. في قسم **Bot**، فعّل:
   - `SERVER MEMBERS INTENT` ✅
   - `MESSAGE CONTENT INTENT` ✅
   - `PRESENCE INTENT` ✅ (اختياري)
5. قسم **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Permissions: `Administrator` (أو يدويًا: Manage Channels, Manage Roles, Send Messages, Embed Links, Attach Files, Connect, Speak, Manage Messages)
6. انسخ الرابط وأضف البوت لسيرفرك.

### 4. الإعدادات
انسخ `.env.example` إلى `.env` وعبّي البيانات:

```bash
cp .env.example .env
```

عبّي:
- `DISCORD_TOKEN` — توكن البوت (خطوة 3)
- `CLIENT_ID` — Application ID (موجود في General Information)
- `GUILD_ID` — آيدي سيرفرك (فعّل Developer Mode من Discord Settings → Advanced، وبعدين right-click على السيرفر → Copy Server ID)
- بقية الـ IDs (الأقسام، الرومات، الرولات) — انسخها بنفس الطريقة (right-click → Copy ID)

### 5. رفع أوامر السلاش
```bash
node deploy-commands.js
```

### 6. تشغيل البوت
```bash
node index.js
```

أو بـ `pm2` عشان يشتغل 24/7:
```bash
npm install -g pm2
pm2 start index.js --name akatsuki
pm2 save
```

---

## ⚙️ كيف تشتغل كل الأنظمة

### 🎫 1. نظام التذاكر
- استخدم `/setup-tickets` في القناة اللي تبيها (نفس الصورة 2)
- العضو يختار من القائمة → البوت يسوي له قناة خاصة
- **كل نوع تذكرة له category خاصة بيه** (اختياري) — اضبطها في `.env`:
  ```
  TICKET_CATEGORY_BUY_ID=
  TICKET_CATEGORY_APPLY_ID=
  TICKET_CATEGORY_REPORT_ID=
  TICKET_CATEGORY_MEDIATOR_ID=
  ```
  إذا ما ضبطتها، البوت يرجع تلقائيًا لـ `TICKET_CATEGORY_ID` (category عامة واحدة)
- كل نوع (شراء/تقديم/إبلاغ/وسيط) له **صورة/بانر خاص فيه** — ضبطها في `config.js` → `tickets.types.<type>.image` (حط رابط الصورة). حاليًا كلها متوجهة لنفس صورة الويلكم كـ placeholder مؤقت شغال، بدّلها براحتك بصور خاصة لكل نوع
- الأزرار: **استلام** (للستاف فقط) و **إغلاق التذكرة** (فيه تأكيد قبل ما تنسكر)
- كل تذكرة تنسجل تلقائيًا في `data/tickets.json`

### 👋 2. نظام الترحيب
- كل عضو جديد يدخل → رسالة ترحيب ترسل في `WELCOME_CHANNEL_ID` مع بانر السيرفر
- البانر مربوط حاليًا برابط الصورة اللي عطيتني
- روابط الرومات المهمة (معلومات، تحديثات، تذكرة الطلب) تنضبط عبر:
  ```
  WELCOME_INFO_CHANNEL_ID=
  WELCOME_UPDATES_CHANNEL_ID=
  WELCOME_TICKET_CHANNEL_ID=
  ```
- تجربة يدوية: `/test-welcome`

### 📣 3. نظام الإعلانات (مع تأكيد دفع يدوي)
- استخدم `/setup-ads` في قناة الإعلانات (نفس الصورة 3/4)
- **نظام السعر تلقائي**: الخيار الأول = `basePrice` (افتراضيًا 10M)، وكل خيار بعده يزيد `priceStepPerOption` (افتراضيًا +5M) → يعطي: 10M, 15M, 20M, 25M, 30M
  تقدر تغيّر الأرقام من `config.js` → `ads.basePrice` و `ads.priceStepPerOption`
- العضو يختار خيار → يعبي فورم (اسم السيرفر، الوصف، رابط الدعوة، GIF)
- **الطلب ما ينشر مباشرة** — يروح لقناة الستاف كـ "بانتظار تأكيد الدفع" مع زرين: **تأكيد الدفع** و **رفض**
  ⚠️ لازم الستاف يتأكد يدويًا إن الفلوس وصلت فعليًا (البوت ما يقدر يتحقق من اقتصاد اللعبة تلقائيًا) قبل الضغط على تأكيد
- بعد التأكيد: البوت ينشر الإعلان في `ADS_CHANNEL_ID` مع المنشن المناسب (@here/@everyone)
- إذا الخيار فيه **Private Room**: البوت يسوي روم خاص تلقائيًا بإسم المشتري في `ADS_PAID_CATEGORY_ID`

### 🛍️ 4. نظام متجر البائعين (Seller Shop)
- أي عضو يقدر يستخدم `/sell` → يفتح فورم (اسم المنتج، الوصف، السعر، صورة اختيارية)
- المنتج يروح لقناة `SELLER_APPROVAL_CHANNEL_ID` مع زرين **موافقة** و **رفض** — بس رول `SELLER_OWNER_ROLE_ID` (الأونرز) يقدر يستخدمهم
- بعد الموافقة، المنتج ينشر تلقائيًا في `SELLER_SHOP_CHANNEL_ID` (الشوب العام)
- **روم خاص للبائع**: استخدم `/buy-private-room` → يرسل طلب للأونرز → بعد تأكيد الدفع يتصنع روم خاص بإسم البائع في `SELLER_PRIVATE_ROOM_CATEGORY_ID`
  السعر الافتراضي: `config.js` → `sellerShop.privateRoom.price` (20M)

### 🔐 5. أداة التشفير (Encrypt/Decrypt)
- `/encrypt text:<النص> method:<caesar|base64>` — يشفر أي نص
- `/decrypt text:<النص المشفر> method:<caesar|base64>` — يفك التشفير
- Caesar cipher الافتراضي بإزاحة 5 حروف (تقدر تغيّرها من `config.js` → `encryptTool.caesarShift`)
- الردود دايمًا ephemeral (بس اللي كتب الأمر يشوفها)

### 📊 6. إحصائيات التذاكر (نفس الصورة 1)
- استخدم `/setup-stats` في قناة الإحصائيات
- يظهر: إجمالي/مفتوحة/مغلقة، تذاكر اليوم، تذاكر الأسبوع، متوسط وقت الرد، متوسط المدة، آخر تذكرة، وقت الذروة، **أفضل 3 من الستاف**
- يتحدث تلقائيًا كل دقيقة (تقدر تغيّر المدة من `config.js` → `analytics.updateIntervalMs`)
- إحصائيات الستاف تُحسب من حقل `claimedBy` (اللي استلم أو سكر التذكرة)
- يشتغل عادي مع التذاكر اللي عندها categories منفصلة (الإحصائيات ما تعتمد على الـ category، تعتمد على بيانات `tickets.json`)

### 🔊 7. فويس 24/7
- البوت يدخل روم `VOICE_CHANNEL_ID` بمجرد ما يشتغل ويضل فيه 24/7
- يعيد الاتصال تلقائيًا لو انقطع
- تفعيل يدوي: `/joinvoice`

### ✅ 8. نظام التحقق
- استخدم `/setup-verification` في قناة التحقق
- العضو يضغط على زر "تحقق الآن" → يتزاد له `VERIFIED_ROLE_ID` وينشال منه `UNVERIFIED_ROLE_ID` (إذا موجود)
- الأعضاء الجدد يتزاد لهم `UNVERIFIED_ROLE_ID` تلقائيًا من نظام الترحيب

### 🎨 9. الإيموجيات المخصصة
كل الإيموجيات اللي عطيتني مضافة في `config.js` → `emojis`:
```js
scales, ticketRed, verify, shoppingCart, proBot, emoji138
```
إذا تبي تغيّر/تضيف إيموجي جديد، زوده في `config.js` واستخدمه في الملف اللي تبي (ticketPanel.js، verificationManager.js، إلخ)

---

## 🗄️ قاعدة البيانات (ملفات JSON)

كل شي مخزن في `data/`:
- `tickets.json` — كل التذاكر (مفتوحة/مغلقة)، إحصائيات الستاف، عداد التذاكر
- `verified.json` — قائمة الأعضاء المتحققين
- `statsMessages.json` — يتولد تلقائيًا، يحفظ مرجع رسالة الإحصائيات عشان تتحدث

**ملاحظة:** ملفات JSON مو مثالية لحركة عالية جدًا (كتابة متزامنة)، لكن تكفي للاستخدام العادي.

---

## 🛠️ الأماكن اللي تحتاج تعبيها

| الملف | المتغير | الوصف |
|---|---|---|
| `config.js` | `tickets.types.buy.image` | صورة تذكرة الشراء |
| `config.js` | `tickets.types.apply.image` | صورة تذكرة التقديم |
| `config.js` | `tickets.types.report.image` | صورة تذكرة الإبلاغ |
| `config.js` | `tickets.types.mediator.image` | صورة تذكرة الوسيط |
| `config.js` | `welcome.bannerImage` | بانر السيرفر (ترحيب + بانل التذاكر) |
| `.env` | كل الـ `*_ID` | آيدي رومات ورولات سيرفرك |

---

## 📝 أوامر السلاش

| الأمر | الوصف |
|---|---|
| `/setup-tickets` | ينشر بانل التذاكر |
| `/setup-ads` | ينشر بانل الإعلانات |
| `/setup-verification` | ينشر بانل التحقق |
| `/setup-stats` | ينشر بانل الإحصائيات (يتحدث تلقائيًا) |
| `/test-welcome` | يجرب رسالة الترحيب |
| `/joinvoice` | يجبر البوت يدخل الفويس 24/7 |
| `/sell` | يقدم منتج جديد للموافقة (سيلر) |
| `/buy-private-room` | يطلب شراء روم خاص بإسمك |
| `/encrypt` | يشفر نص (Caesar أو Base64) |
| `/decrypt` | يفك تشفير نص (Caesar أو Base64) |

---

## ❓ مشاكل شائعة

- **الأوامر السلاشية ما تبان**: شغّل `node deploy-commands.js` مرة ثانية، وتأكد `CLIENT_ID`/`GUILD_ID` مضبوطين في `.env`
- **البوت ما عنده صلاحية يسوي قنوات**: تأكد عنده رول فيه `Manage Channels` ومرتب فوق قسم التذاكر
- **الإيموجيات ما تبان**: هذي الإيموجيات لازم تكون مرفوعة في سيرفرك بنفس الـ IDs اللي في config، أو بدّلها بـ IDs جديدة
- **الفويس ما يدخل**: تأكد البوت عنده صلاحية `Connect` و `Speak` في روم الفويس
