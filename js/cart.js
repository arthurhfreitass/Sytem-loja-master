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

// --- Funções Principais ---

// Toast
function showToast(message) {
    toastMessageEl.textContent = message;
    toastMessageEl.classList.add('show');
    setTimeout(() => toastMessageEl.classList.remove('show'), 3000);
}

// Renderiza carrinho
function renderCart() {
    cart = JSON.parse(localStorage.getItem('tempCart')) || [];
    cartList.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartList.innerHTML = '<p class="empty-cart-message">Seu carrinho está vazio.</p>';
        checkoutButton.disabled = true;
    } else {
        checkoutButton.disabled = false;
        cart.forEach(item => {
            const li = document.createElement('li');
            li.classList.add('cart-item');

            const toppings = item.toppings && item.toppings.length > 0 ? item.toppings.join(', ') : 'Nenhum';
            const extras = item.extras && item.extras.length > 0 ? item.extras.join(', ') : 'Nenhum';

            li.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-price">R$ ${Number(item.price).toFixed(2).replace('.', ',')}</span>
                </div>
                <ul class="item-details">
                    <li>**Tamanho:** ${item.size}</li>
                    <li>**Complementos:** ${toppings}</li>
                    <li>**Extras:** ${extras}</li>
                </ul>
            `;
            cartList.appendChild(li);
            total += Number(item.price);
        });
    }

    cartTotalPriceSpan.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// Renderiza revisão
function renderReviewList() {
    reviewList.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const li = document.createElement('li');
        li.classList.add('order-item');

        const toppings = item.toppings && item.toppings.length > 0 ? item.toppings.join(', ') : 'Nenhum';
        const extras = item.extras && item.extras.length > 0 ? item.extras.join(', ') : 'Nenhum';

        li.innerHTML = `
            <div class="item-info">
                <span class="item-name">${item.name}</span>
                <span class="item-price">R$ ${Number(item.price).toFixed(2).replace('.', ',')}</span>
            </div>
            <ul class="item-details">
                <li>**Tamanho:** ${item.size}</li>
                <li>**Complementos:** ${toppings}</li>
                <li>**Extras:** ${extras}</li>
            </ul>
        `;
        reviewList.appendChild(li);
        total += Number(item.price);
    });

    reviewTotalPriceSpan.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// Gera ID único
function generateOrderId() {
    return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Salva pedido
function saveOrder(paymentMethod, orderId) {
    const orderData = {
        id: orderId,
        items: cart,
        total: cart.reduce((sum, item) => sum + Number(item.price), 0),
        payment: paymentMethod,
        status: 'pendente'
    };

    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(orderData);
    localStorage.setItem('orders', JSON.stringify(orders));
}

// Finaliza pedido
function finalizeOrder(paymentMethod) {
    if (cart.length === 0) {
        showToast("Seu carrinho está vazio!");
        return;
    }

    const orderId = generateOrderId();
    const orderData = {
        orderId: orderId,
        items: cart.map(i => ({ name: i.name, price: Number(i.price), quantity: 1 })),
        total: cart.reduce((sum, item) => sum + Number(item.price), 0),
        payment: paymentMethod,
    };

    if (paymentMethod === 'pix') {
        fetch('http://127.0.0.1:5000/create_pix_payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => Promise.reject(err));
            }
            return response.json();
        })
        .then(data => {
            if (data.qr_code && data.qr_code_base64) {
                showPixModal(data.qr_code, data.qr_code_base64, orderId);
            } else {
                showToast('Erro ao gerar o Pix. Tente novamente.');
                console.error('Erro na resposta do servidor:', data);
            }
        })
        .catch(error => {
            showToast('Erro de conexão. Verifique o servidor.');
            console.error('Erro:', error);
        });
    } else if (paymentMethod === 'cash') {
        saveOrder(paymentMethod, orderId);
        finishTitle.textContent = "Pagamento com Dinheiro";
        finishMessage.textContent = "Dirija-se ao caixa para finalizar o pagamento. O número do seu pedido é:";
        orderCodeDisplay.textContent = orderId;

        hideModal(reviewModal);
        hideModal(paymentModal);
        showModal(finishModal);

        localStorage.removeItem('tempCart');
        renderCart();
    } else {
        showToast('Método de pagamento não implementado.');
    }
}

// Exibe modal Pix
function showPixModal(qrCode, qrCodeBase64, orderId) {
    hideModal(reviewModal);
    hideModal(paymentModal);
    showModal(finishModal);

    finishTitle.textContent = "Pagamento com PIX";
    finishMessage.innerHTML = `
        <p>Aponte a câmera do seu celular para o QR Code para pagar.</p>
        <img src="data:image/jpeg;base64,${qrCodeBase64}" alt="QR Code Pix" style="max-width: 200px; margin: 1rem auto; display: block;">
        <p>Ou copie o código abaixo e pague no seu aplicativo de banco.</p>
        <div class="pix-code-container">
            <input type="text" id="pix-code" value="${qrCode}" readonly>
            <button id="copy-pix-button">Copiar</button>
        </div>
        <p class="small-text">O número do seu pedido é: <span id="order-code-display">${orderId}</span></p>
    `;

    document.getElementById('copy-pix-button').addEventListener('click', () => {
        const pixCodeInput = document.getElementById('pix-code');
        pixCodeInput.select();
        document.execCommand('copy');
        showToast("Código Pix copiado!");
    });

    saveOrder('pix', orderId);
    localStorage.removeItem('tempCart');
    renderCart();
}

// Utilitários de modal
function showModal(modal) { modal.classList.add('show'); }
function hideModal(modal) { modal.classList.remove('show'); }

// --- Eventos ---
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
    button.addEventListener('click', (e) => {
        finalizeOrder(e.target.dataset.type);
    });
});

closeButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        hideModal(e.target.closest('.modal'));
    });
});

document.addEventListener('DOMContentLoaded', renderCart);
