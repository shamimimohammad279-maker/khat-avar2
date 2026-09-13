(() => {
  'use strict';

  const NORMALIZATION_MAP = new Map([
    ['ي', 'ی'], ['ى', 'ی'], ['ئ', 'ی'],
    ['ك', 'ک'],
    ['ۀ', 'هٔ'], ['ة', 'ه'],
    ['ؤ', 'و'],
    ['ـ', 'ـ'],
    ['٠', '۰'], ['١', '۱'], ['٢', '۲'], ['٣', '۳'], ['٤', '۴'],
    ['٥', '۵'], ['٦', '۶'], ['٧', '۷'], ['٨', '۸'], ['٩', '۹'],
  ]);

  const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
  const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

  function normalizePersianText(value) {
    let text = String(value ?? '');
    text = text.normalize('NFC');
    text = text.replace(/[يىئكۀةؤ٠-٩]/g, ch => NORMALIZATION_MAP.get(ch) || ch);
    text = text.replace(/\r\n?/g, '\n');
    text = text.replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n');
    return text;
  }

  function arabicDigitsToPersian(value) {
    return String(value ?? '').replace(/[٠-٩]/g, ch => PERSIAN_DIGITS[ARABIC_DIGITS.indexOf(ch)]);
  }

  function latinDigitsToPersian(value) {
    return String(value ?? '').replace(/[0-9]/g, ch => PERSIAN_DIGITS[ch]);
  }

  function normalizeTextarea(textarea) {
    if (!textarea) return false;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = textarea.value;
    const after = normalizePersianText(before);
    if (before === after) return false;
    textarea.value = after;
    const delta = after.length - before.length;
    textarea.setSelectionRange(Math.max(0, start + delta), Math.max(0, end + delta));
    return true;
  }

  document.addEventListener('input', event => {
    if (event.target?.id === 'textInput') normalizeTextarea(event.target);
  }, true);

  window.KhatAvarPersian = Object.freeze({
    normalize: normalizePersianText,
    normalizeTextarea,
    arabicDigitsToPersian,
    latinDigitsToPersian,
  });

  // Load the next typography layer after the existing core without changing app.js.
  const script = document.createElement('script');
  script.src = 'typography-enhancements.js';
  script.defer = true;
  document.head.appendChild(script);
})();
