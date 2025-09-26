// Este script irá gerenciar o status do pedido em tempo real.

// Elementos da página
const statusSteps = {
    aprovado: document.getElementById('step-aprovado'),
    em_preparacao: document.getElementById('step-em_preparacao'),
    concluido: document.getElementById('step-concluido')
};

const statusDetails = document.getElementById('order-status-details');
const orderCodeDisplay = document.getElementById('order-code-display');
const progressBarFill = document.getElementById('progress-fill');
const backToHomeButton = document.getElementById('back-to-home-button');

let orderId = null;
let statusInterval = null;

const API_BASE = "https://sytem-loja-master.onrender.com";

// Mapeia o status do pedido para informações visuais e de progresso
const statusMap = {
    'aprovado': {
        details: 'Pedido aprovado e enviado para a cozinha.',
        progress: '50%'
    },
    'em_preparacao': {
        details: 'O seu pedido já está a ser montado.',
        progress: '75%'
    },
    'concluido': {
        details: 'O seu pedido já pode ser retirado no balcão.',
        progress: '100%'
    }
};

/**
 * Atualiza a interface do utilizador com base no status do pedido.
 * @param {string} status O status atual do pedido.
 */
function updateUI(status) {
    Object.values(statusSteps).forEach(step => step.classList.remove('active'));

    // Adiciona a classe 'active' aos passos que já foram concluídos
    if (status === 'em_preparacao' || status === 'concluido') {
        statusSteps.aprovado.classList.add('active');
    }
    if (status === 'concluido') {
        statusSteps.em_preparacao.classList.add('active');
    }
    
    // Adiciona a classe 'active' ao passo atual
    const stepElement = statusSteps[status];
    if (stepElement) {
        stepElement.classList.add('active');
        statusDetails.textContent = statusMap[status].details;
        progressBarFill.style.width = statusMap[status].progress;
    }

    if (status === 'concluido') {
        progressBarFill.classList.remove('loading');
        clearInterval(statusInterval);
        setTimeout(() => {
            alert('O seu pedido está pronto para ser retirado!');
            backToHomeButton.classList.add('show');
        }, 1000);
    } else {
        progressBarFill.classList.add('loading');
        backToHomeButton.classList.remove('show');
    }
}

/**
 * Busca o status do pedido na API e atualiza a interface.
 */
async function checkOrderStatus() {
    try {
        const response = await fetch(`${API_BASE}/orders/${orderId}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar status do pedido.');
        }
        const order = await response.json();
        updateUI(order.status);
    } catch (error) {
        console.error('❌ Erro na comunicação com a API:', error);
        clearInterval(statusInterval);
    }
}

// Evento que inicia a verificação quando a página carrega.
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    orderId = urlParams.get('id');

    if (orderId) {
        orderCodeDisplay.textContent = orderId;
        statusInterval = setInterval(checkOrderStatus, 3000);
        checkOrderStatus();
    } else {
        orderCodeDisplay.textContent = 'N/A';
        document.querySelector('.order-status-steps').innerHTML = '<p>Pedido inválido.</p>';
    }
});