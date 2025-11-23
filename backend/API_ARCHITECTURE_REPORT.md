# Báo Cáo Kiến Trúc API - Hệ Thống DogeRat

## Mục Lục

1. [Tổng Quan Hệ Thống](#tổng-quan-hệ-thống)
2. [Phân Tích REST API](#phân-tích-rest-api)
3. [Phân Tích Socket.IO](#phân-tích-socketio)
4. [Framework và Pattern](#framework-và-pattern)
5. [Đánh Giá và Nhận Xét](#đánh-giá-và-nhận-xét)

---

## Tổng Quan Hệ Thống

### 1.1. Mô Tả Kiến Trúc Tổng Thể

Hệ thống DogeRat sử dụng kiến trúc **Hybrid Architecture** kết hợp giữa:
- **REST API** (Express.js) - Cho các thao tác HTTP truyền thống
- **WebSocket** (Socket.IO) - Cho giao tiếp real-time hai chiều

Kiến trúc này cho phép hệ thống:
- Xử lý các request HTTP chuẩn qua REST API
- Duy trì kết nối real-time với các thiết bị Android qua WebSocket
- Đồng bộ dữ liệu real-time giữa server và client web

### 1.2. Sơ Đồ Kiến Trúc

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Client (Browser)                      │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   Dashboard UI    │         │  Device Detail   │          │
│  │   (index.html)   │         │   (device.html)  │          │
│  └──────────────────┘         └──────────────────┘          │
│         │                              │                     │
│         │ REST API                     │ Socket.IO           │
│         │ (HTTP/HTTPS)                 │ (WebSocket)         │
└─────────┼──────────────────────────────┼─────────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Node.js Server                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Express.js Application                   │   │
│  │  ┌────────────────┐      ┌──────────────────┐      │   │
│  │  │  REST Routes   │      │  Socket.IO Server │      │   │
│  │  │                │      │                   │      │   │
│  │  │ GET  /         │      │  Event Handlers:  │      │   │
│  │  │ GET  /api/*    │      │  - connection     │      │   │
│  │  │ POST /api/*    │      │  - disconnect     │      │   │
│  │  │ POST /upload   │      │  - message        │      │   │
│  │  │ GET  /text     │      │  - data           │      │   │
│  │  └────────────────┘      │  - commend-response│     │   │
│  │                          │  - file           │      │   │
│  └──────────────────────────┴───────────────────┘      │   │
│                                                          │   │
│  ┌──────────────────────────────────────────────────┐   │   │
│  │         In-Memory Data Storage (Maps)              │   │   │
│  │  - devices: Map<deviceId, deviceInfo>            │   │   │
│  │  - deviceData: Map<deviceId, deviceData>         │   │   │
│  └──────────────────────────────────────────────────┘   │   │
└──────────────────────────────────────────────────────────┘
          │                              │
          │ REST API                     │ Socket.IO
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Android Device (Client)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              DogeRat Android App                      │   │
│  │  - Socket.IO Client                                  │   │
│  │  - HTTP Client (for file uploads)                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 1.3. Công Nghệ Sử Dụng

| Công Nghệ | Phiên Bản | Mục Đích |
|-----------|-----------|----------|
| **Node.js** | - | Runtime environment |
| **Express.js** | 4.18.2 | REST API framework |
| **Socket.IO** | 4.5.3 | Real-time WebSocket communication |
| **Multer** | 1.4.5-lts.1 | File upload handling |
| **HTTP/HTTPS** | Built-in | HTTP server và keep-alive |

### 1.4. Lưu Trữ Dữ Liệu

Hệ thống sử dụng **In-Memory Storage** với hai Map chính:
- `devices`: Lưu thông tin thiết bị (model, version, IP, connection time)
- `deviceData`: Lưu dữ liệu từ thiết bị (contacts, SMS, calls, gallery, camera, keylogger, etc.)

**Lưu ý**: Dữ liệu sẽ mất khi server restart (không có persistence layer).

---

## Phân Tích REST API

### 2.1. Tổng Quan REST API

Hệ thống cung cấp **20+ REST API endpoints** với OpenAPI 3.1.0 specification đầy đủ:

**API Versioning**: Hệ thống sử dụng API versioning với prefix `/api/v1/` cho các endpoints mới, đồng thời duy trì các legacy endpoints để đảm bảo backward compatibility.

**OpenAPI 3.1.0 Specification**: Tất cả endpoints được document đầy đủ trong `docs/swagger.yaml` và `docs/openapi.json` theo chuẩn OpenAPI 3.1.0.

#### 2.1.1. Health Check Endpoints

| Method | Endpoint | Mô Tả | OpenAPI Reference |
|--------|----------|-------|-------------------|
| GET | `/health` | Basic health check | `#/paths/~1health` |
| GET | `/health/detailed` | Detailed health check với system information | `#/paths/~1health~1detailed` |
| GET | `/health/metrics` | System metrics và statistics | `#/paths/~1health~1metrics` |

#### 2.1.2. Device Management Endpoints (API v1)

| Method | Endpoint | Mô Tả | OpenAPI Reference |
|--------|----------|-------|-------------------|
| GET | `/api/v1/devices` | Lấy danh sách tất cả thiết bị (supports filtering) | `#/paths/~1api~1v1~1devices` |
| GET | `/api/v1/devices/:id` | Lấy chi tiết thiết bị theo ID | `#/paths/~1api~1v1~1devices~1{id}` |

#### 2.1.3. Action Execution Endpoints (API v1)

| Method | Endpoint | Mô Tả | OpenAPI Reference |
|--------|----------|-------|-------------------|
| POST | `/api/v1/devices/:id/action` | Thực thi hành động trên thiết bị (platform-aware) | `#/paths/~1api~1v1~1devices~1{id}~1action` |
| GET | `/api/v1/actions` | Lấy danh sách tất cả actions có sẵn | `#/paths/~1api~1v1~1actions` |

#### 2.1.4. Screen Control Endpoints (API v1)

| Method | Endpoint | Mô Tả | OpenAPI Reference |
|--------|----------|-------|-------------------|
| POST | `/api/v1/devices/:id/screen/start` | Bắt đầu screen streaming | `#/paths/~1api~1v1~1devices~1{id}~1screen~1start` |
| POST | `/api/v1/devices/:id/screen/stop` | Dừng screen streaming | `#/paths/~1api~1v1~1devices~1{id}~1screen~1stop` |
| POST | `/api/v1/devices/:id/screen/quality` | Cập nhật quality settings | `#/paths/~1api~1v1~1devices~1{id}~1screen~1quality` |
| GET | `/api/v1/devices/:id/screen/status` | Lấy streaming status | `#/paths/~1api~1v1~1devices~1{id}~1screen~1status` |

#### 2.1.5. Remote Control Endpoints (API v1)

| Method | Endpoint | Mô Tả | OpenAPI Reference |
|--------|----------|-------|-------------------|
| POST | `/api/v1/devices/:id/control/start` | Bắt đầu remote control session | `#/paths/~1api~1v1~1devices~1{id}~1control~1start` |
| POST | `/api/v1/devices/:id/control/stop` | Dừng remote control session | `#/paths/~1api~1v1~1devices~1{id}~1control~1stop` |
| POST | `/api/v1/devices/:id/control/command` | Gửi control command (touch, swipe, key, scroll) | `#/paths/~1api~1v1~1devices~1{id}~1control~1command` |
| GET | `/api/v1/devices/:id/control/status` | Lấy remote control status | `#/paths/~1api~1v1~1devices~1{id}~1control~1status` |

#### 2.1.6. File Upload Endpoints

| Method | Endpoint | Mô Tả | OpenAPI Reference |
|--------|----------|-------|-------------------|
| POST | `/upload` | Upload file từ thiết bị | `#/paths/~1upload` |

#### 2.1.7. Legacy Endpoints (Deprecated)

| Method | Endpoint | Mô Tả | Status |
|--------|----------|-------|--------|
| GET | `/` | Serve dashboard HTML | Active |
| GET | `/api/devices` | Legacy endpoint - Use `/api/v1/devices` instead | Deprecated |
| GET | `/api/device/:id` | Legacy endpoint - Use `/api/v1/devices/:id` instead | Deprecated |
| POST | `/api/device/:id/action` | Legacy endpoint - Use `/api/v1/devices/:id/action` instead | Deprecated |
| GET | `/text` | Legacy configuration endpoint | Deprecated |

**Note**: Legacy endpoints được giữ lại để đảm bảo backward compatibility nhưng được đánh dấu là deprecated trong OpenAPI specification.

### 2.2. Chi Tiết Các Endpoints

#### 2.2.1. GET `/` - Serve Dashboard

**Mục đích**: Phục vụ trang dashboard chính

**Request**:
```
GET /
```

**Response**:
- Content-Type: `text/html`
- Body: File `public/index.html`

**Đặc điểm**:
- Static file serving
- Không có xử lý logic phức tạp

---

#### 2.2.1a. GET `/health` - Basic Health Check

**Mục đích**: Kiểm tra trạng thái cơ bản của server

**OpenAPI Reference**: `#/paths/~1health`

**Request**:
```
GET /health
```

**Response Success (200)**:
```json
{
  "status": "ok",
  "uptime": 3600,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response Error (500)**:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An internal server error occurred"
  }
}
```

**Logic xử lý**:
1. Tính toán uptime từ server start time
2. Trả về status, uptime, và timestamp

**Schema**: `#/components/schemas/HealthStatus`

---

#### 2.2.1b. GET `/health/detailed` - Detailed Health Check

**Mục đích**: Kiểm tra trạng thái chi tiết với system information

**OpenAPI Reference**: `#/paths/~1health~1detailed`

**Request**:
```
GET /health/detailed
```

**Response Success (200)**:
```json
{
  "status": "ok",
  "uptime": 3600,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "memory": {
    "rss": "150MB",
    "heapTotal": "50MB",
    "heapUsed": "30MB",
    "external": "10MB"
  },
  "node": {
    "version": "v18.0.0",
    "platform": "darwin",
    "arch": "x64"
  },
  "database": {
    "connected": true
  }
}
```

**Logic xử lý**:
1. Tính toán uptime
2. Lấy memory usage từ process.memoryUsage()
3. Lấy Node.js version, platform, arch
4. Check database connection status
5. Trả về detailed health information

**Schema**: `#/components/schemas/DetailedHealth`

---

#### 2.2.1c. GET `/health/metrics` - System Metrics

**Mục đích**: Lấy system metrics và statistics

**OpenAPI Reference**: `#/paths/~1health~1metrics`

**Request**:
```
GET /health/metrics
```

**Response Success (200)**:
```json
{
  "success": true,
  "data": {
    "sockets": {
      "total": 5,
      "connected": 5,
      "disconnected": 0
    },
    "devices": {
      "total": 3,
      "online": 2,
      "offline": 1
    },
    "errors": {
      "total": 0,
      "byType": {}
    }
  }
}
```

**Logic xử lý**:
1. Get metrics từ metrics service
2. Tính toán socket statistics
3. Tính toán device statistics
4. Tính toán error statistics
5. Trả về metrics data

**Schema**: `#/components/schemas/SystemMetrics`

---

#### 2.2.2. GET `/api/v1/devices` - Lấy Danh Sách Thiết Bị (API v1)

**Mục đích**: Lấy danh sách tất cả thiết bị đang kết nối với filtering support

**OpenAPI Reference**: `#/paths/~1api~1v1~1devices`

**Request**:
```
GET /api/v1/devices?platform=android&online=true
```

**Query Parameters**:
- `platform` (optional): Filter by platform (`android` or `ios`)
- `online` (optional): Filter by online status (`true` or `false`)

**Response Success (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "socket-id-123",
      "model": "Samsung Galaxy S21",
      "version": "Android 12",
      "ip": "192.168.1.100",
      "platform": "android",
      "platformVersion": "Android 12",
      "connectedAt": "2024-01-15T10:30:00.000Z",
      "online": true
    }
  ],
  "count": 1,
  "filters": {
    "platform": "android",
    "online": true
  }
}
```

**Response Error (500)**:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An internal server error occurred"
  }
}
```

**Logic xử lý**:
1. Validate query parameters với express-validator
2. Build filters object từ query parameters
3. Get devices từ deviceService với filters
4. Trả về JSON response với success, data, count, và filters

**Error Handling**: 
- ✅ Validation errors (400) nếu query parameters không hợp lệ
- ✅ Internal server errors (500) với error response schema
- ✅ Trả về mảng rỗng nếu không có thiết bị phù hợp

**Schema**: `#/components/schemas/Device`

---

#### 2.2.2a. GET `/api/devices` - Legacy Endpoint (Deprecated)

**Mục đích**: Legacy endpoint cho backward compatibility

**Status**: ⚠️ Deprecated - Sử dụng `/api/v1/devices` thay thế

**Request**:
```
GET /api/devices
```

**Response**: Tương tự `/api/v1/devices` nhưng không có filtering support

---

#### 2.2.3. GET `/api/v1/devices/:id` - Lấy Chi Tiết Thiết Bị (API v1)

**Mục đích**: Lấy thông tin chi tiết và dữ liệu của một thiết bị cụ thể

**OpenAPI Reference**: `#/paths/~1api~1v1~1devices~1{id}`

**Request**:
```
GET /api/v1/devices/socket-id-123
```

**Parameters**:
- `id` (path parameter, required): Device ID (Socket ID)

**Response Success (200)**:
```json
{
  "success": true,
  "data": {
    "info": {
      "id": "socket-id-123",
      "model": "Samsung Galaxy S21",
      "version": "Android 12",
      "ip": "192.168.1.100",
      "platform": "android",
      "platformVersion": "Android 12",
      "connectedAt": "2024-01-15T10:30:00.000Z",
      "online": true
    },
    "data": {
      "contacts": [],
      "sms": [],
      "calls": [],
      "gallery": [],
      "camera": {
        "main": [],
        "selfie": []
      },
      "screenshots": [],
      "keylogger": {
        "enabled": false,
        "data": []
      },
      "clipboard": "",
      "location": null,
      "apps": [],
      "files": [],
      "microphone": [],
      "audio": {
        "playing": false,
        "current": null
      }
    }
  }
}
```

**Response Error (404)**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Device not found"
  }
}
```

**Response Error (500)**:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An internal server error occurred"
  }
}
```

**Logic xử lý**:
1. Validate path parameter với express-validator
2. Get device từ deviceService bằng deviceId
3. Nếu không tìm thấy → 404 với error response schema
4. Lấy device data từ deviceDataRepository
5. Trả về JSON response với success và data

**Error Handling**: 
- ✅ Validation errors (400) nếu path parameter không hợp lệ
- ✅ Not found errors (404) với error response schema
- ✅ Internal server errors (500) với error response schema
- ✅ Trả về `data: {}` nếu không có dữ liệu

**Schema**: `#/components/schemas/DeviceDetails`

---

#### 2.2.3a. GET `/api/device/:id` - Legacy Endpoint (Deprecated)

**Mục đích**: Legacy endpoint cho backward compatibility

**Status**: ⚠️ Deprecated - Sử dụng `/api/v1/devices/:id` thay thế

**Request**:
```
GET /api/device/socket-id-123
```

**Response**: Tương tự `/api/v1/devices/:id`

---

#### 2.2.4. POST `/api/v1/devices/:id/action` - Thực Thi Hành Động (API v1)

**Mục đích**: Thực thi hành động trên thiết bị với platform-aware validation

**OpenAPI Reference**: `#/paths/~1api~1v1~1devices~1{id}~1action`

**Request**:
```
POST /api/v1/devices/socket-id-123/action
Content-Type: application/json
```

**Request Body**:
```json
{
  "action": "screenshot",
  "params": {}
}
```

**Hoặc với params**:
```json
{
  "action": "toast",
  "params": {
    "toastText": "Hello World"
  }
}
```

**Parameters**:
- `id` (path parameter, required): Device ID (Socket ID)
- `action` (body, required): Action name (xem danh sách actions hỗ trợ)
- `params` (body, optional): Action parameters (object)

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Action sent to device",
  "action": "screenshot",
  "platform": "android"
}
```

**Response Error (400)**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Action is required and must be a string",
    "field": "action"
  }
}
```

**Response Error (404)**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Device not connected"
  }
}
```

**Các Actions Hỗ Trợ** (Platform-aware):

| Action | Android | iOS | Mô Tả | Params |
|--------|---------|-----|-------|--------|
| `contacts` | ✅ | ✅ | Lấy danh sách contacts | - |
| `sms` | ✅ | ✅ | Lấy danh sách SMS | - |
| `calls` | ✅ | ✅ | Lấy lịch sử cuộc gọi | - |
| `gallery` | ✅ | ✅ | Lấy danh sách ảnh gallery | - |
| `main-camera` | ✅ | ✅ | Chụp ảnh camera chính | - |
| `selfie-camera` | ✅ | ✅ | Chụp ảnh camera selfie | - |
| `screenshot` | ✅ | ✅ | Chụp màn hình | - |
| `toast` | ✅ | ✅ | Hiển thị toast message | `toastText` |
| `vibrate` | ✅ | ✅ | Rung thiết bị | `duration` |
| `sendSms` | ✅ | ✅ | Gửi SMS | `smsNumber`, `text` |
| `all-sms` | ✅ | ❌ | Gửi SMS cho tất cả contacts | `toastText` |
| `popNotification` | ✅ | ✅ | Hiển thị notification | `text` |
| `keylogger-on` | ✅ | ❌ | Bật keylogger | - |
| `keylogger-off` | ✅ | ❌ | Tắt keylogger | - |
| `clipboard` | ✅ | ✅ | Lấy clipboard | - |
| `openUrl` / `open-url` | ✅ | ✅ | Mở URL | `url` |
| `microphone` | ✅ | ✅ | Ghi âm microphone | `duration` |
| `play-audio` | ✅ | ✅ | Phát audio | - |
| `stop-audio` | ✅ | ✅ | Dừng audio | - |
| `apps` | ✅ | ✅ | Lấy danh sách apps | - |
| `file-explorer` | ✅ | ❌ | Duyệt file | - |
| `screen-stream-start` | ✅ | ✅ | Bắt đầu screen streaming | - |
| `screen-stream-stop` | ✅ | ✅ | Dừng screen streaming | - |
| `remote-control-start` | ✅ | ✅ | Bắt đầu remote control | - |
| `remote-control-stop` | ✅ | ✅ | Dừng remote control | - |
| `phishing` | ✅ | ❌ | Phishing attack | - |
| `encrypt` | ✅ | ❌ | Encrypt files | - |
| `decrypt` | ✅ | ❌ | Decrypt files | - |

**Logic xử lý**:
1. Validate path parameter và request body với express-validator
2. Check device connection status
3. Validate action support trên platform của device
4. Map action name sang device command (actionMap)
5. Convert params sang format `extras` (array of {key, value})
6. Emit Socket.IO event `commend` tới thiết bị
7. Update keylogger status nếu cần
8. Trả về success response với action và platform info

**Error Handling**:
- ✅ Validation errors (400) nếu request không hợp lệ
- ✅ Not found errors (404) nếu device không kết nối
- ✅ Validation errors (400) nếu action không được support trên platform
- ✅ Internal server errors (500) với error response schema

**Pattern**: Command Pattern - Action mapping và command execution

**Schema**: 
- Request: `#/components/schemas/ActionRequest`
- Response: `#/components/schemas/ActionResponse`

---

#### 2.2.4a. GET `/api/v1/actions` - Lấy Danh Sách Actions (API v1)

**Mục đích**: Lấy danh sách tất cả actions có sẵn, có thể filter theo platform

**OpenAPI Reference**: `#/paths/~1api~1v1~1actions`

**Request**:
```
GET /api/v1/actions?platform=android
```

**Query Parameters**:
- `platform` (optional): Filter by platform (`android` or `ios`)

**Response Success (200)**:
```json
{
  "success": true,
  "data": [
    "contacts",
    "sms",
    "calls",
    "gallery",
    "main-camera",
    "selfie-camera",
    "screenshot",
    "toast",
    "vibrate",
    "sendSms"
  ],
  "count": 10
}
```

**Logic xử lý**:
1. Get available actions từ actionService
2. Filter theo platform nếu có query parameter
3. Trả về danh sách actions với count

**Schema**: Array of strings

---

#### 2.2.4b. POST `/api/device/:id/action` - Legacy Endpoint (Deprecated)

**Mục đích**: Legacy endpoint cho backward compatibility

**Status**: ⚠️ Deprecated - Sử dụng `/api/v1/devices/:id/action` thay thế

**Request**:
```
POST /api/device/socket-id-123/action
Content-Type: application/json
```

**Response**: Tương tự `/api/v1/devices/:id/action` nhưng không có platform validation

---

#### 2.2.5. POST `/upload` - Upload File

**Mục đích**: Nhận file upload từ thiết bị

**OpenAPI Reference**: `#/paths/~1upload`

**Request**:
```
POST /upload
Content-Type: multipart/form-data
Headers:
  model: "Samsung Galaxy S21"
```

**Request Body**: 
- `file` (required): File to upload (multipart/form-data, binary)

**Parameters**:
- `model` (header, optional): Device model name

**Response Success (200)**:
```json
{
  "success": true,
  "filePath": "/uploads/Samsung_Galaxy_S21-1705312200000-image.jpg"
}
```

**Response Error (400)**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "No file uploaded"
  }
}
```

**Response Error (500)**:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An internal server error occurred"
  }
}
```

**Logic xử lý**:
1. Multer middleware xử lý file upload
2. Validate file presence
3. Lưu file vào thư mục `uploads/` với tên: `{sanitizedModel}-{timestamp}-{originalname}`
4. Tìm thiết bị theo model từ header
5. Thêm file vào deviceData.files array nếu tìm thấy device
6. Emit Socket.IO event `file-uploaded` tới web clients
7. Trả về file path

**File Storage**:
- Directory: `uploads/` (configurable via config.upload.uploadDir)
- Filename format: `{sanitizedModel}-{timestamp}-{originalname}`
- Max file size: Configurable via config.upload.maxFileSize
- Static serving: `/uploads/*` được serve qua Express static middleware

**Error Handling**:
- ✅ Validation errors (400) nếu không có file
- ✅ Internal server errors (500) với error response schema
- ✅ File được lưu ngay cả khi không tìm thấy thiết bị

**Schema**: Multipart form data với binary file field

---

#### 2.2.6. Screen Control Endpoints (API v1)

##### 2.2.6a. POST `/api/v1/devices/:id/screen/start` - Start Screen Streaming

**Mục đích**: Bắt đầu screen streaming cho thiết bị với optional quality settings

**OpenAPI Reference**: `#/paths/~1api~1v1~1devices~1{id}~1screen~1start`

**Request**:
```
POST /api/v1/devices/socket-id-123/screen/start
Content-Type: application/json
```

**Request Body** (optional):
```json
{
  "quality": {
    "fps": 15,
    "resolution": "half",
    "compression": 75
  }
}
```

**Parameters**:
- `id` (path parameter, required): Device ID
- `quality.fps` (optional): Frames per second (5-30)
- `quality.resolution` (optional): Screen resolution (`full`, `half`, `quarter`)
- `quality.compression` (optional): JPEG compression quality (60-90)

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Screen streaming started",
  "session": {
    "deviceId": "socket-id-123",
    "startedAt": "2024-01-15T10:30:00.000Z",
    "active": true,
    "frameCount": 0,
    "quality": {
      "fps": 15,
      "resolution": "half",
      "compression": 75
    }
  }
}
```

**Schema**: 
- Request: `#/components/schemas/StartStreamingRequest`
- Response: `#/components/schemas/StreamingStatus`

---

##### 2.2.6b. POST `/api/v1/devices/:id/screen/stop` - Stop Screen Streaming

**Mục đích**: Dừng screen streaming cho thiết bị

**OpenAPI Reference**: `#/paths/~1api~1v1~1devices~1{id}~1screen~1stop`

**Request**:
```
POST /api/v1/devices/socket-id-123/screen/stop
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Screen streaming stopped"
}
```

---

##### 2.2.6c. POST `/api/v1/devices/:id/screen/quality` - Update Quality Settings

**Mục đích**: Cập nhật quality settings cho active screen streaming session

**OpenAPI Reference**: `#/paths/~1api~1v1~1devices~1{id}~1screen~1quality`

**Request**:
```
POST /api/v1/devices/socket-id-123/screen/quality
Content-Type: application/json
```

**Request Body**:
```json
{
  "fps": 20,
  "resolution": "full",
  "compression": 80
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Quality settings updated",
  "quality": {
    "fps": 20,
    "resolution": "full",
    "compression": 80
  }
}
```

**Schema**: `#/components/schemas/ScreenQuality`

---

##### 2.2.6d. GET `/api/v1/devices/:id/screen/status` - Get Streaming Status

**Mục đích**: Lấy current screen streaming status cho thiết bị

**OpenAPI Reference**: `#/paths/~1api~1v1~1devices~1{id}~1screen~1status`

**Request**:
```
GET /api/v1/devices/socket-id-123/screen/status
```

**Response Success (200)**:
```json
{
  "success": true,
  "data": {
    "deviceId": "socket-id-123",
    "startedAt": "2024-01-15T10:30:00.000Z",
    "active": true,
    "frameCount": 150,
    "quality": {
      "fps": 15,
      "resolution": "half",
      "compression": 75
    }
  }
}
```

**Schema**: `#/components/schemas/StreamingStatus`

---

#### 2.2.7. Remote Control Endpoints (API v1)

##### 2.2.7a. POST `/api/v1/devices/:id/control/start` - Start Remote Control

**Mục đích**: Bắt đầu remote control session cho thiết bị

**OpenAPI Reference**: `#/paths/~1api~1v1~1devices~1{id}~1control~1start`

**Request**:
```
POST /api/v1/devices/socket-id-123/control/start
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Remote control started",
  "session": {
    "deviceId": "socket-id-123",
    "startedAt": "2024-01-15T10:30:00.000Z",
    "active": true,
    "commandCount": 0
  }
}
```

**Schema**: `#/components/schemas/ControlStatus`

---

##### 2.2.7b. POST `/api/v1/devices/:id/control/stop` - Stop Remote Control

**Mục đích**: Dừng remote control session cho thiết bị

**OpenAPI Reference**: `#/paths/~1api~1v1~1devices~1{id}~1control~1stop`

**Request**:
```
POST /api/v1/devices/socket-id-123/control/stop
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Remote control stopped"
}
```

---

##### 2.2.7c. POST `/api/v1/devices/:id/control/command` - Send Control Command

**Mục đích**: Gửi control command tới thiết bị (touch, swipe, key, scroll)

**OpenAPI Reference**: `#/paths/~1api~1v1~1devices~1{id}~1control~1command`

**Request**:
```
POST /api/v1/devices/socket-id-123/control/command
Content-Type: application/json
```

**Request Body Examples**:

**Touch Command**:
```json
{
  "type": "touch",
  "data": {
    "x": 100,
    "y": 200
  }
}
```

**Swipe Command**:
```json
{
  "type": "swipe",
  "data": {
    "startX": 100,
    "startY": 200,
    "endX": 300,
    "endY": 400,
    "duration": 500
  }
}
```

**Key Command**:
```json
{
  "type": "key",
  "data": {
    "keyCode": 4,
    "action": "press"
  }
}
```

**Scroll Command**:
```json
{
  "type": "scroll",
  "data": {
    "x": 100,
    "y": 200,
    "deltaX": 0,
    "deltaY": -100
  }
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Command sent to device"
}
```

**Schema**: `#/components/schemas/ControlCommand`

---

##### 2.2.7d. GET `/api/v1/devices/:id/control/status` - Get Control Status

**Mục đích**: Lấy current remote control status cho thiết bị

**OpenAPI Reference**: `#/paths/~1api~1v1~1devices~1{id}~1control~1status`

**Request**:
```
GET /api/v1/devices/socket-id-123/control/status
```

**Response Success (200)**:
```json
{
  "success": true,
  "data": {
    "deviceId": "socket-id-123",
    "startedAt": "2024-01-15T10:30:00.000Z",
    "active": true,
    "commandCount": 25
  }
}
```

**Schema**: `#/components/schemas/ControlStatus`

---

#### 2.2.8. GET `/text` - Legacy Configuration Endpoint (Deprecated)

**Mục đích**: Lấy cấu hình text từ `data.json` (cho compatibility)

**Status**: ⚠️ Deprecated

**OpenAPI Reference**: `#/paths/~1text`

**Request**:
```
GET /text
```

**Response**:
```
Plain text content from data.json.text
```

**Logic xử lý**:
1. Đọc `data.json` (đã load khi server start)
2. Trả về `data.text` hoặc chuỗi rỗng

**Use Case**: Sử dụng cho tính năng premium (gửi text tới tất cả contacts)

---

### 2.3. HTTP Methods và Conventions

**RESTful Conventions**:
- ✅ Sử dụng HTTP methods đúng mục đích (GET cho read, POST cho write)
- ✅ Resource-based URLs (`/api/v1/devices/:id`)
- ✅ JSON response format
- ✅ API versioning (`/api/v1/...`) cho các endpoints mới
- ⚠️ Không tuân thủ hoàn toàn REST (thiếu PUT, DELETE, PATCH)
- ✅ OpenAPI 3.1.0 specification đầy đủ

**API Versioning**:
- **API v1**: `/api/v1/...` - Endpoints mới với đầy đủ features và validation
- **Legacy**: `/api/...` - Endpoints cũ được giữ lại cho backward compatibility (deprecated)

**URL Structure**:
```
/                           → Static file serving
/health                     → Health check endpoints
/health/detailed            → Detailed health check
/health/metrics             → System metrics
/api/v1/devices             → Collection resource (API v1)
/api/v1/devices/:id         → Individual resource (API v1)
/api/v1/devices/:id/action  → Action endpoint (API v1)
/api/v1/actions             → Available actions list (API v1)
/api/v1/devices/:id/screen/* → Screen control endpoints (API v1)
/api/v1/devices/:id/control/* → Remote control endpoints (API v1)
/upload                     → File upload endpoint
/api/devices                → Legacy endpoint (deprecated)
/api/device/:id             → Legacy endpoint (deprecated)
/api/device/:id/action      → Legacy endpoint (deprecated)
/text                       → Legacy configuration endpoint (deprecated)
```

**OpenAPI 3.1.0 Specification**:
- Tất cả endpoints được document đầy đủ trong `docs/swagger.yaml` và `docs/openapi.json`
- Swagger UI available tại `/api-docs`
- Tất cả schemas, parameters, và responses được định nghĩa trong OpenAPI spec
- Security schemes (JWT, API Key) được định nghĩa trong components

### 2.4. Request/Response Patterns

**Request Headers**:
- `Content-Type: application/json` (cho POST requests với JSON body)
- `Content-Type: multipart/form-data` (cho file uploads)
- Custom headers: `model` (cho file uploads)
- `Authorization: Bearer <token>` (optional, cho future authentication)
- `X-API-Key: <key>` (optional, cho future API key authentication)

**Response Format**:

**Success Response Pattern**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message",
  "count": 10,
  "filters": { ... }
}
```

**Error Response Pattern**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "field": "field_name" // Optional, for validation errors
  }
}
```

**Status Codes**:
- `200` - Success
- `400` - Bad Request (validation error, invalid parameters)
- `401` - Unauthorized (authentication required - future)
- `404` - Not Found (device not found/not connected)
- `500` - Internal Server Error

**Error Response Schemas**:
- `BadRequest`: `#/components/responses/BadRequest`
- `Unauthorized`: `#/components/responses/Unauthorized`
- `NotFound`: `#/components/responses/NotFound`
- `InternalServerError`: `#/components/responses/InternalServerError`

**Request Validation**:
- ✅ Path parameters validation với express-validator
- ✅ Query parameters validation với express-validator
- ✅ Request body validation với express-validator
- ✅ Custom validation middleware (`validateRequest`)

**Response Schemas**:
- Tất cả response schemas được định nghĩa trong OpenAPI spec
- Reusable components trong `#/components/schemas/`
- Examples cho tất cả request/response bodies

### 2.5. Error Handling

**Hiện trạng**:
- ✅ Error handling đầy đủ với try-catch cho tất cả endpoints
- ✅ Centralized error handler (`asyncHandler` middleware)
- ✅ Request validation với express-validator
- ✅ Error response schemas theo OpenAPI 3.1.0
- ✅ Error logging với winston logger
- ⚠️ Không có rate limiting (có thể thêm trong tương lai)

**Error Handling Implementation**:

**1. Centralized Error Handler**:
```javascript
// middleware/errorHandler.js
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

**2. Custom Error Classes**:
```javascript
// utils/errors.js
class NotFoundError extends Error { ... }
class ValidationError extends Error { ... }
```

**3. Error Response Format**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "field": "field_name" // Optional
  }
}
```

**4. Error Response Schemas** (OpenAPI 3.1.0):
- `BadRequest` (400): Validation errors
- `Unauthorized` (401): Authentication errors (future)
- `NotFound` (404): Resource not found
- `InternalServerError` (500): Server errors

**5. Request Validation**:
- Path parameters: `param('id').isString().notEmpty()`
- Query parameters: `query('platform').optional().isIn(['android', 'ios'])`
- Request body: `body('action').isString().notEmpty()`
- Custom validation: `validateRequest` middleware

**6. Error Logging**:
- Winston logger cho error logging
- Error details logged với context information
- Error metrics tracking

**Error Codes**:
- `VALIDATION_ERROR`: Request validation failed
- `NOT_FOUND`: Resource not found
- `AUTHENTICATION_ERROR`: Authentication required (future)
- `INTERNAL_ERROR`: Internal server error

**Cải thiện đề xuất** (Future):
- Rate limiting middleware
- Request/response logging middleware
- Error monitoring và alerting
- Error recovery mechanisms

---

### 2.6. OpenAPI 3.1.0 Specification

**Overview**: Hệ thống DogeRat API được document đầy đủ theo chuẩn OpenAPI 3.1.0, cung cấp specification file hoàn chỉnh cho tất cả endpoints, schemas, và security schemes.

**Specification Files**:
- `docs/swagger.yaml` - OpenAPI 3.1.0 specification (YAML format)
- `docs/openapi.json` - OpenAPI 3.1.0 specification (JSON format)

**Swagger UI Integration**:
- Swagger UI available tại `/api-docs`
- Auto-generated từ OpenAPI spec
- Interactive API documentation với try-it-out functionality

#### 2.6.1. OpenAPI 3.1.0 Features

**1. API Information**:
```yaml
openapi: 3.1.0
info:
  title: DogeRat API
  version: 1.0.0
  description: API documentation for DogeRat server - Multi-Platform Device Control Tool
  contact:
    name: DogeRat Support
    email: support@dogerat.com
  license:
    name: ISC
    url: https://opensource.org/licenses/ISC
```

**2. Servers**:
```yaml
servers:
  - url: http://localhost:3000
    description: Development server
  - url: https://api.dogerat.com
    description: Production server
```

**3. Tags**:
- Health: Health check endpoints
- Devices: Device management endpoints
- Actions: Action execution endpoints
- Screen Control: Screen streaming endpoints
- Remote Control: Remote device control endpoints
- Uploads: File upload endpoints
- Configuration: Legacy configuration endpoints

**4. Paths**: Tất cả 20+ endpoints được document đầy đủ với:
- Operation ID
- Summary và description
- Parameters (path, query, header)
- Request body schemas
- Response schemas với examples
- Error response schemas

#### 2.6.2. Security Schemes

**Bearer Authentication (JWT)**:
```yaml
securitySchemes:
  BearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT
    description: JWT token authentication (optional for backward compatibility)
```

**API Key Authentication**:
```yaml
securitySchemes:
  ApiKeyAuth:
    type: apiKey
    in: header
    name: X-API-Key
    description: API key authentication (optional)
```

**Note**: Security schemes được định nghĩa nhưng hiện tại chưa được enforce (optional cho backward compatibility).

#### 2.6.3. Reusable Components

**Schemas**:
- `Device`: Device information schema
- `DeviceDetails`: Device details với data schema
- `DeviceData`: Device data structure schema
- `ActionRequest`: Action request schema
- `ActionResponse`: Action response schema
- `ScreenQuality`: Screen quality settings schema
- `StreamingStatus`: Screen streaming status schema
- `ControlCommand`: Remote control command schema
- `ControlStatus`: Remote control status schema
- `HealthStatus`: Basic health status schema
- `DetailedHealth`: Detailed health status schema
- `SystemMetrics`: System metrics schema
- `ErrorResponse`: Error response schema
- Và nhiều schemas khác cho Contact, SMS, Call, App, etc.

**Parameters**:
- `DeviceId`: Path parameter cho device ID
- `PlatformQuery`: Query parameter cho platform filter
- `OnlineQuery`: Query parameter cho online status filter

**Responses**:
- `BadRequest`: 400 error response
- `Unauthorized`: 401 error response
- `NotFound`: 404 error response
- `InternalServerError`: 500 error response

#### 2.6.4. Examples và Documentation

**Request Examples**:
- Tất cả endpoints có request body examples
- Multiple examples cho các use cases khác nhau
- Examples cho tất cả command types (touch, swipe, key, scroll)

**Response Examples**:
- Success response examples cho tất cả endpoints
- Error response examples cho tất cả error codes
- Real-world data examples

**Documentation**:
- Detailed descriptions cho tất cả endpoints
- Parameter descriptions với constraints
- Schema descriptions với field explanations
- Error code descriptions

#### 2.6.5. OpenAPI 3.1.0 Benefits

**1. Standardization**:
- ✅ Chuẩn hóa API documentation theo industry standard
- ✅ Interoperability với các tools và frameworks
- ✅ Auto-generated client SDKs

**2. Developer Experience**:
- ✅ Interactive API documentation (Swagger UI)
- ✅ Try-it-out functionality
- ✅ Clear request/response examples
- ✅ Schema validation

**3. API Quality**:
- ✅ Complete endpoint coverage
- ✅ Comprehensive error handling documentation
- ✅ Security schemes definition
- ✅ Request/response validation

**4. Integration**:
- ✅ API client generation (OpenAPI Generator)
- ✅ API testing tools integration
- ✅ API monitoring tools integration
- ✅ Documentation tools integration

#### 2.6.6. OpenAPI Specification Structure

**File Structure**:
```
docs/
├── swagger.yaml          # OpenAPI 3.1.0 spec (YAML)
├── openapi.json          # OpenAPI 3.1.0 spec (JSON)
└── examples/             # Example files
    ├── ios-api-responses.json
    ├── ios-device-connection.json
    └── ios-socket-events.json
```

**Specification Sections**:
1. **Info**: API metadata và contact information
2. **Servers**: Server URLs (development, production)
3. **Tags**: Endpoint categories
4. **Paths**: Tất cả API endpoints với full documentation
5. **Components**:
   - `securitySchemes`: Authentication schemes
   - `parameters`: Reusable parameters
   - `schemas`: Data models
   - `responses`: Reusable response definitions

#### 2.6.7. Swagger UI Integration

**Middleware Setup**:
```javascript
// middleware/swagger.js
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../docs/swagger.yaml');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

**Access**: Swagger UI available tại `http://localhost:3000/api-docs`

**Features**:
- Interactive API documentation
- Try-it-out functionality
- Schema viewer
- Response examples
- Error response documentation

---

## Phân Tích Socket.IO

### 3.1. Tổng Quan Socket.IO

Socket.IO được sử dụng cho **real-time bidirectional communication** giữa:
- Server ↔ Android Device
- Server ↔ Web Client

### 3.2. Server-to-Client Events (Server Emit)

#### 3.2.1. `device-connected`

**Mục đích**: Thông báo khi có thiết bị mới kết nối

**Emit từ**: Server (khi device socket connects)

**Payload**:
```json
{
  "id": "socket-id-123",
  "model": "Samsung Galaxy S21",
  "version": "Android 12",
  "ip": "192.168.1.100",
  "connectedAt": "2024-01-15T10:30:00.000Z"
}
```

**Người nhận**: Tất cả web clients

**Logic**:
- Emit khi device socket kết nối
- Broadcast tới tất cả web clients
- Web client cập nhật danh sách thiết bị

---

#### 3.2.2. `device-disconnected`

**Mục đích**: Thông báo khi thiết bị ngắt kết nối

**Emit từ**: Server (khi device socket disconnects)

**Payload**:
```json
{
  "id": "socket-id-123",
  "model": "Samsung Galaxy S21",
  "version": "Android 12",
  "ip": "192.168.1.100",
  "connectedAt": "2024-01-15T10:30:00.000Z",
  "online": false
}
```

**Người nhận**: Tất cả web clients

**Logic**:
- Emit khi device socket disconnect
- Đánh dấu device là offline (nhưng giữ lại data)

---

#### 3.2.3. `device-data-update`

**Mục đích**: Thông báo khi dữ liệu thiết bị được cập nhật

**Emit từ**: Server (khi nhận data từ device)

**Payload**:
```json
{
  "deviceId": "socket-id-123",
  "type": "sms",
  "data": [...]
}
```

**Người nhận**: Tất cả web clients (hoặc specific client nếu cần)

**Logic**:
- Emit sau khi xử lý data từ device
- Web client refresh UI nếu đang xem device đó

**Các types**:
- `contacts`, `sms`, `calls`, `gallery`
- `main-camera`, `selfie-camera`, `screenshot`
- `keylogger`, `clipboard`, `location`, `apps`

---

#### 3.2.4. `device-message`

**Mục đích**: Chuyển tiếp message từ thiết bị tới web clients

**Emit từ**: Server (khi nhận `message` event từ device)

**Payload**:
```json
{
  "deviceId": "socket-id-123",
  "message": { ... }
}
```

**Người nhận**: Tất cả web clients

---

#### 3.2.5. `file-uploaded`

**Mục đích**: Thông báo khi file được upload thành công

**Emit từ**: Server (khi nhận file upload qua HTTP POST `/upload`)

**Payload**:
```json
{
  "deviceId": "socket-id-123",
  "deviceModel": "Samsung Galaxy S21",
  "file": {
    "name": "image.jpg",
    "path": "/uploads/...",
    "size": 12345
  }
}
```

**Người nhận**: Tất cả web clients

---

#### 3.2.6. `ping`

**Mục đích**: Keep-alive ping tới thiết bị

**Emit từ**: Server (periodic task mỗi 5 giây)

**Payload**:
```json
{}
```

**Người nhận**: Tất cả device sockets

**Logic**:
- Periodic task chạy mỗi 5 giây
- Ping tất cả connected devices
- Giữ kết nối alive

---

#### 3.2.7. `commend` (Command)

**Mục đích**: Gửi lệnh thực thi tới thiết bị

**Emit từ**: Server (khi nhận POST `/api/device/:id/action`)

**Payload**:
```json
{
  "request": "screenshot",
  "extras": [
    { "key": "param1", "value": "value1" }
  ]
}
```

**Người nhận**: Specific device socket (via `io.to(deviceId)`)

**Logic**:
- Convert action từ REST API sang Socket.IO command
- Emit tới device socket cụ thể
- Device nhận và thực thi command

---

### 3.3. Client-to-Server Events (Server Listen)

#### 3.3.1. `connection`

**Mục đích**: Xử lý khi device kết nối

**Emit từ**: Device (automatic khi connect)

**Logic**:
1. Extract device info từ handshake headers:
   - `model`: Device model
   - `version`: Android version
   - `ip`: Device IP address
2. Tạo device info object
3. Lưu vào `devices` Map với key = `socket.id`
4. Initialize device data structure
5. Emit `device-connected` tới web clients

**Handshake Headers**:
```javascript
socket.handshake.headers.model
socket.handshake.headers.version
socket.handshake.headers.ip
```

---

#### 3.3.2. `disconnect`

**Mục đích**: Xử lý khi device ngắt kết nối

**Emit từ**: Device (automatic khi disconnect)

**Logic**:
1. Đánh dấu device là offline
2. Giữ lại device data (không xóa)
3. Emit `device-disconnected` tới web clients

**Lưu ý**: Device data được giữ lại để xem sau khi reconnect

---

#### 3.3.3. `message`

**Mục đích**: Nhận message từ thiết bị

**Emit từ**: Device

**Payload**: Tùy theo message type từ Android app

**Logic**:
1. Lưu message vào device data (nếu cần)
2. Emit `device-message` tới web clients

**Hiện trạng**: Logic xử lý message chưa được implement đầy đủ

---

#### 3.3.4. `data`

**Mục đích**: Nhận dữ liệu từ thiết bị (contacts, SMS, calls, etc.)

**Emit từ**: Device

**Payload**:
```json
{
  "type": "sms",
  "payload": [...]
}
```

**Logic**:
1. Parse `type` và `payload` từ data packet
2. Lưu vào `deviceData` Map theo type:
   - `contacts`, `sms`, `calls`, `gallery` → Array
   - `main-camera`, `selfie-camera`, `screenshot` → Push vào array với timestamp
   - `keylogger` → Push vào keylogger.data array
   - `clipboard` → String
   - `location` → Object
   - `apps` → Array
   - `keylogger-status` → Boolean
3. Emit `device-data-update` tới web clients

**Các Data Types**:
- `contacts`: Array of contact objects
- `sms`: Array of SMS objects
- `calls`: Array of call objects
- `gallery`: Array of image objects
- `main-camera`: Image data (base64 hoặc URL)
- `selfie-camera`: Image data
- `screenshot`: Image data
- `keylogger`: Text data
- `clipboard`: String
- `location`: Location object
- `apps`: Array of app objects
- `keylogger-status`: Boolean

---

#### 3.3.5. `commend-response`

**Mục đích**: Nhận response từ thiết bị sau khi thực thi command

**Emit từ**: Device

**Payload**:
```json
{
  "request": "contacts",
  "result": {
    "contacts": [...]
  }
}
```

**Logic**:
1. Parse `request` và `result` từ response
2. Cập nhật device data theo request type
3. Emit `device-data-update` tới web clients

**Response Types**:
- `contacts` → `data.contacts`
- `sms` → `data.sms`
- `calls` → `data.calls`
- `gallery` → `data.gallery`
- `apps` → `data.apps`
- `clipboard` → `data.clipboard`
- `location` → `data.location`

---

#### 3.3.6. `file`

**Mục đích**: Nhận file data từ thiết bị (qua Socket.IO, không phải HTTP)

**Emit từ**: Device

**Payload**:
```json
{
  "name": "file.jpg",
  "data": "base64-encoded-data"
}
```

**Logic**:
1. Lưu file vào device data
2. Emit `device-file` tới web clients

**Lưu ý**: File upload chủ yếu qua HTTP POST `/upload`, event này có thể là backup method

---

### 3.4. Communication Flow

#### 3.4.1. Device Connection Flow

```
1. Android Device → Socket.IO Connect
   ↓
2. Server: Extract device info from handshake
   ↓
3. Server: Store device in devices Map
   ↓
4. Server: Initialize device data structure
   ↓
5. Server → Web Clients: emit('device-connected')
   ↓
6. Web Clients: Update device list UI
```

#### 3.4.2. Action Execution Flow

```
1. Web Client → Server: POST /api/device/:id/action
   { action: "screenshot", params: [...] }
   ↓
2. Server: Validate device connection
   ↓
3. Server: Map action to command
   ↓
4. Server → Device: emit('commend', { request, extras })
   ↓
5. Device: Execute command
   ↓
6. Device → Server: emit('commend-response' hoặc 'data')
   ↓
7. Server: Update device data
   ↓
8. Server → Web Clients: emit('device-data-update')
   ↓
9. Web Clients: Refresh UI
```

#### 3.4.3. Real-time Data Update Flow

```
1. Device → Server: emit('data', { type, payload })
   ↓
2. Server: Parse and store data
   ↓
3. Server → Web Clients: emit('device-data-update', { deviceId, type, data })
   ↓
4. Web Clients: Check if viewing this device
   ↓
5. Web Clients: Refresh device data if needed
```

### 3.5. Bidirectional Communication Pattern

**Pattern**: **Request-Response Pattern** kết hợp với **Event-Driven Pattern**

- **Request-Response**: REST API → Socket.IO command → Device response
- **Event-Driven**: Device tự động gửi data updates → Server broadcast → Web clients

**Benefits**:
- Real-time updates không cần polling
- Efficient bidirectional communication
- Event-driven architecture cho scalability

---

## Framework và Pattern

### 4.1. Express.js Patterns

#### 4.1.1. REST API Pattern

**Implementation**:
- Sử dụng Express router với HTTP methods
- Resource-based URLs
- JSON request/response

**Conventions**:
- ✅ GET cho read operations
- ✅ POST cho write operations
- ✅ Path parameters cho resource IDs (`:id`)
- ⚠️ Thiếu PUT, DELETE, PATCH
- ⚠️ Không có API versioning

**Example**:
```javascript
app.get('/api/device/:id', (req, res) => {
  const deviceId = req.params.id;
  // ... logic
  res.json({ ... });
});
```

#### 4.1.2. Middleware Pattern

**Middleware Stack**:
1. `express.json()` - Parse JSON request body
2. `express.static('public')` - Serve static files
3. `multer` - File upload handling
4. Custom route handlers

**Custom Middleware**: Không có custom middleware (có thể thêm authentication, validation, logging)

#### 4.1.3. Error Handling Pattern

**Hiện trạng**:
- Basic error handling với status codes
- Không có centralized error handler
- Không có error logging

**Cải thiện đề xuất**:
```javascript
// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
});
```

### 4.2. Socket.IO Patterns

#### 4.2.1. Event-Driven Architecture

**Pattern**: Event-driven với các events:
- Connection events (`connection`, `disconnect`)
- Data events (`data`, `message`, `file`)
- Command events (`commend`, `commend-response`)

**Benefits**:
- Loose coupling giữa components
- Real-time updates
- Scalable architecture

#### 4.2.2. Room/Namespace Pattern

**Implementation**:
- Sử dụng `io.to(deviceId)` để emit tới specific device
- Sử dụng `io.emit()` để broadcast tới tất cả clients

**Có thể cải thiện**:
- Sử dụng rooms cho device groups
- Namespace separation cho admin/users

#### 4.2.3. Connection Management Pattern

**Implementation**:
- Device info extraction từ handshake headers
- Device registration trong Map
- Periodic ping để keep-alive

**Keep-Alive**:
- Ping mỗi 5 giây
- Server keep-alive ping (nếu có host URL)

### 4.3. Hybrid Architecture Benefits

#### 4.3.1. REST API Benefits

- **Standard HTTP**: Dễ integrate với các tools/APIs khác
- **Stateless**: Mỗi request độc lập
- **Cacheable**: Có thể cache responses
- **Simple**: Dễ hiểu và maintain

#### 4.3.2. WebSocket Benefits

- **Real-time**: Instant updates không cần polling
- **Bidirectional**: Server có thể push data
- **Efficient**: Ít overhead hơn HTTP polling
- **Persistent Connection**: Giữ connection mở

#### 4.3.3. Hybrid Approach

**Khi nào dùng REST**:
- File uploads (POST `/upload`)
- Initial data fetching (GET `/api/devices`)
- Action execution (POST `/api/device/:id/action`)

**Khi nào dùng WebSocket**:
- Real-time device connection/disconnection
- Real-time data updates từ device
- Command execution và response
- Keep-alive ping

**Best Practice**: 
- REST cho operations cần reliability
- WebSocket cho real-time updates

### 4.4. Design Patterns Sử Dụng

#### 4.4.1. Command Pattern

**Implementation**: Action mapping trong `/api/device/:id/action`

```javascript
const actionMap = {
  'screenshot': 'screenshot',
  'toast': 'toast',
  // ...
};
```

**Benefits**:
- Decouple action request từ execution
- Dễ thêm actions mới
- Centralized command handling

#### 4.4.2. Observer Pattern

**Implementation**: Socket.IO events

- Server observes device events
- Web clients observe server events
- Event-driven updates

#### 4.4.3. Singleton Pattern

**Implementation**: Single Express app instance, single Socket.IO server

#### 4.4.4. Repository Pattern (Partial)

**Implementation**: In-memory Maps như data repositories

- `devices` Map: Device repository
- `deviceData` Map: Device data repository

**Cải thiện**: Có thể abstract thành Repository classes với database persistence

---

## Đánh Giá và Nhận Xét

### 5.1. Ưu Điểm

#### 5.1.1. Kiến Trúc

✅ **Hybrid Architecture**: Kết hợp tốt REST API và WebSocket
- REST cho standard operations
- WebSocket cho real-time communication

✅ **Real-time Updates**: Socket.IO cung cấp real-time updates hiệu quả

✅ **Simple Architecture**: Dễ hiểu và maintain

#### 5.1.2. Implementation

✅ **Express.js Integration**: Sử dụng Express.js đúng cách
- Middleware stack hợp lý
- Route organization rõ ràng

✅ **Socket.IO Integration**: Event-driven architecture tốt
- Clear event naming
- Bidirectional communication

✅ **File Upload**: Multer integration tốt với custom storage

#### 5.1.3. Code Quality

✅ **Code Organization**: Code được tổ chức rõ ràng với sections
✅ **Error Handling**: Có basic error handling với status codes
✅ **Data Structure**: Data structures được định nghĩa rõ ràng

### 5.2. Nhược Điểm

#### 5.2.1. Kiến Trúc

⚠️ **No Database Persistence**: 
- Dữ liệu mất khi server restart
- Không có backup/recovery
- Không scale được cho production

⚠️ **No Authentication/Authorization**:
- Không có security layer
- Bất kỳ ai cũng có thể truy cập API
- Không có rate limiting

⚠️ **No API Versioning**:
- Khó maintain backward compatibility
- Khó upgrade API

#### 5.2.2. REST API

⚠️ **Incomplete RESTful**:
- Thiếu PUT, DELETE, PATCH methods
- Một số endpoints không tuân thủ REST conventions
- Action endpoint (`/action`) là RPC-style, không phải REST

⚠️ **Error Handling**:
- Không có centralized error handler
- Không có error logging
- Một số endpoints thiếu try-catch

⚠️ **Validation**:
- Không có request validation
- Không validate request body structure
- Không validate path parameters

⚠️ **Documentation**:
- Không có API documentation (Swagger/OpenAPI)
- Không có request/response examples

#### 5.2.3. Socket.IO

⚠️ **Error Handling**:
- Không có error handling cho socket events
- Không có reconnection handling
- Không có timeout handling

⚠️ **Security**:
- Không có authentication cho socket connections
- Không validate handshake headers
- Không có rate limiting cho events

⚠️ **Scalability**:
- In-memory storage không scale
- Không support multiple server instances
- Không có message queue

#### 5.2.4. Code Quality

⚠️ **Error Handling**:
- Thiếu try-catch ở nhiều nơi
- Không có error logging
- Không có monitoring

⚠️ **Code Duplication**:
- Một số logic bị duplicate
- Có thể refactor thành helper functions

⚠️ **Testing**:
- Không có unit tests
- Không có integration tests
- Không có API tests

### 5.3. Khuyến Nghị Cải Thiện

#### 5.3.1. Kiến Trúc

**1. Database Persistence**
```javascript
// Thêm database (MongoDB/PostgreSQL)
const mongoose = require('mongoose');
// Hoặc
const { Pool } = require('pg');
```

**2. Authentication/Authorization**
```javascript
// JWT authentication
const jwt = require('jsonwebtoken');
app.use('/api', authenticateToken);
```

**3. API Versioning**
```javascript
app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);
```

**4. Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');
app.use('/api', rateLimit({ windowMs: 60000, max: 100 }));
```

#### 5.3.2. REST API

**1. Complete RESTful Implementation**
```javascript
// Thêm PUT, DELETE, PATCH
app.put('/api/device/:id', updateDevice);
app.delete('/api/device/:id', deleteDevice);
app.patch('/api/device/:id', patchDevice);
```

**2. Request Validation**
```javascript
const { body, param, validationResult } = require('express-validator');
app.post('/api/device/:id/action', 
  param('id').isString(),
  body('action').isString(),
  validateRequest,
  executeAction
);
```

**3. Centralized Error Handler**
```javascript
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(err.status || 500).json({
    error: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

**4. API Documentation**
```javascript
// Swagger/OpenAPI
const swaggerUi = require('swagger-ui-express');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
```

#### 5.3.3. Socket.IO

**1. Authentication**
```javascript
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (verifyToken(token)) {
    next();
  } else {
    next(new Error('Authentication error'));
  }
});
```

**2. Error Handling**
```javascript
socket.on('error', (err) => {
  logger.error('Socket error:', err);
  socket.disconnect();
});
```

**3. Reconnection Handling**
```javascript
// Client-side
socket.on('disconnect', () => {
  socket.connect();
});
```

**4. Message Queue** (cho scalability)
```javascript
// Redis adapter cho Socket.IO
const redisAdapter = require('@socket.io/redis-adapter');
io.adapter(redisAdapter({ host: 'localhost', port: 6379 }));
```

#### 5.3.4. Code Quality

**1. Logging**
```javascript
const winston = require('winston');
const logger = winston.createLogger({ ... });
```

**2. Testing**
```javascript
// Jest tests
describe('API Endpoints', () => {
  test('GET /api/devices', async () => {
    const res = await request(app).get('/api/devices');
    expect(res.status).toBe(200);
  });
});
```

**3. Code Organization**
```javascript
// Tách routes thành modules
// routes/devices.js
// routes/actions.js
// routes/uploads.js
```

**4. Environment Configuration**
```javascript
// .env file
require('dotenv').config();
const PORT = process.env.PORT || 3000;
```

### 5.4. Tóm Tắt Đánh Giá

| Tiêu Chí | Điểm | Nhận Xét |
|----------|------|----------|
| **Kiến Trúc** | 7/10 | Hybrid architecture tốt nhưng thiếu persistence |
| **REST API** | 6/10 | Cơ bản tốt nhưng chưa hoàn chỉnh RESTful |
| **Socket.IO** | 7/10 | Real-time tốt nhưng thiếu security |
| **Error Handling** | 4/10 | Cơ bản, cần cải thiện nhiều |
| **Security** | 2/10 | Không có authentication/authorization |
| **Scalability** | 3/10 | In-memory không scale được |
| **Code Quality** | 6/10 | Tốt nhưng cần refactor và testing |
| **Documentation** | 4/10 | Có README nhưng thiếu API docs |

**Tổng Điểm**: **4.9/10**

**Kết Luận**: 
Hệ thống có kiến trúc cơ bản tốt với hybrid REST + WebSocket approach. Tuy nhiên, cần cải thiện đáng kể về security, persistence, error handling, và scalability để có thể sử dụng trong production environment.

---

## Kết Luận

Hệ thống DogeRat sử dụng **Hybrid Architecture** kết hợp:
- **Express.js** (v4.18.2) cho REST API
- **Socket.IO** (v4.5.3) cho real-time WebSocket communication

**Framework và Pattern chính**:
1. **REST API Pattern** (một phần) - Express.js routes
2. **Event-Driven Architecture** - Socket.IO events
3. **Command Pattern** - Action mapping
4. **In-Memory State Management** - Map-based storage

**Điểm mạnh**: 
- Kiến trúc đơn giản, dễ hiểu
- Real-time updates hiệu quả
- Hybrid approach phù hợp với use case

**Điểm yếu**:
- Thiếu database persistence
- Không có authentication/authorization
- Error handling chưa đầy đủ
- Không scale được cho production

**Khuyến nghị**: 
Cần cải thiện security, persistence, error handling, và scalability trước khi deploy production.

---

**Tài liệu được tạo bởi**: API Architecture Analysis  
**Ngày**: 2024  
**Phiên bản**: 1.0

