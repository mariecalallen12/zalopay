// Transaction management for ZaloPay Merchant
document.addEventListener('DOMContentLoaded', function() {
    initializeTransactionsPage();
});

let currentPage = 1;
let pageSize = 10;
let totalRecords = 0;
let allTransactions = [];
let filteredTransactions = [];

function initializeTransactionsPage() {
    // Set default date range to last 30 days
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    dateFrom.value = thirtyDaysAgo.toISOString().split('T')[0];
    dateTo.value = today.toISOString().split('T')[0];

    // Load initial data
    loadTransactions();

    // Set up periodic refresh (every 30 seconds)
    setInterval(refreshTransactions, 30000);
}

async function loadTransactions() {
    try {
        showLoading();

        // Simulate API call - replace with actual API endpoint
        const response = await fetchTransactions();
        allTransactions = response.transactions;
        totalRecords = response.total;

        filterTransactions();
    } catch (error) {
        console.error('Error loading transactions:', error);
        showError('Không thể tải danh sách giao dịch');
    } finally {
        hideLoading();
    }
}

async function fetchTransactions() {
    // API call - replace with actual endpoint
    try {
        const response = await fetch('/api/merchant/transactions');
        if (!response.ok) throw new Error('Failed to fetch transactions');
        const data = await response.json();
        return {
            transactions: data.transactions || [],
            total: data.total || 0
        };
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return {
            transactions: [],
            total: 0
        };
    }
}

function filterTransactions() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const methodFilter = document.getElementById('methodFilter').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;

    filteredTransactions = allTransactions.filter(transaction => {
        // Search filter
        if (searchTerm) {
            const matchesSearch =
                transaction.id.toLowerCase().includes(searchTerm) ||
                transaction.customer.toLowerCase().includes(searchTerm) ||
                transaction.amount.toString().includes(searchTerm) ||
                transaction.description.toLowerCase().includes(searchTerm);

            if (!matchesSearch) return false;
        }

        // Status filter
        if (statusFilter && transaction.status !== statusFilter) {
            return false;
        }

        // Method filter
        if (methodFilter && transaction.method !== methodFilter) {
            return false;
        }

        // Date filter
        if (dateFrom || dateTo) {
            const transactionDate = new Date(transaction.time.split(' ')[0]);

            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                if (transactionDate < fromDate) return false;
            }

            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59); // End of day
                if (transactionDate > toDate) return false;
            }
        }

        return true;
    });

    // Sort by time (newest first)
    filteredTransactions.sort((a, b) => new Date(b.time) - new Date(a.time));

    currentPage = 1;
    renderTransactions();
    renderPagination();
}

function renderTransactions() {
    const tbody = document.getElementById('transactionsTable');
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredTransactions.length);
    const transactionsToShow = filteredTransactions.slice(startIndex, endIndex);

    if (transactionsToShow.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <p class="text-muted mb-0">Không tìm thấy giao dịch nào phù hợp với bộ lọc</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = transactionsToShow.map(transaction => `
        <tr>
            <td>
                <input type="checkbox" class="transaction-checkbox" value="${transaction.id}" onchange="updateSelectedCount()">
            </td>
            <td>
                <code class="text-muted">${transaction.id}</code>
            </td>
            <td>
                <small class="text-muted d-block">${formatDateTime(transaction.time)}</small>
                <small class="text-muted">${formatRelativeTime(transaction.time)}</small>
            </td>
            <td>
                <div>
                    <strong class="d-block">${transaction.customer}</strong>
                    <small class="text-muted">${transaction.description}</small>
                </div>
            </td>
            <td>
                <strong class="text-success">${formatCurrency(transaction.amount)}</strong>
            </td>
            <td>
                <span class="badge bg-light text-dark">
                    ${getPaymentMethodIcon(transaction.method)} ${transaction.method}
                </span>
            </td>
            <td>
                ${getStatusBadge(transaction.status)}
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewTransaction('${transaction.id}')" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="downloadReceipt('${transaction.id}')" title="Tải hóa đơn">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    // Update pagination info
    document.getElementById('showingFrom').textContent = filteredTransactions.length > 0 ? startIndex + 1 : 0;
    document.getElementById('showingTo').textContent = endIndex;
    document.getElementById('totalRecords').textContent = filteredTransactions.length.toLocaleString();
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredTransactions.length / pageSize);

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>
    `;

    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(1)">1</a></li>`;
        if (startPage > 2) {
            paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(${totalPages})">${totalPages}</a></li>`;
    }

    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>
    `;

    pagination.innerHTML = paginationHTML;
}

function changePage(page) {
    if (page < 1 || page > Math.ceil(filteredTransactions.length / pageSize)) {
        return;
    }

    currentPage = page;
    renderTransactions();
    renderPagination();

    // Scroll to top of table
    document.querySelector('.table-responsive').scrollIntoView({ behavior: 'smooth' });
}

function changePageSize() {
    pageSize = parseInt(document.getElementById('pageSize').value);
    currentPage = 1;
    renderTransactions();
    renderPagination();
}

function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.transaction-checkbox');

    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });

    updateSelectedCount();
}

function updateSelectedCount() {
    const selectedCount = document.querySelectorAll('.transaction-checkbox:checked').length;
    // You can add logic here to show selected count and enable bulk actions
    console.log(`${selectedCount} transactions selected`);
}

function viewTransaction(transactionId) {
    const transaction = allTransactions.find(t => t.id === transactionId);
    if (!transaction) {
        showError('Không tìm thấy giao dịch');
        return;
    }

    const modal = new bootstrap.Modal(document.getElementById('transactionModal'));
    const detailDiv = document.getElementById('transactionDetail');

    detailDiv.innerHTML = `
        <div class="row g-3">
            <div class="col-md-6">
                <h6>Thông tin giao dịch</h6>
                <table class="table table-sm">
                    <tr>
                        <td><strong>Mã giao dịch:</strong></td>
                        <td><code>${transaction.id}</code></td>
                    </tr>
                    <tr>
                        <td><strong>Thời gian:</strong></td>
                        <td>${formatDateTime(transaction.time)}</td>
                    </tr>
                    <tr>
                        <td><strong>Trạng thái:</strong></td>
                        <td>${getStatusBadge(transaction.status)}</td>
                    </tr>
                    <tr>
                        <td><strong>Mã tham chiếu:</strong></td>
                        <td><code>${transaction.reference}</code></td>
                    </tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>Thông tin thanh toán</h6>
                <table class="table table-sm">
                    <tr>
                        <td><strong>Khách hàng:</strong></td>
                        <td>${transaction.customer}</td>
                    </tr>
                    <tr>
                        <td><strong>Số tiền:</strong></td>
                        <td><strong class="text-success">${formatCurrency(transaction.amount)}</strong></td>
                    </tr>
                    <tr>
                        <td><strong>Phương thức:</strong></td>
                        <td>${getPaymentMethodIcon(transaction.method)} ${transaction.method}</td>
                    </tr>
                    <tr>
                        <td><strong>Mô tả:</strong></td>
                        <td>${transaction.description}</td>
                    </tr>
                </table>
            </div>
        </div>
    `;

    modal.show();
}

function downloadReceipt(transactionId) {
    // In a real implementation, this would download a PDF receipt
    alert(`Đang tải hóa đơn cho giao dịch ${transactionId}...`);
}

function printTransaction() {
    window.print();
}

function exportTransactions() {
    // In a real implementation, this would export selected transactions to Excel/CSV
    const selectedTransactions = Array.from(document.querySelectorAll('.transaction-checkbox:checked'))
        .map(checkbox => checkbox.value);

    if (selectedTransactions.length === 0) {
        // Export all filtered transactions if none selected
        if (filteredTransactions.length === 0) {
            showError('Không có giao dịch để xuất');
            return;
        }

        alert(`Đang xuất ${filteredTransactions.length} giao dịch ra file Excel...`);
    } else {
        alert(`Đang xuất ${selectedTransactions.length} giao dịch đã chọn ra file Excel...`);
    }
}

function refreshTransactions() {
    loadTransactions();
}

function showLoading() {
    const tbody = document.getElementById('transactionsTable');
    tbody.innerHTML = `
        <tr>
            <td colspan="8" class="text-center py-4">
                <div class="spinner"></div>
                <p class="text-muted mt-2">Đang tải dữ liệu...</p>
            </td>
        </tr>
    `;
}

function hideLoading() {
    // Loading will be replaced by renderTransactions()
}

// Utility functions
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
        minute: '2-digit',
        second: '2-digit'
    });
}

function formatRelativeTime(dateTimeString) {
    const now = new Date();
    const date = new Date(dateTimeString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;

    return date.toLocaleDateString('vi-VN');
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
        'pending': '<span class="badge bg-warning text-dark">Đang xử lý</span>',
        'failed': '<span class="badge bg-danger">Thất bại</span>',
        'cancelled': '<span class="badge bg-secondary">Đã hủy</span>'
    };
    return badges[status] || '<span class="badge bg-secondary">Không xác định</span>';
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

function logout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        // Clear session/local storage
        localStorage.clear();
        sessionStorage.clear();

        // Redirect to login page
        window.location.href = 'auth_signup.html';
    }
}
