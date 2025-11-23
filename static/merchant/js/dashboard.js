// Dashboard functionality for ZaloPay Merchant
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    loadDashboardData();
    initializeCharts();
});

function initializeDashboard() {
    // Update last update time
    updateLastUpdateTime();

    // Set up periodic updates
    setInterval(updateLastUpdateTime, 60000); // Update every minute
}

function updateLastUpdateTime() {
    const now = new Date();
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = '2 phút trước';
    }
}

async function loadDashboardData() {
    try {
        // Simulate API calls - replace with actual API endpoints
        const stats = await fetchDashboardStats();
        const transactions = await fetchRecentTransactions();

        updateStats(stats);
        updateRecentTransactions(transactions);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Không thể tải dữ liệu dashboard');
    }
}

async function fetchDashboardStats() {
    // API call - replace with actual endpoint
    try {
        const response = await fetch('/api/merchant/dashboard/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        return await response.json();
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return {
            totalRevenue: 0,
            totalTransactions: 0,
            activeQRCodes: 0,
            totalCustomers: 0
        };
    }
}

async function fetchRecentTransactions() {
    // API call - replace with actual endpoint
    try {
        const response = await fetch('/api/merchant/dashboard/recent-transactions');
        if (!response.ok) throw new Error('Failed to fetch transactions');
        const data = await response.json();
        return data.transactions || [];
    } catch (error) {
        console.error('Error fetching recent transactions:', error);
        return [];
    }
}

function updateStats(stats) {
    // Format currency
    document.getElementById('totalRevenue').textContent = formatCurrency(stats.totalRevenue);
    document.getElementById('totalTransactions').textContent = stats.totalTransactions.toLocaleString();
    document.getElementById('activeQRCodes').textContent = stats.activeQRCodes.toString();
    document.getElementById('totalCustomers').textContent = stats.totalCustomers.toLocaleString();
}

function updateRecentTransactions(transactions) {
    const tbody = document.getElementById('recentTransactions');

    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <p class="text-muted mb-0">Chưa có giao dịch nào</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = transactions.map(transaction => `
        <tr>
            <td>
                <code class="text-muted">${transaction.id}</code>
            </td>
            <td>
                <small class="text-muted">${formatDateTime(transaction.time)}</small>
            </td>
            <td>
                <strong class="text-success">${formatCurrency(transaction.amount)}</strong>
            </td>
            <td>
                <span class="badge bg-light text-dark">${getPaymentMethodIcon(transaction.method)} ${transaction.method}</span>
            </td>
            <td>
                ${getStatusBadge(transaction.status)}
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="viewTransaction('${transaction.id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getPaymentMethodIcon(method) {
    const icons = {
        'ZaloPay': '<i class="fas fa-wallet text-primary"></i>',
        'Momo': '<i class="fas fa-mobile-alt text-pink"></i>',
        'Bank Transfer': '<i class="fas fa-university text-info"></i>',
        'Credit Card': '<i class="fas fa-credit-card text-warning"></i>'
    };
    return icons[method] || '<i class="fas fa-money-bill-wave"></i>';
}

function getStatusBadge(status) {
    const badges = {
        'success': '<span class="badge bg-success">Thành công</span>',
        'pending': '<span class="badge bg-warning">Đang xử lý</span>',
        'failed': '<span class="badge bg-danger">Thất bại</span>',
        'cancelled': '<span class="badge bg-secondary">Đã hủy</span>'
    };
    return badges[status] || '<span class="badge bg-secondary">Không xác định</span>';
}

async function initializeCharts() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    // Fetch chart data from API
    let labels = [];
    let data = [];

    try {
        const response = await fetch('/api/merchant/dashboard/revenue-chart?days=7');
        if (response.ok) {
            const chartData = await response.json();
            labels = chartData.labels || [];
            data = chartData.data || [];
        }
    } catch (error) {
        console.error('Error fetching chart data:', error);
        // Fallback to empty data
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            labels.push(date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }));
            data.push(0);
        }
    }

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Doanh thu (VND)',
                data: data,
                borderColor: '#0033C9',
                backgroundColor: 'rgba(0, 51, 201, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#0033C9',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Doanh thu: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value, true); // Short format
                        }
                    },
                    grid: {
                        color: '#f3f4f6'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function changeChartPeriod(days) {
    // In a real implementation, this would fetch new data for the selected period
    console.log(`Changing chart period to ${days} days`);
    // For now, just reinitialize with new sample data
    initializeCharts();
}

function viewTransaction(transactionId) {
    // In a real implementation, this would navigate to transaction detail page
    console.log(`Viewing transaction: ${transactionId}`);
    alert(`Xem chi tiết giao dịch: ${transactionId}`);
}

function exportData() {
    // In a real implementation, this would trigger a data export
    alert('Đang xuất dữ liệu... (Tính năng sẽ được triển khai)');
}

function logout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        // Clear session/local storage
        localStorage.clear();
        sessionStorage.clear();

        // Redirect to login page
        window.location.href = 'auth_signup.html';
    }
}

function showError(message) {
    // Simple error display - in a real app, use a proper notification system
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-error';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;

    // Insert at the top of the main content
    const main = document.querySelector('main');
    main.insertBefore(alertDiv, main.firstChild);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

// Utility function for short currency format
function formatCurrency(amount, short = false) {
    if (short) {
        if (amount >= 1000000) {
            return (amount / 1000000).toFixed(1) + 'M';
        } else if (amount >= 1000) {
            return (amount / 1000).toFixed(0) + 'K';
        }
        return amount.toString();
    }

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}
