// Referências a elementos do HTML
const ordersListContainer = document.getElementById('orders-list-container');
const noOrdersMessage = document.getElementById('no-orders-message');

function renderOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    ordersListContainer.innerHTML = '';
    
    // Filtra os pedidos que precisam de ser aceites (status 'aprovado')
    const ordersToAccept = orders.filter(order => order.status === 'aprovado');

    if (ordersToAccept.length === 0) {
        noOrdersMessage.style.display = 'block';
        return;
    }
    
    noOrdersMessage.style.display = 'none';

    ordersToAccept.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.classList.add('order-card');
        
        // No painel de aceitação, não precisamos de botões de 'iniciar' ou 'finalizar'
        const actionsHtml = `<a class="accept-button" href="production.html?id=${order.id}">Aceitar Pedido</a>`;

        let itemsHtml = '';
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                let details = `Tamanho: ${item.size.name}`;
                if (item.included && item.included.length > 0) {
                    details += ` | Inclusos: ${item.included.join(', ')}`;
                }
                if (item.extras && item.extras.length > 0) {
                    details += ` | Extras: ${item.extras.map(e => e.name).join(', ')}`;
                }
                itemsHtml += `
                    <li class="order-item-kitchen">
                        <span class="item-name">${item.name}</span>
                        <p class="details">${details}</p>
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

// Inicializa o painel
document.addEventListener('DOMContentLoaded', renderOrders);

// Atualiza a página a cada 5 segundos para simular tempo real
setInterval(renderOrders, 5000);

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
    if (e.target.classList.contains('accept-button')) {
        const orderId = e.target.dataset.id;
        updateOrderStatus(orderId, 'accepted');
    } else if (e.target.classList.contains('complete-button')) {
        const orderId = e.target.dataset.id;
        updateOrderStatus(orderId, 'in_progress');
    } else if (e.target.classList.contains('finalize-button')) {
        const orderId = e.target.dataset.id;
        updateOrderStatus(orderId, 'completed');
    }
});

// Inicializa o painel
document.addEventListener('DOMContentLoaded', renderOrders);

// Atualiza a página a cada 5 segundos para simular tempo real
setInterval(renderOrders, 5000);