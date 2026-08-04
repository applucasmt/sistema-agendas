/**
 * API - Comunicação com Google Apps Script via JSONP
 * @version 1.0.0 - JSONP Support
 */

const API_CONFIG = {
    // ATUALIZE COM A URL DO SEU WEB APP
    BASE_URL: 'https://script.google.com/macros/s/AKfycbyouNUkUo3QjEfXOe8bWOPgdbkl9QkcNq4AMU8ZG7JqUAuu-30IJ8nzO4JskT5KS5bE/exec',
    TIMEOUT: 30000
};

class ApiService {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
        this.timeout = API_CONFIG.TIMEOUT;
        this.requestId = 0;
    }

    /**
     * Método GET com JSONP (para evitar CORS)
     */
    async get(params = {}) {
        return new Promise((resolve, reject) => {
            try {
                const url = new URL(this.baseUrl);
                
                // Adicionar parâmetros
                Object.keys(params).forEach(key => {
                    if (params[key] !== undefined && params[key] !== null) {
                        url.searchParams.append(key, params[key]);
                    }
                });

                // Adicionar callback para JSONP
                const callbackName = `jsonp_callback_${++this.requestId}`;
                url.searchParams.append('callback', callbackName);

                console.log('📤 JSONP Request:', url.toString());

                // Criar script tag
                const script = document.createElement('script');
                script.src = url.toString();

                // Timeout
                const timeoutId = setTimeout(() => {
                    cleanup();
                    reject(new Error('Timeout: A requisição demorou muito para responder'));
                }, this.timeout);

                // Função de limpeza
                const cleanup = () => {
                    if (script.parentNode) {
                        script.parentNode.removeChild(script);
                    }
                    delete window[callbackName];
                    clearTimeout(timeoutId);
                };

                // Definir callback global
                window[callbackName] = (data) => {
                    cleanup();
                    console.log('📥 JSONP Response:', data);
                    resolve(data);
                };

                // Handler de erro
                script.onerror = () => {
                    cleanup();
                    reject(new Error('Erro na requisição JSONP'));
                };

                // Adicionar script ao DOM
                document.head.appendChild(script);

            } catch (error) {
                console.error('❌ Erro na requisição JSONP:', error);
                reject(error);
            }
        });
    }

    /**
     * Método POST (usa GET com JSONP internamente)
     */
    async post(data) {
        try {
            // Converter dados para parâmetros
            const params = {};
            Object.keys(data).forEach(key => {
                if (data[key] !== undefined && data[key] !== null) {
                    if (typeof data[key] === 'object') {
                        params[key] = JSON.stringify(data[key]);
                    } else {
                        params[key] = data[key];
                    }
                }
            });

            console.log('📤 POST via JSONP:', params);
            return await this.get(params);
        } catch (error) {
            console.error('❌ Erro na requisição POST:', error);
            throw error;
        }
    }

    // ============================================
    // MÉTODOS DA API
    // ============================================

    async login(email, senha) {
        return this.get({
            acao: 'login',
            email,
            senha
        });
    }

    async getDashboard() {
        return this.get({ acao: 'dashboard' });
    }

    async listarAgendas(filtros = {}) {
        return this.get({
            acao: 'listarAgendas',
            ...filtros
        });
    }

    async buscarAgenda(id) {
        return this.get({
            acao: 'buscarAgenda',
            id
        });
    }

    async criarAgenda(dados) {
        return this.post({
            acao: 'criarAgenda',
            ...dados
        });
    }

    async editarAgenda(dados) {
        return this.post({
            acao: 'editarAgenda',
            ...dados
        });
    }

    async excluirAgenda(id) {
        return this.post({
            acao: 'excluirAgenda',
            id
        });
    }

    async atualizarStatus(id, status) {
        return this.post({
            acao: 'atualizarStatus',
            id,
            status
        });
    }

    async solicitarAdiamento(dados) {
        return this.post({
            acao: 'solicitarAdiamento',
            ...dados
        });
    }

    async aprovarAdiamento(dados) {
        return this.post({
            acao: 'aprovarAdiamento',
            ...dados
        });
    }

    async recusarAdiamento(dados) {
        return this.post({
            acao: 'recusarAdiamento',
            ...dados
        });
    }

    async listarUsuarios() {
        return this.get({ acao: 'listarUsuarios' });
    }

    async buscarUsuario(id) {
        return this.get({
            acao: 'buscarUsuario',
            id
        });
    }

    async criarUsuario(dados) {
        return this.post({
            acao: 'criarUsuario',
            ...dados
        });
    }

    async editarUsuario(dados) {
        return this.post({
            acao: 'editarUsuario',
            ...dados
        });
    }

    async excluirUsuario(id) {
        return this.post({
            acao: 'excluirUsuario',
            id
        });
    }

    async listarNotificacoes(usuario) {
        return this.get({
            acao: 'listarNotificacoes',
            usuario
        });
    }

    async criarNotificacao(dados) {
        return this.post({
            acao: 'criarNotificacao',
            ...dados
        });
    }
}

// Instância global
const api = new ApiService();
window.api = api;

console.log('🚀 API Configurada (JSONP):', {
    baseUrl: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT
});
