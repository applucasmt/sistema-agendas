/**
 * Sistema de Modais
 * @version 1.0.0
 */

class ModalManager {
    constructor() {
        this.activeModal = null;
        this.modalStack = [];
        this.init();
    }

    init() {
        // Criar container de modais se não existir
        if (!document.getElementById('modalContainer')) {
            const container = document.createElement('div');
            container.id = 'modalContainer';
            document.body.appendChild(container);
        }
    }

    /**
     * Abre um modal
     */
    open(options = {}) {
        const {
            title = '',
            content = '',
            size = 'md',
            onClose = null,
            onOpen = null,
            closeOnOverlay = true,
            closeOnEsc = true,
            buttons = []
        } = options;

        // Criar overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.dataset.modalId = Date.now().toString();

        // Criar modal
        const modal = document.createElement('div');
        modal.className = `modal modal-${size}`;

        // Header
        const header = document.createElement('div');
        header.className = 'modal-header';
        header.innerHTML = `
            <h2 class="modal-title">${title}</h2>
            <button class="modal-close" aria-label="Fechar">&times;</button>
        `;

        // Body
        const body = document.createElement('div');
        body.className = 'modal-body';
        body.innerHTML = content;

        // Footer
        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `btn ${btn.class || 'btn-primary'}`;
            button.textContent = btn.label;
            button.onclick = () => {
                if (btn.action) btn.action();
                if (btn.close !== false) this.close(overlay.dataset.modalId);
            };
            footer.appendChild(button);
        });

        // Montar modal
        modal.appendChild(header);
        modal.appendChild(body);
        if (buttons.length > 0) {
            modal.appendChild(footer);
        }
        overlay.appendChild(modal);

        // Adicionar ao container
        const container = document.getElementById('modalContainer');
        container.appendChild(overlay);

        // Eventos
        overlay.querySelector('.modal-close').addEventListener('click', () => {
            this.close(overlay.dataset.modalId);
        });

        if (closeOnOverlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close(overlay.dataset.modalId);
                }
            });
        }

        if (closeOnEsc) {
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    this.close(overlay.dataset.modalId);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        }

        // Adicionar à pilha
        this.modalStack.push(overlay.dataset.modalId);
        this.activeModal = overlay.dataset.modalId;

        // Mostrar com animação
        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });

        // Callback
        if (onOpen) onOpen(modal);

        return {
            id: overlay.dataset.modalId,
            element: modal,
            overlay: overlay,
            close: () => this.close(overlay.dataset.modalId)
        };
    }

    /**
     * Fecha um modal
     */
    close(id) {
        const overlay = document.querySelector(`.modal-overlay[data-modal-id="${id}"]`);
        if (!overlay) return;

        overlay.classList.remove('active');
        
        // Remover após animação
        setTimeout(() => {
            overlay.remove();
            this.modalStack = this.modalStack.filter(mid => mid !== id);
            this.activeModal = this.modalStack[this.modalStack.length - 1] || null;
        }, 300);
    }

    /**
     * Fecha todos os modais
     */
    closeAll() {
        const overlays = document.querySelectorAll('.modal-overlay');
        overlays.forEach(overlay => {
            this.close(overlay.dataset.modalId);
        });
    }

    /**
     * Abre um modal de confirmação
     */
    confirm(options = {}) {
        const {
            title = 'Confirmar',
            message = 'Tem certeza?',
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            onConfirm = null,
            onCancel = null,
            confirmClass = 'btn-danger'
        } = options;

        return this.open({
            title: title,
            content: `
                <div class="confirm-modal">
                    <p>${message}</p>
                </div>
            `,
            buttons: [
                {
                    label: cancelText,
                    class: 'btn-outline',
                    action: onCancel
                },
                {
                    label: confirmText,
                    class: confirmClass,
                    action: onConfirm
                }
            ]
        });
    }

    /**
     * Abre um modal de alerta
     */
    alert(options = {}) {
        const {
            title = 'Alerta',
            message = '',
            buttonText = 'OK',
            onClose = null
        } = options;

        return this.open({
            title: title,
            content: `
                <div class="alert-modal">
                    <p>${message}</p>
                </div>
            `,
            buttons: [
                {
                    label: buttonText,
                    class: 'btn-primary',
                    action: onClose
                }
            ]
        });
    }

    /**
     * Abre um modal de formulário
     */
    form(options = {}) {
        const {
            title = 'Formulário',
            fields = [],
            onSubmit = null,
            submitText = 'Salvar',
            cancelText = 'Cancelar'
        } = options;

        let formContent = '<form id="modalForm">';
        
        fields.forEach(field => {
            formContent += `
                <div class="form-group">
                    <label class="form-label">${field.label} ${field.required ? '*' : ''}</label>
                    ${field.type === 'textarea' ? `
                        <textarea class="form-control" id="${field.id}" ${field.required ? 'required' : ''} 
                            placeholder="${field.placeholder || ''}" rows="${field.rows || 3}">${field.value || ''}</textarea>
                    ` : field.type === 'select' ? `
                        <select class="form-control" id="${field.id}" ${field.required ? 'required' : ''}>
                            ${field.options.map(opt => `
                                <option value="${opt.value}" ${opt.value === field.value ? 'selected' : ''}>${opt.label}</option>
                            `).join('')}
                        </select>
                    ` : `
                        <input type="${field.type || 'text'}" class="form-control" id="${field.id}" 
                            ${field.required ? 'required' : ''} 
                            placeholder="${field.placeholder || ''}" value="${field.value || ''}">
                    `}
                </div>
            `;
        });

        formContent += '</form>';

        const modal = this.open({
            title: title,
            content: formContent,
            buttons: [
                {
                    label: cancelText,
                    class: 'btn-outline'
                },
                {
                    label: submitText,
                    class: 'btn-primary',
                    action: () => {
                        const form = document.getElementById('modalForm');
                        if (form.checkValidity()) {
                            const data = {};
                            fields.forEach(field => {
                                const el = document.getElementById(field.id);
                                if (el) data[field.id] = el.value;
                            });
                            if (onSubmit) onSubmit(data);
                            this.close(modal.id);
                        } else {
                            form.reportValidity();
                        }
                    }
                }
            ]
        });

        return modal;
    }
}

// Instância global
const modal = new ModalManager();
window.modal = modal;
