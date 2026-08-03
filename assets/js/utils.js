/**
 * Utilitários Gerais
 * @version 1.0.0
 */

class Utils {
    /**
     * Formata data para padrão brasileiro
     */
    static formatDate(date, format = 'DD/MM/YYYY') {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');

        const formats = {
            'DD/MM/YYYY': `${day}/${month}/${year}`,
            'YYYY-MM-DD': `${year}-${month}-${day}`,
            'DD/MM/YYYY HH:mm': `${day}/${month}/${year} ${hours}:${minutes}`,
            'HH:mm': `${hours}:${minutes}`
        };

        return formats[format] || formats['DD/MM/YYYY'];
    }

    /**
     * Valida email
     */
    static isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    /**
     * Valida telefone
     */
    static isValidPhone(phone) {
        const regex = /^\(?[1-9]{2}\)? ?[9]?[0-9]{4}-?[0-9]{4}$/;
        return regex.test(phone);
    }

    /**
     * Gera ID único
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Máscara para telefone
     */
    static maskPhone(value) {
        value = value.replace(/\D/g, '');
        if (value.length <= 2) {
            return `(${value}`;
        }
        if (value.length <= 6) {
            return `(${value.substring(0, 2)}) ${value.substring(2)}`;
        }
        if (value.length <= 10) {
            return `(${value.substring(0, 2)}) ${value.substring(2, 6)}-${value.substring(6)}`;
        }
        return `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7, 11)}`;
    }

    /**
     * Máscara para CPF
     */
    static maskCPF(value) {
        value = value.replace(/\D/g, '');
        if (value.length <= 3) {
            return value;
        }
        if (value.length <= 6) {
            return `${value.substring(0, 3)}.${value.substring(3)}`;
        }
        if (value.length <= 9) {
            return `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6)}`;
        }
        return `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6, 9)}-${value.substring(9, 11)}`;
    }

    /**
     * Converte para slug
     */
    static toSlug(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-');
    }

    /**
     * Capitaliza texto
     */
    static capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }

    /**
     * Trunca texto
     */
    static truncate(text, maxLength = 50) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * Verifica se é um objeto vazio
     */
    static isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }

    /**
     * Debounce para eventos
     */
    static debounce(func, delay = 300) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * Throttle para eventos
     */
    static throttle(func, limit = 300) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Converte para base64
     */
    static toBase64(str) {
        return btoa(unescape(encodeURIComponent(str)));
    }

    /**
     * Converte de base64
     */
    static fromBase64(str) {
        return decodeURIComponent(escape(atob(str)));
    }

    /**
     * Gera cores aleatórias
     */
    static randomColor() {
        const colors = [
            '#007AFF', '#34C759', '#FF9500', '#FF3B30',
            '#AF52DE', '#5AC8FA', '#FF2D92', '#5856D6'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Valida data
     */
    static isValidDate(date) {
        const d = new Date(date);
        return d instanceof Date && !isNaN(d);
    }

    /**
     * Verifica se é hoje
     */
    static isToday(date) {
        const today = new Date();
        const d = new Date(date);
        return d.getDate() === today.getDate() &&
               d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
    }

    /**
     * Verifica se é amanhã
     */
    static isTomorrow(date) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const d = new Date(date);
        return d.getDate() === tomorrow.getDate() &&
               d.getMonth() === tomorrow.getMonth() &&
               d.getFullYear() === tomorrow.getFullYear();
    }

    /**
     * Verifica se é ontem
     */
    static isYesterday(date) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const d = new Date(date);
        return d.getDate() === yesterday.getDate() &&
               d.getMonth() === yesterday.getMonth() &&
               d.getFullYear() === yesterday.getFullYear();
    }

    /**
     * Obtém diferença em dias
     */
    static daysBetween(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Adiciona dias a uma data
     */
    static addDays(date, days) {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    }

    /**
     * Verifica se é feriado (exemplo)
     */
    static isHoliday(date) {
        // Implementar verificação de feriados
        const holidays = [
            '01-01', // Ano Novo
            '04-21', // Tiradentes
            '05-01', // Dia do Trabalho
            '09-07', // Independência
            '10-12', // Nossa Senhora Aparecida
            '11-02', // Finados
            '11-15', // Proclamação da República
            '12-25'  // Natal
        ];

        const d = new Date(date);
        const monthDay = String(d.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(d.getDate()).padStart(2, '0');
        return holidays.includes(monthDay);
    }

    /**
     * Formata tamanho de arquivo
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Clona objeto
     */
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Mescla objetos
     */
    static deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        return result;
    }

    /**
     * Converte para URL amigável
     */
    static toFriendlyUrl(text) {
        return text
            .toLowerCase()
            .replace(/[áàãâä]/g, 'a')
            .replace(/[éèêë]/g, 'e')
            .replace(/[íìîï]/g, 'i')
            .replace(/[óòõôö]/g, 'o')
            .replace(/[úùûü]/g, 'u')
            .replace(/[ç]/g, 'c')
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, '-');
    }

    /**
     * Obtém parâmetros da URL
     */
    static getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    }

    /**
     * Verifica se é mobile
     */
    static isMobile() {
        return window.innerWidth < 768;
    }

    /**
     * Verifica se é tablet
     */
    static isTablet() {
        return window.innerWidth >= 768 && window.innerWidth < 1024;
    }

    /**
     * Verifica se é desktop
     */
    static isDesktop() {
        return window.innerWidth >= 1024;
    }
}

// Exportar utilitários
window.Utils = Utils;
