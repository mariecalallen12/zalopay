# iOS Actions Reference

Danh sách đầy đủ actions hỗ trợ trên iOS, so sánh với Android, và limitations.

## Actions Overview

| Action | Android | iOS | Notes |
|--------|---------|-----|-------|
| contacts | ✅ | ✅ | Requires Contacts permission |
| sms | ✅ | ✅ | Requires SMS access (may be limited) |
| calls | ✅ | ✅ | Requires Call Log permission |
| gallery | ✅ | ✅ | Requires Photo Library permission |
| main-camera | ✅ | ✅ | Requires Camera permission |
| selfie-camera | ✅ | ✅ | Requires Camera permission |
| screenshot | ✅ | ✅ | Requires Screen Recording permission |
| toast | ✅ | ✅ | Native iOS alert |
| vibrate | ✅ | ✅ | Haptic feedback |
| sendSms | ✅ | ✅ | May require user interaction |
| popNotification | ✅ | ✅ | Local notifications |
| openUrl | ✅ | ✅ | Opens URL in Safari |
| keylogger-on | ✅ | ✅ | Requires Accessibility permission |
| keylogger-off | ✅ | ✅ | - |
| clipboard | ✅ | ✅ | - |
| location | ✅ | ✅ | Requires Location permission |
| apps | ✅ | ✅ | Limited app list (sandbox restrictions) |
| microphone | ✅ | ✅ | Requires Microphone permission |
| play-audio | ✅ | ✅ | AVPlayer |
| stop-audio | ✅ | ✅ | - |
| screen-stream-start | ✅ | ✅ | Requires ReplayKit |
| screen-stream-stop | ✅ | ✅ | - |
| remote-control-start | ✅ | ✅ | Requires Accessibility service |
| remote-control-stop | ✅ | ✅ | - |
| file-explorer | ✅ | ✅ | Limited to app sandbox |
| encrypt | ✅ | ✅ | iOS Keychain |
| decrypt | ✅ | ✅ | iOS Keychain |
| phishing | ✅ | ❌ | Not available on iOS |
| all-sms | ✅ | ✅ | - |

## Detailed Actions

### Data Retrieval Actions

#### contacts
- **Description**: Get all contacts from device
- **iOS Implementation**: `CNContactStore`
- **Permission**: `NSContactsUsageDescription`
- **Limitations**: None

#### sms
- **Description**: Get SMS messages
- **iOS Implementation**: May require third-party library or jailbreak
- **Permission**: Limited access on iOS
- **Limitations**: iOS restricts SMS access for security

#### calls
- **Description**: Get call history
- **iOS Implementation**: May require third-party library
- **Permission**: Limited access
- **Limitations**: iOS restricts call log access

#### gallery
- **Description**: Get photos from gallery
- **iOS Implementation**: `PHPhotoLibrary`
- **Permission**: `NSPhotoLibraryUsageDescription`
- **Limitations**: None

#### location
- **Description**: Get device location
- **iOS Implementation**: `CLLocationManager`
- **Permission**: `NSLocationWhenInUseUsageDescription`
- **Limitations**: None

#### apps
- **Description**: Get installed apps list
- **iOS Implementation**: Limited to app's own bundle
- **Permission**: None
- **Limitations**: iOS sandbox prevents listing all apps

### Camera Actions

#### main-camera
- **Description**: Capture photo from main camera
- **iOS Implementation**: `AVCaptureSession`
- **Permission**: `NSCameraUsageDescription`
- **Limitations**: None

#### selfie-camera
- **Description**: Capture photo from front camera
- **iOS Implementation**: `AVCaptureSession`
- **Permission**: `NSCameraUsageDescription`
- **Limitations**: None

#### screenshot
- **Description**: Capture screenshot
- **iOS Implementation**: `ReplayKit` or `UIGraphicsBeginImageContext`
- **Permission**: `RPScreenRecorder` (for ReplayKit)
- **Limitations**: May require user permission

### Device Control Actions

#### toast
- **Description**: Show toast message
- **iOS Implementation**: `UIAlertController` or custom view
- **Permission**: None
- **Limitations**: None

#### vibrate
- **Description**: Vibrate device
- **iOS Implementation**: `UIImpactFeedbackGenerator`
- **Permission**: None
- **Limitations**: Haptic feedback only (no vibration on iPad)

#### sendSms
- **Description**: Send SMS message
- **iOS Implementation**: `MFMessageComposeViewController`
- **Permission**: None (user interaction required)
- **Limitations**: Requires user to confirm and send

#### popNotification
- **Description**: Show notification
- **iOS Implementation**: `UNUserNotificationCenter`
- **Permission**: `UNUserNotificationCenter` authorization
- **Limitations**: None

#### openUrl
- **Description**: Open URL in browser
- **iOS Implementation**: `UIApplication.shared.open()`
- **Permission**: None
- **Limitations**: None

### Keylogger Actions

#### keylogger-on
- **Description**: Enable keylogger
- **iOS Implementation**: Accessibility service
- **Permission**: Accessibility permission required
- **Limitations**: Requires user to enable in Settings

#### keylogger-off
- **Description**: Disable keylogger
- **iOS Implementation**: - 
- **Permission**: None
- **Limitations**: None

### Audio Actions

#### microphone
- **Description**: Record audio from microphone
- **iOS Implementation**: `AVAudioRecorder`
- **Permission**: `NSMicrophoneUsageDescription`
- **Limitations**: None

#### play-audio
- **Description**: Play audio file
- **iOS Implementation**: `AVPlayer`
- **Permission**: None
- **Limitations**: None

#### stop-audio
- **Description**: Stop playing audio
- **iOS Implementation**: `AVPlayer.stop()`
- **Permission**: None
- **Limitations**: None

### Screen Streaming Actions

#### screen-stream-start
- **Description**: Start screen streaming
- **iOS Implementation**: `RPScreenRecorder`
- **Permission**: Screen recording permission
- **Limitations**: Requires user permission, iOS 11+

#### screen-stream-stop
- **Description**: Stop screen streaming
- **iOS Implementation**: `RPScreenRecorder.stop()`
- **Permission**: None
- **Limitations**: None

### Remote Control Actions

#### remote-control-start
- **Description**: Start remote control
- **iOS Implementation**: Accessibility service with gesture injection
- **Permission**: Accessibility permission
- **Limitations**: Requires user to enable in Settings, iOS 7+

#### remote-control-stop
- **Description**: Stop remote control
- **iOS Implementation**: - 
- **Permission**: None
- **Limitations**: None

### File Operations

#### file-explorer
- **Description**: Browse files
- **iOS Implementation**: Limited to app sandbox
- **Permission**: None
- **Limitations**: iOS sandbox restricts file access

### Security Actions

#### encrypt
- **Description**: Encrypt data
- **iOS Implementation**: iOS Keychain or CryptoKit
- **Permission**: None
- **Limitations**: None

#### decrypt
- **Description**: Decrypt data
- **iOS Implementation**: iOS Keychain or CryptoKit
- **Permission**: None
- **Limitations**: None

## Unsupported Actions

### phishing
- **Status**: ❌ Not supported on iOS
- **Reason**: iOS security restrictions prevent phishing attacks
- **Alternative**: N/A

## Platform Differences

### Android Advantages
- Full SMS and call log access
- Complete app list access
- File system access
- No sandbox restrictions

### iOS Advantages
- Better security model
- Consistent permission system
- Better privacy controls

### Common Limitations
- Both platforms require user permissions
- Both have security restrictions
- Some features may require root/jailbreak

## Best Practices

1. **Request Permissions**: Always request permissions before using features
2. **Handle Errors**: Gracefully handle permission denials
3. **User Experience**: Provide clear explanations for permission requests
4. **Security**: Follow platform security guidelines
5. **Testing**: Test on real devices, not just simulators

## Implementation Notes

- Most actions require appropriate permissions
- Some actions may not work in iOS Simulator
- Test on real devices for accurate behavior
- Check iOS version compatibility for newer features

