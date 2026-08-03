/**
 * Validadores de Formulários
 * @version 1.0.0
 */

class Validators {
    /**
     * Validação de campos obrigatórios
     */
    static required(value) {
        if (value === undefined || value === null || value === '') {
            return { valid: false, message: 'Campo obrigatório' };
        }
        if (Array.isArray(value) && value.length === 0) {
            return { valid: false, message: 'Selecione pelo menos uma opção' };
        }
        return { valid: true };
    }

    /**
     * Validação de email
     */
    static email(value) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(value)) {
            return { valid: false, message: 'E-mail inválido' };
        }
        return { valid: true };
    }

    /**
     * Validação de senha
     */
    static password(value, minLength = 6) {
        if (value.length < minLength) {
            return { valid: false, message: `Senha deve ter no mínimo ${minLength} caracteres` };
        }
        return { valid: true };
    }

    /**
     * Validação de confirmação de senha
     */
    static passwordMatch(password, confirm) {
        if (password !== confirm) {
            return { valid: false, message: 'As senhas não coincidem' };
        }
        return { valid: true };
    }

    /**
     * Validação de CPF
     */
    static cpf(value) {
        value = value.replace(/\D/g, '');
        if (value.length !== 11) {
            return { valid: false, message: 'CPF deve ter 11 dígitos' };
        }

        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1+$/.test(value)) {
            return { valid: false, message: 'CPF inválido' };
        }

        // Validação dos dígitos verificadores
        let sum = 0;
        let rest;

        for (let i = 1; i <= 9; i++) {
            sum += parseInt(value.substring(i - 1, i)) * (11 - i);
        }

        rest = (sum * 10) % 11;
        if (rest === 10 || rest === 11) rest = 0;
        if (rest !== parseInt(value.substring(9, 10))) {
            return { valid: false, message: 'CPF inválido' };
        }

        sum = 0;
        for (let i = 1; i <= 10; i++) {
            sum += parseInt(value.substring(i - 1, i)) * (12 - i);
        }

        rest = (sum * 10) % 11;
        if (rest === 10 || rest === 11) rest = 0;
        if (rest !== parseInt(value.substring(10, 11))) {
            return { valid: false, message: 'CPF inválido' };
        }

        return { valid: true };
    }

    /**
     * Validação de CNPJ
     */
    static cnpj(value) {
        value = value.replace(/\D/g, '');
        if (value.length !== 14) {
            return { valid: false, message: 'CNPJ deve ter 14 dígitos' };
        }

        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1+$/.test(value)) {
            return { valid: false, message: 'CNPJ inválido' };
        }

        // Validação dos dígitos verificadores
        let size = value.length - 2;
        let numbers = value.substring(0, size);
        const digits = value.substring(size);
        let sum = 0;
        let pos = size - 7;

        for (let i = size; i >= 1; i--) {
            sum += parseInt(numbers.charAt(size - i)) * pos--;
            if (pos < 2) pos = 9;
        }

        let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        if (result !== parseInt(digits.charAt(0))) {
            return { valid: false, message: 'CNPJ inválido' };
        }

        size = size + 1;
        numbers = value.substring(0, size);
        sum = 0;
        pos = size - 7;

        for (let i = size; i >= 1; i--) {
            sum += parseInt(numbers.charAt(size - i)) * pos--;
            if (pos < 2) pos = 9;
        }

        result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        if (result !== parseInt(digits.charAt(1))) {
            return { valid: false, message: 'CNPJ inválido' };
        }

        return { valid: true };
    }

    /**
     * Validação de telefone
     */
    static phone(value) {
        value = value.replace(/\D/g, '');
        if (value.length < 10 || value.length > 11) {
            return { valid: false, message: 'Telefone inválido' };
        }
        return { valid: true };
    }

    /**
     * Validação de CEP
     */
    static cep(value) {
        value = value.replace(/\D/g, '');
        if (value.length !== 8) {
            return { valid: false, message: 'CEP deve ter 8 dígitos' };
        }
        return { valid: true };
    }

    /**
     * Validação de data
     */
    static date(value) {
        if (!Utils.isValidDate(value)) {
            return { valid: false, message: 'Data inválida' };
        }
        return { valid: true };
    }

    /**
     * Validação de data futura
     */
    static futureDate(value) {
        const date = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (date < today) {
            return { valid: false, message: 'Data deve ser futura' };
        }
        return { valid: true };
    }

    /**
     * Validação de horário
     */
    static time(value) {
        const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!regex.test(value)) {
            return { valid: false, message: 'Horário inválido' };
        }
        return { valid: true };
    }

    /**
     * Validação de URL
     */
    static url(value) {
        try {
            new URL(value);
            return { valid: true };
        } catch {
            return { valid: false, message: 'URL inválida' };
        }
    }

    /**
     * Validação de número
     */
    static number(value, min = null, max = null) {
        const num = Number(value);
        if (isNaN(num)) {
            return { valid: false, message: 'Deve ser um número' };
        }
        if (min !== null && num < min) {
            return { valid: false, message: `Valor mínimo é ${min}` };
        }
        if (max !== null && num > max) {
            return { valid: false, message: `Valor máximo é ${max}` };
        }
        return { valid: true };
    }

    /**
     * Validação de tamanho mínimo
     */
    static minLength(value, length) {
        if (value.length < length) {
            return { valid: false, message: `Deve ter no mínimo ${length} caracteres` };
        }
        return { valid: true };
    }

    /**
     * Validação de tamanho máximo
     */
    static maxLength(value, length) {
        if (value.length > length) {
            return { valid: false, message: `Deve ter no máximo ${length} caracteres` };
        }
        return { valid: true };
    }

    /**
     * Validação de range
     */
    static range(value, min, max) {
        const num = Number(value);
        if (num < min || num > max) {
            return { valid: false, message: `Valor deve estar entre ${min} e ${max}` };
        }
        return { valid: true };
    }

    /**
     * Validação de seleção
     */
    static selected(value) {
        if (value === '' || value === null || value === undefined) {
            return { valid: false, message: 'Selecione uma opção' };
        }
        return { valid: true };
    }

    /**
     * Validação de arquivo
     */
    static file(value, allowedTypes = [], maxSize = 5 * 1024 * 1024) {
        if (!value || value.length === 0) {
            return { valid: false, message: 'Selecione um arquivo' };
        }

        const file = value[0];
        
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
            return { valid: false, message: 'Tipo de arquivo não permitido' };
        }
        
        if (file.size > maxSize) {
            return { valid: false, message: `Arquivo deve ter no máximo ${Utils.formatFileSize(maxSize)}` };
        }
        
        return { valid: true };
    }
}

// Exportar validadores
window.Validators = Validators;
