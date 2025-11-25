# DogeRat - Multi-Platform Device Control Tool

<h3>Advanced and powerful device controlling tool with a wide range of features and capabilities for Android and iOS</h3>
<h4>This software is exclusively designed for educational purposes ⚠️</h4>

<p>
  <img src="images/logo.PNG" alt="logo" style="max-width: auto; height: auto;" />
</p>

<p>
  <i>A multifunctional Web-based RAT without port forwarding - Supporting Android and iOS</i>
</p>

<h2 align="center">About DogeRat</h2>

#### The ultimate multi-platform device control tool, empowering you with seamless, secure, and limitless control over target devices  
#### DogeRat is powered by the latest and greatest technologies, ensuring a top-tier experience    
#### DogeRat comprises primary components:
- **Server side:** Powered by Node.js, Express.js, and Socket.IO
- **Web Interface:** Real-time dashboard with modern UI supporting both Android and iOS
- **Android APK:** Powered by Kotlin
- **iOS App:** Swift-based (coming soon)

## Features

### Core Features
- 🔴 **Real-time Web Interface** - Monitor and control devices through a modern web dashboard
- 🌐 **Custom Web View** - Beautiful and responsive user interface
- 🔔 **Notification Management** - Send custom notifications to target device
- 🗨️ **Toast Messages** - Display toast messages on target device
- 📡 **SIM Card Information** - Receive information about SIM card provider
- 📳 **Device Control** - Vibrate target device with custom duration
- 🛰️ **Location Tracking** - Receive device location
- ✉️ **SMS Management** - Receive all SMS messages and send SMS to any number or all contacts
- 👤 **Contacts Access** - Receive all target contacts
- 💻 **Apps List** - Receive list of all installed apps in target device
- 📷 **Camera Control** - Capture main and front camera
- 🎙 **Microphone Recording** - Capture microphone with custom duration
- 📋 **Clipboard Access** - Receive last clipboard text
- ✅️ **Auto Start** - Auto start after device boot
- 🔐 **Keylogger** - Monitor keystrokes with ON/OFF control
- 🖥️ **Screenshot** - Capture screenshots from target device
- 📒 **Gallery Access** - Get all photos available in gallery
- 📞 **Call History** - Access call logs from target device
- 🔗 **URL Control** - Open any URL on target device

### Web Interface Features
- 📊 **Real-time Dashboard** - View all connected devices in real-time
- 📱 **Device Details Page** - Comprehensive device information and data
- 🔄 **Live Updates** - Real-time data synchronization via Socket.IO
- 🎨 **Modern UI** - Dark theme with responsive design
- 📈 **Data Visualization** - Organized tabs for different data types
- ⚡ **Fast Performance** - Optimized for quick response times

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DogeRat-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the server**
   - Edit `data.json` and set your server host URL (optional, for keep-alive)
   ```json
   {
     "host": "https://your-server-url.com/",
     "text": ""
   }
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Access the web interface**
   - Open your browser and navigate to `http://localhost:3000`
   - The dashboard will display all connected devices (Android and iOS)
   - Use the platform filter to view devices by platform

## Usage

### Web Interface

1. **Dashboard View**
   - Access the main dashboard at `http://localhost:3000`
   - View all connected devices with their status (Online/Offline)
   - See device information: Model, Version, IP Address, Connection Time

2. **Device Details**
   - Click "View Details" on any device card
   - Navigate through different tabs:
     - **Overview**: Basic device information
     - **Contacts**: View all contacts
     - **SMS**: View and manage SMS messages
     - **Calls**: View call history
     - **Gallery**: Browse device gallery
     - **Camera**: View camera captures (main and selfie)
     - **Screenshots**: View captured screenshots
     - **Keylogger**: Monitor keystrokes
     - **Actions**: Control device features

3. **Device Control**
   - Use the Actions tab to control device features
   - Send toast messages, vibrate device, send SMS
   - Capture camera, take screenshots
   - Control keylogger, access clipboard
   - Open URLs, record microphone

### API Endpoints

- `GET /api/v1/devices` - Get list of all connected devices (supports `?platform=android|ios` filter)
- `GET /api/v1/devices/:id` - Get detailed information about a specific device
- `POST /api/v1/devices/:id/action` - Execute an action on a device (platform-aware)
- `POST /upload` - Upload files from device
- `GET /text` - Get text configuration

**Platform Detection:**
- Server automatically detects platform from Socket.IO handshake headers
- Devices are tagged with `platform` field (`android` or `ios`)
- Actions are validated based on platform support

### Socket.IO Events

**Client to Server:**
- `device-connected` - New device connected
- `device-disconnected` - Device disconnected
- `device-data-update` - Device data updated
- `device-message` - Message from device
- `file-uploaded` - File uploaded from device

## Project Structure

```
DogeRat-main/
├── server.js              # Main server file
├── package.json           # Dependencies
├── data.json              # Configuration file
├── public/                # Web interface files
│   ├── index.html         # Dashboard page
│   ├── device.html        # Device details page
│   ├── css/
│   │   └── style.css      # Styling
│   └── js/
│       ├── app.js         # Dashboard logic
│       └── device.js      # Device page logic
├── uploads/               # Uploaded files directory
└── images/                # Project images
```

## Platform Support

### Android
- Full feature support
- All actions available
- Hướng dẫn điều khiển chi tiết đã được gỡ bỏ — xem trực tiếp `services/actionService.js` để biết danh sách lệnh.

### iOS
- Full feature support (most actions)
- Platform-specific limitations documented trong mã nguồn
- Kiểm tra `services/remoteControlService.js` và `services/deviceService.js` để xem khả năng hỗ trợ hiện tại.

### Platform Detection
- Automatic platform detection from Socket.IO handshake headers
- Manual platform specification via `platform` header
- Backward compatible with existing Android devices (defaults to `android`)

## Technical Details

### Server Technologies
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **Multer** - File upload handling
- **PostgreSQL** - Database (with in-memory fallback)

### Frontend Technologies
- **HTML5** - Structure
- **CSS3** - Styling with modern features
- **JavaScript (ES6+)** - Client-side logic
- **Socket.IO Client** - Real-time updates
- **Platform badges** - Visual platform indicators

## Security & Disclaimer

<p align="center">
  <img src="https://img.shields.io/badge/Disclaimer-Important-red" alt="Important Disclaimer"/>
</p>

<p align="center">
  <b><i>Note:</i></b> The developer provides no warranty with this software and will not be responsible for any direct or indirect damage caused by the usage of this tool. DogeRat is built for educational and internal use only.
</p>

<p align="center">
  <b><i>Attention:</i></b> We do not endorse any illegal or unethical use of this tool. The user assumes all responsibility for the use of this software.
</p>

<p align="center">
  <b><i>Important:</i></b> This tool should only be used for legitimate purposes such as:
  - Testing your own devices
  - Educational purposes
  - Authorized security research
  - Internal network monitoring with proper authorization
</p>

## Development

### Running in Development Mode

```bash
# Install dependencies
npm install

# Start server
npm start

# Server will run on http://localhost:3000
```

### Building for Production

1. Ensure all dependencies are installed
2. Configure `data.json` with production settings
3. Set environment variables if needed
4. Start server with `npm start`

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change the PORT in `server.js` or set `process.env.PORT`

2. **Devices not connecting**
   - Check firewall settings
   - Verify app configuration (Android or iOS)
   - Ensure server is accessible from device
   - Check platform detection in server logs

3. **Files not uploading**
   - Check `uploads/` directory permissions
   - Verify multer configuration

## Contributing

This project is for educational purposes. Contributions should follow ethical guidelines and legal requirements.

## License

ISC License - See package.json for details

<p align="center">
  <b><i>Thank you for using DogeRat - we hope it serves its intended purpose and helps you achieve your goals!</i></b>
</p>
