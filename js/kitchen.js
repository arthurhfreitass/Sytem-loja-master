// Referências a elementos do HTML
const ordersListContainer = document.getElementById('orders-list-container');
const noOrdersMessage = document.getElementById('no-orders-message');

const API_BASE = "https://sytem-loja-master.onrender.com";

// Busca os pedidos da API.
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

// Renderiza os pedidos para a cozinha
async function renderOrders() {
    const orders = await fetchOrdersFromAPI();
    ordersListContainer.innerHTML = '';
    
    const ordersToAccept = orders.filter(order => 
        order.status === 'aprovado' || order.status === 'em_preparacao' || order.status === 'pendente'
    );

    if (ordersToAccept.length === 0) {
        noOrdersMessage.style.display = 'block';
        return;
    }
    
    noOrdersMessage.style.display = 'none';

    ordersToAccept.forEach(order => {
        let itemsHtml = '';
        order.items.forEach(item => {
            const toppingsText = Array.isArray(item.toppings) && item.toppings.length > 0
                ? item.toppings.join(', ')
                : 'Nenhum';

            // CORRIGIDO: Filtra valores nulos/vazios e junta os extras
            const filteredExtras = Array.isArray(item.extras)
                ? item.extras.filter(e => e && (typeof e === "string" || e.name))
                : [];

            const extrasText = filteredExtras.length > 0
                ? filteredExtras.map(e => typeof e === "string" ? e : e.name).join(', ')
                : 'Nenhum';




            itemsHtml += `
                <li class="order-item">
                    <span class="order-item-name">${item.name}</span>
                    <ul class="order-item-details">
                        <li><strong>Tamanho:</strong> ${item.size ? item.size.name : 'N/A'}</li>
                        <li><strong>Complementos:</strong> ${toppingsText}</li>
                        <li><strong>Extras:</strong> ${extrasText}</li>
                    </ul>
                </li>
            `;
        });
        
        const orderCard = document.createElement('div');
        orderCard.classList.add('order-card');
        orderCard.innerHTML = `
            <div class="order-header">
                <h2>Pedido #${order.id}</h2>
                <span class="order-status">${order.status.toUpperCase()}</span>
            </div>
            <ul class="order-list-items">${itemsHtml}</ul>
            <div class="order-actions">
                <button class="accept-button" data-id="${order.id}">Aceitar Pedido</button>
            </div>
        `;
        
        ordersListContainer.appendChild(orderCard);
    });
}

// Atualiza o status do pedido na API
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
        
        await renderOrders();
    } catch (error) {
        console.error('❌ Erro ao atualizar status:', error);
    }
}

// Event Listeners para os botões do painel
ordersListContainer.addEventListener('click', async (e) => {
    if (e.target.classList.contains('accept-button')) {
        const orderId = e.target.dataset.id;
        await updateOrderStatus(orderId, 'em_preparacao');
        console.log(`Pedido ${orderId} aceito e enviado para produção!`);
        window.location.href = `production.html?id=${orderId}`;
    }
});

// Inicializa a renderização dos pedidos ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    renderOrders();
    setInterval(renderOrders, 5000);
});