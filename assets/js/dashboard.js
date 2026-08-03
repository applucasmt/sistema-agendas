/**
 * Dashboard do Usuário
 * @version 1.0.0
 */

class DashboardApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.isSidebarOpen = false;
        this.isDarkMode = this.loadTheme();
        this.notificacoes = [];
        this.init();
    }

    init() {
        this.setupTheme();
        this.setupSidebar();
        this.setupNavigation();
        this.setupLogout();
        this.loadPage('dashboard');
        this.loadNotificacoesCount();
        this.registerServiceWorker();
    }

    // ============================================
    // TEMA
    // ============================================

    loadTheme() {
        const saved = localStorage.getItem('theme_choice');
        if (saved) {
            return saved === 'dark';
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    setupTheme() {
        const html = document.documentElement;
        if (this.isDarkMode) {
            html.setAttribute('data-theme', 'dark');
        }

        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        const html = document.documentElement;
        if (this.isDarkMode) {
            html.setAttribute('data-theme', 'dark');
        } else {
            html.removeAttribute('data-theme');
        }
        localStorage.setItem('theme_choice', this.isDarkMode ? 'dark' : 'light');
    }

    // ============================================
    // SIDEBAR
    // ============================================

    setupSidebar() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');

        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        document.addEventListener('click', (e) => {
            if (window.innerWidth < 768) {
                const isClickInside = sidebar?.contains(e.target);
                const isClickOnToggle = menuToggle?.contains(e.target);
                if (!isClickInside && !isClickOnToggle && this.isSidebarOpen) {
                    this.toggleSidebar();
                }
            }
        });
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            this.isSidebarOpen = !this.isSidebarOpen;
            sidebar.classList.toggle('open', this.isSidebarOpen);
        }
    }

    // ============================================
    // NAVEGAÇÃO
    // ============================================

    setupNavigation() {
        const links = document.querySelectorAll('.sidebar-link');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                if (page) {
                    this.loadPage(page);
                    if (window.innerWidth < 768) {
                        this.toggleSidebar();
                    }
                }
            });
        });
    }

    async loadPage(page) {
        this.currentPage = page;

        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });

        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        try {
            switch(page) {
                case 'dashboard':
                    await this.loadDashboard(mainContent);
                    break;
                case 'minhas-agendas':
                    await this.loadMinhasAgendas(mainContent);
                    break;
                case 'notificacoes':
                    await this.loadNotificacoes(mainContent);
                    break;
                case 'perfil':
                    await this.loadPerfil(mainContent);
                    break;
                default:
                    mainContent.innerHTML = '<h2>Página não encontrada</h2>';
            }
        } catch (error) {
            mainContent.innerHTML = this.renderError('Erro ao carregar página');
            console.error(error);
        }
    }

    // ============================================
    // DASHBOARD
    // ============================================

    async loadDashboard(container) {
        const response = await api.getDashboard();
        
        if (!response.sucesso) {
            container.innerHTML = this.renderError(response.mensagem);
            return;
        }

        const dados = response.dados;
        
        // Filtrar apenas agendas do usuário atual
        const email = auth.getEmail();
        const responseAgendas = await api.listarAgendas();
        const minhasAgendas = responseAgendas.sucesso ? 
            responseAgendas.dados.filter(a => a.Participantes?.includes(email)) : [];

        container.innerHTML = `
            <div class="dashboard-container">
                <h1 class="page-title">Dashboard</h1>
                
                <div class="dashboard-grid">
                    <div class="stat-card">
                        <div class="stat-icon">📅</div>
                        <div class="stat-value">${minhasAgendas.length}</div>
                        <div class="stat-label">Minhas Agendas</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📆</div>
                        <div class="stat-value">${minhasAgendas.filter(a => a.Data === new Date().toISOString().split('T')[0]).length}</div>
                        <div class="stat-label">Agendas Hoje</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">⏰</div>
                        <div class="stat-value">${minhasAgendas.filter(a => a.Status === 'Agendada' || a.Status === 'Confirmada').length}</div>
                        <div class="stat-label">Pendentes</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-value">${minhasAgendas.filter(a => a.Status === 'Realizada').length}</div>
                        <div class="stat-label">Realizadas</div>
                    </div>
                </div>

                <div class="card">
                    <h3 class="card-title">Próximas Agendas</h3>
                    <div class="agendas-list">
                        ${minhasAgendas
                            .filter(a => a.Status !== 'Realizada' && a.Status !== 'Cancelada')
                            .sort((a, b) => new Date(a.Data) - new Date(b.Data))
                            .slice(0, 5)
                            .map(agenda => `
                                <div class="agenda-item">
                                    <div class="agenda-info">
                                        <strong>${agenda['Tipo da Agenda']}</strong>
                                        <span>${new Date(agenda.Data).toLocaleDateString('pt-BR')} às ${agenda.Horário}</span>
                                    </div>
                                    <span class="agenda-status status-${agenda.Status.toLowerCase().replace(/ /g, '')}">${agenda.Status}</span>
                                </div>
                            `).join('') || '<p class="text-muted">Nenhuma agenda próxima</p>'
                        }
                    </div>
                </div>

                <div class="card">
                    <h3 class="card-title">Atividades Recentes</h3>
                    <div class="atividades-list">
                        ${dados.ultimasAtividades.slice(0, 5).map(atividade => `
                            <div class="atividade-item">
                                <span class="atividade-tipo">${atividade.tipo}</span>
                                <span class="atividade-status status-${atividade.status.toLowerCase().replace(/ /g, '')}">${atividade.status}</span>
                                <span class="atividade-data">${new Date(atividade.data).toLocaleString('pt-BR')}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================
    // MINHAS AGENDAS
    // ============================================

    async loadMinhasAgendas(container) {
        const response = await api.listarAgendas();
        
        if (!response.sucesso) {
            container.innerHTML = this.renderError(response.mensagem);
            return;
        }

        const email = auth.getEmail();
        const minhasAgendas = response.dados.filter(a => 
            a.Participantes?.includes(email) || a['Solicitação de Alteração']?.includes(email)
        );

        container.innerHTML = `
            <div class="agendas-container">
                <h1 class="page-title">Minhas Agendas</h1>

                <div class="filtros-container mb-3">
                    <div class="filtros-botoes">
                        <button class="btn btn-outline btn-sm" data-filtro="todas">Todas</button>
                        <button class="btn btn-outline btn-sm" data-filtro="hoje">Hoje</button>
                        <button class="btn btn-outline btn-sm" data-filtro="semana">Esta Semana</button>
                        <button class="btn btn-outline btn-sm" data-filtro="pendentes">Pendentes</button>
                        <button class="btn btn-outline btn-sm" data-filtro="realizadas">Realizadas</button>
                    </div>
                    <div class="search-container">
                        <input type="text" id="searchMinhasAgendas" class="form-control" placeholder="Buscar agenda...">
                    </div>
                </div>

                <div class="agendas-grid">
                    ${minhasAgendas.length === 0 ? `
                        <div class="card text-center">
                            <p class="text-muted">Você não possui agendas</p>
                        </div>
                    ` : minhasAgendas.map(agenda => this.renderAgendaCard(agenda)).join('')}
                </div>
            </div>
        `;

        // Configurar filtros
        document.querySelectorAll('[data-filtro]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.aplicarFiltro(btn.dataset.filtro);
            });
        });

        // Configurar busca
        document.getElementById('searchMinhasAgendas')?.addEventListener('input', (e) => {
            this.filterAgendas(e.target.value);
        });
    }

    renderAgendaCard(agenda) {
        const statusClass = `status-${agenda.Status.toLowerCase().replace(/ /g, '')}`;
        const tipoIcon = this.getTipoIcon(agenda['Tipo da Agenda']);
        const temSolicitacao = agenda['Solicitação de Alteração'] && agenda['Solicitação de Alteração'] !== '';

        return `
            <div class="agenda-card" data-id="${agenda.ID}" data-data="${agenda.Data}" data-status="${agenda.Status}">
                <div class="agenda-card-header">
                    <div class="agenda-type">
                        <span>${tipoIcon}</span>
                        ${agenda['Tipo da Agenda']}
                    </div>
                    <span class="agenda-status ${statusClass}">${agenda.Status}</span>
                </div>
                
                <div class="agenda-details">
                    <div class="agenda-detail">📅 ${new Date(agenda.Data).toLocaleDateString('pt-BR')}</div>
                    <div class="agenda-detail">🕐 ${agenda.Horário}</div>
                    <div class="agenda-detail">👥 ${agenda.Participantes || 'Sem participantes'}</div>
                    <div class="agenda-detail">📍 ${agenda.Local}</div>
                    ${agenda.Descrição ? `<div class="agenda-detail">📝 ${agenda.Descrição}</div>` : ''}
                    ${temSolicitacao ? `<div class="agenda-detail">⏳ Solicitação de alteração pendente</div>` : ''}
                </div>
                
                <div class="agenda-actions">
                    ${agenda['Link Google Maps'] ? `
                        <a href="${agenda['Link Google Maps']}" target="_blank" class="btn btn-primary btn-sm">
                            🗺️ Abrir no Maps
                        </a>
                    ` : ''}
                    
                    ${agenda.Status !== 'Realizada' && agenda.Status !== 'Cancelada' && !temSolicitacao ? `
                        <button class="btn btn-success btn-sm" onclick="dashboard.finalizarAgenda('${agenda.ID}')">
                            ✅ Finalizar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="dashboard.cancelarAgenda('${agenda.ID}')">
                            ❌ Cancelar
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="dashboard.adiarAgenda('${agenda.ID}')">
                            ⏰ Adiar
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getTipoIcon(tipo) {
        const icons = {
            'Reunião': '🤝',
            'Consulta': '👨‍⚕️',
            'Evento': '🎉',
            'Compromisso': '📌',
            'Entrega': '📦',
            'Outro': '📋'
        };
        return icons[tipo] || '📅';
    }

    aplicarFiltro(filtro) {
        const cards = document.querySelectorAll('.agenda-card');
        const hoje = new Date().toISOString().split('T')[0];
        const semanaAtras = new Date();
        semanaAtras.setDate(semanaAtras.getDate() - 7);

        cards.forEach(card => {
            const data = card.dataset.data;
            const status = card.dataset.status;
            let mostrar = true;

            switch(filtro) {
                case 'hoje':
                    mostrar = data === hoje;
                    break;
                case 'semana':
                    mostrar = new Date(data) >= semanaAtras;
                    break;
                case 'pendentes':
                    mostrar = status !== 'Realizada' && status !== 'Cancelada';
                    break;
                case 'realizadas':
                    mostrar = status === 'Realizada';
                    break;
                case 'todas':
                    mostrar = true;
                    break;
            }

            card.style.display = mostrar ? '' : 'none';
        });
    }

    filterAgendas(term) {
        if (!term) {
            document.querySelectorAll('.agenda-card').forEach(el => el.style.display = '');
            return;
        }

        const cards = document.querySelectorAll('.agenda-card');
        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(term.toLowerCase()) ? '' : 'none';
        });
    }

    // ============================================
    // AÇÕES DAS AGENDAS
    // ============================================

    async finalizarAgenda(id) {
        if (!confirm('Tem certeza que deseja finalizar esta agenda?')) return;
        
        try {
            const response = await api.atualizarStatus(id, 'Realizada');
            if (response.sucesso) {
                alert('Agenda finalizada com sucesso!');
                this.loadPage('minhas-agendas');
            } else {
                alert('Erro ao finalizar agenda: ' + response.mensagem);
            }
        } catch (error) {
            alert('Erro ao finalizar agenda');
            console.error(error);
        }
    }

    async cancelarAgenda(id) {
        if (!confirm('Tem certeza que deseja cancelar esta agenda?')) return;
        
        try {
            const response = await api.atualizarStatus(id, 'Cancelada');
            if (response.sucesso) {
                alert('Agenda cancelada com sucesso!');
                this.loadPage('minhas-agendas');
            } else {
                alert('Erro ao cancelar agenda: ' + response.mensagem);
            }
        } catch (error) {
            alert('Erro ao cancelar agenda');
            console.error(error);
        }
    }

    async adiarAgenda(id) {
        const modal = this.openModal('Adiar Agenda');
        modal.innerHTML = `
            <form id="formAdiar">
                <div class="form-group">
                    <label class="form-label">Nova Data *</label>
                    <input type="date" class="form-control" id="novaData" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Novo Horário *</label>
                    <input type="time" class="form-control" id="novoHorario" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Motivo *</label>
                    <textarea class="form-control" id="motivo" rows="3" required></textarea>
                </div>
                <button type="submit" class="btn btn-primary w-100">Enviar Solicitação</button>
            </form>
        `;

        // Preencher data mínima (amanhã)
        const amanha = new Date();
        amanha.setDate(amanha.getDate() + 1);
        document.getElementById('novaData').min = amanha.toISOString().split('T')[0];

        document.getElementById('formAdiar').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const dados = {
                id,
                novaData: document.getElementById('novaData').value,
                novoHorario: document.getElementById('novoHorario').value,
                motivo: document.getElementById('motivo').value,
                usuario: auth.getEmail()
            };

            try {
                const response = await api.solicitarAdiamento(dados);
                if (response.sucesso) {
                    alert('Solicitação enviada com sucesso!');
                    this.closeModal();
                    this.loadPage('minhas-agendas');
                } else {
                    alert('Erro ao enviar solicitação: ' + response.mensagem);
                }
            } catch (error) {
                alert('Erro ao enviar solicitação');
                console.error(error);
            }
        });
    }

    // ============================================
    // NOTIFICAÇÕES
    // ============================================

    async loadNotificacoes(container) {
        const email = auth.getEmail();
        const response = await api.listarNotificacoes(email);
        
        if (!response.sucesso) {
            container.innerHTML = this.renderError(response.mensagem);
            return;
        }

        this.notificacoes = response.dados || [];

        container.innerHTML = `
            <div class="notificacoes-container">
                <h1 class="page-title">Minhas Notificações</h1>
                
                <div class="notificacoes-list">
                    ${this.notificacoes.length === 0 ? `
                        <div class="card text-center">
                            <p class="text-muted">Nenhuma notificação</p>
                        </div>
                    ` : this.notificacoes.map(notif => `
                        <div class="notificacao-item">
                            <div class="icon">${notif.Status === 'Pendente' ? '🔔' : '📬'}</div>
                            <div class="content">
                                <div class="mensagem">${notif.Mensagem}</div>
                                <div class="data">${new Date(notif.Data).toLocaleString('pt-BR')}</div>
                            </div>
                            <span class="status status-${notif.Status.toLowerCase()}">${notif.Status}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // ============================================
    // PERFIL
    // ============================================

    async loadPerfil(container) {
        const usuario = auth.getUsuario();
        
        container.innerHTML = `
            <div class="perfil-container">
                <h1 class="page-title">Meu Perfil</h1>
                
                <div class="card">
                    <div class="perfil-header">
                        <div class="perfil-avatar">${usuario.Nome.charAt(0).toUpperCase()}</div>
                        <h2>${usuario.Nome}</h2>
                        <p class="text-muted">${usuario['E-mail']}</p>
                    </div>
                    
                    <div class="perfil-dados">
                        <div class="perfil-item">
                            <span class="label">Tipo</span>
                            <span class="value">${usuario.Tipo}</span>
                        </div>
                        <div class="perfil-item">
                            <span class="label">Status</span>
                            <span class="value status-${usuario.Status.toLowerCase()}">${usuario.Status}</span>
                        </div>
                        <div class="perfil-item">
                            <span class="label">Data de Cadastro</span>
                            <span class="value">${new Date(usuario['Data Cadastro']).toLocaleDateString('pt-BR')}</span>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3 class="card-title">Estatísticas</h3>
                    <div class="perfil-estatisticas">
                        <div class="estatistica-item">
                            <span class="numero" id="totalAgendas">-</span>
                            <span class="label">Total de Agendas</span>
                        </div>
                        <div class="estatistica-item">
                            <span class="numero" id="agendasRealizadas">-</span>
                            <span class="label">Realizadas</span>
                        </div>
                        <div class="estatistica-item">
                            <span class="numero" id="agendasPendentes">-</span>
                            <span class="label">Pendentes</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Carregar estatísticas
        this.carregarEstatisticas();
    }

    async carregarEstatisticas() {
        try {
            const email = auth.getEmail();
            const response = await api.listarAgendas();
            
            if (response.sucesso) {
                const minhasAgendas = response.dados.filter(a => a.Participantes?.includes(email));
                
                document.getElementById('totalAgendas').textContent = minhasAgendas.length;
                document.getElementById('agendasRealizadas').textContent = 
                    minhasAgendas.filter(a => a.Status === 'Realizada').length;
                document.getElementById('agendasPendentes').textContent = 
                    minhasAgendas.filter(a => a.Status !== 'Realizada' && a.Status !== 'Cancelada').length;
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    // ============================================
    // CONTADORES
    // ============================================

    async loadNotificacoesCount() {
        try {
            const email = auth.getEmail();
            const response = await api.listarNotificacoes(email);
            if (response.sucesso) {
                const pendentes = response.dados.filter(n => n.Status === 'Pendente');
                const badge = document.getElementById('notificacoesBadge');
                if (badge) {
                    badge.textContent = pendentes.length;
                    badge.style.display = pendentes.length > 0 ? '' : 'none';
                }
            }
        } catch (error) {
            console.error('Erro ao carregar contagem de notificações:', error);
        }
    }

    // ============================================
    // UTILITÁRIOS
    // ============================================

    setupLogout() {
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja sair?')) {
                auth.logout();
            }
        });
    }

    openModal(title) {
        let overlay = document.querySelector('.modal-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal">
                    <div class="modal-header">
                        <h2 class="modal-title"></h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body"></div>
                </div>
            `;
            document.body.appendChild(overlay);
            
            overlay.querySelector('.modal-close').addEventListener('click', () => {
                this.closeModal();
            });
            
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeModal();
                }
            });
        }

        overlay.querySelector('.modal-title').textContent = title;
        overlay.classList.add('active');
        return overlay.querySelector('.modal-body');
    }

    closeModal() {
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    renderError(mensagem) {
        return `
            <div class="card text-center">
                <h2>❌ Erro</h2>
                <p class="text-muted">${mensagem}</p>
                <button class="btn btn-primary mt-2" onclick="location.reload()">Tentar Novamente</button>
            </div>
        `;
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registrado:', registration);
                })
                .catch(error => {
                    console.error('Erro ao registrar Service Worker:', error);
                });
        }
    }
}

// Inicializar
const dashboard = new DashboardApp();
window.dashboard = dashboard;
