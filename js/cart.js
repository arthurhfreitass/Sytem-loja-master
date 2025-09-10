// js/cart.js

// =======================================================
// INICIALIZAÇÃO DO MERCADO PAGO (NOVO)
// =======================================================
// Use a sua Public Key de TESTE aqui.
const mp = new MercadoPago("APP_USR-4a92f47e-85b7-44ea-95be-6829bf84805c", {
    locale: 'pt-BR'
});
const bricksBuilder = mp.bricks();

// =======================================================
// ELEMENTOS DA PÁGINA
// =======================================================
let cart = [];

// Elementos da página
const cartList = document.getElementById('cart-list');
const cartTotalPriceSpan = document.getElementById('cart-total-price');
const checkoutButton = document.getElementById('checkout-button');
const toastMessageEl = document.getElementById('toast-message');

// Elementos das modais
const reviewModal = document.getElementById('review-modal');
const paymentModal = document.getElementById('payment-modal');
const finishModal = document.getElementById('finish-modal');
const reviewList = document.getElementById('review-list');
const reviewTotalPriceSpan = document.getElementById('review-total-price');
const confirmReviewButton = document.getElementById('confirm-review-button');
const paymentOptions = document.querySelectorAll('.payment-option');
const finishTitle = document.getElementById('finish-title');
const finishMessage = document.getElementById('finish-message');
const orderCodeDisplay = document.getElementById('order-code-display');
const closeButtons = document.querySelectorAll('.close-button');

// Elementos do novo Modal PIX (NOVO)
const pixModal = document.getElementById('pix-modal');
const pixLoadingMessage = document.getElementById('pix-loading-message');
const pixOrderIdSpan = document.getElementById('pix-order-id');
const pixBrickContainer = document.getElementById('pix-payment-brick-container');


// =======================================================
// FUNÇÕES PRINCIPAIS (Sem alterações aqui)
// =======================================================

// Função para mostrar uma notificação temporária
function showToast(message) {
    toastMessageEl.textContent = message;
    toastMessageEl.classList.add('show');
    setTimeout(() => {
        toastMessageEl.classList.remove('show');
    }, 3000);
}

// Função para carregar e renderizar o carrinho
function renderCart() {
    cart = JSON.parse(localStorage.getItem('tempCart')) || [];
    cartList.innerHTML = '';
    let cartTotal = 0;

    if (cart.length === 0) {
        cartList.innerHTML = '<li><span class="label">Carrinho vazio</span></li>';
        checkoutButton.disabled = true;
    } else {
        checkoutButton.disabled = false;
        cart.forEach(item => {
            const itemElement = document.createElement('li');
            itemElement.classList.add('order-item');
            itemElement.dataset.id = item.id;
            
            let details = `Açaí ${item.size.name}`;
            if (item.included.length > 0) {
                details += ` c/ ${item.included.join(', ')}`;
            }
            if (item.extras.length > 0) {
                details += ` e extras`;
            }

            itemElement.innerHTML = `
                <span>${details}</span>
                <span>R$ ${item.price.toFixed(2)}</span>
                <button class="remove-from-cart-btn" data-id="${item.id}">&times;</button>
            `;
            cartList.appendChild(itemElement);
            cartTotal += item.price;
        });
    }

    cartTotalPriceSpan.textContent = `R$ ${cartTotal.toFixed(2)}`;

    document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const itemId = e.target.dataset.id;
            removeFromCart(itemId);
        });
    });
}

function removeFromCart(itemId) {
    const removedItemIndex = cart.findIndex(item => item.id === itemId);
    if (removedItemIndex > -1) {
        const removedItemName = `Açaí ${cart[removedItemIndex].size.name}`;
        cart.splice(removedItemIndex, 1);
        localStorage.setItem('tempCart', JSON.stringify(cart));
        renderCart();
        showToast(`${removedItemName} removido!`);
    }
}


// =======================================================
// FUNÇÕES DAS MODAIS E FINALIZAÇÃO
// =======================================================

function renderReviewList() {
    reviewList.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const reviewItemElement = document.createElement('li');
        reviewItemElement.classList.add('order-item-review');
        let details = `Açaí ${item.size.name}`;
        if (item.included.length > 0) {
            details += ` (inclusos: ${item.included.join(', ')})`;
        }
        if (item.extras.length > 0) {
            details += ` (extras: ${item.extras.map(e => e.name).join(', ')})`;
        }
        reviewItemElement.innerHTML = `
            <span>${details}</span>
            <span>R$ ${item.price.toFixed(2)}</span>
        `;
        reviewList.appendChild(reviewItemElement);
        total += item.price;
    });

    reviewTotalPriceSpan.textContent = `R$ ${total.toFixed(2)}`;
}

function generateOrderId() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

function saveOrder(paymentMethod) {
    const orderId = generateOrderId();
    const orderData = {
        id: orderId,
        items: cart,
        total: cart.reduce((sum, item) => sum + item.price, 0),
        payment: paymentMethod,
        status: 'pendente'
    };
    
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(orderData);
    localStorage.setItem('orders', JSON.stringify(orders));

    return orderId;
}

// Função MODIFICADA para lidar com pagamentos que não são Pix
function finalizeOrder(paymentMethod) {
    if (cart.length === 0) {
        showToast("Seu carrinho está vazio!");
        return;
    }

    const orderId = saveOrder(paymentMethod);
    
    if (paymentMethod === 'card') {
        finishTitle.textContent = "Pagamento com Cartão";
        finishMessage.textContent = "Dirija-se ao caixa para finalizar o pagamento. O número do seu pedido é:";
    } else {
        finishTitle.textContent = "Pagamento com Dinheiro";
        finishMessage.textContent = "Dirija-se ao caixa para finalizar o pagamento. O número do seu pedido é:";
    }
    
    orderCodeDisplay.textContent = orderId;
    
    hideModal(reviewModal);
    hideModal(paymentModal);
    showModal(finishModal);
    
    localStorage.removeItem('tempCart');
    renderCart();
}

function showModal(modal) { modal.classList.add('show'); }
function hideModal(modal) { modal.classList.remove('show'); }

// =======================================================
// LÓGICA DE PAGAMENTO PIX DO MERCADO PAGO (NOVO)
// =======================================================

async function startPixPayment() {
    // 1. Salva o pedido localmente e pega o ID
    const orderId = saveOrder('pix');
    const orderTotal = cart.reduce((sum, item) => sum + item.price, 0);

    // 2. Prepara e exibe o modal do Pix
    hideModal(paymentModal);
    pixOrderIdSpan.textContent = `#${orderId}`;
    pixLoadingMessage.style.display = 'block';
    pixBrickContainer.innerHTML = ''; // Limpa o container
    showModal(pixModal);

    try {
        // 3. Chama a nossa Netlify Function para criar o pagamento no Mercado Pago
        const response = await fetch('/.netlify/functions/criar-pagamento-pix', {
            method: 'POST',
            body: JSON.stringify({
                description: `Pedido #${orderId}`,
                price: orderTotal,
                email: 'cliente@email.com' // Pode ser um email fixo ou capturado por um formulário
            })
        });

        if (!response.ok) {
            throw new Error('Falha ao gerar o QR Code. Tente outro método de pagamento.');
        }

        const pixData = await response.json();

        // 4. Renderiza o QR Code na tela usando o Payment Brick
        pixLoadingMessage.style.display = 'none';
        await renderPixBrick(pixData, orderTotal);

        // 5. Limpa o carrinho no frontend
        localStorage.removeItem('tempCart');
        renderCart();

    } catch (error) {
        console.error("Erro no pagamento PIX:", error);
        hideModal(pixModal);
        showToast(error.message || 'Erro desconhecido. Tente novamente.');
        // Reverte o salvamento do pedido se deu erro (opcional)
        let orders = JSON.parse(localStorage.getItem('orders')) || [];
        orders = orders.filter(o => o.id !== orderId);
        localStorage.setItem('orders', JSON.stringify(orders));
    }
}

async function renderPixBrick(pixData, amount) {
    const settings = {
        initialization: {
            amount: amount,
        },
        callbacks: {
            onReady: () => console.log('Brick de Pix pronto!'),
            onError: (error) => console.error(error),
        },
    };
    
    const pixBrickController = await bricksBuilder.create('pix', 'pix-payment-brick-container', settings);
    // Injeta os dados do PIX que criamos no backend
    pixBrickController.update(pixData);
}

// =======================================================
// EVENTOS
// =======================================================
checkoutButton.addEventListener('click', () => {
    if (cart.length === 0) {
        showToast("Seu carrinho está vazio!");
        return;
    }
    renderReviewList();
    showModal(reviewModal);
});

confirmReviewButton.addEventListener('click', () => {
    hideModal(reviewModal);
    showModal(paymentModal);
});

// Evento de seleção de pagamento (MODIFICADO)
paymentOptions.forEach(button => {
    button.addEventListener('click', (e) => {
        const paymentType = e.target.dataset.type;
        
        if (paymentType === 'pix') {
            startPixPayment(); // Chama a nova função de pagamento Pix
        } else {
            finalizeOrder(paymentType); // Mantém o fluxo antigo para Cartão/Dinheiro
        }
    });
});

closeButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        hideModal(modal);
    });
});
async function startPixPayment() {
    const orderId = saveOrder('pix');
    const orderTotal = cart.reduce((sum, item) => sum + item.price, 0);

    hideModal(paymentModal);
    pixOrderIdSpan.textContent = `#${orderId}`;
    pixLoadingMessage.style.display = 'block';
    pixBrickContainer.innerHTML = '';
    showModal(pixModal);

    try {
        const response = await fetch('/.netlify/functions/criar-pagamento-pix', {
            method: 'POST',
            body: JSON.stringify({
                description: `Pedido #${orderId}`,
                price: orderTotal,
                email: 'cliente@email.com'
            })
        });

        if (!response.ok) {
            throw new Error('Falha ao gerar o QR Code. Tente outro método de pagamento.');
        }

        // --- CORREÇÃO: Armazena a resposta da API diretamente ---
        const paymentResponse = await response.json();

        // 4. Renderiza o QR Code na tela usando o Payment Brick
        pixLoadingMessage.style.display = 'none';
        // --- CORREÇÃO: Passa a resposta completa para a função de renderização ---
        await renderPixBrick(paymentResponse, orderTotal);

        // 5. Limpa o carrinho no frontend
        localStorage.removeItem('tempCart');
        renderCart();

    } catch (error) {
        console.error("Erro no pagamento PIX:", error);
        hideModal(pixModal);
        showToast(error.message || 'Erro desconhecido. Tente novamente.');
        let orders = JSON.parse(localStorage.getItem('orders')) || [];
        orders = orders.filter(o => o.id !== orderId);
        localStorage.setItem('orders', JSON.stringify(orders));
    }
}

async function renderPixBrick(paymentResponse, amount) {
    const settings = {
        initialization: {
            amount: amount,
        },
        callbacks: {
            onReady: () => console.log('Brick de Pix pronto!'),
            onError: (error) => console.error(error),
        },
    };
    
    const pixBrickController = await bricksBuilder.create('pix', 'pix-payment-brick-container', settings);
    // --- CORREÇÃO: Injeta os dados do PIX que vieram completos do backend ---
    pixBrickController.update({ paymentId: paymentResponse.id, transactionData: paymentResponse.point_of_interaction.transaction_data });
}

// Inicializa a página do carrinho
document.addEventListener('DOMContentLoaded', renderCart);