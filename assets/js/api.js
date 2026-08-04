/**
 * API - Comunicação com Google Apps Script
 * @version 1.0.0
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
    }

    /**
     * Método GET - Para consultas
     */
    async get(params = {}) {
        try {
            const url = new URL(this.baseUrl);
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    url.searchParams.append(key, params[key]);
                }
            });

            console.log('📤 GET Request:', url.toString());

            const response = await this.fetchWithTimeout(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                mode: 'cors',
                credentials: 'omit'
            });

            const data = await response.json();
            console.log('📥 GET Response:', data);
            return data;
        } catch (error) {
            console.error('❌ Erro na requisição GET:', error);
            throw error;
        }
    }

    /**
     * Método POST - Para escritas (usa GET internamente para evitar CORS)
     */
    async post(data) {
        try {
            // Converter dados para parâmetros GET
            const params = new URLSearchParams();
            Object.keys(data).forEach(key => {
                if (data[key] !== undefined && data[key] !== null) {
                    // Se for objeto ou array, converter para JSON string
                    if (typeof data[key] === 'object') {
                        params.append(key, JSON.stringify(data[key]));
                    } else {
                        params.append(key, data[key]);
                    }
                }
            });

            const url = new URL(this.baseUrl);
            url.search = params.toString();

            console.log('📤 POST Request (via GET):', url.toString());

            const response = await this.fetchWithTimeout(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                mode: 'cors',
                credentials: 'omit'
            });

            const result = await response.json();
            console.log('📥 POST Response:', result);
            return result;
        } catch (error) {
            console.error('❌ Erro na requisição POST:', error);
            throw error;
        }
    }

    /**
     * Fetch com timeout
     */
    async fetchWithTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
            console.warn('⏰ Timeout:', url);
        }, this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeout);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return response;
        } catch (error) {
            clearTimeout(timeout);
            throw error;
        }
    }

    // ============================================
    // MÉTODOS DA API
    // ============================================

    /**
     * Autenticação
     */
    async login(email, senha) {
        return this.get({
            acao: 'login',
            email,
            senha
        });
    }

    /**
     * Dashboard
     */
    async getDashboard() {
        return this.get({ acao: 'dashboard' });
    }

    /**
     * Listar Agendas
     */
    async listarAgendas(filtros = {}) {
        return this.get({
            acao: 'listarAgendas',
            ...filtros
        });
    }

    /**
     * Buscar Agenda por ID
     */
    async buscarAgenda(id) {
        return this.get({
            acao: 'buscarAgenda',
            id
        });
    }

    /**
     * Criar Agenda
     */
    async criarAgenda(dados) {
        return this.post({
            acao: 'criarAgenda',
            ...dados
        });
    }

    /**
     * Editar Agenda
     */
    async editarAgenda(dados) {
        return this.post({
            acao: 'editarAgenda',
            ...dados
        });
    }

    /**
     * Excluir Agenda
     */
    async excluirAgenda(id) {
        return this.post({
            acao: 'excluirAgenda',
            id
        });
    }

    /**
     * Atualizar Status
     */
    async atualizarStatus(id, status) {
        return this.post({
            acao: 'atualizarStatus',
            id,
            status
        });
    }

    /**
     * Solicitar Adiamento
     */
    async solicitarAdiamento(dados) {
        return this.post({
            acao: 'solicitarAdiamento',
            ...dados
        });
    }

    /**
     * Aprovar Adiamento
     */
    async aprovarAdiamento(dados) {
        return this.post({
            acao: 'aprovarAdiamento',
            ...dados
        });
    }

    /**
     * Recusar Adiamento
     */
    async recusarAdiamento(dados) {
        return this.post({
            acao: 'recusarAdiamento',
            ...dados
        });
    }

    /**
     * Listar Usuários
     */
    async listarUsuarios() {
        return this.get({ acao: 'listarUsuarios' });
    }

    /**
     * Buscar Usuário por ID
     */
    async buscarUsuario(id) {
        return this.get({
            acao: 'buscarUsuario',
            id
        });
    }

    /**
     * Criar Usuário
     */
    async criarUsuario(dados) {
        return this.post({
            acao: 'criarUsuario',
            ...dados
        });
    }

    /**
     * Editar Usuário
     */
    async editarUsuario(dados) {
        return this.post({
            acao: 'editarUsuario',
            ...dados
        });
    }

    /**
     * Excluir Usuário
     */
    async excluirUsuario(id) {
        return this.post({
            acao: 'excluirUsuario',
            id
        });
    }

    /**
     * Listar Notificações
     */
    async listarNotificacoes(usuario) {
        return this.get({
            acao: 'listarNotificacoes',
            usuario
        });
    }

    /**
     * Criar Notificação
     */
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

// Log da configuração
console.log('🚀 API Configurada:', {
    baseUrl: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT
});
