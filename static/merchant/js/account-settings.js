// Account settings for ZaloPay Merchant
document.addEventListener('DOMContentLoaded', function() {
    initializeSettingsPage();
});

let currentSettings = {};

function initializeSettingsPage() {
    // Load initial settings
    loadSettings();

    // Set up form submissions
    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
    document.getElementById('businessForm').addEventListener('submit', handleBusinessUpdate);
    document.getElementById('passwordForm').addEventListener('submit', handlePasswordChange);
    document.getElementById('notificationsForm').addEventListener('submit', handleNotificationsUpdate);
}

async function loadSettings() {
    try {
        // Simulate API call to load user settings
        const settings = await fetchUserSettings();
        currentSettings = settings;

        // Populate forms with current data
        populateProfileForm(settings.profile);
        populateBusinessForm(settings.business);
        populateBankAccounts(settings.bankAccounts);
        populateSecuritySettings(settings.security);
        populateNotificationSettings(settings.notifications);

    } catch (error) {
        console.error('Error loading settings:', error);
        showError('Không thể tải cài đặt tài khoản');
    }
}

async function fetchUserSettings() {
    // API call - replace with actual endpoint
    try {
        const response = await fetch('/api/merchant/account/settings');
        if (!response.ok) throw new Error('Failed to fetch settings');
        return await response.json();
    } catch (error) {
        console.error('Error fetching user settings:', error);
        return {
            profile: {},
            business: {},
            bankAccounts: [],
            security: {
                twoFactorEnabled: false,
                lastPasswordChange: null,
                loginSessions: []
            },
            notifications: {
                transaction: {
                    successful: false,
                    failed: false,
                    largeAmount: false
                },
                security: {
                    newLogin: false,
                    passwordChange: false
                },
                marketing: {
                    promotions: false,
                    news: false
                },
                methods: {
                    email: false,
                    sms: false,
                    push: false
                }
            }
        };
    }
}

function populateProfileForm(profile) {
    document.getElementById('fullName').value = profile.fullName || '';
    document.getElementById('email').value = profile.email || '';
    document.getElementById('phone').value = profile.phone || '';
    document.getElementById('position').value = profile.position || '';
    document.getElementById('address').value = profile.address || '';
}

function populateBusinessForm(business) {
    document.getElementById('businessName').value = business.businessName || '';
    document.getElementById('taxCode').value = business.taxCode || '';
    document.getElementById('businessType').value = business.businessType || '';
    document.getElementById('industry').value = business.industry || '';
    document.getElementById('businessAddress').value = business.businessAddress || '';
    document.getElementById('employeeCount').value = business.employeeCount || '';
    document.getElementById('monthlyRevenue').value = business.monthlyRevenue || '';
}

function populateBankAccounts(bankAccounts) {
    const container = document.getElementById('bankAccountsList');

    if (!bankAccounts || bankAccounts.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-university fa-3x text-muted mb-3"></i>
                <p class="text-muted mb-3">Chưa có tài khoản ngân hàng nào</p>
                <button class="btn btn-primary" onclick="addBankAccount()">
                    <i class="fas fa-plus me-2"></i>
                    Thêm tài khoản ngân hàng
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = bankAccounts.map(account => `
        <div class="card mb-3 border">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-2">
                            <h6 class="mb-0 me-2">${account.bankName}</h6>
                            ${account.isPrimary ? '<span class="badge bg-primary">Mặc định</span>' : ''}
                            <span class="badge bg-${account.status === 'verified' ? 'success' : 'warning'} ms-1">
                                ${account.status === 'verified' ? 'Đã xác minh' : 'Chờ xác minh'}
                            </span>
                        </div>
                        <p class="text-muted small mb-1">Số tài khoản: <strong>${account.accountNumber}</strong></p>
                        <p class="text-muted small mb-1">Chủ tài khoản: <strong>${account.accountHolder}</strong></p>
                        <p class="text-muted small mb-0">Chi nhánh: ${account.branch}</p>
                    </div>
                    <div class="btn-group" role="group">
                        ${!account.isPrimary ? `
                            <button class="btn btn-sm btn-outline-primary" onclick="setPrimaryBank('${account.id}')" title="Đặt làm mặc định">
                                <i class="fas fa-star"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline-secondary" onclick="editBankAccount('${account.id}')" title="Chỉnh sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteBankAccount('${account.id}')" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function populateSecuritySettings(security) {
    document.getElementById('enable2FA').checked = security.twoFactorEnabled;

    const sessionsContainer = document.getElementById('loginSessions');
    sessionsContainer.innerHTML = security.loginSessions.map(session => `
        <div class="d-flex justify-content-between align-items-center border-bottom py-3">
            <div>
                <strong class="d-block">${session.device}</strong>
                <small class="text-muted">${session.location} • ${session.ip}</small>
                ${session.current ? '<span class="badge bg-success ms-2">Phiên hiện tại</span>' : ''}
            </div>
            <div class="text-end">
                <small class="text-muted d-block">${formatDateTime(session.lastActive)}</small>
                ${!session.current ? `
                    <button class="btn btn-sm btn-outline-danger" onclick="logoutSession('${session.ip}')">
                        Đăng xuất
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function populateNotificationSettings(notifications) {
    // Transaction notifications
    document.getElementById('notifySuccessfulTx').checked = notifications.transaction.successful;
    document.getElementById('notifyFailedTx').checked = notifications.transaction.failed;
    document.getElementById('notifyLargeTx').checked = notifications.transaction.largeAmount;

    // Security notifications
    document.getElementById('notifyLogin').checked = notifications.security.newLogin;
    document.getElementById('notifyPasswordChange').checked = notifications.security.passwordChange;

    // Marketing notifications
    document.getElementById('notifyPromotions').checked = notifications.marketing.promotions;
    document.getElementById('notifyNews').checked = notifications.marketing.news;

    // Notification methods
    document.getElementById('emailNotifications').checked = notifications.methods.email;
    document.getElementById('smsNotifications').checked = notifications.methods.sms;
    document.getElementById('pushNotifications').checked = notifications.methods.push;
}

function showSettingsTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.add('d-none');
    });

    // Remove active class from all nav items
    document.querySelectorAll('.list-group-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.remove('d-none');

    // Add active class to clicked nav item
    event.target.classList.add('active');
}

async function handleProfileUpdate(event) {
    event.preventDefault();

    const formData = {
        fullName: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        position: document.getElementById('position').value.trim(),
        address: document.getElementById('address').value.trim()
    };

    if (!formData.fullName || !formData.email || !formData.phone) {
        showError('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
    }

    try {
        await updateProfile(formData);
        showSuccess('Thông tin cá nhân đã được cập nhật');
    } catch (error) {
        console.error('Error updating profile:', error);
        showError('Không thể cập nhật thông tin cá nhân');
    }
}

async function handleBusinessUpdate(event) {
    event.preventDefault();

    const formData = {
        businessName: document.getElementById('businessName').value.trim(),
        taxCode: document.getElementById('taxCode').value.trim(),
        businessType: document.getElementById('businessType').value,
        industry: document.getElementById('industry').value,
        businessAddress: document.getElementById('businessAddress').value.trim(),
        employeeCount: document.getElementById('employeeCount').value,
        monthlyRevenue: document.getElementById('monthlyRevenue').value
    };

    if (!formData.businessName || !formData.taxCode) {
        showError('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
    }

    try {
        await updateBusiness(formData);
        showSuccess('Thông tin doanh nghiệp đã được cập nhật');
    } catch (error) {
        console.error('Error updating business:', error);
        showError('Không thể cập nhật thông tin doanh nghiệp');
    }
}

async function handlePasswordChange(event) {
    event.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        showError('Vui lòng điền đầy đủ thông tin');
        return;
    }

    if (newPassword !== confirmPassword) {
        showError('Mật khẩu xác nhận không khớp');
        return;
    }

    if (newPassword.length < 8) {
        showError('Mật khẩu mới phải có ít nhất 8 ký tự');
        return;
    }

    try {
        await changePassword(currentPassword, newPassword);
        document.getElementById('passwordForm').reset();
        showSuccess('Mật khẩu đã được thay đổi thành công');
    } catch (error) {
        console.error('Error changing password:', error);
        showError('Không thể thay đổi mật khẩu. Vui lòng kiểm tra mật khẩu hiện tại.');
    }
}

async function handleNotificationsUpdate(event) {
    event.preventDefault();

    const formData = {
        transaction: {
            successful: document.getElementById('notifySuccessfulTx').checked,
            failed: document.getElementById('notifyFailedTx').checked,
            largeAmount: document.getElementById('notifyLargeTx').checked
        },
        security: {
            newLogin: document.getElementById('notifyLogin').checked,
            passwordChange: document.getElementById('notifyPasswordChange').checked
        },
        marketing: {
            promotions: document.getElementById('notifyPromotions').checked,
            news: document.getElementById('notifyNews').checked
        },
        methods: {
            email: document.getElementById('emailNotifications').checked,
            sms: document.getElementById('smsNotifications').checked,
            push: document.getElementById('pushNotifications').checked
        }
    };

    try {
        await updateNotifications(formData);
        showSuccess('Cài đặt thông báo đã được lưu');
    } catch (error) {
        console.error('Error updating notifications:', error);
        showError('Không thể cập nhật cài đặt thông báo');
    }
}

async function updateProfile(data) {
    // Simulate API call
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() > 0.1) {
                resolve();
            } else {
                reject(new Error('API Error'));
            }
        }, 1000);
    });
}

async function updateBusiness(data) {
    // Simulate API call
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() > 0.1) {
                resolve();
            } else {
                reject(new Error('API Error'));
            }
        }, 1000);
    });
}

async function changePassword(current, newPassword) {
    // Simulate API call
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() > 0.1) {
                resolve();
            } else {
                reject(new Error('API Error'));
            }
        }, 1000);
    });
}

async function updateNotifications(data) {
    // Simulate API call
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() > 0.1) {
                resolve();
            } else {
                reject(new Error('API Error'));
            }
        }, 1000);
    });
}

function addBankAccount() {
    alert('Tính năng thêm tài khoản ngân hàng sẽ được triển khai trong phiên bản tiếp theo');
}

function editBankAccount(accountId) {
    alert(`Tính năng chỉnh sửa tài khoản ${accountId} sẽ được triển khai trong phiên bản tiếp theo`);
}

function deleteBankAccount(accountId) {
    if (confirm('Bạn có chắc chắn muốn xóa tài khoản ngân hàng này?')) {
        alert(`Đã xóa tài khoản ${accountId}`);
        // Reload bank accounts
        loadSettings();
    }
}

function setPrimaryBank(accountId) {
    alert(`Đã đặt tài khoản ${accountId} làm mặc định`);
    // Reload bank accounts
    loadSettings();
}

function toggle2FA() {
    const enabled = document.getElementById('enable2FA').checked;
    if (enabled) {
        alert('Xác thực hai yếu tố đã được bật. Vui lòng cấu hình ứng dụng xác thực.');
    } else {
        if (confirm('Bạn có chắc chắn muốn tắt xác thực hai yếu tố? Tài khoản của bạn sẽ kém an toàn hơn.')) {
            alert('Xác thực hai yếu tố đã được tắt.');
        } else {
            document.getElementById('enable2FA').checked = true;
        }
    }
}

function logoutSession(sessionIp) {
    if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi thiết bị này?')) {
        alert(`Đã đăng xuất khỏi thiết bị có IP ${sessionIp}`);
        // Reload sessions
        loadSettings();
    }
}

function logoutAllSessions() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi tất cả thiết bị? Bạn sẽ cần đăng nhập lại trên thiết bị này.')) {
        logout();
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

    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 3000);
}

// Utility functions
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

function logout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = 'auth_signup.html';
    }
}
