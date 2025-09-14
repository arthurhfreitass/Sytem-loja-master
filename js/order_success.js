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

// Mapeia o status do pedido para informações visuais e de progresso
const statusMap = {
    'aprovado': {
        details: 'Estamos a preparar o seu pedido.',
        progress: '50%'
    },
    'em_preparacao': {
        details: 'O seu pedido já está a ser montado.',
        progress: '100%'
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

    let currentStepHeight = 0;
    for (const key in statusSteps) {
        if (key === status) {
            statusSteps[key].classList.add('active');
            currentStepHeight += statusSteps[key].offsetTop;
            break;
        }
        statusSteps[key].classList.add('active');
        currentStepHeight += statusSteps[key].offsetHeight;
    }

    const info = statusMap[status] || statusMap['aprovado'];
    statusDetails.textContent = info.details;
    progressBarFill.style.height = info.progress;

    if (status === 'concluido') {
        progressBarFill.classList.remove('loading');
        clearInterval(statusInterval);
        setTimeout(() => {
            alert('O seu pedido está pronto para ser retirado!');
            backToHomeButton.classList.add('show'); // Mostra o botão
        }, 1000);
    } else {
        progressBarFill.classList.add('loading');
        backToHomeButton.classList.remove('show'); // Esconde o botão
    }
}

/**
 * Busca o status do pedido no localStorage e atualiza a interface.
 */
function checkOrderStatus() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => String(o.id) === String(orderId));

    if (order) {
        updateUI(order.status);
    } else {
        console.error('Pedido não encontrado no localStorage.');
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
        document.querySelector('.order-status-card').innerHTML = '<h2>Erro</h2><p>Não foi possível carregar as informações do pedido. Verifique se o link está correto.</p>';
    }
});