// Referências a elementos do HTML
const ordersListContainer = document.getElementById('orders-list-container');
const noOrdersMessage = document.getElementById('no-orders-message');

function renderOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    ordersListContainer.innerHTML = '';
    
    // Filtra os pedidos que precisam ser aceitos (status 'aprovado')
    const ordersToAccept = orders.filter(order => order.status === 'aprovado');

    if (ordersToAccept.length === 0) {
        noOrdersMessage.style.display = 'block';
        return;
    }
    
    noOrdersMessage.style.display = 'none';

    ordersToAccept.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.classList.add('order-card');
        
        // Agora o botão tem um data-id para identificar o pedido
        const actionsHtml = `<button class="accept-button" data-id="${order.id}">Aceitar Pedido</button>`;

        let itemsHtml = '';
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                const sizeName = item.size && item.size.name ? item.size.name : 'N/A';
                const toppingsText = item.toppings && item.toppings.length > 0 ? item.toppings.join(', ') : 'Nenhum';
                const extrasText = item.extras && item.extras.length > 0 ? item.extras.map(e => e.name).join(', ') : 'Nenhum';

                itemsHtml += `
                    <li class="order-item-kitchen">
                        <span class="item-name">${item.name}</span>
                        <p class="details">
                            Tamanho: ${sizeName} | 
                            Complementos: ${toppingsText} | 
                            Extras: ${extrasText}
                        </p>
                    </li>
                `;
            });
        }

        orderCard.innerHTML = `
            <div class="order-header">
                <h2>Pedido #${order.id}</h2>
                <span class="order-status">APROVADO</span>
            </div>
            <ul class="order-list-items">${itemsHtml}</ul>
            <p>Total: R$ ${order.total.toFixed(2)}</p>
            <p>Pagamento: ${order.payment}</p>
            <div class="order-actions">${actionsHtml}</div>
        `;
        
        ordersListContainer.appendChild(orderCard);
    });
}

function updateOrderStatus(orderId, newStatus) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const orderToUpdate = orders.find(order => order.id === orderId);
    if (orderToUpdate) {
        orderToUpdate.status = newStatus;
        localStorage.setItem('orders', JSON.stringify(orders));
        renderOrders();
    }
}

// Event Listeners para os botões do painel
ordersListContainer.addEventListener('click', (e) => {
    // Verifica se o clique foi no botão 'Aceitar Pedido'
    if (e.target.classList.contains('accept-button')) {
        // Pega o ID do pedido do atributo 'data-id'
        const orderId = e.target.dataset.id;
        // Atualiza o status do pedido para 'em_preparacao'
        updateOrderStatus(orderId, 'em_preparacao');
        console.log(`Pedido ${orderId} aceito e enviado para produção!`); // Para debug
        
        // NOVO: Redireciona para a página de produção após aceitar o pedido
        window.location.href = `production.html?id=${orderId}`;
    }
});

// Inicializa o painel
document.addEventListener('DOMContentLoaded', renderOrders);

// Atualiza a página a cada 5 segundos para simular tempo real
setInterval(renderOrders, 5000);