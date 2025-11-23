// QR Codes management for ZaloPay Merchant
document.addEventListener('DOMContentLoaded', function() {
    initializeQRCodesPage();
});

let qrCodes = [];
let currentQRDetail = null;

function initializeQRCodesPage() {
    loadQRCodes();

    // Set up form submission
    document.getElementById('createQRForm').addEventListener('submit', handleCreateQR);

    // Set up amount field toggle based on QR type
    document.getElementById('qrType').addEventListener('change', function() {
        const amountField = document.getElementById('qrAmount');
        const amountLabel = amountField.previousElementSibling;

        if (this.value === 'dynamic') {
            amountField.required = false;
            amountField.placeholder = 'Để trống nếu không cố định';
            amountLabel.textContent = 'Số tiền (tùy chọn)';
        } else {
            amountField.required = false; // Static QR can have fixed amount or not
            amountField.placeholder = 'Để trống nếu không cố định';
            amountLabel.textContent = 'Số tiền (tùy chọn)';
        }
    });
}

async function loadQRCodes() {
    try {
        showLoading();

        // Simulate API call - replace with actual API endpoint
        const response = await fetchQRCodes();
        qrCodes = response.qrCodes;

        renderQRCodes();
    } catch (error) {
        console.error('Error loading QR codes:', error);
        showError('Không thể tải danh sách QR codes');
    } finally {
        hideLoading();
    }
}

async function fetchQRCodes() {
    // API call - replace with actual endpoint
    try {
        const response = await fetch('/api/merchant/qr-codes');
        if (!response.ok) throw new Error('Failed to fetch QR codes');
        const data = await response.json();
        return {
            qrCodes: data.qrCodes || []
        };
    } catch (error) {
        console.error('Error fetching QR codes:', error);
        return {
            qrCodes: []
        };
    }
}

function renderQRCodes() {
    const grid = document.getElementById('qrCodesGrid');

    if (qrCodes.length === 0) {
        document.getElementById('emptyState').classList.remove('d-none');
        grid.innerHTML = '';
        return;
    }

    document.getElementById('emptyState').classList.add('d-none');

    grid.innerHTML = qrCodes.map(qr => `
        <div class="col-lg-3 col-md-6">
            <div class="card h-100 qr-card" onclick="viewQRDetail('${qr.id}')">
                <div class="card-body text-center">
                    <div class="qr-preview mb-3" id="qr-preview-${qr.id}" style="width: 120px; height: 120px; margin: 0 auto; background: #f8f9fa; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-qrcode fa-3x text-muted"></i>
                    </div>
                    <h6 class="card-title mb-2">${qr.name}</h6>
                    <p class="text-muted small mb-2">${qr.description}</p>
                    <div class="mb-2">
                        ${getStatusBadge(qr.status)}
                        <span class="badge bg-light text-dark ms-1">${qr.type === 'static' ? 'Cố định' : 'Động'}</span>
                    </div>
                    ${qr.amount ? `<p class="text-success fw-bold mb-1">${formatCurrency(qr.amount)}</p>` : ''}
                    <div class="stats small text-muted">
                        <div><i class="fas fa-exchange-alt me-1"></i>${qr.totalTransactions} giao dịch</div>
                        <div><i class="fas fa-dollar-sign me-1"></i>${formatCurrency(qr.totalAmount)}</div>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <div class="btn-group w-100" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); downloadQR('${qr.id}')" title="Tải xuống">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="event.stopPropagation(); toggleQRStatus('${qr.id}')" title="${qr.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}">
                            <i class="fas fa-${qr.status === 'active' ? 'pause' : 'play'}"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); deleteQR('${qr.id}')" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // Generate QR codes for each item
    qrCodes.forEach(qr => {
        generateQRPreview(qr.id, qr.qrData);
    });
}

function generateQRPreview(qrId, qrData) {
    const previewElement = document.getElementById(`qr-preview-${qrId}`);

    // Clear existing content
    previewElement.innerHTML = '';

    // Generate QR code
    QRCode.toCanvas(qrData, {
        width: 100,
        height: 100,
        color: {
            dark: '#0033C9',
            light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
    }).then(canvas => {
        previewElement.innerHTML = '';
        previewElement.appendChild(canvas);
    }).catch(error => {
        console.error('Error generating QR code:', error);
        previewElement.innerHTML = '<i class="fas fa-exclamation-triangle fa-3x text-danger"></i>';
    });
}

function handleCreateQR(event) {
    event.preventDefault();

    const formData = {
        name: document.getElementById('qrName').value.trim(),
        type: document.getElementById('qrType').value,
        amount: document.getElementById('qrAmount').value ? parseInt(document.getElementById('qrAmount').value) : null,
        description: document.getElementById('qrDescription').value.trim(),
        design: document.querySelector('input[name="qrDesign"]:checked').value
    };

    // Basic validation
    if (!formData.name) {
        showError('Vui lòng nhập tên QR code');
        return;
    }

    if (formData.amount && formData.amount < 1000) {
        showError('Số tiền tối thiểu là 1,000 VND');
        return;
    }

    // Simulate API call to create QR code
    createQRCode(formData).then(() => {
        // Close modal and reset form
        bootstrap.Modal.getInstance(document.getElementById('createQRModal')).hide();
        document.getElementById('createQRForm').reset();

        // Reload QR codes
        loadQRCodes();

        showSuccess('QR code đã được tạo thành công!');
    }).catch(error => {
        console.error('Error creating QR code:', error);
        showError('Không thể tạo QR code. Vui lòng thử lại.');
    });
}

async function createQRCode(data) {
    // Simulate API call
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simulate random success/failure
            if (Math.random() > 0.1) { // 90% success rate
                resolve({
                    id: 'QR' + String(100 + qrCodes.length + 1).slice(1),
                    ...data,
                    status: 'active',
                    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    totalTransactions: 0,
                    totalAmount: 0,
                    qrData: `https://zalopay.vn/pay?merchant=DEMO001&name=${encodeURIComponent(data.name)}${data.amount ? `&amount=${data.amount}` : ''}`
                });
            } else {
                reject(new Error('API Error'));
            }
        }, 1500);
    });
}

function viewQRDetail(qrId) {
    const qr = qrCodes.find(q => q.id === qrId);
    if (!qr) {
        showError('Không tìm thấy QR code');
        return;
    }

    currentQRDetail = qr;
    const modal = new bootstrap.Modal(document.getElementById('qrDetailModal'));
    const content = document.getElementById('qrDetailContent');

    content.innerHTML = `
        <div class="row g-4">
            <div class="col-md-6">
                <div class="text-center mb-4">
                    <div id="qr-detail-canvas" style="width: 200px; height: 200px; margin: 0 auto; background: #f8f9fa; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <div class="spinner"></div>
                    </div>
                    <p class="text-muted mt-2">Quét mã để thanh toán</p>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Thông tin QR Code</h6>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tr>
                                <td><strong>Mã QR:</strong></td>
                                <td><code>${qr.id}</code></td>
                            </tr>
                            <tr>
                                <td><strong>Tên:</strong></td>
                                <td>${qr.name}</td>
                            </tr>
                            <tr>
                                <td><strong>Loại:</strong></td>
                                <td>${qr.type === 'static' ? 'Cố định' : 'Động'}</td>
                            </tr>
                            ${qr.amount ? `
                            <tr>
                                <td><strong>Số tiền:</strong></td>
                                <td>${formatCurrency(qr.amount)}</td>
                            </tr>
                            ` : ''}
                            <tr>
                                <td><strong>Trạng thái:</strong></td>
                                <td>${getStatusBadge(qr.status)}</td>
                            </tr>
                            <tr>
                                <td><strong>Ngày tạo:</strong></td>
                                <td>${formatDateTime(qr.createdAt)}</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>

            <div class="col-md-6">
                <div class="card mb-4">
                    <div class="card-header">
                        <h6 class="mb-0">Thống kê sử dụng</h6>
                    </div>
                    <div class="card-body">
                        <div class="row text-center">
                            <div class="col-6">
                                <h4 class="text-primary mb-1">${qr.totalTransactions}</h4>
                                <p class="text-muted small mb-0">Tổng giao dịch</p>
                            </div>
                            <div class="col-6">
                                <h4 class="text-success mb-1">${formatCurrency(qr.totalAmount)}</h4>
                                <p class="text-muted small mb-0">Tổng doanh thu</p>
                            </div>
                        </div>
                        ${qr.lastUsed ? `
                        <hr>
                        <p class="text-muted small mb-0">
                            <i class="fas fa-clock me-1"></i>
                            Lần cuối sử dụng: ${formatDateTime(qr.lastUsed)}
                        </p>
                        ` : ''}
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Giao dịch gần đây</h6>
                    </div>
                    <div class="card-body p-0">
                        <div class="list-group list-group-flush" id="recent-transactions-${qr.id}">
                            <div class="text-center py-3">
                                <div class="spinner"></div>
                                <p class="text-muted small mt-2">Đang tải...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.show();

    // Generate QR code for detail view
    setTimeout(() => {
        const canvasElement = document.getElementById('qr-detail-canvas');
        QRCode.toCanvas(qr.qrData, {
            width: 180,
            height: 180,
            color: {
                dark: '#0033C9',
                light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
        }).then(canvas => {
            canvasElement.innerHTML = '';
            canvasElement.appendChild(canvas);
        }).catch(error => {
            console.error('Error generating QR detail:', error);
            canvasElement.innerHTML = '<i class="fas fa-exclamation-triangle fa-4x text-danger"></i>';
        });

        // Load recent transactions for this QR
        loadRecentTransactionsForQR(qr.id);
    }, 100);
}

async function loadRecentTransactionsForQR(qrId) {
    // API call - replace with actual endpoint
    const container = document.getElementById(`recent-transactions-${qrId}`);
    
    try {
        const response = await fetch(`/api/merchant/qr-codes/${qrId}/transactions`);
        if (!response.ok) throw new Error('Failed to fetch transactions');
        const data = await response.json();
        const transactions = data.transactions || [];

        if (transactions.length === 0) {
            container.innerHTML = '<div class="text-center py-3"><p class="text-muted small mb-0">Chưa có giao dịch</p></div>';
            return;
        }

        container.innerHTML = transactions.map(tx => `
            <div class="list-group-item px-3 py-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong class="small">${formatCurrency(tx.amount)}</strong>
                        <br>
                        <small class="text-muted">${tx.customer} • ${formatDateTime(tx.time)}</small>
                    </div>
                    <span class="badge bg-success">Thành công</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading transactions for QR:', error);
        container.innerHTML = '<div class="text-center py-3"><p class="text-muted small mb-0">Chưa có giao dịch</p></div>';
    }
}

function downloadQR(qrId) {
    const qr = qrId ? qrCodes.find(q => q.id === qrId) : currentQRDetail;
    if (!qr) {
        showError('Không tìm thấy QR code');
        return;
    }

    // In a real implementation, this would download a high-quality PNG
    const link = document.createElement('a');
    link.download = `QR-${qr.name}-${qr.id}.png`;
    link.href = document.getElementById(qrId ? `qr-preview-${qrId}` : 'qr-detail-canvas').querySelector('canvas').toDataURL();
    link.click();

    showSuccess('QR code đã được tải xuống!');
}

function toggleQRStatus(qrId) {
    const qr = qrCodes.find(q => q.id === qrId);
    if (!qr) return;

    const newStatus = qr.status === 'active' ? 'inactive' : 'active';

    // Simulate API call
    setTimeout(() => {
        qr.status = newStatus;
        renderQRCodes();
        showSuccess(`QR code đã được ${newStatus === 'active' ? 'kích hoạt' : 'vô hiệu hóa'}`);
    }, 500);
}

function deleteQR(qrId) {
    if (!confirm('Bạn có chắc chắn muốn xóa QR code này? Hành động này không thể hoàn tác.')) {
        return;
    }

    // Simulate API call
    setTimeout(() => {
        qrCodes = qrCodes.filter(q => q.id !== qrId);
        renderQRCodes();
        showSuccess('QR code đã được xóa');

        // Close modal if it's open
        const modal = bootstrap.Modal.getInstance(document.getElementById('qrDetailModal'));
        if (modal) modal.hide();
    }, 500);
}

function editQR() {
    // In a real implementation, this would open an edit modal
    showError('Tính năng chỉnh sửa sẽ được triển khai trong phiên bản tiếp theo');
}

function showLoading() {
    document.getElementById('loadingState').classList.remove('d-none');
}

function hideLoading() {
    document.getElementById('loadingState').classList.add('d-none');
}

function showError(message) {
    // Simple error display - in a real app, use a proper notification system
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-error';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>
        ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    alertDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px;';

    document.body.appendChild(alertDiv);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

function showSuccess(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success';
    alertDiv.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>
        ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    alertDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px;';

    document.body.appendChild(alertDiv);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 3000);
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
        minute: '2-digit'
    });
}

function getStatusBadge(status) {
    const badges = {
        'active': '<span class="badge bg-success">Hoạt động</span>',
        'inactive': '<span class="badge bg-secondary">Vô hiệu hóa</span>',
        'expired': '<span class="badge bg-warning">Hết hạn</span>'
    };
    return badges[status] || '<span class="badge bg-secondary">Không xác định</span>';
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
