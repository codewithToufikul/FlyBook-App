import { Platform } from 'react-native';
import { franc } from 'franc';

const languageMap: Record<string, string> = {
  BD: 'bn',
  IN: 'hi',
  PK: 'ur',
  NP: 'ne',
  LK: 'si',
};

// Mapping 3-letter ISO codes to 2-letter codes (used for franc detection)
const threeToTwo: Record<string, string> = {
  ben: 'bn',
  eng: 'en',
  hin: 'hi',
  urd: 'ur',
  nep: 'ne',
  sin: 'si',
  msa: 'ms',
  ind: 'id',
  tha: 'th',
  vie: 'vi',
  mya: 'my',
  zho: 'zh',
  jpn: 'ja',
  kor: 'ko',
  ara: 'ar',
  fas: 'fa',
  tur: 'tr',
  fra: 'fr',
  spa: 'es',
  deu: 'de',
  ita: 'it',
  por: 'pt',
  nld: 'nl',
  swe: 'sv',
  nor: 'no',
  dan: 'da',
  fin: 'fi',
  rus: 'ru',
  ukr: 'uk',
  pol: 'pl',
  ces: 'cs',
  hun: 'hu',
  ron: 'ro',
  ell: 'el',
  afr: 'af',
  yor: 'yo',
  amh: 'am',
};

let cachedTargetLang = '';

export const getTargetLanguage = async (): Promise<string> => {
  if (cachedTargetLang) {
    return cachedTargetLang;
  }

  let systemLang = 'en';
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    if (locale) {
      systemLang = locale.split('-')[0].split('_')[0].toLowerCase();
    }
  } catch (e) {
    console.log('Error getting system locale:', e);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    if (data && data.country_code) {
      const countryCode = data.country_code.toUpperCase();
      cachedTargetLang = languageMap[countryCode] || systemLang || 'en';
      return cachedTargetLang;
    }
  } catch (error) {
    console.log(
      'Error detecting country via IP, falling back to system lang:',
      error,
    );
  }

  cachedTargetLang = systemLang || 'en';
  return cachedTargetLang;
};

export const isBengaliText = (text: string): boolean => {
  return /[\u0980-\u09FF]/.test(text);
};

/**
 * Detect if the given text is already in the target language.
 * Uses franc to detect language for any text and maps the detected ISO639-3 code to a 2-letter code.
 * Falls back to simple Bengali detection for backward compatibility.
 */
export const isAlreadyInTargetLanguage = (
  text: string,
  targetLang: string,
): boolean => {
  if (!text) return false;

  // First try franc detection for generic languages
  try {
    const detectedIso3 = franc(text);
    if (detectedIso3 && detectedIso3 !== 'und') {
      const mapped = threeToTwo[detectedIso3];
      const detectedLang = mapped || detectedIso3.slice(0, 2);
      if (detectedLang === targetLang) {
        return true;
      }
    }
  } catch (e) {
    // franc may not be available or throw, ignore and fallback
  }

  // Fallback: simple Bengali check when target is Bengali
  const isBengali = isBengaliText(text);
  if (targetLang === 'bn' && isBengali) {
    return true;
  }
  if (targetLang === 'en' && !isBengali) {
    return true;
  }
  return false;
};
