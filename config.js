require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,

  botName: 'Akatsuki',

  colors: {
    primary: 0xC0392B, // أحمر بستايل Akatsuki
    black: 0x1a1a1a,
    success: 0x2ecc71,
    danger: 0xe74c3c,
    warning: 0xf39c12,
  },

  // ==================== EMOJIS CUSTOM ====================
  // كل الإيموجيات اللي عطيتني - كلها مضافة بأسمائها
  emojis: {
    scales:        '<:5298scales:1526365188591321220>', // Mediator / balance
    ticketRed:     '<:z_RTN_TicketToolRed:1526365130122596463>', // Ticket general
    verify:        '<:verify:1526350044914122794>', // Verification
    shoppingCart:  '<:shoppingcart:1526350086416629870>', // Shop / Buy ticket
    proBot:        '<:probot:1526350020155150406>', // Staff / Apply
    emoji138:      '<:emoji_138:1526365183050514494>', // Report / General use
    e1:            '<:1_:1526753307014463488>',
    e3:            '<:3_:1526753309623582790>',
    e8:            '<:8_:1526753337800790189>',
    layer5:        '<:Layer5:1526753350434160801>',

    // Semantic aliases (used across the bot instead of unicode emojis)
    success:       '<:1_:1526753307014463488>',
    error:         '<:3_:1526753309623582790>',
    warning:       '<:8_:1526753337800790189>',
    lock:          '<:Layer5:1526753350434160801>',
    unlock:        '<:Layer5:1526753350434160801>',
    wave:          '<:1_:1526753307014463488>',
  },

  // ==================== TICKET SYSTEM ====================
  tickets: {
    // Category "fallback" (تستخدم إذا نوع معين ما عنده category خاصة بيه)
    categoryId: process.env.TICKET_CATEGORY_ID,
    staffRoleId: process.env.STAFF_ROLE_ID,
    logChannelId: process.env.TICKET_LOG_CHANNEL_ID,
    // القناة اللي ترسل فيها أخطاء التذاكر (فشل إنشاء قناة، صلاحيات ناقصة...)
    errorLogChannelId: process.env.TICKET_ERROR_LOG_CHANNEL_ID || '1099687466409132032',

    // Kol chi ticket type m3ah: label, description, emoji, image (banner), couleur, category خاصة بيه
    types: {
      buy: {
        id: 'ticket_buy',
        slug: 'buy',
        label: 'تذكرة شراء',
        description: 'لطلبات الشراء والمساعدة في المتجر',
        emoji: '__EMOJI_SHOPPINGCART__', // -> config.emojis.shoppingCart
        color: 0xC0392B,
        // رابط صورة مؤقت (placeholder) - نفس بانر الويلكم، بدلها براحتك بصورة خاصة بتذكرة الشراء
        image: 'https://cdn.discordapp.com/attachments/1524836732187578470/1527087397379244083/preview_3.webp?ex=6a596277&is=6a5810f7&hm=929c0be6c76e723b075f0572cae456682f960d4a0212380d35433491589e11bd',
        welcomeMessage: 'شكراً لك على فتح التذكرة! أحد أعضاء الفريق بيردك أول ما يتوفر. لو سمحت وضح لنا تفاصيل أكثر عن الشي اللي تبي تشتريه (المنتج، السعر، الكمية...).',
        // آيدي category خاصة بهذا النوع (right-click على category -> Copy Category ID)
        categoryId: process.env.TICKET_CATEGORY_BUY_ID || null,
      },
      apply: {
        id: 'ticket_apply',
        slug: 'apply',
        label: 'تذكرة تقديم',
        description: 'للانضمام إلى فريقنا',
        emoji: '__EMOJI_PROBOT__',
        color: 0x9b59b6,
        image: 'https://cdn.discordapp.com/attachments/1524836732187578470/1527087397379244083/preview_3.webp?ex=6a596277&is=6a5810f7&hm=929c0be6c76e723b075f0572cae456682f960d4a0212380d35433491589e11bd',
        welcomeMessage: 'شكراً على اهتمامك بالانضمام لفريقنا! لو سمحت جاوب على الأسئلة التالية:\n**1.** كم عمرك؟\n**2.** من متى وأنت في هذا السيرفر؟\n**3.** ليش تبي تنضم للستاف؟\n**4.** عندك أي خبرة سابقة؟',
        categoryId: process.env.TICKET_CATEGORY_APPLY_ID || null,
      },
      report: {
        id: 'ticket_report',
        slug: 'report',
        label: 'تذكرة إبلاغ',
        description: 'للإبلاغ عن عضو أو مشكلة',
        emoji: '__EMOJI_EMOJI138__',
        color: 0xe67e22,
        image: 'https://cdn.discordapp.com/attachments/1524836732187578470/1527087397379244083/preview_3.webp?ex=6a596277&is=6a5810f7&hm=929c0be6c76e723b075f0572cae456682f960d4a0212380d35433491589e11bd',
        welcomeMessage: 'تم فتح تذكرة الإبلاغ. لو سمحت زودنا بـ: **اسم/آيدي الشخص اللي تبي تبلغ عنه**، **أدلة (سكرين شوت/فيديوهات)**، و**وصف اللي صار**.',
        categoryId: process.env.TICKET_CATEGORY_REPORT_ID || null,
      },
      mediator: {
        id: 'ticket_mediator',
        slug: 'mediator',
        label: 'تذكرة وسيط',
        description: 'لخدمات الوساطة (Middleman)',
        emoji: '__EMOJI_SCALES__',
        color: 0x3498db,
        image: 'https://cdn.discordapp.com/attachments/1524836732187578470/1527087397379244083/preview_3.webp?ex=6a596277&is=6a5810f7&hm=929c0be6c76e723b075f0572cae456682f960d4a0212380d35433491589e11bd',
        welcomeMessage: 'تم فتح تذكرة الوسيط. أحد الوسطاء بيوصلك الحين. لو سمحت وضح أسماء الطرفين والشي اللي بيصير تبادله (قطعة/فلوس).',
        categoryId: process.env.TICKET_CATEGORY_MEDIATOR_ID || null,
      },
    },
  },

  // ==================== WELCOME SYSTEM ====================
  welcome: {
    channelId: process.env.WELCOME_CHANNEL_ID,
    autoroleId: null,
    bannerImage: 'https://cdn.discordapp.com/attachments/1516967113493975110/1527087065232052404/preview_2.webp?ex=6a596228&is=6a5810a8&hm=869f7d9ed233493837bbba2931fd4b69f44b9cb90e494d5421c189c800b27fb7',
    title: 'Bienvenue f Akatsuki!',

    // آيدي السيرفر (يدخل في الروابط تحت) - افتراضيًا ياخذ GUILD_ID
    guildIdForLinks: process.env.GUILD_ID_FOR_LINKS || process.env.GUILD_ID,

    // الرومات المهمة اللي بتبان روابطها في رسالة الترحيب
    // ضع هنا آيدي كل روم (right-click على الروم -> Copy Channel ID)
    importantChannels: {
      infoChannelId: process.env.WELCOME_INFO_CHANNEL_ID || null,
      updatesChannelId: process.env.WELCOME_UPDATES_CHANNEL_ID || null,
      ticketChannelId: process.env.WELCOME_TICKET_CHANNEL_ID || null,
    },
  },

  // ==================== ADS SYSTEM ====================
  ads: {
    channelId: process.env.ADS_CHANNEL_ID,
    managerRoleId: process.env.ADS_MANAGER_ROLE_ID,
    // Category فين كيتخلقو private ads channels (بعد الدفع)
    paidCategoryId: process.env.ADS_PAID_CATEGORY_ID || null,
    signature: 'Signed By Akatsuki Team',
    // السعر الأساسي أول خيار، وكل خيار بعده يزيد 5M (10M, 15M, 20M, 25M, 30M...)
    basePrice: 10,
    priceStepPerOption: 5,
    currencySuffix: 'M',
    options: [
      { id: 'ad_here', label: 'Option 1: @here', description: 'Mention @here Only', mention: 'here', privateRoom: false, giveaway: false, days: 0 },
      { id: 'ad_everyone', label: 'Option 2: @everyone', description: 'Mention @everyone Only', mention: 'everyone', privateRoom: false, giveaway: false, days: 0 },
      { id: 'ad_private_here', label: 'Option 3: Private Room @here', description: 'Private Room With Mention @here', mention: 'here', privateRoom: true, giveaway: false, days: 0 },
      { id: 'ad_private_giveaway', label: 'Option 4: Private Room + Giveaway', description: 'Private Room + Giveaway + @everyone', mention: 'everyone', privateRoom: true, giveaway: true, days: 0 },
      { id: 'ad_first_channel', label: 'Option 5: First Channel @everyone', description: 'First Channel With @everyone (3 Days)', mention: 'everyone', privateRoom: false, giveaway: false, days: 3 },
    ],
    // رابط الـ GIF اللي يتحط فبانل الإعلانات (رفعه فديسكورد وحط الرابط هنا)
    panelGifUrl: 'https://cdn.discordapp.com/attachments/1524836732187578470/1527087263484215396/preview_2.webp?ex=6a596257&is=6a5810d7&hm=8e90daa3045234caae345bd73f572d43b6169078dd03bbd0bc202ade90c81295',
  },

  // ==================== نظام الدفع بالكريدت (ProBot) ====================
  credit: {
    // ID دايم يتحط فـ #credit command (نفس اللي فالصورة: 220410495486787585)
    // هذا الـ ID خاص بحساب/بوت الاقتصاد (ProBot)، ثابت لكل الطلبات
    receiverId: process.env.CREDIT_RECEIVER_ID || '220410495486787585',
    // اسم عملة ProBot اللي تبان فرسائل الدفع
    currencyName: 'ProBot credits',
    // القناة اللي المفروض يتصيفط فيها أمر #credit والبوت يراقبها
    paymentChannelId: process.env.CREDIT_PAYMENT_CHANNEL_ID || null,
    // آيدي بوت ProBot نفسه (right-click على ProBot فالسيرفر -> Copy User ID)
    proBotUserId: process.env.PROBOT_USER_ID || null,
    // بعد كم دقيقة يعتبر العرض منتهي إذا ما تدفعش
    offerExpiryMinutes: 5,
  },

  // ==================== SELLER SHOP SYSTEM ====================
  sellerShop: {
    // رول السيلرز (يقدر يستخدم أوامر خاصة بيهم بحال /line)
    sellerRoleId: process.env.SELLER_ROLE_ID || null,
    // القناة اللي تُنشر فيها تقييمات السيلرز (public) - إذا فارغة كتستعمل publishChannelId
    reviewsChannelId: process.env.SELLER_REVIEWS_CHANNEL_ID || null,
    // القناة اللي ينشر فيها المنتج مباشرة (بلا موافقة) - شوب عام
    publishChannelId: process.env.SELLER_SHOP_CHANNEL_ID || null,
    // رول الأونرز (يشوفو private rooms ديال السيلرز، ويقدرو يستخدمو /line)
    ownerRoleId: process.env.SELLER_OWNER_ROLE_ID || null,
    // Private Room للسيلر (روم خاص بيه بإسمه)
    privateRoom: {
      categoryId: process.env.SELLER_PRIVATE_ROOM_CATEGORY_ID || null,
      price: '20M', // سعر شراء روم خاص
    },
    // بانر/GIF خفيف يتحط فوق كل منتج ينشر فالشوب (نفس فكرة gif ديال الإعلانات)
    publishBannerUrl: null, // <-- ضع هنا رابط الصورة/GIF بعد ما ترفعها
  },

  // ==================== VOICE 24/7 ====================
  voice: {
    channelId: process.env.VOICE_CHANNEL_ID,
    reconnectDelayMs: 5000,
  },

  // ==================== VERIFICATION ====================
  verification: {
    channelId: process.env.VERIFY_CHANNEL_ID,
    verifiedRoleId: process.env.VERIFIED_ROLE_ID,
    unverifiedRoleId: process.env.UNVERIFIED_ROLE_ID || null,
    bannerImage: 'https://cdn.discordapp.com/attachments/1524836732187578470/1527087598047334621/preview_4.webp?ex=6a5962a7&is=6a581127&hm=f1a1b1c0f19dc17048e621e91537dee992f1bfc59244f28342f90405547b19b9',
  },

  // ==================== BROADCAST (Mass DM) ====================
  broadcast: {
    // رول اللي عنده صلاحية يستخدم أمر البرودكاست
    allowedRoleId: process.env.BROADCAST_ROLE_ID || null,
    // تأخير بين كل DM (بالميلي ثانية) - عشان ما يعتبر spam ديسكورد
    delayMs: 1500,
    // القناة اللي يتصيفط فيها تقرير النتيجة (مين وصلته ومين لا)
    reportChannelId: process.env.BROADCAST_REPORT_CHANNEL_ID || null,
  },
};
