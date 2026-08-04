/**
 * Admin App - Painel Administrativo
 * @version 1.0.0
 */

class AdminApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.isSidebarOpen = false;
        this.isDarkMode = this.loadTheme();
        this.notificacoes = [];
        this.solicitacoes = [];
        this.init();
    }

    init() {
        this.setupTheme();
        this.setupSidebar();
        this.setupNavigation();
        this.setupLogout();
        this.loadPage('dashboard');
        this.loadNotificacoesCount();
        this.loadSolicitacoesCount();
        this.registerServiceWorker();
    }

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
                case 'agendas':
                    await this.loadAgendas(mainContent);
                    break;
                case 'solicitacoes':
                    await this.loadSolicitacoes(mainContent);
                    break;
                case 'usuarios':
                    await this.loadUsuarios(mainContent);
                    break;
                case 'notificacoes':
                    await this.loadNotificacoes(mainContent);
                    break;
                case 'configuracoes':
                    await this.loadConfiguracoes(mainContent);
                    break;
                default:
                    mainContent.innerHTML = '<h2>Página não encontrada</h2>';
            }
        } catch (error) {
            mainContent.innerHTML = this.renderError('Erro ao carregar página');
            console.error(error);
        }
    }

    async loadDashboard(container) {
        const response = await api.getDashboard();
        
        if (!response.sucesso) {
            container.innerHTML = this.renderError(response.mensagem);
            return;
        }

        const dados = response.dados;
        container.innerHTML = `
            <div class="dashboard-container">
                <h1 class="page-title">Dashboard Administrativo</h1>
                
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
                        <canvas id="chartMes" height="250"></canvas>
                    </div>
                    <div class="card">
                        <h3 class="card-title">Agendas por Status</h3>
                        <canvas id="chartStatus" height="250"></canvas>
                    </div>
                    <div class="card">
                        <h3 class="card-title">Agendas por Tipo</h3>
                        <canvas id="chartTipo" height="250"></canvas>
                    </div>
                </div>

                <div class="card">
                    <h3 class="card-title">Últimas Atividades</h3>
                    <div class="atividades-list">
                        ${dados.ultimasAtividades.map(atividade => `
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

        this.initCharts(dados);
    }

    initCharts(dados) {
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
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }

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

    async loadAgendas(container) {
        const response = await api.listarAgendas();
        
        if (!response.sucesso) {
            container.innerHTML = this.renderError(response.mensagem);
            return;
        }

        container.innerHTML = `
            <div class="agendas-container">
                <div class="flex-between mb-3">
                    <h1 class="page-title">Gerenciar Agendas</h1>
                    <button class="btn btn-primary" onclick="admin.abrirCriarAgenda()">
                        + Nova Agenda
                    </button>
                </div>

                <div class="search-container mb-3">
                    <input type="text" id="searchAdminAgenda" class="form-control" placeholder="Buscar agenda...">
                </div>

                <div class="agendas-grid">
                    ${response.dados.length === 0 ? `
                        <div class="card text-center">
                            <p class="text-muted">Nenhuma agenda cadastrada</p>
                        </div>
                    ` : response.dados.map(agenda => this.renderAdminAgendaCard(agenda)).join('')}
                </div>
            </div>
        `;

        document.getElementById('searchAdminAgenda')?.addEventListener('input', (e) => {
            this.filterAdminAgendas(e.target.value);
        });
    }

    renderAdminAgendaCard(agenda) {
        const statusClass = `status-${agenda.Status.toLowerCase().replace(/ /g, '')}`;
        
        return `
            <div class="agenda-card" data-id="${agenda.ID}" onclick="admin.verDetalhesAgenda('${agenda.ID}')" style="cursor: pointer;">
                <div class="agenda-card-header">
                    <div class="agenda-type">
                        <span>${this.getTipoIcon(agenda['Tipo da Agenda'])}</span>
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
                </div>
                
                <div class="agenda-actions" onclick="event.stopPropagation();">
                    ${agenda['Link Google Maps'] ? `
                        <a href="${agenda['Link Google Maps']}" target="_blank" class="btn btn-primary btn-sm">🗺️ Maps</a>
                    ` : ''}
                    <button class="btn btn-outline btn-sm" onclick="admin.editarAgenda('${agenda.ID}')">✏️ Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="admin.excluirAgenda('${agenda.ID}')">🗑️ Excluir</button>
                </div>
            </div>
        `;
    }

    filterAdminAgendas(term) {
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

    async verDetalhesAgenda(id) {
        await agendaDetail.open(id);
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

    async loadSolicitacoes(container) {
        const response = await api.listarAgendas();
        
        if (!response.sucesso) {
            container.innerHTML = this.renderError(response.mensagem);
            return;
        }

        const solicitacoes = response.dados.filter(a => a['Solicitação de Alteração'] && a['Solicitação de Alteração'] !== '');

        container.innerHTML = `
            <div class="solicitacoes-container">
                <h1 class="page-title">Solicitações de Alteração</h1>
                
                ${solicitacoes.length === 0 ? `
                    <div class="card text-center">
                        <p class="text-muted">Nenhuma solicitação pendente</p>
                    </div>
                ` : `
                    <div class="card">
                        <table class="solicitacoes-table">
                            <thead>
                                <tr>
                                    <th>Agenda</th>
                                    <th>Data Atual</th>
                                    <th>Nova Data</th>
                                    <th>Novo Horário</th>
                                    <th>Motivo</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${solicitacoes.map(s => {
                                    let solicitacao;
                                    try {
                                        solicitacao = JSON.parse(s['Solicitação de Alteração']);
                                    } catch {
                                        solicitacao = { motivo: s['Solicitação de Alteração'] };
                                    }
                                    
                                    return `
                                        <tr>
                                            <td><strong>${s['Tipo da Agenda']}</strong><br><small>ID: ${s.ID}</small></td>
                                            <td>${new Date(s.Data).toLocaleDateString('pt-BR')}</td>
                                            <td>${new Date(s['Nova Data']).toLocaleDateString('pt-BR')}</td>
                                            <td>${s['Novo Horário']}</td>
                                            <td>${solicitacao.motivo || 'Não informado'}</td>
                                            <td>
                                                <div class="solicitacao-actions">
                                                    <button class="btn btn-success btn-sm" onclick="admin.aprovarSolicitacao('${s.ID}')">✓ Aprovar</button>
                                                    <button class="btn btn-danger btn-sm" onclick="admin.recusarSolicitacao('${s.ID}')">✗ Recusar</button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    }

    async aprovarSolicitacao(id) {
        if (!confirm('Aprovar esta solicitação?')) return;
        
        try {
            const response = await api.aprovarAdiamento({
                id,
                usuario: auth.getEmail()
            });
            
            if (response.sucesso) {
                alert('Solicitação aprovada com sucesso!');
                this.loadPage('solicitacoes');
                this.loadSolicitacoesCount();
            } else {
                alert('Erro ao aprovar: ' + response.mensagem);
            }
        } catch (error) {
            alert('Erro ao aprovar solicitação');
            console.error(error);
        }
    }

    async recusarSolicitacao(id) {
        const motivo = prompt('Informe o motivo da recusa:');
        if (motivo === null) return;
        
        try {
            const response = await api.recusarAdiamento({
                id,
                motivo,
                usuario: auth.getEmail()
            });
            
            if (response.sucesso) {
                alert('Solicitação recusada!');
                this.loadPage('solicitacoes');
                this.loadSolicitacoesCount();
            } else {
                alert('Erro ao recusar: ' + response.mensagem);
            }
        } catch (error) {
            alert('Erro ao recusar solicitação');
            console.error(error);
        }
    }

    async loadUsuarios(container) {
        const response = await api.listarUsuarios();
        
        if (!response.sucesso) {
            container.innerHTML = this.renderError(response.mensagem);
            return;
        }

        container.innerHTML = `
            <div class="usuarios-container">
                <div class="flex-between mb-3">
                    <h1 class="page-title">Gerenciar Usuários</h1>
                    <button class="btn btn-primary" onclick="admin.abrirCriarUsuario()">
                        + Novo Usuário
                    </button>
                </div>

                <div class="usuarios-grid">
                    ${response.dados.map(usuario => `
                        <div class="usuario-card">
                            <div class="avatar">${usuario.Nome.charAt(0).toUpperCase()}</div>
                            <div class="nome">${usuario.Nome}</div>
                            <div class="email">${usuario['E-mail']}</div>
                            <div style="margin-top: var(--spacing-sm);">
                                <span class="tipo">${usuario.Tipo}</span>
                                <span class="status status-${usuario.Status.toLowerCase()}">${usuario.Status}</span>
                            </div>
                            <div class="actions">
                                <button class="btn btn-outline btn-sm" onclick="admin.editarUsuario('${usuario.ID}')">✏️ Editar</button>
                                <button class="btn btn-danger btn-sm" onclick="admin.excluirUsuario('${usuario.ID}')">🗑️ Excluir</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    async loadNotificacoes(container) {
        const response = await api.listarNotificacoes();
        
        if (!response.sucesso) {
            container.innerHTML = this.renderError(response.mensagem);
            return;
        }

        this.notificacoes = response.dados || [];

        container.innerHTML = `
            <div class="notificacoes-container">
                <h1 class="page-title">Notificações</h1>
                
                <div class="notificacoes-list">
                    ${this.notificacoes.length === 0 ? `
                        <div class="card text-center">
                            <p class="text-muted">Nenhuma notificação</p>
                        </div>
                    ` : this.notificacoes.map(notif => `
                        <div class="notificacao-item">
                            <div class="icon">📬</div>
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

    loadConfiguracoes(container) {
        container.innerHTML = `
            <div class="configuracoes-container">
                <h1 class="page-title">Configurações</h1>
                
                <div class="card">
                    <div class="config-section">
                        <h3>Aparência</h3>
                        <div class="config-item">
                            <span class="label">Tema Escuro</span>
                            <div class="toggle-switch ${this.isDarkMode ? 'active' : ''}" onclick="admin.toggleTheme()">
                                <div class="slider"></div>
                            </div>
                        </div>
                    </div>

                    <div class="config-section">
                        <h3>Sistema</h3>
                        <div class="config-item">
                            <span class="label">Versão</span>
                            <span class="value">1.0.0</span>
                        </div>
                        <div class="config-item">
                            <span class="label">Administrador</span>
                            <span class="value">${auth.getEmail()}</span>
                        </div>
                    </div>

                    <div class="config-section">
                        <h3>Dados</h3>
                        <div class="config-item">
                            <span class="label">Total de Agendas</span>
                            <span class="value" id="totalAgendas">Carregando...</span>
                        </div>
                        <div class="config-item">
                            <span class="label">Total de Usuários</span>
                            <span class="value" id="totalUsuarios">Carregando...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.carregarDadosConfiguracoes();
    }

    async carregarDadosConfiguracoes() {
        try {
            const [agendas, usuarios] = await Promise.all([
                api.listarAgendas(),
                api.listarUsuarios()
            ]);
            
            document.getElementById('totalAgendas').textContent = agendas.sucesso ? agendas.dados.length : 'Erro';
            document.getElementById('totalUsuarios').textContent = usuarios.sucesso ? usuarios.dados.length : 'Erro';
        } catch (error) {
            console.error('Erro ao carregar dados das configurações:', error);
        }
    }

    abrirCriarAgenda() {
        const hoje = new Date().toISOString().split('T')[0];
        modal.form({
            title: 'Nova Agenda',
            fields: [
                {
                    id: 'tipo',
                    label: 'Tipo da Agenda',
                    type: 'select',
                    required: true,
                    options: [
                        { value: '', label: 'Selecione...' },
                        { value: 'Reunião', label: 'Reunião' },
                        { value: 'Consulta', label: 'Consulta' },
                        { value: 'Evento', label: 'Evento' },
                        { value: 'Compromisso', label: 'Compromisso' },
                        { value: 'Entrega', label: 'Entrega' },
                        { value: 'Outro', label: 'Outro' }
                    ]
                },
                {
                    id: 'status',
                    label: 'Status',
                    type: 'select',
                    required: true,
                    value: 'Agendada',
                    options: [
                        { value: 'Agendada', label: 'Agendada' },
                        { value: 'Confirmada', label: 'Confirmada' },
                        { value: 'Em andamento', label: 'Em andamento' },
                        { value: 'Realizada', label: 'Realizada' },
                        { value: 'Cancelada', label: 'Cancelada' },
                        { value: 'Adiada', label: 'Adiada' }
                    ]
                },
                {
                    id: 'data',
                    label: 'Data',
                    type: 'date',
                    required: true,
                    value: hoje
                },
                {
                    id: 'horario',
                    label: 'Horário',
                    type: 'time',
                    required: true,
                    value: '09:00'
                },
                {
                    id: 'participantes',
                    label: 'Participantes',
                    type: 'text',
                    placeholder: 'Nomes separados por vírgula'
                },
                {
                    id: 'local',
                    label: 'Local',
                    type: 'text',
                    required: true,
                    placeholder: 'Endereço completo'
                },
                {
                    id: 'descricao',
                    label: 'Descrição',
                    type: 'textarea',
                    placeholder: 'Descrição da agenda...',
                    rows: 3
                }
            ],
            submitText: 'Criar Agenda',
            onSubmit: async (data) => {
                const dados = {
                    tipo: data.tipo,
                    status: data.status,
                    data: data.data,
                    horario: data.horario,
                    participantes: data.participantes,
                    local: data.local,
                    descricao: data.descricao,
                    usuario: auth.getEmail()
                };

                try {
                    const response = await api.criarAgenda(dados);
                    if (response.sucesso) {
                        modal.alert({
                            title: '✅ Sucesso',
                            message: 'Agenda criada com sucesso!'
                        });
                        setTimeout(() => {
                            this.loadPage('agendas');
                        }, 1500);
                    } else {
                        modal.alert({
                            title: 'Erro',
                            message: response.mensagem
                        });
                    }
                } catch (error) {
                    modal.alert({
                        title: 'Erro',
                        message: 'Não foi possível criar a agenda'
                    });
                }
            }
        });
    }

    async editarAgenda(id) {
        const response = await api.buscarAgenda(id);
        if (!response.sucesso) {
            modal.alert({
                title: 'Erro',
                message: response.mensagem
            });
            return;
        }

        const agenda = response.dados;
        
        modal.form({
            title: 'Editar Agenda',
            fields: [
                {
                    id: 'tipo',
                    label: 'Tipo da Agenda',
                    type: 'select',
                    required: true,
                    value: agenda['Tipo da Agenda'],
                    options: [
                        { value: 'Reunião', label: 'Reunião' },
                        { value: 'Consulta', label: 'Consulta' },
                        { value: 'Evento', label: 'Evento' },
                        { value: 'Compromisso', label: 'Compromisso' },
                        { value: 'Entrega', label: 'Entrega' },
                        { value: 'Outro', label: 'Outro' }
                    ]
                },
                {
                    id: 'status',
                    label: 'Status',
                    type: 'select',
                    required: true,
                    value: agenda.Status,
                    options: [
                        { value: 'Agendada', label: 'Agendada' },
                        { value: 'Confirmada', label: 'Confirmada' },
                        { value: 'Em andamento', label: 'Em andamento' },
                        { value: 'Realizada', label: 'Realizada' },
                        { value: 'Cancelada', label: 'Cancelada' },
                        { value: 'Adiada', label: 'Adiada' }
                    ]
                },
                {
                    id: 'data',
                    label: 'Data',
                    type: 'date',
                    required: true,
                    value: agenda.Data
                },
                {
                    id: 'horario',
                    label: 'Horário',
                    type: 'time',
                    required: true,
                    value: agenda.Horário
                },
                {
                    id: 'participantes',
                    label: 'Participantes',
                    type: 'text',
                    value: agenda.Participantes || '',
                    placeholder: 'Nomes separados por vírgula'
                },
                {
                    id: 'local',
                    label: 'Local',
                    type: 'text',
                    required: true,
                    value: agenda.Local,
                    placeholder: 'Endereço completo'
                },
                {
                    id: 'descricao',
                    label: 'Descrição',
                    type: 'textarea',
                    value: agenda.Descrição || '',
                    placeholder: 'Descrição da agenda...',
                    rows: 3
                }
            ],
            submitText: 'Salvar Alterações',
            onSubmit: async (data) => {
                const dados = {
                    id: agenda.ID,
                    tipo: data.tipo,
                    status: data.status,
                    data: data.data,
                    horario: data.horario,
                    participantes: data.participantes,
                    local: data.local,
                    descricao: data.descricao
                };

                try {
                    const response = await api.editarAgenda(dados);
                    if (response.sucesso) {
                        modal.alert({
                            title: '✅ Sucesso',
                            message: 'Agenda atualizada com sucesso!'
                        });
                        setTimeout(() => {
                            this.loadPage('agendas');
                        }, 1500);
                    } else {
                        modal.alert({
                            title: 'Erro',
                            message: response.mensagem
                        });
                    }
                } catch (error) {
                    modal.alert({
                        title: 'Erro',
                        message: 'Não foi possível atualizar a agenda'
                    });
                }
            }
        });
    }

    async excluirAgenda(id) {
        const result = await modal.confirm({
            title: '⚠️ Excluir Agenda',
            message: 'Tem certeza que deseja excluir esta agenda permanentemente?',
            confirmText: 'Excluir',
            confirmClass: 'btn-danger'
        });

        if (result) {
            try {
                const response = await api.excluirAgenda(id);
                if (response.sucesso) {
                    modal.alert({
                        title: '✅ Sucesso',
                        message: 'Agenda excluída com sucesso!'
                    });
                    setTimeout(() => {
                        this.loadPage('agendas');
                    }, 1500);
                } else {
                    modal.alert({
                        title: 'Erro',
                        message: response.mensagem
                    });
                }
            } catch (error) {
                modal.alert({
                    title: 'Erro',
                    message: 'Não foi possível excluir a agenda'
                });
            }
        }
    }

    abrirCriarUsuario() {
        modal.form({
            title: 'Novo Usuário',
            fields: [
                {
                    id: 'nome',
                    label: 'Nome',
                    type: 'text',
                    required: true,
                    placeholder: 'Nome completo'
                },
                {
                    id: 'email',
                    label: 'E-mail',
                    type: 'email',
                    required: true,
                    placeholder: 'email@exemplo.com'
                },
                {
                    id: 'tipo',
                    label: 'Tipo',
                    type: 'select',
                    required: true,
                    value: 'Usuário',
                    options: [
                        { value: 'Usuário', label: 'Usuário' },
                        { value: 'Administrador', label: 'Administrador' }
                    ]
                },
                {
                    id: 'senha',
                    label: 'Senha',
                    type: 'password',
                    required: true,
                    placeholder: 'Mínimo 6 caracteres'
                }
            ],
            submitText: 'Criar Usuário',
            onSubmit: async (data) => {
                try {
                    const response = await api.criarUsuario(data);
                    if (response.sucesso) {
                        modal.alert({
                            title: '✅ Sucesso',
                            message: 'Usuário criado com sucesso!'
                        });
                        setTimeout(() => {
                            this.loadPage('usuarios');
                        }, 1500);
                    } else {
                        modal.alert({
                            title: 'Erro',
                            message: response.mensagem
                        });
                    }
                } catch (error) {
                    modal.alert({
                        title: 'Erro',
                        message: 'Não foi possível criar o usuário'
                    });
                }
            }
        });
    }

    async editarUsuario(id) {
        const response = await api.listarUsuarios();
        if (!response.sucesso) {
            modal.alert({
                title: 'Erro',
                message: 'Erro ao buscar usuários'
            });
            return;
        }

        const usuario = response.dados.find(u => u.ID === id);
        if (!usuario) {
            modal.alert({
                title: 'Erro',
                message: 'Usuário não encontrado'
            });
            return;
        }

        modal.form({
            title: 'Editar Usuário',
            fields: [
                {
                    id: 'nome',
                    label: 'Nome',
                    type: 'text',
                    required: true,
                    value: usuario.Nome
                },
                {
                    id: 'email',
                    label: 'E-mail',
                    type: 'email',
                    required: true,
                    value: usuario['E-mail']
                },
                {
                    id: 'tipo',
                    label: 'Tipo',
                    type: 'select',
                    required: true,
                    value: usuario.Tipo,
                    options: [
                        { value: 'Usuário', label: 'Usuário' },
                        { value: 'Administrador', label: 'Administrador' }
                    ]
                },
                {
                    id: 'status',
                    label: 'Status',
                    type: 'select',
                    required: true,
                    value: usuario.Status,
                    options: [
                        { value: 'Ativo', label: 'Ativo' },
                        { value: 'Inativo', label: 'Inativo' }
                    ]
                },
                {
                    id: 'senha',
                    label: 'Nova Senha',
                    type: 'password',
                    placeholder: 'Deixe em branco para manter'
                }
            ],
            submitText: 'Salvar Alterações',
            onSubmit: async (data) => {
                const dados = {
                    id: usuario.ID,
                    nome: data.nome,
                    email: data.email,
                    tipo: data.tipo,
                    status: data.status
                };

                if (data.senha) {
                    dados.senha = data.senha;
                }

                try {
                    const response = await api.editarUsuario(dados);
                    if (response.sucesso) {
                        modal.alert({
                            title: '✅ Sucesso',
                            message: 'Usuário atualizado com sucesso!'
                        });
                        setTimeout(() => {
                            this.loadPage('usuarios');
                        }, 1500);
                    } else {
                        modal.alert({
                            title: 'Erro',
                            message: response.mensagem
                        });
                    }
                } catch (error) {
                    modal.alert({
                        title: 'Erro',
                        message: 'Não foi possível atualizar o usuário'
                    });
                }
            }
        });
    }

    async excluirUsuario(id) {
        const result = await modal.confirm({
            title: '⚠️ Excluir Usuário',
            message: 'Tem certeza que deseja excluir este usuário permanentemente?',
            confirmText: 'Excluir',
            confirmClass: 'btn-danger'
        });

        if (result) {
            try {
                const response = await api.excluirUsuario(id);
                if (response.sucesso) {
                    modal.alert({
                        title: '✅ Sucesso',
                        message: 'Usuário excluído com sucesso!'
                    });
                    setTimeout(() => {
                        this.loadPage('usuarios');
                    }, 1500);
                } else {
                    modal.alert({
                        title: 'Erro',
                        message: response.mensagem
                    });
                }
            } catch (error) {
                modal.alert({
                    title: 'Erro',
                    message: 'Não foi possível excluir o usuário'
                });
            }
        }
    }

    async loadNotificacoesCount() {
        try {
            const response = await api.listarNotificacoes();
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

    async loadSolicitacoesCount() {
        try {
            const response = await api.listarAgendas();
            if (response.sucesso) {
                const solicitacoes = response.dados.filter(a => a['Solicitação de Alteração'] && a['Solicitação de Alteração'] !== '');
                const badge = document.getElementById('solicitacoesBadge');
                if (badge) {
                    badge.textContent = solicitacoes.length;
                    badge.style.display = solicitacoes.length > 0 ? '' : 'none';
                }
            }
        } catch (error) {
            console.error('Erro ao carregar contagem de solicitações:', error);
        }
    }

    setupLogout() {
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja sair?')) {
                auth.logout();
            }
        });
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

const admin = new AdminApp();
window.admin = admin;
