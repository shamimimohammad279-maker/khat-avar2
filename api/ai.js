export const config = { runtime: 'nodejs' };

const ACTIONS = {
  normalize: 'متن فارسی را پاکسازی و استاندارد کن. معنی، لحن و محتوای اصلی را حفظ کن. فقط نسخه نهایی متن را برگردان.',
  improve: 'متن را برای استفاده در یک اثر تایپوگرافی فارسی بهبود بده. کوتاه، خوش‌خوان، طبیعی و مناسب ترکیب بصری باشد. فقط نسخه نهایی را برگردان.',
  shorten: 'متن را تا حد ممکن کوتاه کن، بدون اینکه پیام اصلی از بین برود. فقط نسخه نهایی را برگردان.',
  variants: 'سه نسخه متفاوت و کوتاه برای استفاده در تایپوگرافی پیشنهاد بده. هر نسخه در یک خط جدا باشد و هیچ توضیح اضافه‌ای نده.',
  analyze: 'متن را از نظر طول، ریتم، خوانایی، شکست سطر، لحن و مناسب‌بودن برای تایپوگرافی فارسی تحلیل کن. چند پیشنهاد عملی و کوتاه بده.'
};
const hits=new Map();
const RATE_WINDOW=60_000;
const RATE_LIMIT=12;
function allowed(request){
 const key=(request.headers.get('x-forwarded-for')||request.headers.get('x-real-ip')||'unknown').split(',')[0].trim();
 const now=Date.now();
 const old=hits.get(key)||[];
 const fresh=old.filter(t=>now-t<RATE_WINDOW);
 if(fresh.length>=RATE_LIMIT){hits.set(key,fresh);return false}
 fresh.push(now);hits.set(key,fresh);return true;
}
const SYSTEM=`تو دستیار هوشمند تایپوگرافی فارسی در نرم‌افزار خط‌آور هستی.
روی کیفیت متن فارسی، خوانایی، ایجاز، ریتم بصری و مناسب‌بودن متن برای طراحی تمرکز کن.
به درخواست کاربر وفادار باش و از اضافه‌گویی پرهیز کن.
اگر متن مناسب است، بی‌دلیل تغییرش نده.`;

export default async function handler(request,response){
 if(request.method!=='POST')return response.status(405).json({error:'Method not allowed'});
 if(!allowed(request))return response.status(429).json({error:'تعداد درخواست‌های AI زیاد است؛ کمی بعد دوباره امتحان کنید.'});
 const key=process.env.OPENAI_API_KEY;
 if(!key)return response.status(503).json({error:'کلید هوش مصنوعی روی سرور تنظیم نشده است.'});
 try{
  const body=typeof request.body==='string'?JSON.parse(request.body):(request.body||{});
  const action=String(body.action||''), text=String(body.text||'').trim(), prompt=String(body.prompt||'').trim();
  if(!ACTIONS[action])return response.status(400).json({error:'عملیات هوش مصنوعی نامعتبر است.'});
  if(!text)return response.status(400).json({error:'ابتدا یک متن را انتخاب کنید.'});
  if(text.length>6000)return response.status(413).json({error:'متن انتخاب‌شده بیش از حد طولانی است.'});
  const input=[ACTIONS[action],prompt?'دستور اضافی کاربر: '+prompt:'','متن ورودی:',text].filter(Boolean).join('\n\n');
  const upstream=await fetch('https://api.openai.com/v1/responses',{
   method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
   body:JSON.stringify({model:process.env.AI_MODEL||'gpt-6-luna',instructions:SYSTEM,input,max_output_tokens:action==='analyze'?900:500})
  });
  const data=await upstream.json();
  if(!upstream.ok)return response.status(upstream.status>=500?502:upstream.status).json({error:data?.error?.message||'ارتباط با سرویس هوش مصنوعی ناموفق بود.'});
  const output=String(data.output_text||'').trim();
  if(!output)return response.status(502).json({error:'پاسخ خالی از سرویس هوش مصنوعی دریافت شد.'});
  return response.status(200).json({action,text:output});
 }catch(error){return response.status(500).json({error:'خطای داخلی در سرویس هوش مصنوعی.'});}
}