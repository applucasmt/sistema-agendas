/**
 * Autenticação e Gerenciamento de Sessão
 * @version 1.0.0
 */

class AuthService {
    constructor() {
        this.usuario = null;
        this.token = null;
        this.loadSession();
    }

    loadSession() {
        try {
            const session = localStorage.getItem('agenda_session');
            if (session) {
                const data = JSON.parse(session);
                this.usuario = data.usuario;
                this.token = data.token;
            }
        } catch (error) {
            console.error('Erro ao carregar sessão:', error);
            this.clearSession();
        }
    }

    saveSession(usuario, token) {
        this.usuario = usuario;
        this.token = token;
        localStorage.setItem('agenda_session', JSON.stringify({
            usuario,
            token
        }));
    }

    clearSession() {
        this.usuario = null;
        this.token = null;
        localStorage.removeItem('agenda_session');
    }

    isAuthenticated() {
        return this.usuario !== null && this.token !== null;
    }

    isAdmin() {
        return this.usuario && this.usuario.Tipo === 'Administrador';
    }

    async login(email, senha) {
        try {
            const response = await api.login(email, senha);
            
            if (response.sucesso) {
                const token = this.generateToken(response.dados);
                this.saveSession(response.dados, token);
                return {
                    sucesso: true,
                    dados: response.dados
                };
            } else {
                return {
                    sucesso: false,
                    mensagem: response.mensagem || 'Erro ao fazer login'
                };
            }
        } catch (error) {
            console.error('Erro no login:', error);
            return {
                sucesso: false,
                mensagem: 'Erro de conexão com o servidor'
            };
        }
    }

    logout() {
        this.clearSession();
        window.location.href = '/login.html';
    }

    generateToken(usuario) {
        const data = {
            email: usuario['E-mail'],
            tipo: usuario.Tipo,
            timestamp: Date.now()
        };
        return btoa(JSON.stringify(data));
    }

    getUsuario() {
        return this.usuario;
    }

    getNome() {
        return this.usuario ? this.usuario.Nome : 'Usuário';
    }

    getEmail() {
        return this.usuario ? this.usuario['E-mail'] : null;
    }

    getTipo() {
        return this.usuario ? this.usuario.Tipo : null;
    }

    isExpired() {
        if (!this.token) return true;
        
        try {
            const data = JSON.parse(atob(this.token));
            const expiracao = data.timestamp + (24 * 60 * 60 * 1000);
            return Date.now() > expiracao;
        } catch {
            return true;
        }
    }

    async atualizarUsuario() {
        if (!this.usuario) return;
        
        try {
            const response = await api.buscarUsuario(this.usuario.ID);
            if (response.sucesso) {
                this.usuario = response.dados;
                this.saveSession(this.usuario, this.token);
            }
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
        }
    }
}

const auth = new AuthService();
window.auth = auth;

function verificarAutenticacao() {
    const paginaAtual = window.location.pathname;
    const paginaLogin = '/login.html';
    const paginaAdmin = '/admin.html';
    const paginaDashboard = '/dashboard.html';
    
    const paginasPublicas = [paginaLogin, '/', '/index.html'];
    
    if (!auth.isAuthenticated() && !paginasPublicas.includes(paginaAtual)) {
        window.location.href = paginaLogin;
        return false;
    }
    
    if (auth.isAuthenticated() && paginaAtual === paginaLogin) {
        if (auth.isAdmin()) {
            window.location.href = '/admin.html';
        } else {
            window.location.href = '/dashboard.html';
        }
        return false;
    }
    
    if (paginaAtual === paginaAdmin && !auth.isAdmin()) {
        window.location.href = '/dashboard.html';
        return false;
    }
    
    if (paginaAtual === paginaDashboard && auth.isAdmin()) {
        // Admin pode ver dashboard também, mas fica no admin
        if (window.location.pathname.includes('dashboard.html') && auth.isAdmin()) {
            // Não redirecionar, permitir admin ver dashboard também
        }
    }
    
    return true;
}

function initAuth() {
    if (!verificarAutenticacao()) {
        return;
    }
    atualizarInterfaceUsuario();
}

function atualizarInterfaceUsuario() {
    if (!auth.isAuthenticated()) return;
    
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => {
        el.textContent = auth.getNome();
    });
    
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
        el.style.display = auth.isAdmin() ? 'flex' : 'none';
    });
    
    const userElements = document.querySelectorAll('.user-only');
    userElements.forEach(el => {
        el.style.display = auth.isAdmin() ? 'none' : 'flex';
    });
}

async function fazerLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const lembrar = document.getElementById('lembrar').checked;
    const btnLogin = document.getElementById('btnLogin');
    
    btnLogin.disabled = true;
    btnLogin.innerHTML = '<span class="spinner"></span> Entrando...';
    
    try {
        const result = await auth.login(email, senha);
        
        if (result.sucesso) {
            if (lembrar) {
                localStorage.setItem('email_salvo', email);
            } else {
                localStorage.removeItem('email_salvo');
            }
            
            if (auth.isAdmin()) {
                window.location.href = '/admin.html';
            } else {
                window.location.href = '/dashboard.html';
            }
        } else {
            mostrarErroLogin(result.mensagem);
        }
    } catch (error) {
        mostrarErroLogin('Erro ao conectar com o servidor');
        console.error('Erro no login:', error);
    } finally {
        btnLogin.disabled = false;
        btnLogin.textContent = 'Entrar';
    }
}

function mostrarErroLogin(mensagem) {
    const errorContainer = document.getElementById('loginError');
    if (errorContainer) {
        errorContainer.textContent = mensagem;
        errorContainer.style.display = 'block';
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    }
}

function preencherEmailSalvo() {
    const emailSalvo = localStorage.getItem('email_salvo');
    if (emailSalvo) {
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.value = emailSalvo;
            const lembrarCheck = document.getElementById('lembrar');
            if (lembrarCheck) {
                lembrarCheck.checked = true;
            }
        }
    }
}

function fazerLogout() {
    if (confirm('Tem certeza que deseja sair?')) {
        auth.logout();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    preencherEmailSalvo();
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', fazerLogout);
    }
});
