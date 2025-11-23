// Reports and analytics for ZaloPay Merchant
document.addEventListener('DOMContentLoaded', function() {
    initializeReportsPage();
});

let currentPeriod = '7d';
let reportData = {};
let charts = {};

function initializeReportsPage() {
    // Set default date range
    setDefaultDateRange();

    // Load initial data
    loadReportData();

    // Initialize charts
    initializeCharts();
}

function setDefaultDateRange() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    document.getElementById('reportStartDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('reportEndDate').value = endDate.toISOString().split('T')[0];
}

function setPeriod(period) {
    currentPeriod = period;

    // Update button states
    document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Show/hide custom date range
    const customRange = document.getElementById('customDateRange');
    if (period === 'custom') {
        customRange.style.display = 'block';
    } else {
        customRange.style.display = 'none';
        loadReportData();
    }
}

function applyCustomDateRange() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;

    if (!startDate || !endDate) {
        showError('Vui lòng chọn đầy đủ khoảng thời gian');
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        showError('Ngày bắt đầu không được lớn hơn ngày kết thúc');
        return;
    }

    loadReportData();
}

async function loadReportData() {
    try {
        showLoading();

        // Simulate API call - replace with actual API endpoint
        const data = await fetchReportData();
        reportData = data;

        updateMetrics();
        updateCharts();
        updateDetailedStats();

    } catch (error) {
        console.error('Error loading report data:', error);
        showError('Không thể tải dữ liệu báo cáo');
    } finally {
        hideLoading();
    }
}

async function fetchReportData() {
    // API call - replace with actual endpoint
    try {
        const days = getDaysFromPeriod(currentPeriod);
        const startDate = document.getElementById('reportStartDate')?.value || '';
        const endDate = document.getElementById('reportEndDate')?.value || '';
        
        const params = new URLSearchParams({
            period: currentPeriod,
            days: days.toString()
        });
        if (startDate && endDate) {
            params.append('startDate', startDate);
            params.append('endDate', endDate);
        }
        
        const response = await fetch(`/api/merchant/reports?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch report data');
        const data = await response.json();
        
        return {
            current: data.current || {},
            previous: data.previous || {},
            comparison: data.comparison || {}
        };
    } catch (error) {
        console.error('Error fetching report data:', error);
        const days = getDaysFromPeriod(currentPeriod);
        return {
            current: generateEmptyData(days),
            previous: generateEmptyData(days),
            comparison: {}
        };
    }
}

function generateEmptyData(days) {
    return {
        revenue: Array(days).fill(0),
        transactions: Array(days).fill(0),
        customers: Array(days).fill(0),
        paymentMethods: {
            'ZaloPay': 0,
            'Momo': 0,
            'Bank Transfer': 0,
            'Credit Card': 0
        },
        peakHours: Array(24).fill(0),
        qrCodes: [],
        detailed: {
            total: 0,
            success: 0,
            failed: 0,
            pending: 0
        },
        topCustomers: [],
        weeklyAnalysis: Array(7).fill(0)
    };
}

function getDaysFromPeriod(period) {
    switch (period) {
        case '7d': return 7;
        case '30d': return 30;
        case '90d': return 90;
        case 'custom':
            const start = new Date(document.getElementById('reportStartDate').value);
            const end = new Date(document.getElementById('reportEndDate').value);
            return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        default: return 7;
    }
}

function generateSampleData(days) {
    // This function is deprecated - use generateEmptyData instead
    return generateEmptyData(days);
}

function calculateComparison(current, previous) {
    const totalRevenue = current.revenue.reduce((a, b) => a + b, 0);
    const prevRevenue = previous.revenue.reduce((a, b) => a + b, 0);
    const totalTransactions = current.transactions.reduce((a, b) => a + b, 0);
    const prevTransactions = previous.transactions.reduce((a, b) => a + b, 0);
    const totalCustomers = current.customers.reduce((a, b) => a + b, 0);
    const prevCustomers = previous.customers.reduce((a, b) => a + b, 0);

    return {
        revenue: ((totalRevenue - prevRevenue) / prevRevenue * 100),
        transactions: ((totalTransactions - prevTransactions) / prevTransactions * 100),
        customers: ((totalCustomers - prevCustomers) / prevCustomers * 100),
        avgValue: ((totalRevenue/totalTransactions - prevRevenue/prevTransactions) / (prevRevenue/prevTransactions) * 100)
    };
}

function updateMetrics() {
    const current = reportData.current;
    const comparison = reportData.comparison;

    const totalRevenue = current.revenue.reduce((a, b) => a + b, 0);
    const totalTransactions = current.transactions.reduce((a, b) => a + b, 0);
    const totalCustomers = current.customers.reduce((a, b) => a + b, 0);
    const avgValue = totalRevenue / totalTransactions;

    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('totalTransactions').textContent = totalTransactions.toLocaleString();
    document.getElementById('totalCustomers').textContent = totalCustomers.toLocaleString();
    document.getElementById('avgTransactionValue').textContent = formatCurrency(avgValue);

    // Update comparison badges
    updateComparisonBadge('revenueChange', comparison.revenue);
    updateComparisonBadge('transactionsChange', comparison.transactions);
    updateComparisonBadge('customersChange', comparison.customers);
    updateComparisonBadge('avgValueChange', comparison.avgValue);
}

function updateComparisonBadge(elementId, change) {
    const element = document.getElementById(elementId);
    const isPositive = change >= 0;
    element.className = `badge ${isPositive ? 'bg-success' : 'bg-danger'}`;
    element.textContent = `${isPositive ? '+' : ''}${change.toFixed(1)}%`;
}

function updateDetailedStats() {
    const detailed = reportData.current.detailed;

    document.getElementById('detailedTotalTx').textContent = detailed.total.toLocaleString();
    document.getElementById('detailedSuccessTx').textContent = detailed.success.toLocaleString();
    document.getElementById('detailedFailedTx').textContent = detailed.failed.toLocaleString();
    document.getElementById('detailedPendingTx').textContent = detailed.pending.toLocaleString();

    const successRate = (detailed.success / detailed.total * 100).toFixed(1);
    const failRate = (detailed.failed / detailed.total * 100).toFixed(1);
    const pendingRate = (detailed.pending / detailed.total * 100).toFixed(1);

    document.getElementById('detailedSuccessRate').textContent = `${successRate}%`;
    document.getElementById('detailedFailRate').textContent = `${failRate}%`;
    document.getElementById('detailedPendingRate').textContent = `${pendingRate}%`;
}

function initializeCharts() {
    // Revenue chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    charts.revenue = new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Doanh thu',
                data: [],
                borderColor: '#0033C9',
                backgroundColor: 'rgba(0, 51, 201, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: getChartOptions('Doanh thu (VND)')
    });

    // Payment methods chart
    const paymentCtx = document.getElementById('paymentMethodsChart').getContext('2d');
    charts.paymentMethods = new Chart(paymentCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: ['#0033C9', '#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Peak hours chart
    const peakCtx = document.getElementById('peakHoursChart').getContext('2d');
    charts.peakHours = new Chart(peakCtx, {
        type: 'bar',
        data: {
            labels: Array.from({length: 24}, (_, i) => `${i}:00`),
            datasets: [{
                label: 'Số giao dịch',
                data: [],
                backgroundColor: '#0033C9',
                borderRadius: 4
            }]
        },
        options: getChartOptions('Số giao dịch')
    });

    // Weekly analysis chart
    const weeklyCtx = document.getElementById('weeklyAnalysisChart').getContext('2d');
    charts.weeklyAnalysis = new Chart(weeklyCtx, {
        type: 'bar',
        data: {
            labels: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
            datasets: [{
                label: 'Doanh thu',
                data: [],
                backgroundColor: '#10b981',
                borderRadius: 4
            }]
        },
        options: getChartOptions('Doanh thu (VND)')
    });
}

function getChartOptions(yAxisLabel) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        if (yAxisLabel.includes('VND')) {
                            return yAxisLabel.replace('(VND)', '') + ': ' + formatCurrency(context.parsed.y);
                        }
                        return yAxisLabel + ': ' + context.parsed.y;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        if (yAxisLabel.includes('VND')) {
                            return formatCurrency(value, true);
                        }
                        return value;
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
        }
    };
}

function updateCharts() {
    const current = reportData.current;
    const days = current.revenue.length;

    // Revenue chart
    const revenueLabels = Array.from({length: days}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
    });

    charts.revenue.data.labels = revenueLabels;
    charts.revenue.data.datasets[0].data = current.revenue;
    charts.revenue.update();

    // Payment methods chart
    const paymentLabels = Object.keys(current.paymentMethods);
    const paymentData = Object.values(current.paymentMethods);
    charts.paymentMethods.data.labels = paymentLabels;
    charts.paymentMethods.data.datasets[0].data = paymentData;
    charts.paymentMethods.update();

    // Peak hours chart
    charts.peakHours.data.datasets[0].data = current.peakHours;
    charts.peakHours.update();

    // Weekly analysis chart
    charts.weeklyAnalysis.data.datasets[0].data = current.weeklyAnalysis;
    charts.weeklyAnalysis.update();

    // Update top QR codes
    updateTopQRCodes();

    // Update top customers
    updateTopCustomers();
}

function updateTopQRCodes() {
    const container = document.getElementById('topQRCodes');
    const qrCodes = reportData.current.qrCodes.slice(0, 5);

    container.innerHTML = qrCodes.map((qr, index) => `
        <div class="list-group-item d-flex justify-content-between align-items-center px-3 py-2">
            <div class="d-flex align-items-center">
                <div class="badge bg-primary me-3">${index + 1}</div>
                <div>
                    <strong class="d-block">${qr.name}</strong>
                    <small class="text-muted">${qr.transactions} giao dịch</small>
                </div>
            </div>
            <strong class="text-success">${formatCurrency(qr.revenue)}</strong>
        </div>
    `).join('');
}

function updateTopCustomers() {
    const container = document.getElementById('topCustomers');
    const customers = reportData.current.topCustomers;

    container.innerHTML = customers.map((customer, index) => `
        <div class="list-group-item d-flex justify-content-between align-items-center px-3 py-2">
            <div class="d-flex align-items-center">
                <div class="badge bg-secondary me-3">${index + 1}</div>
                <div>
                    <strong class="d-block">${customer.name}</strong>
                    <small class="text-muted">${customer.transactions} giao dịch</small>
                </div>
            </div>
            <strong class="text-primary">${formatCurrency(customer.totalSpent)}</strong>
        </div>
    `).join('');
}

function changeChartView(view) {
    // In a real implementation, this would change the chart granularity
    console.log(`Changing chart view to: ${view}`);
    // For now, just reload data
    loadReportData();
}

function exportReport() {
    // In a real implementation, this would export the report as PDF or Excel
    alert('Đang xuất báo cáo... (Tính năng sẽ được triển khai)');
}

function showLoading() {
    // Add loading overlay or spinner
    const main = document.querySelector('main');
    const loading = document.createElement('div');
    loading.id = 'reportLoading';
    loading.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75';
    loading.style.zIndex = '9999';
    loading.innerHTML = `
        <div class="text-center">
            <div class="spinner mb-3"></div>
            <p class="text-muted">Đang tải dữ liệu báo cáo...</p>
        </div>
    `;
    main.appendChild(loading);
}

function hideLoading() {
    const loading = document.getElementById('reportLoading');
    if (loading) {
        loading.remove();
    }
}

function showError(message) {
    // Simple error display
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-error';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>
        ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    alertDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px;';

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

// Utility functions
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

function logout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = 'auth_signup.html';
    }
}
