(() => {
  'use strict';

  const STORAGE_KEY = 'khatavar_typography_enhancements_v1';
  const defaults = { kerning: 'normal', ligatures: true, wordSpacing: 0, rendering: 'auto' };

  const readStore = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  };
  const writeStore = value => localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  const keyFor = el => `obj:${el.dataset.id || 'unknown'}`;

  function settingsFor(el) {
    const all = readStore();
    return { ...defaults, ...(all[keyFor(el)] || {}) };
  }

  function apply(el, settings) {
    if (!el || !el.classList.contains('text-object')) return;
    el.style.fontKerning = settings.kerning;
    el.style.fontVariantLigatures = settings.ligatures ? 'common-ligatures contextual' : 'none';
    el.style.wordSpacing = `${Number(settings.wordSpacing) || 0}px`;
    el.style.textRendering = settings.rendering;
    el.dataset.kaKerning = settings.kerning;
    el.dataset.kaLigatures = settings.ligatures ? 'on' : 'off';
    el.dataset.kaWordSpacing = settings.wordSpacing;
    el.querySelectorAll('.word-span').forEach(word => {
      word.style.fontKerning = settings.kerning;
      word.style.fontVariantLigatures = settings.ligatures ? 'common-ligatures contextual' : 'none';
      word.style.textRendering = settings.rendering;
    });
  }

  function applyAll() {
    document.querySelectorAll('.text-object').forEach(el => apply(el, settingsFor(el)));
  }

  function currentObject() {
    return document.querySelector('.text-object.selected');
  }

  function buildPanel() {
    const properties = document.getElementById('properties');
    if (!properties || document.getElementById('advancedTypographySection')) return;

    const section = document.createElement('section');
    section.id = 'advancedTypographySection';
    section.className = 'prop-section ka-advanced-typography';
    section.innerHTML = `
      <div class="section-caption">تایپوگرافی پیشرفته</div>
      <div class="grid2">
        <label class="field"><span>کرنینگ</span><select data-ka="kerning"><option value="auto">خودکار</option><option value="normal">عادی</option><option value="none">خاموش</option></select></label>
        <label class="field"><span>لیگچر</span><select data-ka="ligatures"><option value="true">فعال</option><option value="false">خاموش</option></select></label>
        <label class="field"><span>فاصله کلمات</span><input data-ka="wordSpacing" type="number" step="0.5" min="-50" max="100" value="0"></label>
        <label class="field"><span>رندر متن</span><select data-ka="rendering"><option value="auto">خودکار</option><option value="optimizeLegibility">خوانایی</option><option value="geometricPrecision">دقیق</option></select></label>
      </div>
      <div class="word-help">این تنظیمات روی رندر متن اعمال می‌شوند و مستقل از فاصله حروف هستند.</div>`;
    properties.appendChild(section);

    section.addEventListener('change', event => {
      const control = event.target.closest('[data-ka]');
      const el = currentObject();
      if (!control || !el) return;
      const settings = settingsFor(el);
      const name = control.dataset.ka;
      settings[name] = name === 'ligatures' ? control.value === 'true' : name === 'wordSpacing' ? Number(control.value) || 0 : control.value;
      const all = readStore();
      all[keyFor(el)] = settings;
      writeStore(all);
      apply(el, settings);
      const status = document.getElementById('statusText');
      if (status) status.textContent = 'تنظیمات تایپوگرافی پیشرفته اعمال شد';
    });
  }

  function syncPanel() {
    const el = currentObject();
    const section = document.getElementById('advancedTypographySection');
    if (!section) return;
    const settings = el ? settingsFor(el) : defaults;
    section.querySelector('[data-ka="kerning"]').value = settings.kerning;
    section.querySelector('[data-ka="ligatures"]').value = String(settings.ligatures);
    section.querySelector('[data-ka="wordSpacing"]').value = settings.wordSpacing;
    section.querySelector('[data-ka="rendering"]').value = settings.rendering;
  }

  function boot() {
    buildPanel();
    applyAll();
    syncPanel();
    const observer = new MutationObserver(() => {
      applyAll();
      syncPanel();
    });
    observer.observe(document.getElementById('artboard') || document.body, { childList: true, subtree: true });
    window.KhatAvarTypography = Object.freeze({ applyAll, apply, settingsFor });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
