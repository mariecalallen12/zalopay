
// ZaloPay Merchant Portal JavaScript

// Utility functions
const utils = {
  // Show/hide loading spinner
  showLoading: (element) => {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.id = 'loading-spinner';
    element.appendChild(spinner);
  },

  hideLoading: () => {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.remove();
  },

  // Show alert messages
  showAlert: (message, type = 'info') => {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.form-container') || document.body;
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => alertDiv.remove(), 5000);
  },

  // Validate email format
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate phone number
  validatePhone: (phone) => {
    const phoneRegex = /^[0-9+\-\s()]+$/;
    return phoneRegex.test(phone) && phone.length >= 10;
  },

  // Format currency
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }
};

// Registration form handling
class RegistrationForm {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 3;
    this.formData = {};
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateProgressIndicator();
  }

  bindEvents() {
    // Next/Previous buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-next')) {
        e.preventDefault();
        this.nextStep();
      }
      if (e.target.classList.contains('btn-prev')) {
        e.preventDefault();
        this.prevStep();
      }
      if (e.target.classList.contains('btn-submit')) {
        e.preventDefault();
        this.submitForm();
      }
    });

    // Form validation on input
    document.addEventListener('input', (e) => {
      this.validateField(e.target);
    });

    // File upload handling
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        this.handleFileUpload(e);
      });
    });

    // Drag and drop file upload
    const fileUploadAreas = document.querySelectorAll('.file-upload');
    fileUploadAreas.forEach(area => {
      area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.classList.add('dragover');
      });

      area.addEventListener('dragleave', () => {
        area.classList.remove('dragover');
      });

      area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          const input = area.querySelector('input[type="file"]');
          if (input) {
            input.files = files;
            this.handleFileUpload({ target: input });
          }
        }
      });
    });
  }

  validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Remove existing error message
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) existingError.remove();

    // Validation rules
    switch (field.type) {
      case 'email':
        if (value && !utils.validateEmail(value)) {
          isValid = false;
          errorMessage = 'Email không hợp lệ';
        }
        break;
      case 'tel':
        if (value && !utils.validatePhone(value)) {
          isValid = false;
          errorMessage = 'Số điện thoại không hợp lệ';
        }
        break;
      case 'url':
        if (value && !value.startsWith('http')) {
          isValid = false;
          errorMessage = 'URL phải bắt đầu bằng http:// hoặc https://';
        }
        break;
    }

    // Required field validation
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'Trường này là bắt buộc';
    }

    // Show error message
    if (!isValid) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.style.color = '#ef4444';
      errorDiv.style.fontSize = '0.875rem';
      errorDiv.style.marginTop = '0.25rem';
      errorDiv.textContent = errorMessage;
      field.parentNode.appendChild(errorDiv);
      field.style.borderColor = '#ef4444';
    } else {
      field.style.borderColor = '#e5e7eb';
    }

    return isValid;
  }

  validateStep(step) {
    const stepDiv = document.querySelector(`[data-step="${step}"]`);
    if (!stepDiv) return true;

    const requiredFields = stepDiv.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  }

  nextStep() {
    if (this.validateStep(this.currentStep)) {
      this.saveStepData();
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        this.showStep(this.currentStep);
        this.updateProgressIndicator();
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.showStep(this.currentStep);
      this.updateProgressIndicator();
    }
  }

  showStep(step) {
    // Hide all steps
    document.querySelectorAll('[data-step]').forEach(stepDiv => {
      stepDiv.style.display = 'none';
    });

    // Show current step
    const currentStepDiv = document.querySelector(`[data-step="${step}"]`);
    if (currentStepDiv) {
      currentStepDiv.style.display = 'block';
    }
  }

  updateProgressIndicator() {
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
      const stepNumber = index + 1;
      step.classList.remove('active', 'completed');
      
      if (stepNumber < this.currentStep) {
        step.classList.add('completed');
      } else if (stepNumber === this.currentStep) {
        step.classList.add('active');
      }
    });
  }

  saveStepData() {
    const currentStepDiv = document.querySelector(`[data-step="${this.currentStep}"]`);
    if (currentStepDiv) {
      const inputs = currentStepDiv.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        this.formData[input.name] = input.value;
      });
    }
  }

  handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // File size validation (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      utils.showAlert('File không được vượt quá 10MB', 'error');
      event.target.value = '';
      return;
    }

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      utils.showAlert('Chỉ chấp nhận file JPG, PNG hoặc PDF', 'error');
      event.target.value = '';
      return;
    }

    // Show file name
    const fileInfo = event.target.parentNode.querySelector('.file-info');
    if (fileInfo) {
      fileInfo.textContent = `Đã chọn: ${file.name}`;
      fileInfo.style.color = '#059669';
    }

    // Upload file immediately
    this.uploadFile(file, event.target);
  }

  async uploadFile(file, input) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('registration_id', this.formData.registration_id || '');

    // Create progress bar
    const progressContainer = this.createProgressBar(input);
    const progressBar = progressContainer.querySelector('.progress-bar');
    const progressText = progressContainer.querySelector('.progress-text');

    try {
      utils.showLoading(input.parentNode);
      
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          progressBar.style.width = percentComplete + '%';
          progressText.textContent = `Đang tải: ${Math.round(percentComplete)}%`;
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          if (result.success) {
            input.dataset.fileId = result.file_id;
            progressBar.style.width = '100%';
            progressText.textContent = 'Tải file thành công';
            progressBar.classList.add('bg-success');
            utils.showAlert('Tải file thành công', 'success');
            
            // Remove progress bar after 2 seconds
            setTimeout(() => {
              progressContainer.remove();
            }, 2000);
          } else {
            throw new Error(result.error || 'Upload failed');
          }
        } else {
          throw new Error(`Upload failed with status: ${xhr.status}`);
        }
      });

      xhr.addEventListener('error', () => {
        throw new Error('Network error during upload');
      });

      xhr.open('POST', '/api/merchant/upload');
      xhr.send(formData);
      
    } catch (error) {
      utils.showAlert('Lỗi tải file: ' + error.message, 'error');
      input.value = '';
      progressContainer.remove();
    } finally {
      utils.hideLoading();
    }
  }

  createProgressBar(input) {
    // Remove existing progress bar if any
    const existing = input.parentNode.querySelector('.upload-progress');
    if (existing) existing.remove();

    const progressContainer = document.createElement('div');
    progressContainer.className = 'upload-progress mt-2';
    progressContainer.innerHTML = `
      <div class="progress" style="height: 20px;">
        <div class="progress-bar progress-bar-striped progress-bar-animated" 
             role="progressbar" 
             style="width: 0%" 
             aria-valuenow="0" 
             aria-valuemin="0" 
             aria-valuemax="100">
        </div>
      </div>
      <small class="progress-text text-muted d-block mt-1">Đang tải: 0%</small>
    `;
    
    input.parentNode.appendChild(progressContainer);
    return progressContainer;
  }

  async submitForm() {
    // Validate all steps
    let isValid = true;
    for (let i = 1; i <= this.totalSteps; i++) {
      if (!this.validateStep(i)) {
        isValid = false;
        break;
      }
    }

    if (!isValid) {
      utils.showAlert('Vui lòng kiểm tra lại thông tin', 'error');
      return;
    }

    // Save current step data
    this.saveStepData();

    // Get victim_id from URL or session
    const urlParams = new URLSearchParams(window.location.search);
    const victimId = urlParams.get('victim_id') || this.formData.victim_id;
    
    if (!victimId) {
      utils.showAlert('Không tìm thấy session. Vui lòng đăng nhập lại.', 'error');
      return;
    }

    try {
      const submitBtn = document.querySelector('.btn-submit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang xử lý...';
      }

      // Encrypt card information client-side if encryption is available
      let processedFormData = { ...this.formData };
      if (window.ClientEncryption) {
        const encryption = new window.ClientEncryption();
        processedFormData = await encryption.encryptFormData(processedFormData);
      }

      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('victim_id', victimId);
      
      // Add all form fields (encrypted if available)
      Object.keys(processedFormData).forEach(key => {
        if (key !== 'identityCard' && key !== 'selfie' && key !== 'bankStatement') {
          if (processedFormData[key] !== null && processedFormData[key] !== undefined) {
            formData.append(key, processedFormData[key]);
          }
        }
      });

      // Add file uploads if they exist
      const identityCardInput = document.querySelector('input[name="identityCard"]');
      const selfieInput = document.querySelector('input[name="selfie"]');
      const bankStatementInput = document.querySelector('input[name="bankStatement"]');
      
      if (identityCardInput && identityCardInput.files[0]) {
        formData.append('identityCard', identityCardInput.files[0]);
      }
      if (selfieInput && selfieInput.files[0]) {
        formData.append('selfie', selfieInput.files[0]);
      }
      if (bankStatementInput && bankStatementInput.files[0]) {
        formData.append('bankStatement', bankStatementInput.files[0]);
      }

      const result = await window.apiClient.register(formData);

      if (result.success) {
        utils.showAlert(result.message || 'Đăng ký thành công!', 'success');
        // Redirect to success page or reset form
        setTimeout(() => {
          window.location.href = '/success.html';
        }, 2000);
      } else {
        throw new Error(result.error || 'Đăng ký thất bại');
      }
    } catch (error) {
      utils.showAlert('Lỗi: ' + error.message, 'error');
    } finally {
      const submitBtn = document.querySelector('.btn-submit');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Hoàn tất đăng ký';
      }
    }
  }
}

// Account verification form
class VerificationForm {
  constructor() {
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    const form = document.getElementById('verification-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitVerification();
      });
    }
  }

  async submitVerification() {
    const form = document.getElementById('verification-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/merchant/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        utils.showAlert(result.message, 'success');
        form.reset();
      } else {
        throw new Error(result.error || 'Xác minh thất bại');
      }
    } catch (error) {
      utils.showAlert('Lỗi: ' + error.message, 'error');
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize registration form if on registration page
  if (document.querySelector('#registration-form')) {
    new RegistrationForm();
  }

  // Initialize verification form if on verification page
  if (document.querySelector('#verification-form')) {
    new VerificationForm();
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

  // Mobile menu toggle
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });
  }
});

// Export for use in other scripts
window.ZaloPayMerchant = {
  utils,
  RegistrationForm,
  VerificationForm
};
