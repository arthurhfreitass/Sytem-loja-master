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

// Toast
function showToast(message) {
    toastMessageEl.textContent = message;
    toastMessageEl.classList.add('show');
    setTimeout(() => toastMessageEl.classList.remove('show'), 3000);
}

// Render carrinho
// Função auxiliar para criar HTML de um item
function createCartItemHTML(item, className = 'cart-item') {
    const { name, price, size, toppings = [], extras = [] } = item;
    const formattedPrice = Number(price).toFixed(2).replace('.', ',');
    const toppingsText = toppings.length ? toppings.join(', ') : 'Nenhum';
    const extrasText = extras.length ? extras.join(', ') : 'Nenhum';

    const li = document.createElement('li');
    li.classList.add(className);
    li.innerHTML = `
        <div class="item-info">
            <span class="item-name">${name}</span>
            <span class="item-price">R$ ${formattedPrice}</span>
        </div>
        <ul class="item-details">
            <li><strong>Tamanho:</strong> ${size}</li>
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
        cart.forEach(item => {
            cartList.appendChild(createCartItemHTML(item, 'cart-item'));
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


// Código 4 dígitos
function generateOrderCode() {
    return Math.floor(1000 + Math.random() * 9000);
}

// Salvar pedido
function saveOrder(paymentMethod, orderId, status) {
    const orderData = {
        id: orderId,
        items: cart,
        total: cart.reduce((sum, item) => sum + Number(item.price), 0),
        payment: paymentMethod,
        status: status // O status é dinâmico agora
    };
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(orderData);
    localStorage.setItem('orders', JSON.stringify(orders));
}

// Na função finalizeOrder, ajuste a chamada de saveOrder
function finalizeOrder(paymentMethod) {
    if (cart.length === 0) {
        showToast("Seu carrinho está vazio!");
        return;
    }
    const orderId = generateOrderCode();

    if (paymentMethod === 'pix') {
        fetch(`${API_BASE}/create_pix_payment`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: orderId,
                items: cart.map(i => ({ name: i.name, price: Number(i.price), quantity: 1 })),
                total: cart.reduce((sum, item) => sum + Number(item.price), 0),
                payment: paymentMethod
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.id && data.qr_code && data.qr_code_base64) {
                showPixModal(data.id, data.qr_code, data.qr_code_base64, orderId);
            } else {
                showToast('Erro ao gerar o Pix.');
            }
        })
        .catch(() => showToast('Erro de conexão.'));
    } else if (paymentMethod === 'caixa') {
        // Pedidos no caixa recebem status 'pendente'
        saveOrder(paymentMethod, orderId, 'pendente');
        finishTitle.textContent = "Pedido registrado no Caixa";
        finishMessage.textContent = "Dirija-se ao caixa para finalizar o pagamento. Seu número do pedido é:";
        orderCodeDisplay.textContent = `Código: ${orderId}`;
        hideModal(reviewModal);
        hideModal(paymentModal);
        showModal(finishModal);
        localStorage.removeItem('tempCart');
        renderCart();
    }
}

// Adicione também a chamada da função saveOrder no checkPixStatus
function checkPixStatus(paymentId, orderId) {
    // ...
    const interval = setInterval(() => {
        fetch(url)
            // ...
                if (data.status === "approved") {
                    clearInterval(interval);
                    finishTitle.textContent = "Pagamento aprovado!";
                    finishMessage.textContent = "Seu pedido foi confirmado e está sendo preparado.";
                    orderCodeDisplay.textContent = `Código: ${orderId}`;
                    // Pedidos PIX aprovados recebem status 'aprovado'
                    saveOrder('pix', orderId, 'aprovado');
                    localStorage.removeItem('tempCart');
                    renderCart();
                }
                // ...
            // ...
    }, 5000);
}

const API_BASE = "https://sytem-loja-master.onrender.com";
// Finalizar pedido
function finalizeOrder(paymentMethod) {
    if (cart.length === 0) {
        showToast("Seu carrinho está vazio!");
        return;
    }
    const orderId = generateOrderCode();

    if (paymentMethod === 'pix') {
        // CORRIGIDO: usa crases para o template literal
        fetch(`${API_BASE}/create_pix_payment`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: orderId,
                items: cart.map(i => ({ name: i.name, price: Number(i.price), quantity: 1 })),
                total: cart.reduce((sum, item) => sum + Number(item.price), 0),
                payment: paymentMethod
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.id && data.qr_code && data.qr_code_base64) {
                // 🔥 Aqui usamos o ID do pagamento real do Mercado Pago
                showPixModal(data.id, data.qr_code, data.qr_code_base64, orderId);
            } else {
                showToast('Erro ao gerar o Pix.');
            }
        })
        .catch(() => showToast('Erro de conexão.'));
    } else if (paymentMethod === 'caixa') {
        saveOrder(paymentMethod, orderId);
        finishTitle.textContent = "Pedido registrado no Caixa";
        finishMessage.textContent = "Dirija-se ao caixa para finalizar o pagamento. Seu número do pedido é:";
        orderCodeDisplay.textContent = `Código: ${orderId}`;
        hideModal(reviewModal);
        hideModal(paymentModal);
        showModal(finishModal);
        localStorage.removeItem('tempCart');
        renderCart();
    }
}

// PIX modal + verificação
function showPixModal(paymentId, qrCode, qrCodeBase64, orderId) {
    hideModal(reviewModal);
    hideModal(paymentModal);
    showModal(finishModal);

    finishTitle.textContent = "Pagamento com PIX";
    finishMessage.innerHTML = `
        <p>Aponte a câmera para pagar via PIX.</p>
        <img src="data:image/jpeg;base64,${qrCodeBase64}" style="max-width:200px;margin:1rem auto;display:block;">
        <p>Ou copie o código abaixo:</p>
        <div class="pix-code-container">
            <input type="text" id="pix-code" value="${qrCode}" readonly>
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

    console.log("🔍 Iniciando verificação do pagamento ID:", paymentId); // debug
    checkPixStatus(paymentId, orderId);
}


// Checa status do Pix
function checkPixStatus(paymentId, orderId) {
    // CORRIGIDO: a URL deve ser construída uma única vez
    const url = `${API_BASE}/payment_status/${paymentId}`;
    console.log("🔗 Chamando URL de status:", url);

    const interval = setInterval(() => {
        fetch(url)
            .then(async res => {
                const text = await res.text();
                try {
                    const data = JSON.parse(text);
                    console.log("📡 Status recebido:", data);
                    if (data.status === "approved") {
                        clearInterval(interval);
                        finishTitle.textContent = "Pagamento aprovado!";
                        finishMessage.textContent = "Seu pedido foi confirmado e está sendo preparado.";
                        orderCodeDisplay.textContent = `Código: ${orderId}`;
                        saveOrder('pix', orderId);
                        localStorage.removeItem('tempCart');
                        renderCart();
                    }
                } catch (e) {
                    console.error("❌ Resposta inesperada:", text);
                }
            })
            .catch(err => console.error("Erro ao verificar pagamento:", err));
    }, 5000);
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