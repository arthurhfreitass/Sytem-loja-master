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

// Variáveis para os gráficos (referências)
let balanceChart;
let goalChart;

function updateFinances() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];

    // Calcula o total de arrecadação
    const totalRevenue = orders
        .filter(order => order.status === 'aprovado' || order.status === 'accepted' || order.status === 'in_progress' || order.status === 'completed')
        .reduce((sum, order) => sum + order.total, 0);

    // Calcula o total de gastos
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.value, 0);
    const balance = totalRevenue - totalExpenses;
    const revenueDividedBy13 = totalRevenue / 13;

    // Atualiza os displays na página
    totalRevenueDisplay.textContent = `R$ ${totalRevenue.toFixed(2)}`;
    totalExpensesDisplay.textContent = `R$ ${totalExpenses.toFixed(2)}`;
    balanceDisplay.textContent = `R$ ${balance.toFixed(2)}`;
    revenueDividedDisplay.textContent = `R$ ${revenueDividedBy13.toFixed(2)}`;

    // Atualiza os gráficos
    renderCharts(totalRevenue, totalExpenses, balance);
    // Atualiza o histórico de gastos
    renderExpensesHistory();
}

function renderCharts(revenue, expenses, balance) {
    const ctx1 = document.getElementById('balanceChart').getContext('2d');
    const ctx2 = document.getElementById('goalChart').getContext('2d');

    if (balanceChart) balanceChart.destroy();
    if (goalChart) goalChart.destroy();

    balanceChart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: ['Arrecadado', 'Gastos'],
            datasets: [{
                label: 'Valores (R$)',
                data: [revenue, expenses],
                backgroundColor: ['rgba(40, 167, 69, 0.6)', 'rgba(220, 53, 69, 0.6)'],
                borderColor: ['#28a745', '#dc3545'],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            responsive: true,
            maintainAspectRatio: false,
        }
    });

    const goal = 1000;
    const missingToGoal = Math.max(0, goal - balance);

    goalChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Meta Alcançada', 'Falta para a Meta'],
            datasets: [{
                data: [balance, missingToGoal],
                backgroundColor: ['rgba(0, 123, 255, 0.8)', 'rgba(255, 193, 7, 0.8)'],
                hoverBackgroundColor: ['#007bff', '#ffc107']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    });
}

// Nova função para renderizar o histórico de gastos
function renderExpensesHistory() {
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    expenseHistoryContainer.innerHTML = '';

    if (expenses.length === 0) {
        noExpensesMessage.style.display = 'block';
        return;
    }

    noExpensesMessage.style.display = 'none';

    // Cria a tabela
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Descrição</th>
                <th class="text-right">Valor</th>
                <th class="text-right">Data</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    expenses.forEach(expense => {
        const row = document.createElement('tr');
        const formattedDate = new Date(expense.date).toLocaleDateString('pt-BR');
        row.innerHTML = `
            <td>${expense.description}</td>
            <td class="text-right expense-value-cell">- R$ ${expense.value.toFixed(2)}</td>
            <td class="text-right">${formattedDate}</td>
        `;
        tbody.appendChild(row);
    });

    expenseHistoryContainer.appendChild(table);
}

function handleExpense(e) {
    e.preventDefault();
    const description = document.getElementById('expense-description').value;
    const value = parseFloat(document.getElementById('expense-value').value);

    if (description && value) {
        const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        expenses.push({ description, value, date: new Date().toISOString() });
        localStorage.setItem('expenses', JSON.stringify(expenses));
        
        document.getElementById('expense-form').reset();
        updateFinances();
        alert('Gasto registrado com sucesso!');
    } else {
        alert('Por favor, preencha todos os campos do gasto.');
    }
}

function renderCashierOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    ordersListContainer.innerHTML = '';
    
    const pendingOrders = orders.filter(order => order.status === 'pendente');

    if (pendingOrders.length === 0) {
        noOrdersMessage.style.display = 'block';
        return;
    }
    
    noOrdersMessage.style.display = 'none';

    pendingOrders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.classList.add('order-card');
        
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
                    <li class="order-item-cashier">
                        <span class="item-name">${item.name}</span>
                        <p class="details">${details}</p>
                    </li>
                `;
            });
        }

        orderCard.innerHTML = `
            <div class="order-header">
                <h2>Pedido #${order.id}</h2>
                <span class="order-status">PENDENTE</span>
            </div>
            <ul class="order-list-items">${itemsHtml}</ul>
            <p>Total: R$ ${order.total.toFixed(2)}</p>
            <p>Pagamento: ${order.payment}</p>
            <div class="order-actions">
                <button class="approve-button" data-id="${order.id}">Aprovar e Enviar para Cozinha</button>
            </div>
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
        renderCashierOrders();
    }
}

function showSection(target) {
    ordersSection.classList.add('hidden');
    financesSection.classList.add('hidden');
    navButtons.forEach(btn => btn.classList.remove('active'));

    if (target === 'orders') {
        ordersSection.classList.remove('hidden');
        document.querySelector('[data-target="orders"]').classList.add('active');
        renderCashierOrders();
    } else if (target === 'finances') {
        financesSection.classList.remove('hidden');
        document.querySelector('[data-target="finances"]').classList.add('active');
        updateFinances();
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

expenseForm.addEventListener('submit', handleExpense);

document.addEventListener('DOMContentLoaded', () => {
    showSection('orders');
});

setInterval(renderCashierOrders, 5000);