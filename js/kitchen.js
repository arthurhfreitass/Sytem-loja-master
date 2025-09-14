// Referências a elementos do HTML
const ordersListContainer = document.getElementById('orders-list-container');
const noOrdersMessage = document.getElementById('no-orders-message');

const API_BASE = "https://sytem-loja-master.onrender.com";

async function fetchOrdersFromAPI() {
    try {
        const response = await fetch(`${API_BASE}/orders`);
        if (!response.ok) {
            throw new Error('Erro ao buscar pedidos da API.');
        }
        return await response.json();
    } catch (error) {
        console.error('❌ Erro na comunicação com a API:', error);
        return [];
    }
}

async function renderOrders() {
    const orders = await fetchOrdersFromAPI();
    ordersListContainer.innerHTML = '';
    
    const ordersToAccept = orders.filter(order => order.status === 'aprovado' || order.status === 'em_preparacao');

    if (ordersToAccept.length === 0) {
        noOrdersMessage.style.display = 'block';
        return;
    }
    
    noOrdersMessage.style.display = 'none';

    ordersToAccept.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.classList.add('order-card');
        
        let actionsHtml = '';
        if (order.status === 'aprovado') {
            actionsHtml = `<button class="accept-button" data-id="${order.id}">Aceitar Pedido</button>`;
        } else if (order.status === 'em_preparacao') {
            actionsHtml = `<button class="finish-button" data-id="${order.id}">Pedido Pronto</button>`;
        }

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
                <span class="order-status">${order.status === 'aprovado' ? 'APROVADO' : 'EM PREPARAÇÃO'}</span>
            </div>
            <ul class="order-list-items">${itemsHtml}</ul>
            <p>Total: R$ ${order.total.toFixed(2)}</p>
            <p>Pagamento: ${order.payment}</p>
            <div class="order-actions">${actionsHtml}</div>
        `;
        
        ordersListContainer.appendChild(orderCard);
    });
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar status do pedido.');
        }
        
        renderOrders();
    } catch (error) {
        console.error('❌ Erro ao atualizar status:', error);
    }
}

// Event Listeners para os botões do painel
ordersListContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('accept-button')) {
        const orderId = e.target.dataset.id;
        updateOrderStatus(orderId, 'em_preparacao');
        console.log(`Pedido ${orderId} aceito e enviado para produção!`);
    } else if (e.target.classList.contains('finish-button')) {
        const orderId = e.target.dataset.id;
        updateOrderStatus(orderId, 'concluido');
        console.log(`Pedido ${orderId} concluído!`);
    }
});

// Inicializa o painel
document.addEventListener('DOMContentLoaded', renderOrders);

// Atualiza a página a cada 5 segundos para simular tempo real
setInterval(renderOrders, 5000);