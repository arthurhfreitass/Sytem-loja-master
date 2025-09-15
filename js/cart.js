let cart = [];

// Elementos
const cartList = document.getElementById('cart-list');
const cartTotalPriceSpan = document.getElementById('cart-total-price');
const checkoutButton = document.getElementById('checkout-button');
const toastMessageEl = document.getElementById('toast-message');
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

// NOVO: Referência para o modal de espera do caixa.
const cashierWaitingModal = document.getElementById('cashier-waiting-modal');
// NOVO: Referência para o código do pedido no modal do caixa.
const cashierOrderCode = document.getElementById('cashier-order-code');


// Toast
function showToast(message) {
    toastMessageEl.textContent = message;
    toastMessageEl.classList.add('show');
    setTimeout(() => toastMessageEl.classList.remove('show'), 3000);
}

// Render carrinho
// Função auxiliar para criar HTML de um item
function createCartItemHTML(item, index, className = 'cart-item') {
    const { name, price, size, toppings = [], extras = [] } = item;
    const formattedPrice = Number(price).toFixed(2).replace('.', ',');
    const toppingsText = toppings.length ? toppings.join(', ') : 'Nenhum';
    const extrasText = extras.length ? extras.map(e => e.name).join(', ') : 'Nenhum';

    const li = document.createElement('li');
    li.classList.add(className);
    li.innerHTML = `
        <div class="item-info">
            <div class="item-info-text">
                <span class="item-name">${name}</span>
                <span class="item-price">R$ ${formattedPrice}</span>
            </div>
            <button class="remove-item" data-index="${index}">❌</button>
        </div>
        <ul class="item-details">
            <li><strong>Tamanho:</strong> ${size.name}</li>
            <li><strong>Complementos:</strong> ${toppingsText}</li>
            <li><strong>Extras:</strong> ${extrasText}</li>
        </ul>
    `;
    return li;
}

// Função para renderizar o carrinho
function renderCart() {
    cart = JSON.parse(localStorage.getItem('tempCart')) || [];
    cartList.innerHTML = '';
    let total = 0;

    if (!cart.length) {
        cartList.innerHTML = '<p class="empty-cart-message">Seu carrinho está vazio.</p>';
        checkoutButton.disabled = true;
    } else {
        checkoutButton.disabled = false;
        cart.forEach((item, index) => {
            cartList.appendChild(createCartItemHTML(item, index, 'cart-item'));
            total += Number(item.price);
        });
    }

    cartTotalPriceSpan.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// Função para renderizar a lista de revisão
function renderReviewList() {
    reviewList.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        reviewList.appendChild(createCartItemHTML(item, 'order-item'));
        total += Number(item.price);
    });

    reviewTotalPriceSpan.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// Função para remover item
function removeCartItem(index) {
    cart.splice(index, 1);
    localStorage.setItem('tempCart', JSON.stringify(cart));
    renderCart();
    showToast("Item removvido do carrinho.");
}

// Código 4 dígitos - Esta função não é mais necessária para o fluxo de pedido.
// function generateOrderCode() {
//     return Math.floor(1000 + Math.random() * 9000);
// }

const API_BASE = "https://sytem-loja-master.onrender.com";

// NOVO: Adicione esta função para salvar o pedido na API.
// A API agora retorna o orderId.
async function saveOrderToAPI(orderData) {
    try {
        const response = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
            throw new Error('Erro ao salvar o pedido na API.');
        }

        const data = await response.json();
        return data.orderId;
    } catch (error) {
        console.error('❌ Erro na comunicação com a API:', error);
        showToast('Erro ao salvar pedido. Por favor, tente novamente.');
        return null;
    }
}


// Finalizar pedido
// cart.js
// Finalizar pedido
async function finalizeOrder(paymentMethod) {
    if (cart.length === 0) {
        showToast("Seu carrinho está vazio!");
        return;
    }
    
    // O orderId será obtido após o envio para a API.
    const orderPayload = {
        items: cart.map(i => ({ 
            name: i.name, 
            price: Number(i.price), 
            quantity: 1, 
            toppings: i.toppings, 
            extras: i.extras.map(e => e.name) 
        })),
        total: cart.reduce((sum, item) => sum + Number(item.price), 0),
        payment: paymentMethod
    };

    try {
        // CORREÇÃO: Define o status com base no método de pagamento
        if (paymentMethod === 'caixa') {
            orderPayload.status = 'pendente_caixa';
        } else {
            orderPayload.status = 'pendente';
        }

        // Envia o pedido para a API.
        const response = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });

        if (!response.ok) {
            throw new Error('Erro ao criar o pedido.');
        }

        const data = await response.json();
        const orderId = data.orderId;

        localStorage.removeItem('tempCart');
        renderCart();
        
        if (paymentMethod === 'caixa') {
            await startCashierPaymentFlow(orderId);
        } else if (paymentMethod === 'pix') {
            await createPixPayment(orderId, orderPayload);
        }
    } catch (error) {
        console.error("❌ Erro ao finalizar pedido:", error);
        showToast("❌ Erro ao finalizar o pedido. Tente novamente.");
    }
}

// NOVO: Função para exibir o modal e gerenciar o fluxo de pagamento no caixa
async function startCashierPaymentFlow(orderId) {
    hideModal(reviewModal);
    hideModal(paymentModal);
    
    // Exibe o modal do caixa
    cashierOrderCode.textContent = orderId;
    showModal(cashierWaitingModal);
    
    // Inicia a verificação de status do pedido (polling)
    const statusInterval = setInterval(async () => {
        try {
            const response = await fetch(`${API_BASE}/orders/${orderId}`);
            if (!response.ok) throw new Error('Pedido não encontrado.');
            
            const order = await response.json();
            
            // Se o status for 'aprovado', interrompe a verificação e redireciona
            if (order.status === 'aprovado') {
                clearInterval(statusInterval);
                hideModal(cashierWaitingModal);
                showToast("✅ Pagamento Aprovado!");
                window.location.href = `order_success.html?id=${orderId}`;
            }
        } catch (error) {
            console.error("Erro ao verificar status do pedido:", error);
            // Em caso de erro, você pode optar por parar a verificação
            clearInterval(statusInterval);
        }
    }, 3000); // Verifica a cada 3 segundos
}


// PIX modal + verificação
async function createPixPayment(orderId, orderPayload) {
    try {
        const response = await fetch(`${API_BASE}/create_pix_payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: orderId,
                items: orderPayload.items,
                total: orderPayload.total,
                customerName: 'Cliente',
                customerEmail: 'cliente@exemplo.com'
            })
        });

        if (!response.ok) {
            throw new Error('Erro ao criar o pagamento Pix.');
        }

        const data = await response.json();
        
        hideModal(reviewModal);
        hideModal(paymentModal);
        showModal(finishModal);

        finishTitle.textContent = "Pagamento com PIX";
        finishMessage.innerHTML = `
            <p>Aponte a câmera para pagar via PIX.</p>
            <img src="data:image/jpeg;base64,${data.qr_code_base64}" style="max-width:200px;margin:1rem auto;display:block;">
            <p>Ou copie o código abaixo:</p>
            <div class="pix-code-container">
                <input type="text" id="pix-code" value="${data.qr_code}" readonly>
                <button id="copy-pix-button">Copiar</button>
            </div>
            <p class="small-text">Aguardando confirmação...</p>
        `;
        
        document.getElementById('copy-pix-button').addEventListener('click', () => {
            const pixCodeInput = document.getElementById('pix-code');
            pixCodeInput.select();
            document.execCommand('copy');
            showToast("Código Pix copiado!");
        });

        checkPixStatus(data.id, orderId);

    } catch (error) {
        console.error("❌ Erro ao criar pagamento Pix:", error);
        showToast("❌ Erro ao gerar o Pix. Tente outro método de pagamento.");
    }
}

// Checa status do Pix
function checkPixStatus(paymentId, orderId) {
    const url = `${API_BASE}/payment_status/${paymentId}`;

    const interval = setInterval(() => {
        fetch(url)
            .then(res => res.json()) // Use .json() diretamente
            .then(data => {
                if (data.status === "approved") {
                    clearInterval(interval);
                    // Atualiza o status do pedido na API para 'aprovado'
                    updateOrderStatus(orderId, 'aprovado');
                    localStorage.removeItem('tempCart');
                    window.location.href = `order_success.html?id=${orderId}`;
                }
            })
            .catch(err => console.error("Erro ao verificar pagamento:", err));
    }, 5000);
}

// NOVO: Função auxiliar para atualizar o status do pedido na API.
async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (!response.ok) {
            throw new Error('Erro ao atualizar status do pedido na API.');
        }
        console.log(`Status do pedido ${orderId} atualizado para ${newStatus}.`);
    } catch (error) {
        console.error("❌ Erro ao atualizar status:", error);
    }
}

// Utils modal
function showModal(modal) { modal.classList.add('show'); }
function hideModal(modal) { modal.classList.remove('show'); }

// Eventos
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
paymentOptions.forEach(button => {
    button.addEventListener('click', e => finalizeOrder(e.target.dataset.type));
});
closeButtons.forEach(button => {
    button.addEventListener('click', e => hideModal(e.target.closest('.modal')));
});
document.addEventListener('DOMContentLoaded', renderCart);

// Evento para remover item
cartList.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-item')) {
        const index = e.target.getAttribute('data-index');
        removeCartItem(index);
    }
});