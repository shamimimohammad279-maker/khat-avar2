const ACTIONS = {
  normalize: 'متن فارسی را پاکسازی و استاندارد کن. معنی، لحن و محتوای اصلی را حفظ کن. فقط نسخه نهایی متن را برگردان.',
  improve: 'متن را برای استفاده در یک اثر تایپوگرافی فارسی بهبود بده. کوتاه، خوش‌خوان، طبیعی و مناسب ترکیب بصری باشد. فقط نسخه نهایی را برگردان.',
  shorten: 'متن را تا حد ممکن کوتاه کن، بدون اینکه پیام اصلی از بین برود. فقط نسخه نهایی را برگردان.',
  variants: 'سه نسخه متفاوت و کوتاه برای استفاده در تایپوگرافی پیشنهاد بده. هر نسخه در یک خط جدا باشد و هیچ توضیح اضافه‌ای نده.',
  analyze: 'متن را از نظر طول، ریتم، خوانایی، شکست سطر، لحن و مناسب‌بودن برای تایپوگرافی فارسی تحلیل کن. چند پیشنهاد عملی و کوتاه بده.'
};

const SYSTEM = `تو دستیار هوشمند تایپوگرافی فارسی در نرم‌افزار خط‌آور هستی.
روی کیفیت متن فارسی، خوانایی، ایجاز، ریتم بصری و مناسب‌بودن متن برای طراحی تمرکز کن.
به درخواست کاربر وفادار باش و از اضافه‌گویی پرهیز کن.
اگر متن مناسب است، بی‌دلیل تغییرش نده.`;

export async function onRequestPost(context) {
  const { request, env } = context;
  const key = env.OPENROUTER_API_KEY || env.OPENAI_API_KEY;

  if (!key) {
    return Response.json({ error: 'کلید هوش مصنوعی روی سرور تنظیم نشده است.' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const action = String(body.action || '');
    const text = String(body.text || '').trim();
    const prompt = String(body.prompt || '').trim();

    if (!ACTIONS[action]) return Response.json({ error: 'عملیات هوش مصنوعی نامعتبر است.' }, { status: 400 });
    if (!text) return Response.json({ error: 'ابتدا یک متن را انتخاب کنید.' }, { status: 400 });
    if (text.length > 6000) return Response.json({ error: 'متن انتخاب‌شده بیش از حد طولانی است.' }, { status: 413 });

    const input = [ACTIONS[action], prompt ? 'دستور اضافی کاربر: ' + prompt : '', 'متن ورودی:', text]
      .filter(Boolean).join('\\n\\n');

    const upstream = await fetch('https://openrouter.ai/api/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key,
        'HTTP-Referer': 'https://khatavar.app',
        'X-Title': 'KhatAvar'
      },
      body: JSON.stringify({
        model: env.AI_MODEL || 'openai/gpt-latest',
        instructions: SYSTEM,
        input,
        max_output_tokens: action === 'analyze' ? 900 : 500
      })
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return Response.json(
        { error: data?.error?.message || 'ارتباط با سرویس هوش مصنوعی ناموفق بود.' },
        { status: upstream.status >= 500 ? 502 : upstream.status }
      );
    }

    const output = String(data.output_text || '').trim();
    if (!output) return Response.json({ error: 'پاسخ خالی از سرویس هوش مصنوعی دریافت شد.' }, { status: 502 });

    return Response.json({ action, text: output });
  } catch {
    return Response.json({ error: 'خطای داخلی در سرویس هوش مصنوعی.' }, { status: 500 });
  }
}

export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  return onRequestPost(context);
}