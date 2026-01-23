import { km } from '../locales/km';
import { en } from '../locales/en';

type LanguageCode = 'km' | 'en';
type Translations = typeof km;

// Helper to get nested properties safely
function getNestedValue(obj: any, path: string): string {
    return path.split('.').reduce((prev, curr) => prev ? prev[curr] : null, obj) || path;
}

class LanguageService {
    private language: LanguageCode = 'km';
    private translations: Translations = km;
    private listeners: (() => void)[] = [];

    constructor() {
        const savedLang = localStorage.getItem('mouse_master_language');
        if (savedLang === 'en' || savedLang === 'km') {
            this.setLanguage(savedLang);
        } else {
            this.setLanguage('km'); // Default to Khmer
        }
    }

    setLanguage(lang: LanguageCode) {
        this.language = lang;
        this.translations = lang === 'en' ? en : km;
        localStorage.setItem('mouse_master_language', lang);
        this.notifyListeners();
    }

    toggleLanguage() {
        this.setLanguage(this.language === 'km' ? 'en' : 'km');
        return this.language;
    }

    getLanguage() {
        return this.language;
    }

    // Translate function
    t(key: string): string {
        return getNestedValue(this.translations, key);
    }

    // Subscribe to changes
    subscribe(listener: () => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(l => l());
    }
}

export const languageService = new LanguageService();
