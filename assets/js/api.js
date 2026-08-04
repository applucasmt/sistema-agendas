/**
 * API - Comunicação com Google Apps Script
 * @version 1.0.0
 */

const API_CONFIG = {
    // ATUALIZE COM A URL DO SEU WEB APP
    BASE_URL: 'https://script.google.com/macros/s/SEU_ID_AQUI/exec',
    TIMEOUT: 30000
};

class ApiService {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
        this.timeout = API_CONFIG.TIMEOUT;
    }

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

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
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

const api = new ApiService();
window.api = api;
