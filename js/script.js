// Dados do produto - Açaí
const acaiProduct = {
    id: 1,
    name: "Açaí",
    sizes: [
        { 
            name: "Pequeno (300ml)", 
            price: 10.00,
            description: "O açaí pequeno é ideal para quem quer um lanche rápido e refrescante. Inclui duas opções de acompanhamentos.",
            includedToppingsCount: 2,
            availableIncludedToppings: [
                { name: "Leite em pó" },
                { name: "Granola" },
                { name: "Paçoca" }
            ]
        },
        { 
            name: "Médio (500ml)", 
            price: 15.00,
            description: "O tamanho perfeito para um lanche mais completo. Inclui três opções de acompanhamentos.",
            includedToppingsCount: 3,
            availableIncludedToppings: [
                { name: "Leite em pó" },
                { name: "Granola" },
                { name: "Paçoca" },
                { name: "Banana" },
                { name: "Morango" }
            ]
        },
        { 
            name: "Grande (700ml)", 
            price: 20.00,
            description: "Açaí grande para matar a sua fome! Inclui cinco opções de acompanhamentos.",
            includedToppingsCount: 5,
            availableIncludedToppings: [
                { name: "Leite em pó" },
                { name: "Granola" },
                { name: "Paçoca" },
                { name: "Banana" },
                { name: "Morango" },
                { name: "Confete" },
                { name: "Gotas de chocolate" }
            ]
        }
    ],
    extras: [
        { name: "Leite condensado", price: 2.50 },
        { name: "Creme de Ninho", price: 3.00 },
        { name: "Creme de Ovomaltine", price: 3.50 }
    ]
};

// Referências aos elementos do HTML
const productDescriptionEl = document.getElementById('product-description');
const sizeOptionsContainer = document.getElementById('size-options');
const includedOptionsContainer = document.getElementById('included-options');
const includedLimitTextEl = document.getElementById('included-limit-text');
const extraOptionsContainer = document.getElementById('extra-options');
const addToCartButton = document.getElementById('add-to-cart-button');
const addToCartPriceSpan = document.getElementById('add-to-cart-price');
const cartItemCountEl = document.getElementById('cart-item-count');
const checkoutFooterButton = document.getElementById('checkout-footer-button');

// Referências aos elementos da modal
const modal = document.getElementById('cart-confirm-modal');
const continueShoppingBtn = document.getElementById('continue-shopping-btn');
const goToCartBtn = document.getElementById('go-to-cart-btn');

// --- Funções Principais ---

// Renderiza as opções de tamanho e extras na página.
function renderOptions() {
    sizeOptionsContainer.innerHTML = '';
    acaiProduct.sizes.forEach((size, index) => {
        const optionHtml = `
            <label class="option-item">
                <input type="radio" name="acai-size" class="option-radio" data-price="${size.price}" data-name="${size.name}" data-description="${size.description}" data-sizeIndex="${index}">
                <span class="option-name">${size.name}</span>
                <span class="option-price">R$ ${size.price.toFixed(2)}</span>
            </label>
        `;
        sizeOptionsContainer.insertAdjacentHTML('beforeend', optionHtml);
    });

    extraOptionsContainer.innerHTML = '';
    acaiProduct.extras.forEach(extra => {
        const optionHtml = `
            <label class="option-item">
                <input type="checkbox" name="acai-extra" class="option-checkbox" data-price="${extra.price}" data-name="${extra.name}">
                <span class="option-name">${extra.name}</span>
                <span class="option-price">+ R$ ${extra.price.toFixed(2)}</span>
            </label>
        `;
        extraOptionsContainer.insertAdjacentHTML('beforeend', optionHtml);
    });
}

// Atualiza a lista de complementos inclusos com base no tamanho selecionado.
function updateIncludedToppings() {
    const selectedSizeRadio = document.querySelector('input[name="acai-size"]:checked');
    
    if (!selectedSizeRadio) {
        includedOptionsContainer.innerHTML = '';
        includedLimitTextEl.textContent = '';
        return;
    }
    
    const sizeIndex = parseInt(selectedSizeRadio.dataset.sizeIndex, 10);
    const selectedSizeData = acaiProduct.sizes[sizeIndex];

    includedLimitTextEl.textContent = `Escolha até ${selectedSizeData.includedToppingsCount} itens sem custo adicional.`;

    includedOptionsContainer.innerHTML = '';
    selectedSizeData.availableIncludedToppings.forEach(topping => {
        const optionHtml = `
            <label class="option-item">
                <input type="checkbox" name="acai-included" class="option-checkbox" data-name="${topping.name}">
                <span class="option-name">${topping.name}</span>
                <span class="option-price"> (incluso)</span>
            </label>
        `;
        includedOptionsContainer.insertAdjacentHTML('beforeend', optionHtml);
    });
}

// Atualiza a descrição, o preço e a visibilidade dos botões de ação.
function updateSelection() {
    const selectedSizeRadio = document.querySelector('input[name="acai-size"]:checked');
    const cart = JSON.parse(localStorage.getItem('tempCart')) || [];
    
    // Visibilidade do botão de Adicionar ao Carrinho
    if (selectedSizeRadio) {
        addToCartButton.style.display = 'flex';
    } else {
        addToCartButton.style.display = 'none';
        productDescriptionEl.textContent = '';
    }

    // Visibilidade do botão de Finalizar Pedido
    if (cart.length > 0) {
        checkoutFooterButton.style.display = 'flex';
    } else {
        checkoutFooterButton.style.display = 'none';
    }
    
    // Calcula o preço total
    if (selectedSizeRadio) {
        let totalPrice = parseFloat(selectedSizeRadio.dataset.price);
        const sizeIndex = parseInt(selectedSizeRadio.dataset.sizeIndex, 10);
        const selectedSizeData = acaiProduct.sizes[sizeIndex];

        productDescriptionEl.textContent = selectedSizeData.description;

        const includedCheckboxes = document.querySelectorAll('input[name="acai-included"]');
        const checkedIncluded = document.querySelectorAll('input[name="acai-included"]:checked').length;
        
        includedCheckboxes.forEach(checkbox => {
            const label = checkbox.closest('label');
            if (checkedIncluded >= selectedSizeData.includedToppingsCount && !checkbox.checked) {
                checkbox.disabled = true;
                label.classList.add('disabled');
            } else {
                checkbox.disabled = false;
                label.classList.remove('disabled');
            }
        });

        document.querySelectorAll('input[name="acai-extra"]:checked').forEach(checkbox => {
            totalPrice += parseFloat(checkbox.dataset.price);
        });
        
        addToCartPriceSpan.textContent = `R$ ${totalPrice.toFixed(2)}`;
    } else {
        addToCartPriceSpan.textContent = `R$ 0,00`;
    }
}

// Adiciona o item ao carrinho e exibe a modal de confirmação.
function addToCart() {
    const selectedSizeRadio = document.querySelector('input[name="acai-size"]:checked');
    if (!selectedSizeRadio) return;
    
    const sizeName = selectedSizeRadio.dataset.name;
    const sizePrice = parseFloat(selectedSizeRadio.dataset.price);
    
    const selectedIncluded = Array.from(document.querySelectorAll('input[name="acai-included"]:checked')).map(checkbox => checkbox.dataset.name);
    
    const selectedExtras = Array.from(document.querySelectorAll('input[name="acai-extra"]:checked')).map(checkbox => ({
        name: checkbox.dataset.name,
        price: parseFloat(checkbox.dataset.price)
    }));

    const extrasPrice = selectedExtras.reduce((sum, extra) => sum + extra.price, 0);
    const finalPrice = sizePrice + extrasPrice;
    
    const newOrder = {
        id: Math.random().toString(16).slice(2),
        name: `Açaí ${sizeName}`,
        size: { name: sizeName, price: sizePrice },
        included: selectedIncluded,
        extras: selectedExtras,
        price: finalPrice
    };
    
    let cart = JSON.parse(localStorage.getItem('tempCart')) || [];
    cart.push(newOrder);
    localStorage.setItem('tempCart', JSON.stringify(cart));

    updateCartCount();
    
    // Exibe a modal de confirmação e esconde o botão de adicionar
    addToCartButton.style.display = 'none';
    modal.style.display = 'flex';
}

// Limpa todas as seleções de opções.
function resetSelections() {
    document.querySelectorAll('input[name="acai-size"]').forEach(radio => radio.checked = false);
    document.querySelectorAll('input[name="acai-included"]').forEach(checkbox => checkbox.checked = false);
    document.querySelectorAll('input[name="acai-extra"]').forEach(checkbox => checkbox.checked = false);
    
    updateIncludedToppings();
    updateSelection();
}

// Atualiza a contagem de itens no carrinho.
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('tempCart')) || [];
    cartItemCountEl.textContent = cart.length;
}

// Funções de salvamento e finalização de pedido (do arquivo cart.js original)
function saveOrder(paymentMethod) {
    const cart = JSON.parse(localStorage.getItem('tempCart')) || [];
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

// --- Eventos ---
sizeOptionsContainer.addEventListener('change', () => {
    updateIncludedToppings();
    updateSelection();
});
includedOptionsContainer.addEventListener('change', updateSelection);
extraOptionsContainer.addEventListener('change', updateSelection);
addToCartButton.addEventListener('click', addToCart);

continueShoppingBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    resetSelections();
});

goToCartBtn.addEventListener('click', () => {
    window.location.href = 'cart.html';
});

// Inicializa a aplicação quando o documento está pronto
document.addEventListener('DOMContentLoaded', () => {
    renderOptions();
    updateCartCount();
    updateSelection();
});