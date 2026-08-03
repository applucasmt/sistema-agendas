/**
 * Aplicação Principal - Controle de Rotas e UI
 * @version 1.0.0
 */

class App {
    constructor() {
        this.currentPage = 'dashboard';
        this.isSidebarOpen = false;
        this.isDarkMode = this.loadTheme();
        this.init();
    }

    /**
     * Inicializa a aplicação
     */
    init() {
        this.setupTheme();
        this.setupSidebar();
        this.setupNavigation();
        this.setupSearch();
        this.loadPage('dashboard');
        this.registerServiceWorker();
    }

    /**
     * Configura tema (Dark/Light)
     */
    setupTheme() {
        const html = document.documentElement;
        if (this.isDarkMode) {
            html.setAttribute('data-theme', 'dark');
        } else {
            html.removeAttribute('data-theme');
        }

        // Botão de toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Detectar preferência do sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        prefersDark.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme_choice')) {
                this.setTheme(e.matches);
            }
        });
    }

    /**
     * Carrega tema salvo
     */
    loadTheme() {
        const saved = localStorage.getItem('theme_choice');
        if (saved) {
            return saved === 'dark';
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    /**
     * Altera tema
     */
    setTheme(isDark) {
        this.isDarkMode = isDark;
        const html = document.documentElement;
        if (isDark) {
            html.setAttribute('data-theme', 'dark');
        } else {
            html.removeAttribute('data-theme');
        }
        localStorage.setItem('theme_choice', isDark ? 'dark' : 'light');
    }

    /**
     * Alterna tema
     */
    toggleTheme() {
        this.setTheme(!this.isDarkMode);
    }

    /**
     * Configura Sidebar
     */
    setupSidebar() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');

        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Fechar sidebar ao clicar fora (mobile)
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

    /**
     * Alterna Sidebar
     */
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            this.isSidebarOpen = !this.isSidebarOpen;
            sidebar.classList.toggle('open', this.isSidebarOpen);
        }
    }

    /**
     * Configura navegação
     */
    setupNavigation() {
        const links = document.querySelectorAll('.sidebar-link');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                if (page) {
                    this.loadPage(page);
                    
                    // Fechar sidebar em mobile
                    if (window.innerWidth < 768) {
                        this.toggleSidebar();
                    }
                }
            });
        });
    }

    /**
     * Configura busca
     */
    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                this.filterAgendas(term);
            });
        }
    }

    /**
     * Carrega página
     */
    async loadPage(page) {
        this.currentPage = page;
        
        // Atualizar link ativo
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });

        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        // Carregar conteúdo baseado na página
        switch(page) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'agendas':
                await this.loadAgendas();
                break;
            case 'solicitacoes':
                await this.loadSolicitacoes();
                break;
            case 'usuarios':
                await this.loadUsuarios();
                break;
            case 'notificacoes':
                await this.loadNotificacoes();
                break;
            case 'configuracoes':
                await this.loadConfiguracoes();
                break;
            default:
                mainContent.innerHTML = '<h2>Página não encontrada</h2>';
        }
    }

    /**
     * Carrega Dashboard
     */
    async loadDashboard() {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        try {
            const response = await api.getDashboard();
            
            if (response.sucesso) {
                const dados = response.dados;
                mainContent.innerHTML = this.renderDashboard(dados);
                this.initCharts(dados);
            } else {
                mainContent.innerHTML = this.renderError(response.mensagem);
            }
        } catch (error) {
            mainContent.innerHTML = this.renderError('Erro ao carregar dashboard');
            console.error(error);
        }
    }

    /**
     * Renderiza Dashboard
     */
    renderDashboard(dados) {
        return `
            <div class="dashboard-container">
                <h1 class="page-title">Dashboard</h1>
                
                <div class="dashboard-grid">
                    <div class="stat-card">
                        <div class="stat-icon">📅</div>
                        <div class="stat-value">${dados.total}</div>
                        <div class="stat-label">Total de Agendas</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📆</div>
                        <div class="stat-value">${dados.agendasHoje}</div>
                        <div class="stat-label">Agendas de Hoje</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">⏰</div>
                        <div class="stat-value">${dados.agendasFuturas}</div>
                        <div class="stat-label">Agendas Futuras</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-value">${dados.realizadas}</div>
                        <div class="stat-label">Realizadas</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">❌</div>
                        <div class="stat-value">${dados.canceladas}</div>
                        <div class="stat-label">Canceladas</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📩</div>
                        <div class="stat-value">${dados.solicitacoesPendentes}</div>
                        <div class="stat-label">Solicitações Pendentes</div>
                    </div>
                </div>

                <div class="charts-grid">
                    <div class="card">
                        <h3 class="card-title">Agendas por Mês</h3>
                        <canvas id="chartMes"></canvas>
                    </div>
                    <div class="card">
                        <h3 class="card-title">Agendas por Status</h3>
                        <canvas id="chartStatus"></canvas>
                    </div>
                    <div class="card">
                        <h3 class="card-title">Agendas por Tipo</h3>
                        <canvas id="chartTipo"></canvas>
                    </div>
                </div>

                <div class="card">
                    <h3 class="card-title">Últimas Atividades</h3>
                    <div class="atividades-list">
                        ${dados.ultimasAtividades.map(atividade => `
                            <div class="atividade-item">
                                <span class="atividade-tipo">${atividade.tipo}</span>
                                <span class="atividade-status status-${atividade.status.toLowerCase()}">${atividade.status}</span>
                                <span class="atividade-data">${new Date(atividade.data).toLocaleString()}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Inicializa gráficos
     */
    initCharts(dados) {
        // Gráfico por Mês
        const ctxMes = document.getElementById('chartMes');
        if (ctxMes) {
            const meses = Object.keys(dados.mesMap);
            const valores = Object.values(dados.mesMap);
            
            new Chart(ctxMes, {
                type: 'bar',
                data: {
                    labels: meses,
                    datasets: [{
                        label: 'Agendas',
                        data: valores,
                        backgroundColor: 'rgba(0, 122, 255, 0.6)',
                        borderColor: 'rgba(0, 122, 255, 1)',
                        borderWidth: 2,
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }

        // Gráfico por Status
        const ctxStatus = document.getElementById('chartStatus');
        if (ctxStatus) {
            const statusMap = dados.statusMap;
            const labels = Object.keys(statusMap);
            const data = Object.values(statusMap);
            const colors = {
                'Agendada': 'rgba(0, 122, 255, 0.8)',
                'Confirmada': 'rgba(52, 199, 89, 0.8)',
                'Em andamento': 'rgba(255, 149, 0, 0.8)',
                'Realizada': 'rgba(142, 142, 147, 0.8)',
                'Cancelada': 'rgba(255, 59, 48, 0.8)',
                'Adiada': 'rgba(175, 82, 222, 0.8)'
            };
            
            new Chart(ctxStatus, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: labels.map(label => colors[label] || 'rgba(0, 0, 0, 0.1)'),
                        borderWidth: 2,
                        borderColor: 'var(--bg-secondary)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 16,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        }
                    }
                }
            });
        }

        // Gráfico por Tipo
        const ctxTipo = document.getElementById('chartTipo');
        if (ctxTipo) {
            const tipoMap = dados.tipoMap;
            const labels = Object.keys(tipoMap);
            const data = Object.values(tipoMap);
            
            new Chart(ctxTipo, {
                type: 'polarArea',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: [
                            'rgba(0, 122, 255, 0.6)',
                            'rgba(52, 199, 89, 0.6)',
                            'rgba(255, 149, 0, 0.6)',
                            'rgba(255, 59, 48, 0.6)',
                            'rgba(175, 82, 222, 0.6)',
                            'rgba(90, 200, 250, 0.6)'
                        ],
                        borderWidth: 2,
                        borderColor: 'var(--bg-secondary)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 16,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        }
                    }
                }
            });
        }
    }

    /**
     * Carrega Agendas
     */
    async loadAgendas() {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        try {
            const response = await api.listarAgendas();
            
            if (response.sucesso) {
                mainContent.innerHTML = this.renderAgendas(response.dados);
                this.setupAgendaActions();
            } else {
                mainContent.innerHTML = this.renderError(response.mensagem);
            }
        } catch (error) {
            mainContent.innerHTML = this.renderError('Erro ao carregar agendas');
            console.error(error);
        }
    }

    /**
     * Renderiza Agendas
     */
    renderAgendas(agendas) {
        return `
            <div class="agendas-container">
                <div class="flex-between mb-3">
                    <h1 class="page-title">Agendas</h1>
                    <button class="btn btn-primary" onclick="app.openCriarAgenda()">
                        + Nova Agenda
                    </button>
                </div>

                <div class="filtros-container mb-3">
                    <div class="filtros-botoes">
                        <button class="btn btn-outline btn-sm" data-filtro="hoje">Hoje</button>
                        <button class="btn btn-outline btn-sm" data-filtro="semana">Esta Semana</button>
                        <button class="btn btn-outline btn-sm" data-filtro="mes">Este Mês</button>
                        <button class="btn btn-outline btn-sm" data-filtro="realizadas">Realizadas</button>
                        <button class="btn btn-outline btn-sm" data-filtro="canceladas">Canceladas</button>
                        <button class="btn btn-outline btn-sm" data-filtro="agendadas">Agendadas</button>
                        <button class="btn btn-outline btn-sm" data-filtro="confirmadas">Confirmadas</button>
                    </div>
                    <div class="search-container">
                        <input type="text" id="searchAgenda" class="form-control" placeholder="Buscar agenda...">
                    </div>
                </div>

                <div class="agendas-grid">
                    ${agendas.length === 0 ? `
                        <div class="card text-center">
                            <p class="text-muted">Nenhuma agenda encontrada</p>
                        </div>
                    ` : agendas.map(agenda => this.renderAgendaCard(agenda)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Renderiza card de agenda
     */
    renderAgendaCard(agenda) {
        const statusClass = `status-${agenda.Status.toLowerCase().replace(/ /g, '')}`;
        const tipoIcon = this.getTipoIcon(agenda['Tipo da Agenda']);
        
        return `
            <div class="agenda-card" data-id="${agenda.ID}">
                <div class="agenda-card-header">
                    <div class="agenda-type">
                        <span>${tipoIcon}</span>
                        ${agenda['Tipo da Agenda']}
                    </div>
                    <span class="agenda-status ${statusClass}">${agenda.Status}</span>
                </div>
                
                <div class="agenda-details">
                    <div class="agenda-detail">
                        📅 ${new Date(agenda.Data).toLocaleDateString('pt-BR')}
                    </div>
                    <div class="agenda-detail">
                        🕐 ${agenda.Horário}
                    </div>
                    <div class="agenda-detail">
                        👥 ${agenda.Participantes || 'Sem participantes'}
                    </div>
                    <div class="agenda-detail">
                        📍 ${agenda.Local}
                    </div>
                    ${agenda.Descrição ? `
                        <div class="agenda-detail">
                            📝 ${agenda.Descrição}
                        </div>
                    ` : ''}
                </div>
                
                <div class="agenda-actions">
                    ${agenda['Link Google Maps'] ? `
                        <a href="${agenda['Link Google Maps']}" target="_blank" class="btn btn-primary btn-sm">
                            🗺️ Abrir no Maps
                        </a>
                    ` : ''}
                    
                    ${!auth.isAdmin() && agenda.Status !== 'Realizada' && agenda.Status !== 'Cancelada' ? `
                        <button class="btn btn-success btn-sm" onclick="app.finalizarAgenda('${agenda.ID}')">
                            ✅ Finalizar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="app.cancelarAgenda('${agenda.ID}')">
                            ❌ Cancelar
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="app.adiarAgenda('${agenda.ID}')">
                            ⏰ Adiar
                        </button>
                    ` : ''}
                    
                    ${auth.isAdmin() ? `
                        <button class="btn btn-outline btn-sm" onclick="app.editarAgenda('${agenda.ID}')">
                            ✏️ Editar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="app.excluirAgenda('${agenda.ID}')">
                            🗑️ Excluir
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Obtém ícone do tipo
     */
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

    /**
     * Configura ações das agendas
     */
    setupAgendaActions() {
        // Filtros
        document.querySelectorAll('[data-filtro]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.aplicarFiltro(btn.dataset.filtro);
            });
        });

        // Busca
        const searchInput = document.getElementById('searchAgenda');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterAgendas(e.target.value);
            });
        }
    }

    /**
     * Aplica filtro
     */
    aplicarFiltro(filtro) {
        const cards = document.querySelectorAll('.agenda-card');
        const hoje = new Date().toISOString().split('T')[0];
        const semanaAtras = new Date();
        semanaAtras.setDate(semanaAtras.getDate() - 7);
        const mesAtras = new Date();
        mesAtras.setMonth(mesAtras.getMonth() - 1);

        cards.forEach(card => {
            const data = card.querySelector('.agenda-detail')?.textContent?.trim() || '';
            const status = card.querySelector('.agenda-status')?.textContent || '';
            let mostrar = true;

            switch(filtro) {
                case 'hoje':
                    mostrar = data.includes(hoje);
                    break;
                case 'semana':
                    mostrar = new Date(data) >= semanaAtras;
                    break;
                case 'mes':
                    mostrar = new Date(data) >= mesAtras;
                    break;
                case 'realizadas':
                    mostrar = status === 'Realizada';
                    break;
                case 'canceladas':
                    mostrar = status === 'Cancelada';
                    break;
                case 'agendadas':
                    mostrar = status === 'Agendada';
                    break;
                case 'confirmadas':
                    mostrar = status === 'Confirmada';
                    break;
            }

            card.style.display = mostrar ? '' : 'none';
        });
    }

    /**
     * Filtra agendas pela busca
     */
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

    /**
     * Finaliza agenda
     */
    async finalizarAgenda(id) {
        if (!confirm('Tem certeza que deseja finalizar esta agenda?')) return;
        
        try {
            const response = await api.atualizarStatus(id, 'Realizada');
            if (response.sucesso) {
                alert('Agenda finalizada com sucesso!');
                this.loadPage('agendas');
            } else {
                alert('Erro ao finalizar agenda: ' + response.mensagem);
            }
        } catch (error) {
            alert('Erro ao finalizar agenda');
            console.error(error);
        }
    }

    /**
     * Cancela agenda
     */
    async cancelarAgenda(id) {
        if (!confirm('Tem certeza que deseja cancelar esta agenda?')) return;
        
        try {
            const response = await api.atualizarStatus(id, 'Cancelada');
            if (response.sucesso) {
                alert('Agenda cancelada com sucesso!');
                this.loadPage('agendas');
            } else {
                alert('Erro ao cancelar agenda: ' + response.mensagem);
            }
        } catch (error) {
            alert('Erro ao cancelar agenda');
            console.error(error);
        }
    }

    /**
     * Adia agenda
     */
    async adiarAgenda(id) {
        const modal = this.openModal('Adiar Agenda');
        modal.innerHTML = `
            <h2>Adiar Agenda</h2>
            <form id="formAdiar">
                <div class="form-group">
                    <label class="form-label">Nova Data</label>
                    <input type="date" class="form-control" id="novaData" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Novo Horário</label>
                    <input type="time" class="form-control" id="novoHorario" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Motivo</label>
                    <textarea class="form-control" id="motivo" rows="3" required></textarea>
                </div>
                <button type="submit" class="btn btn-primary w-100">Enviar Solicitação</button>
            </form>
        `;

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
                    this.loadPage('agendas');
                } else {
                    alert('Erro ao enviar solicitação: ' + response.mensagem);
                }
            } catch (error) {
                alert('Erro ao enviar solicitação');
                console.error(error);
            }
        });
    }

    /**
     * Abre modal
     */
    openModal(title) {
        // Criar overlay se não existir
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

    /**
     * Fecha modal
     */
    closeModal() {
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    /**
     * Renderiza erro
     */
    renderError(mensagem) {
        return `
            <div class="card text-center">
                <h2>❌ Erro</h2>
                <p class="text-muted">${mensagem}</p>
                <button class="btn btn-primary mt-2" onclick="location.reload()">Tentar Novamente</button>
            </div>
        `;
    }

    /**
     * Registra Service Worker
     */
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

// Inicializar aplicação
const app = new App();

// Tornar app global para uso em eventos inline
window.app = app;
