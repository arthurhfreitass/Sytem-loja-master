// Referências a elementos do HTML
const navButtons = document.querySelectorAll('.nav-button');
const ordersSection = document.getElementById('orders-section');
const financesSection = document.getElementById('finances-section');

const ordersListContainer = document.getElementById('orders-list-container');
const noOrdersMessage = document.getElementById('no-orders-message');
const totalRevenueDisplay = document.getElementById('total-revenue-display');
const totalExpensesDisplay = document.getElementById('total-expenses-display');
const balanceDisplay = document.getElementById('balance-display');
const revenueDividedDisplay = document.getElementById('revenue-divided-display');
const expenseForm = document.getElementById('expense-form');
const expenseHistoryContainer = document.getElementById('expense-history-container');
const noExpensesMessage = document.getElementById('no-expenses-message');

// Referências para os elementos de gráficos
const balanceChartCanvas = document.getElementById('balanceChart');
const goalChartCanvas = document.getElementById('goalChart');

// Variáveis para os gráficos (referências)
let balanceChart;
let goalChart;

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

// ATUALIZADO: Função para renderizar os gráficos
function renderCharts(totalRevenue, totalExpenses, balance) {
    // Destrói gráficos anteriores para evitar duplicação ou falha de atualização
    if (balanceChart) balanceChart.destroy();
    if (goalChart) goalChart.destroy();

    // Gráfico de Balanço (Barra)
    balanceChart = new Chart(balanceChartCanvas, {
        type: 'bar',
        data: {
            labels: ['Receita', 'Despesas', 'Saldo'],
            datasets: [{
                label: 'Valores Financeiros (R$)',
                data: [totalRevenue, totalExpenses, balance],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)', // Receita
                    'rgba(255, 99, 132, 0.6)', // Despesas
                    'rgba(54, 162, 235, 0.6)'  // Saldo
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // Gráfico de Meta (Doughnut)
    const profitGoal = 500;
    const remaining = Math.max(0, profitGoal - totalRevenue);

    goalChart = new Chart(goalChartCanvas, {
        type: 'doughnut',
        data: {
            labels: ['Arrecadado', 'Falta para a Meta'],
            datasets: [{
                label: 'Progresso da Meta',
                data: [totalRevenue, remaining],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(201, 203, 207, 0.6)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(201, 203, 207, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `Meta: R$ ${profitGoal.toFixed(2)}`
                }
            }
        }
    });
}

// NOVO: Função para renderizar o histórico de despesas
function renderExpenseHistory(expenses) {
    expenseHistoryContainer.innerHTML = '';
    if (expenses.length === 0) {
        noExpensesMessage.style.display = 'block';
    } else {
        noExpensesMessage.style.display = 'none';
        expenses.forEach(expense => {
            const expenseItem = document.createElement('li');
            expenseItem.classList.add('expense-item');
            expenseItem.innerHTML = `
                <span>${expense.description}</span>
                <span>- R$ ${expense.amount.toFixed(2)}</span>
            `;
            expenseHistoryContainer.appendChild(expenseItem);
        });
    }
}

// ATUALIZADO: Agora lê os dados financeiros do localStorage e renderiza gráficos
async function updateFinances() {

    // Lê a receita total, garantindo que seja um número (float), ou 0 se null
    const totalRevenue = parseFloat(localStorage.getItem('totalRevenue')) || 0; 
    // Lê a lista de despesas, ou um array vazio se null
    const expenses = JSON.parse(localStorage.getItem('expenses')) || []; 

    // Calcula o total das despesas
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const balance = totalRevenue - totalExpenses;

    // Atualiza os displays na interface (toFixed(2) para formatação de moeda)
    totalRevenueDisplay.textContent = `R$ ${totalRevenue.toFixed(2)}`;
    totalExpensesDisplay.textContent = `R$ ${totalExpenses.toFixed(2)}`;
    balanceDisplay.textContent = `R$ ${balance.toFixed(2)}`;

    // Renderiza o histórico de despesas
    renderExpenseHistory(expenses);

    // Atualiza os gráficos
    renderCharts(totalRevenue, totalExpenses, balance);
}

// Renderiza os pedidos para o painel do caixa.
async function renderCashierOrders() {
    const orders = await fetchOrdersFromAPI();
    ordersListContainer.innerHTML = '';
    
    const pendingOrders = orders.filter(order => order.status === 'pendente_caixa');

    if (pendingOrders.length === 0) {
        noOrdersMessage.style.display = 'block';
        return;
    }
    
    noOrdersMessage.style.display = 'none';

    pendingOrders.forEach(order => {
        let itemsHtml = '';
        if (Array.isArray(order.items)) {
            order.items.forEach(item => {
                const sizeName = item?.size?.name ?? (typeof item?.size === 'string' ? item.size : 'N/A');
                const toppingsText = Array.isArray(item?.toppings) && item.toppings.length > 0
                    ? item.toppings.join(', ')
                    : 'Nenhum';

                const filteredExtras = Array.isArray(item?.extras)
                    ? item.extras.filter(e => e && (typeof e === "string" || e.name))
                    : [];

                const extrasText = filteredExtras.length > 0
                    ? filteredExtras.map(e => typeof e === "string" ? e : e.name).join(', ')
                    : 'Nenhum';

                itemsHtml += `
                    <li class="order-item-cashier">
                        <p class="details">
                            <b>${item.name}</b>
                            <p class="item-size"><b>Tamanho:</b> ${sizeName}</p>
                            <p class="item-toppings"><b>Inclusos:</b> ${toppingsText}</p>
                            <p class="item-extras"><b>Extras:</b> ${extrasText}</p>
                        </p>
                    </li>
                `;
            });
        }

        // Correção de acesso ao total (usando order.totalPrice ou order.total)
        const totalNum = Number(order.totalPrice || order.total) || 0; 
        const statusDisplay = order.status ? order.status.toUpperCase() : 'PENDENTE';

        const orderCard = document.createElement('div');
        orderCard.classList.add('order-card');
        orderCard.innerHTML = `
            <div class="order-header">
                <h2>Pedido #${order.id}</h2>
                <span class="order-status">${statusDisplay}</span>
            </div>
            <ul class="order-list-items">${itemsHtml}</ul>
            <p>Total: R$ ${totalNum.toFixed(2)}</p>
            <p>Pagamento: ${order.payment || '—'}</p>
            <div class="order-actions">
                <button class="approve-button" data-id="${order.id}">Aprovar e Enviar para Cozinha</button>
            </div>
        `;
        
        ordersListContainer.appendChild(orderCard);
    });
}

// ATUALIZADO: Função com lógica de contabilidade local
async function updateOrderStatus(orderId, newStatus) {
    try {
        // 1. Atualiza o status do pedido na API (para a Cozinha e Cliente)
        const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error('❌ Erro ao atualizar status do pedido na API.');
        }

        // 2. Lógica para salvar a receita no localStorage (apenas se for 'aprovado')
        if (newStatus === 'aprovado') {
            const orderResponse = await fetch(`${API_BASE}/orders/${orderId}`);
            if (!orderResponse.ok) {
                console.warn('⚠️ Erro ao buscar detalhes do pedido para contabilidade local. Pedido foi aprovado, mas a receita não foi somada.');
            } else {
                const order = await orderResponse.json();

                // Garante que o valor total é lido como um número float
                const orderPrice = parseFloat(order.totalPrice || order.total) || 0; // Tenta 'totalPrice' e 'total'
                
                // Lê a receita total (garantindo que é lido como float)
                let revenue = parseFloat(localStorage.getItem('totalRevenue')) || 0;

                // Soma e atualiza
                revenue += orderPrice;

                // Salva de volta no localStorage, formatando para 2 casas decimais (como string)
                localStorage.setItem('totalRevenue', revenue.toFixed(2));
            }
        }

        // 3. Atualiza a interface do caixa após a mudança
        renderCashierOrders();
        updateFinances(); 
    } catch (error) {
        console.error('❌ Erro ao atualizar status:', error);
    }
}

// ATUALIZADO: Função agora é assíncrona
async function showSection(target) {
    ordersSection.classList.add('hidden');
    financesSection.classList.add('hidden');
    navButtons.forEach(btn => btn.classList.remove('active'));

    if (target === 'orders') {
        ordersSection.classList.remove('hidden');
        document.querySelector('[data-target="orders"]').classList.add('active');
        await renderCashierOrders();
    } else if (target === 'finances') {
        financesSection.classList.remove('hidden');
        document.querySelector('[data-target="finances"]').classList.add('active');
        await updateFinances();
    }
}

// Event Listeners
navButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        const target = e.target.dataset.target;
        showSection(target);
    });
});

ordersListContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('approve-button')) {
        const orderId = e.target.dataset.id;
        updateOrderStatus(orderId, 'aprovado');
    }
});

// CORRIGIDO: Event Listener do formulário de despesas
// Agora usa as referências corretas e o código defensivo para evitar o TypeError.
expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Referências aos elementos do formulário (GARANTINDO QUE OS IDs ESTÃO CORRETOS NO HTML)
    const expenseDescriptionEl = document.getElementById('expense-description');
    const expenseAmountEl = document.getElementById('expense-amount'); // ID CORRETO

    // Verifica se os elementos foram encontrados (evitando o TypeError: Cannot read properties of null)
    if (!expenseDescriptionEl || !expenseAmountEl) {
        console.error('❌ Erro: Elementos do formulário de despesas não encontrados no HTML. Verifique os IDs "expense-description" e "expense-amount".');
        alert('Erro interno: Faltando IDs no HTML para o formulário de despesas.');
        return;
    }

    const description = expenseDescriptionEl.value.trim();
    const amount = parseFloat(expenseAmountEl.value);

    // Validação dos dados
    if (description && !isNaN(amount) && amount > 0) {
        let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        
        // Adiciona a nova despesa
        expenses.push({ 
            description, 
            amount: amount, // 'amount' já é um float
            date: new Date().toISOString() 
        });
        
        // Salva a lista atualizada
        localStorage.setItem('expenses', JSON.stringify(expenses));
    
        // Atualiza a interface e limpa o formulário
        updateFinances();
        e.target.reset(); 
    } else {
        alert('Por favor, preencha a descrição e um valor válido para a despesa.');
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    showSection('orders');
});