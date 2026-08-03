/**
 * Serviço de Notificações
 * Gerencia notificações push e internas
 * @version 1.0.0
 */

class NotificationService {
    constructor() {
        this.permission = 'default';
        this.subscription = null;
        this.vapidPublicKey = null;
        this.init();
    }

    /**
     * Inicializa serviço de notificações
     */
    async init() {
        // Verificar suporte a notificações
        if (!('Notification' in window)) {
            console.warn('Notificações não suportadas neste navegador');
            return;
        }

        // Verificar permissão
        this.permission = Notification.permission;

        // Verificar suporte a Push API
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            await this.setupPushNotifications();
        }

        // Verificar notificações pendentes
        this.checkPendingNotifications();
    }

    /**
     * Solicita permissão para notificações
     */
    async requestPermission() {
        try {
            if (this.permission === 'default') {
                this.permission = await Notification.requestPermission();
                if (this.permission === 'granted') {
                    console.log('Permissão para notificações concedida');
                    this.sendTestNotification();
                }
            }
            return this.permission;
        } catch (error) {
            console.error('Erro ao solicitar permissão:', error);
            return 'denied';
        }
    }

    /**
     * Configura notificações push
     */
    async setupPushNotifications() {
        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Verificar se já está inscrito
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                this.subscription = existingSubscription;
                return;
            }

            // Gerar chave VAPID (em produção, viria do servidor)
            this.vapidPublicKey = this.generateVapidKey();

            // Inscrever
            this.subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
            });

            // Enviar inscrição para o servidor
            await this.saveSubscription(this.subscription);
        } catch (error) {
            console.error('Erro ao configurar Push:', error);
        }
    }

    /**
     * Salva inscrição no servidor
     */
    async saveSubscription(subscription) {
        try {
            // Enviar para o backend
            const response = await fetch('/api/save-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscription)
            });
            return response.json();
        } catch (error) {
            console.error('Erro ao salvar inscrição:', error);
        }
    }

    /**
     * Envia notificação
     */
    sendNotification(title, options = {}) {
        try {
            if (this.permission !== 'granted') {
                console.warn('Permissão não concedida para notificações');
                return;
            }

            const notification = new Notification(title, {
                icon: '/assets/images/icon-192.png',
                badge: '/assets/images/icon-192.png',
                vibrate: [200, 100, 200],
                ...options
            });

            // Fechar após 5 segundos
            setTimeout(() => notification.close(), 5000);

            // Abrir ao clicar
            notification.onclick = () => {
                window.focus();
                if (options.url) {
                    window.location.href = options.url;
                }
                notification.close();
            };

            return notification;
        } catch (error) {
            console.error('Erro ao enviar notificação:', error);
        }
    }

    /**
     * Envia notificação de teste
     */
    sendTestNotification() {
        this.sendNotification('🔔 Notificações Ativadas!', {
            body: 'Você receberá alertas sobre suas agendas.',
            tag: 'test-notification'
        });
    }

    /**
     * Notifica sobre nova agenda
     */
    notifyNewAgenda(agenda) {
        this.sendNotification(`📅 Nova Agenda: ${agenda.tipo}`, {
            body: `Data: ${agenda.data} às ${agenda.horario}\nLocal: ${agenda.local}`,
            url: '/dashboard.html',
            tag: `agenda-${agenda.id}`
        });
    }

    /**
     * Notifica sobre alteração de status
     */
    notifyStatusChange(agenda, status) {
        const statusMessages = {
            'Agendada': 'foi agendada',
            'Confirmada': 'foi confirmada',
            'Em andamento': 'está em andamento',
            'Realizada': 'foi realizada',
            'Cancelada': 'foi cancelada',
            'Adiada': 'foi adiada'
        };

        this.sendNotification(`📌 Agenda ${statusMessages[status] || status}`, {
            body: `${agenda.tipo} - ${agenda.data} às ${agenda.horario}`,
            url: '/dashboard.html',
            tag: `status-${agenda.id}`
        });
    }

    /**
     * Notifica sobre solicitação
     */
    notifySolicitation(agenda, tipo, status) {
        const messages = {
            'aprovada': 'Solicitação de alteração APROVADA',
            'recusada': 'Solicitação de alteração RECUSADA',
            'pendente': 'Nova solicitação de alteração'
        };

        this.sendNotification(`📋 ${messages[status] || 'Solicitação'}`, {
            body: `${agenda.tipo} - Nova data: ${agenda.novaData || ''}`,
            url: '/dashboard.html',
            tag: `solicitacao-${agenda.id}`
        });
    }

    /**
     * Verifica notificações pendentes
     */
    async checkPendingNotifications() {
        try {
            const response = await api.listarNotificacoes(auth.getEmail());
            if (response.sucesso) {
                const pendentes = response.dados.filter(n => n.Status === 'Pendente');
                if (pendentes.length > 0) {
                    this.sendNotification(`📬 ${pendentes.length} notificação(ões) pendente(s)`, {
                        body: 'Clique para visualizar',
                        url: '/dashboard.html?page=notificacoes'
                    });
                }
            }
        } catch (error) {
            console.error('Erro ao verificar notificações:', error);
        }
    }

    /**
     * Gera chave VAPID
     */
    generateVapidKey() {
        // Em produção, use uma chave real do servidor
        // Esta é apenas para demonstração
        return 'BJqwFhGvszFztJxQkZ3uYyjlPOKfYUKMljGiHkDmg4s4sdVgFJtRj8hXpQ8b6NKzT6P2wMH7PzLQ8HjY9XkWlA';
    }

    /**
     * Converte base64 para Uint8Array
     */
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    /**
     * Verifica suporte a notificações
     */
    isSupported() {
        return 'Notification' in window && 'serviceWorker' in navigator;
    }

    /**
     * Verifica se tem permissão
     */
    hasPermission() {
        return this.permission === 'granted';
    }
}

// Instância global
const notificationService = new NotificationService();
window.notificationService = notificationService;
