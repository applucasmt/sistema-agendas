/**
 * Componente de Detalhes da Agenda
 * @version 1.0.0
 */

class AgendaDetailComponent {
    constructor() {
        this.currentAgenda = null;
    }

    /**
     * Abre detalhes da agenda
     */
    async open(agendaId) {
        try {
            const response = await api.buscarAgenda(agendaId);
            
            if (!response.sucesso) {
                modal.alert({
                    title: 'Erro',
                    message: response.mensagem
                });
                return;
            }

            this.currentAgenda = response.dados;
            this.renderDetail();
        } catch (error) {
            console.error('Erro ao abrir detalhes:', error);
            modal.alert({
                title: 'Erro',
                message: 'Não foi possível carregar os detalhes da agenda'
            });
        }
    }

    /**
     * Renderiza detalhes
     */
    renderDetail() {
        const agenda = this.currentAgenda;
        const isAdmin = auth.isAdmin();
        const podeAcao = agenda.Status !== 'Realizada' && agenda.Status !== 'Cancelada';

        modal.open({
            title: `📋 ${agenda['Tipo da Agenda']}`,
            size: 'lg',
            content: `
                <div class="agenda-detail-container">
                    <div class="agenda-detail-header">
                        <span class="agenda-status status-${agenda.Status.toLowerCase().replace(/ /g, '')}">
                            ${agenda.Status}
                        </span>
                        <span class="agenda-data">
                            📅 ${new Date(agenda.Data).toLocaleDateString('pt-BR')}
                        </span>
                    </div>

                    <div class="agenda-detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">🕐 Horário</span>
                            <span class="detail-value">${agenda.Horário}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">📍 Local</span>
                            <span class="detail-value">${agenda.Local}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">👥 Participantes</span>
                            <span class="detail-value">${agenda.Participantes || 'Não informado'}</span>
                        </div>
                        ${agenda.Descrição ? `
                            <div class="detail-item full-width">
                                <span class="detail-label">📝 Descrição</span>
                                <span class="detail-value">${agenda.Descrição}</span>
                            </div>
                        ` : ''}
                        ${agenda['Solicitação de Alteração'] ? `
                            <div class="detail-item full-width">
                                <span class="detail-label">⏳ Solicitação Pendente</span>
                                <span class="detail-value" style="color: var(--warning);">
                                    Aguardando aprovação do administrador
                                </span>
                            </div>
                        ` : ''}
                    </div>

                    <div class="agenda-detail-actions">
                        ${agenda['Link Google Maps'] ? `
                            <a href="${agenda['Link Google Maps']}" target="_blank" class="btn btn-primary">
                                🗺️ Abrir no Google Maps
                            </a>
                        ` : ''}
                        
                        ${!isAdmin && podeAcao && !agenda['Solicitação de Alteração'] ? `
                            <button class="btn btn-success" onclick="agendaDetail.finalizar()">
                                ✅ Finalizar
                            </button>
                            <button class="btn btn-danger" onclick="agendaDetail.cancelar()">
                                ❌ Cancelar
                            </button>
                            <button class="btn btn-warning" onclick="agendaDetail.adiar()">
                                ⏰ Adiar
                            </button>
                        ` : ''}
                        
                        ${isAdmin ? `
                            <button class="btn btn-outline" onclick="agendaDetail.editar()">
                                ✏️ Editar
                            </button>
                            <button class="btn btn-danger" onclick="agendaDetail.excluir()">
                                🗑️ Excluir
                            </button>
                        ` : ''}
                    </div>
                </div>
            `,
            onOpen: (modalElement) => {
                // Estilos específicos
                const style = document.createElement('style');
                style.textContent = `
                    .agenda-detail-container {
                        padding: 8px 0;
                    }
                    .agenda-detail-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                        padding-bottom: 16px;
                        border-bottom: 1px solid var(--glass-border);
                    }
                    .agenda-data {
                        font-size: 14px;
                        color: var(--text-muted);
                    }
                    .agenda-detail-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 16px;
                        margin-bottom: 24px;
                    }
                    .detail-item {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }
                    .detail-item.full-width {
                        grid-column: 1 / -1;
                    }
                    .detail-label {
                        font-size: 13px;
                        color: var(--text-muted);
                        font-weight: 500;
                    }
                    .detail-value {
                        font-size: 15px;
                        color: var(--text-primary);
                        word-break: break-word;
                    }
                    .agenda-detail-actions {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                        padding-top: 16px;
                        border-top: 1px solid var(--glass-border);
                    }
                    @media (max-width: 480px) {
                        .agenda-detail-grid {
                            grid-template-columns: 1fr;
                        }
                        .agenda-detail-header {
                            flex-direction: column;
                            align-items: flex-start;
                            gap: 8px;
                        }
                        .agenda-detail-actions {
                            flex-direction: column;
                        }
                        .agenda-detail-actions .btn {
                            width: 100%;
                            justify-content: center;
                        }
                    }
                `;
                modalElement.querySelector('.modal-body').appendChild(style);
            }
        });
    }

    /**
     * Finaliza agenda
     */
    async finalizar() {
        const result = await modal.confirm({
            title: 'Finalizar Agenda',
            message: 'Tem certeza que deseja finalizar esta agenda?',
            confirmText: 'Finalizar',
            confirmClass: 'btn-success'
        });

        if (result) {
            try {
                const response = await api.atualizarStatus(this.currentAgenda.ID, 'Realizada');
                if (response.sucesso) {
                    modal.alert({
                        title: '✅ Sucesso',
                        message: 'Agenda finalizada com sucesso!'
                    });
                    setTimeout(() => {
                        window.location.reload();
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
                    message: 'Não foi possível finalizar a agenda'
                });
            }
        }
    }

    /**
     * Cancela agenda
     */
    async cancelar() {
        const result = await modal.confirm({
            title: 'Cancelar Agenda',
            message: 'Tem certeza que deseja cancelar esta agenda?',
            confirmText: 'Cancelar',
            confirmClass: 'btn-danger'
        });

        if (result) {
            try {
                const response = await api.atualizarStatus(this.currentAgenda.ID, 'Cancelada');
                if (response.sucesso) {
                    modal.alert({
                        title: '✅ Sucesso',
                        message: 'Agenda cancelada com sucesso!'
                    });
                    setTimeout(() => {
                        window.location.reload();
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
                    message: 'Não foi possível cancelar a agenda'
                });
            }
        }
    }

    /**
     * Adia agenda
     */
    async adiar() {
        const amanha = new Date();
        amanha.setDate(amanha.getDate() + 1);
        const dataMin = amanha.toISOString().split('T')[0];

        modal.form({
            title: '⏰ Adiar Agenda',
            fields: [
                {
                    id: 'novaData',
                    label: 'Nova Data',
                    type: 'date',
                    required: true,
                    value: dataMin
                },
                {
                    id: 'novoHorario',
                    label: 'Novo Horário',
                    type: 'time',
                    required: true,
                    value: '09:00'
                },
                {
                    id: 'motivo',
                    label: 'Motivo',
                    type: 'textarea',
                    required: true,
                    placeholder: 'Explique o motivo do adiamento...',
                    rows: 4
                }
            ],
            submitText: 'Enviar Solicitação',
            onSubmit: async (data) => {
                const dados = {
                    id: this.currentAgenda.ID,
                    novaData: data.novaData,
                    novoHorario: data.novoHorario,
                    motivo: data.motivo,
                    usuario: auth.getEmail()
                };

                try {
                    const response = await api.solicitarAdiamento(dados);
                    if (response.sucesso) {
                        modal.alert({
                            title: '✅ Solicitação Enviada',
                            message: 'Sua solicitação foi enviada e aguarda aprovação do administrador.'
                        });
                        setTimeout(() => {
                            window.location.reload();
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
                        message: 'Não foi possível enviar a solicitação'
                    });
                }
            }
        });
    }

    /**
     * Edita agenda (Admin)
     */
    async editar() {
        const agenda = this.currentAgenda;
        
        modal.form({
            title: '✏️ Editar Agenda',
            fields: [
                {
                    id: 'tipo',
                    label: 'Tipo',
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
                            window.location.reload();
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

    /**
     * Exclui agenda (Admin)
     */
    async excluir() {
        const result = await modal.confirm({
            title: '⚠️ Excluir Agenda',
            message: 'Tem certeza que deseja excluir esta agenda permanentemente? Esta ação não pode ser desfeita.',
            confirmText: 'Excluir',
            confirmClass: 'btn-danger'
        });

        if (result) {
            try {
                const response = await api.excluirAgenda(this.currentAgenda.ID);
                if (response.sucesso) {
                    modal.alert({
                        title: '✅ Sucesso',
                        message: 'Agenda excluída com sucesso!'
                    });
                    setTimeout(() => {
                        window.location.reload();
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
}

// Instância global
const agendaDetail = new AgendaDetailComponent();
window.agendaDetail = agendaDetail;
