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

    /**
     * Carrega sessão do localStorage
     */
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

    /**
     * Salva sessão no localStorage
     */
    saveSession(usuario, token) {
        this.usuario = usuario;
        this.token = token;
        localStorage.setItem('agenda_session', JSON.stringify({
            usuario,
            token
        }));
    }

    /**
     * Limpa sessão
     */
    clearSession() {
        this.usuario = null;
        this.token = null;
        localStorage.removeItem('agenda_session');
    }

    /**
     * Verifica se usuário está autenticado
     */
    isAuthenticated() {
        return this.usuario !== null && this.token !== null;
    }

    /**
     * Verifica se usuário é administrador
     */
    isAdmin() {
        return this.usuario && this.usuario.Tipo === 'Administrador';
    }

    /**
     * Realiza login
     */
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

    /**
     * Realiza logout
     */
    logout() {
        this.clearSession();
        window.location.href = '/login.html';
    }

    /**
     * Gera token simples para sessão
     */
    generateToken(usuario) {
        const data = {
            email: usuario['E-mail'],
            tipo: usuario.Tipo,
            timestamp: Date.now()
        };
        return btoa(JSON.stringify(data));
    }

    /**
     * Obtém usuário atual
     */
    getUsuario() {
        return this.usuario;
    }

    /**
     * Obtém nome do usuário
     */
    getNome() {
        return this.usuario ? this.usuario.Nome : 'Usuário';
    }

    /**
     * Obtém email do usuário
     */
    getEmail() {
        return this.usuario ? this.usuario['E-mail'] : null;
    }

    /**
     * Obtém tipo do usuário
     */
    getTipo() {
        return this.usuario ? this.usuario.Tipo : null;
    }

    /**
     * Verifica se a sessão expirou
     */
    isExpired() {
        if (!this.token) return true;
        
        try {
            const data = JSON.parse(atob(this.token));
            const expiracao = data.timestamp + (24 * 60 * 60 * 1000); // 24h
            return Date.now() > expiracao;
        } catch {
            return true;
        }
    }

    /**
     * Atualiza informações do usuário
     */
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

// Instância global do serviço de autenticação
const auth = new AuthService();

// ============================================
// PROTEÇÃO DE ROTAS
// ============================================

/**
 * Verifica autenticação e redireciona se necessário
 */
function verificarAutenticacao() {
    const paginaAtual = window.location.pathname;
    const paginaLogin = '/login.html';
    const paginaAdmin = '/admin.html';
    
    // Páginas que não requerem autenticação
    const paginasPublicas = [paginaLogin, '/', '/index.html'];
    
    // Se não está autenticado e não está em página pública
    if (!auth.isAuthenticated() && !paginasPublicas.includes(paginaAtual)) {
        window.location.href = paginaLogin;
        return false;
    }
    
    // Se está autenticado e está na página de login
    if (auth.isAuthenticated() && paginaAtual === paginaLogin) {
        if (auth.isAdmin()) {
            window.location.href = '/admin.html';
        } else {
            window.location.href = '/dashboard.html';
        }
        return false;
    }
    
    // Verificar permissões para admin
    if (paginaAtual === paginaAdmin && !auth.isAdmin()) {
        window.location.href = '/dashboard.html';
        return false;
    }
    
    return true;
}

/**
 * Inicializa proteção de rotas
 */
function initAuth() {
    // Verificar autenticação ao carregar página
    if (!verificarAutenticacao()) {
        return;
    }
    
    // Atualizar informações do usuário na interface
    atualizarInterfaceUsuario();
}

/**
 * Atualiza interface com dados do usuário
 */
function atualizarInterfaceUsuario() {
    if (!auth.isAuthenticated()) return;
    
    // Atualizar nome do usuário
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => {
        el.textContent = auth.getNome();
    });
    
    // Mostrar/esconder elementos administrativos
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
        el.style.display = auth.isAdmin() ? 'flex' : 'none';
    });
    
    const userElements = document.querySelectorAll('.user-only');
    userElements.forEach(el => {
        el.style.display = auth.isAdmin() ? 'none' : 'flex';
    });
}

// ============================================
// FUNÇÕES DE LOGIN
// ============================================

/**
 * Função de login para ser chamada pelo formulário
 */
async function fazerLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const lembrar = document.getElementById('lembrar').checked;
    const btnLogin = document.getElementById('btnLogin');
    
    // Mostrar loading
    btnLogin.disabled = true;
    btnLogin.innerHTML = '<span class="spinner"></span> Entrando...';
    
    try {
        const result = await auth.login(email, senha);
        
        if (result.sucesso) {
            // Salvar "Lembrar acesso"
            if (lembrar) {
                localStorage.setItem('email_salvo', email);
            } else {
                localStorage.removeItem('email_salvo');
            }
            
            // Redirecionar
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
        // Restaurar botão
        btnLogin.disabled = false;
        btnLogin.textContent = 'Entrar';
    }
}

/**
 * Mostra erro no login
 */
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

/**
 * Preenche email salvo
 */
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

// ============================================
// LOGOUT
// ============================================

/**
 * Função de logout
 */
function fazerLogout() {
    if (confirm('Tem certeza que deseja sair?')) {
        auth.logout();
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    preencherEmailSalvo();
    
    // Configurar botão de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', fazerLogout);
    }
});
