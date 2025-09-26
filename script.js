// Dados do produto - Açaí
const acaiProduct = {
    id: 1,
    name: "Açaí",
    sizes: [
        { 
            name: "Pequeno", 
            price: 0.01,
            description: "O açaí pequeno é ideal para quem quer um lanche rápido e refrescante. Inclui duas opções de acompanhamentos.",
            includedToppingsCount: 2,
            availableIncludedToppings: [
                { name: "Leite em pó" },
                { name: "Granola" },
                { name: "Paçoca" }
            ]
        },
        { 
            name: "Grande", 
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
    ],
    extras: [
        { name: "Creme de Ninho com Nutela", price: 3.00 },
        { name: "M&M", price: 3.00 },
        { name: "JuJuba", price: 3.00 }
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
const includedGroupContainer = document.getElementById('included-group-container');
const extrasGroupContainer = document.getElementById('extras-group-container');
// Renderiza opções
function renderOptions() {
    sizeOptionsContainer.innerHTML = '';
    acaiProduct.sizes.forEach((size, index) => {
        const optionHtml = `
            <label class="option-item">
                <input type="radio" name="acai-size" class="option-radio" data-price="${size.price}" data-name="${size.name}" data-description="${size.description}" data-size-index="${index}">
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

// Atualiza complementos inclusos
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

// Atualiza seleção e preço
// Atualiza seleção e preço
function updateSelection() {
    const selectedSizeRadio = document.querySelector('input[name="acai-size"]:checked');
    
    if (selectedSizeRadio) {
        // Se um tamanho foi selecionado:
        // 1. Mostrar os botões e os grupos de opções
        addToCartButton.style.display = 'flex';
        includedGroupContainer.classList.remove('hidden');
        extrasGroupContainer.classList.remove('hidden');

        // 2. Calcular o preço e atualizar a descrição
        let totalPrice = parseFloat(selectedSizeRadio.dataset.price);
        const sizeIndex = parseInt(selectedSizeRadio.dataset.sizeIndex, 10);
        const selectedSizeData = acaiProduct.sizes[sizeIndex];

        productDescriptionEl.textContent = selectedSizeData.description;

        // 3. Lógica para limitar a seleção de inclusos
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

        // 4. Somar o preço dos extras
        document.querySelectorAll('input[name="acai-extra"]:checked').forEach(checkbox => {
            totalPrice += parseFloat(checkbox.dataset.price);
        });
        
        // 5. Atualizar o preço no botão
        addToCartPriceSpan.textContent = `R$ ${totalPrice.toFixed(2)}`;
    } else {
        // Se NENHUM tamanho foi selecionado:
        // 1. Esconder os botões e os grupos de opções
        addToCartButton.style.display = 'none';
        includedGroupContainer.classList.add('hidden');
        extrasGroupContainer.classList.add('hidden');

        // 2. Limpar a descrição e o preço
        productDescriptionEl.textContent = '';
        addToCartPriceSpan.textContent = `R$ 0,00`;
    }
}


function addToCart() {
    const selectedSizeRadio = document.querySelector('input[name="acai-size"]:checked');
    if (!selectedSizeRadio) return;
    
    const sizeName = selectedSizeRadio.dataset.name;
    const sizePrice = parseFloat(selectedSizeRadio.dataset.price);
    
    const selectedIncluded = Array.from(document.querySelectorAll('input[name="acai-included"]:checked'))
        .map(checkbox => checkbox.dataset.name)
        .filter(name => name); // Garante que apenas nomes válidos sejam adicionados

    // CORRIGIDO: Coleta apenas os extras que estão marcados
    const selectedExtras = Array.from(document.querySelectorAll('input[name="acai-extra"]:checked'))
        .filter(checkbox => checkbox.dataset.name) // Filtra para garantir que o nome exista
        .map(checkbox => ({
            name: checkbox.dataset.name,
            price: parseFloat(checkbox.dataset.price)
        }));

    const extrasPrice = selectedExtras.reduce((sum, extra) => sum + extra.price, 0);
    const finalPrice = sizePrice + extrasPrice;
    
    const newOrder = {
        id: Math.random().toString(16).slice(2),
        name: "Açaí",
        size: {
            name: sizeName,
            price: sizePrice
        },
        price: finalPrice,
        toppings: selectedIncluded,
        extras: selectedExtras
    };
    
    let cart = JSON.parse(localStorage.getItem('tempCart')) || [];
    cart.push(newOrder);
    localStorage.setItem('tempCart', JSON.stringify(cart));

    updateCartCount();
    resetSelections();
}

// Resetar seleções
function resetSelections() {
    document.querySelectorAll('input[name="acai-size"]').forEach(radio => radio.checked = false);
    document.querySelectorAll('input[name="acai-included"]').forEach(checkbox => checkbox.checked = false);
    document.querySelectorAll('input[name="acai-extra"]').forEach(checkbox => checkbox.checked = false);
    
    updateIncludedToppings();
    updateSelection();
}

// Atualiza contador do carrinho
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('tempCart')) || [];
    const itemCount = cart.length;
    
    cartItemCountEl.textContent = itemCount;

    if (itemCount > 0) {
        checkoutFooterButton.style.display = 'flex';
    } else {
        checkoutFooterButton.style.display = 'none';
    }
}

// Eventos
sizeOptionsContainer.addEventListener('change', () => {

    updateIncludedToppings();
    updateSelection();

    if (includedGroupContainer) {
        includedGroupContainer.scrollIntoView({
            behavior: 'smooth',
            block: 'start'     
        });
    }
});

includedOptionsContainer.addEventListener('change', updateSelection);
extraOptionsContainer.addEventListener('change', updateSelection);
addToCartButton.addEventListener('click', addToCart);

document.addEventListener('DOMContentLoaded', () => {
    renderOptions();
    updateCartCount();
    includedGroupContainer.classList.add('hidden');
    extrasGroupContainer.classList.add('hidden');
    
    updateSelection();
});
// No seu script.js, ao lidar com o clique nas opções:
const optionItems = document.querySelectorAll('.option-item');
optionItems.forEach(item => {
    item.addEventListener('click', () => {
        // Remova a classe 'selected' de todos os itens do grupo
        const parentGroup = item.closest('.option-group');
        parentGroup.querySelectorAll('.option-item').forEach(el => {
            el.classList.remove('selected');
        });
        // Adicione a classe 'selected' ao item clicado
        item.classList.add('selected');
    });
});