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

// API Base URL
const API_BASE = "https://sytem-loja-master.onrender.com";

// Toast
function showToast(message) {
    toastMessageEl.textContent = message;
    toastMessageEl.classList.add('show');
    setTimeout(() => toastMessageEl.classList.remove('show'), 3000);
}

// Render carrinho
function createCartItemHTML(item, index, className = 'cart-item') {
    const { name, price, size, toppings = [], extras = [] } = item;
    const formattedPrice = Number(price).toFixed(2).replace('.', ',');

    const toppingsList = toppings.map(t => `<li class="topping-item">${t}</li>`).join('');
    const extrasList = extras.map(e => `<li class="extra-item">+ ${e.name} (+ R$ ${Number(e.price).toFixed(2).replace('.', ',')})</li>`).join('');

    return `
        <div class="${className}" data-index="${index}">
            <div class="item-header">
                <span class="item-name">${name} - ${size}</span>
                <span class="item-price">R$ ${formattedPrice}</span>
            </div>
            <ul class="item-details">
                ${toppingsList}
                ${extrasList}
            </ul>
            ${className === 'cart-item' ? '<button class="remove-item">Remover</button>' : ''}
        </div>
    `;
}

function renderCart() {
    const tempCart = JSON.parse(localStorage.getItem('tempCart')) || [];
    cart = tempCart;
    cartList.innerHTML = '';
    let totalPrice = 0;

    if (cart.length === 0) {
        cartList.innerHTML = '<p class="empty-cart-message">Seu carrinho está vazio.</p>';
        cartTotalPriceSpan.textContent = '0,00';
    } else {
        cart.forEach((item, index) => {
            cartList.innerHTML += createCartItemHTML(item, index);
            totalPrice += Number(item.price);
        });
        cartTotalPriceSpan.textContent = totalPrice.toFixed(2).replace('.', ',');
    }
}

function renderReviewList() {
    reviewList.innerHTML = '';
    let totalPrice = 0;
    cart.forEach((item, index) => {
        reviewList.innerHTML += createCartItemHTML(item, index, 'review-item');
        totalPrice += Number(item.price);
    });
    reviewTotalPriceSpan.textContent = totalPrice.toFixed(2).replace('.', ',');
}

// Lógica de finalização do pedido
function generateOrderCode() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${timestamp}${random}`;
}

// Nova função para salvar o pedido na API
async function saveOrderToAPI(orderData) {
    try {
        const response = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log("✔ Pedido salvo na API:", data.orderId);
            return data.orderId;
        } else {
            console.error("❌ Erro ao salvar pedido:", data);
            return null;
        }
    } catch (error) {
        console.error("❌ Erro na comunicação com a API:", error);
        return null;
    }
}

// AQUI: A função finalizeOrder foi refatorada.
async function finalizeOrder(paymentMethod) {
    if (cart.length === 0) {
        showToast("Seu carrinho está vazio!");
        return;
    }

    const orderId = generateOrderCode();
    const orderData = {
        id: orderId,
        items: cart,
        total: cart.reduce((sum, item) => sum + Number(item.price), 0),
        payment: paymentMethod,
        status: paymentMethod === 'caixa' ? 'pendente' : 'pendente'
    };

    if (paymentMethod === 'pix') {
        const pixOrderData = {
            orderId: orderId,
            items: cart.map(i => ({ name: i.name, price: Number(i.price), quantity: 1, toppings: i.toppings, extras: i.extras.map(e => e.name) })),
            total: orderData.total,
            payment: paymentMethod
        };
        
        try {
            const response = await fetch(`${API_BASE}/create_pix_payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pixOrderData)
            });

            if (!response.ok) {
                throw new Error('Erro ao gerar o Pix.');
            }

            const data = await response.json();
            if (data.id && data.qr_code && data.qr_code_base64) {
                showPixModal(data.id, data.qr_code, data.qr_code_base64, orderId);
            } else {
                showToast('Erro ao gerar o Pix.');
            }
        } catch (error) {
            showToast('Erro de conexão com a API.');
            console.error("Erro ao gerar Pix:", error);
        }
    } else if (paymentMethod === 'caixa') {
        const savedOrderId = await saveOrderToAPI(orderData);

        if (savedOrderId) {
            // Mostra instrução antes de redirecionar
            finishTitle.textContent = "Pedido registrado no Caixa";
            finishMessage.innerHTML = `
                Dirija-se ao caixa e informe o código abaixo para realizar o pagamento:
                <br><strong>${savedOrderId}</strong>
            `;
            orderCodeDisplay.textContent = `Código: ${savedOrderId}`;

            hideModal(reviewModal);
            hideModal(paymentModal);
            showModal(finishModal);

            localStorage.removeItem('tempCart');
            renderCart();

            // Redireciona para acompanhamento após alguns segundos
            setTimeout(() => {
                window.location.href = `order_success.html?id=${savedOrderId}`;
            }, 4000); // tempo pra ler a mensagem
        } else {
            // Se o pedido não foi salvo, exibe um erro e não redireciona
            showToast('Erro ao salvar pedido no caixa. Por favor, tente novamente.');
        }
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
        const itemElement = e.target.closest('.cart-item');
        const index = itemElement.dataset.index;
        cart.splice(index, 1);
        localStorage.setItem('tempCart', JSON.stringify(cart));
        renderCart();
        updateCartCount();
    }
});

// Mercado Pago
const pixModal = document.getElementById('pix-modal');
const qrCodeImg = document.getElementById('qr-code-img');
const qrCodeCopyButton = document.getElementById('qr-code-copy-button');
const pixPaymentStatus = document.getElementById('pix-payment-status');
let checkStatusInterval = null;

function showPixModal(paymentId, qrCode, qrCodeBase64, orderId) {
    qrCodeImg.src = `data:image/jpeg;base64,${qrCodeBase64}`;
    qrCodeCopyButton.dataset.qrcode = qrCode;

    hideModal(reviewModal);
    hideModal(paymentModal);
    showModal(pixModal);

    checkStatusInterval = setInterval(() => checkPaymentStatus(paymentId, orderId), 5000);
}

qrCodeCopyButton.addEventListener('click', () => {
    const qrCode = qrCodeCopyButton.dataset.qrcode;
    navigator.clipboard.writeText(qrCode).then(() => {
        showToast("Código QR copiado!");
    }).catch(err => {
        console.error("Erro ao copiar: ", err);
    });
});

async function checkPaymentStatus(paymentId, orderId) {
    try {
        const response = await fetch(`${API_BASE}/payment_status/${paymentId}`);
        const data = await response.json();

        if (data.status === 'approved') {
            pixPaymentStatus.textContent = "Pagamento Aprovado!";
            clearInterval(checkStatusInterval);
            await saveOrderToAPI({
                id: orderId,
                items: cart,
                total: cart.reduce((sum, item) => sum + Number(item.price), 0),
                payment: 'pix',
                status: 'aprovado'
            });
            localStorage.removeItem('tempCart');
            window.location.href = `order_success.html?id=${orderId}`;
        }
    } catch (e) {
        console.error("Erro ao verificar pagamento:", e);
    }
}