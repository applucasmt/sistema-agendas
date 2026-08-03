/**
 * API - Comunicação com Google Apps Script
 * @version 1.0.0
 */

// Configuração da API
const API_CONFIG = {
    // URL do Web App do Google Apps Script
    // ATUALIZAR COM A URL GERADA AO PUBLICAR
    BASE_URL: 'https://script.google.com/macros/s/SEU_ID_AQUI/exec',
    TIMEOUT: 30000
};

class ApiService {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
        this.timeout = API_CONFIG.TIMEOUT;
    }

    /**
     * Realiza requisição GET
     */
    async get(params = {}) {
        try {
            const url = new URL(this.baseUrl);
            Object.keys(params).forEach(key => {
                url.searchParams.append(key, params[key]);
            });

            const response = await this.fetchWithTimeout(url.toString(), {
                method: 'GET',
                headers: this.getHeaders()
            });

            return await response.json();
        } catch (error) {
            console.error('Erro na requisição GET:', error);
            throw error;
        }
    }

    /**
     * Realiza requisição POST
     */
    async post(data) {
        try {
            const response = await this.fetchWithTimeout(this.baseUrl, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });

            return await response.json();
        } catch (error) {
            console.error('Erro na requisição POST:', error);
            throw error;
        }
    }

    /**
     * Fetch com timeout
     */
    async fetchWithTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeout);
            return response;
        } catch (error) {
            clearTimeout(timeout);
            throw error;
        }
    }

    /**
     * Headers padrão
     */
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    // ============================================
    // MÉTODOS ESPECÍFICOS DA API
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

// Instância global da API
const api = new ApiService();
