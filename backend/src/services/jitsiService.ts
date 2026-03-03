import jwt from 'jsonwebtoken';
import SystemSetting from '../models/SystemSetting';

interface JitsiMeetingParams {
    roomName: string;
    displayName?: string;
    email?: string;
    isHost?: boolean;
}

interface JitsiRoomConfig {
    roomName: string;
    domain?: string;
    startTime?: Date;
    duration?: number;
    description?: string;
}

class JitsiService {
    private static instance: JitsiService;

    private constructor() {}

    public static getInstance(): JitsiService {
        if (!JitsiService.instance) {
            JitsiService.instance = new JitsiService();
        }
        return JitsiService.instance;
    }

    /**
     * Get Jitsi configuration from system settings
     * Falls back to environment variables if database values are empty
     */
    private async getSystemSetting(key: string): Promise<string> {
        const setting = await SystemSetting.findOne({ where: { key } });
        let value = setting?.value;

        // Fallback to environment variables if DB value is empty
        if (!value) {
            const envMap: { [key: string]: string } = {
                'jitsi_domain': process.env.JITSI_DOMAIN || '',
                'jitsi_app_id': process.env.JITSI_APP_ID || '',
                'jitsi_app_secret': process.env.JITSI_APP_SECRET || '',
            };
            value = envMap[key] || '';
        }

        if (!value) {
            throw new Error(`Missing Jitsi Configuration: ${key}`);
        }
        return value;
    }

    /**
     * Check if Jitsi integration is enabled
     */
    public async isEnabled(): Promise<boolean> {
        try {
            const setting = await SystemSetting.findOne({ where: { key: 'meeting_platform' } });
            return setting?.value === 'jitsi';
        } catch {
            return false;
        }
    }

    /**
     * Get Jitsi domain (server URL)
     */
    public async getDomain(): Promise<string> {
        try {
            return await this.getSystemSetting('jitsi_domain');
        } catch {
            // Fallback to environment or default
            return process.env.JITSI_DOMAIN || 'https://meet.edunura.com';
        }
    }

    /**
     * Generate a secure room name (unique identifier for meeting)
     * Jitsi uses room names as unique identifiers
     */
    public generateRoomName(): string {
        // Format: lms-timestamp-random
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        return `lms-${timestamp}-${random}`;
    }

    /**
     * Generate JWT token for Jitsi if using authenticated setup
     * This is optional - only needed if Jitsi is configured with authentication
     */
    public async generateJWT(params: JitsiMeetingParams): Promise<string | null> {
        try {
            const appId = await this.getSystemSetting('jitsi_app_id');
            const appSecret = await this.getSystemSetting('jitsi_app_secret');

            // If no credentials configured, return null (use public Jitsi)
            if (!appId || !appSecret) {
                return null;
            }

            const domain = await this.getDomain();
            const roomName = params.roomName;

            // Extract domain without protocol for token generation
            const jitsiDomain = new URL(domain).hostname;

            const payload = {
                iss: appId,
                sub: jitsiDomain,
                aud: appId,           // aud must match APP_ID for Prosody JWT validation
                room: roomName,
                exp: Math.floor(Date.now() / 1000) + 24 * 3600, // Valid for 24 hours
                // All user info goes inside context — NOT at top level
                context: {
                    user: {
                        id: String(params.email || params.displayName || 'guest'),
                        avatar: '',
                        name: params.displayName || 'Guest',
                        email: params.email || '',
                        // CRITICAL: false prevents Jitsi from granting moderator role
                        moderator: params.isHost === true,
                        affiliation: params.isHost === true ? 'owner' : 'member',
                    },
                    features: {
                        livestream: params.isHost === true,
                        recording: params.isHost === true,
                        'screen-sharing': true,
                    },
                },
            };

            const token = jwt.sign(payload, appSecret, { algorithm: 'HS256' });
            return token;
        } catch (error) {
            // If JWT generation fails, allow public access
            console.warn('[JITSI] JWT generation failed, falling back to public access', error);
            return null;
        }
    }

    /**
     * Create a Jitsi meeting room (essentially just generate room config)
     * Unlike Zoom, Jitsi doesn't require server-side meeting creation
     * This returns the join URL and meeting details
     */
    public async createMeeting(params: JitsiRoomConfig): Promise<{
        roomName: string;
        joinUrl: string;
        domain: string;
        config: any;
    }> {
        try {
            const domain = await this.getDomain();
            const roomName = params.roomName || this.generateRoomName();

            // Jitsi room URLs follow this pattern: https://meet.jitsi.org/RoomName
            const joinUrl = `${domain}/${roomName}`;

            // Generate JWT if configured
            const token = await this.generateJWT({
                roomName,
                displayName: 'Meeting',
                isHost: true,
            });

            const config = {
                roomName,
                domain,
                startTime: params.startTime,
                duration: params.duration,
                description: params.description,
                token: token || undefined, // Include token only if generated
            };

            console.log('[JITSI] Meeting created:', { roomName, joinUrl });

            return {
                roomName,
                joinUrl,
                domain,
                config,
            };
        } catch (error: any) {
            console.error('[JITSI] Create meeting error:', error);
            throw new Error(`Failed to create Jitsi meeting: ${error.message}`);
        }
    }

    /**
     * Get meeting join URL with optional JWT token
     */
    public async getJoinUrl(params: JitsiMeetingParams): Promise<{
        joinUrl: string;
        token?: string;
    }> {
        try {
            const domain = await this.getDomain();
            const roomName = params.roomName;

            const joinUrl = `${domain}/${roomName}`;
            const token = await this.generateJWT(params);

            return {
                joinUrl,
                ...(token && { token }),
            };
        } catch (error: any) {
            console.error('[JITSI] Get join URL error:', error);
            throw new Error(`Failed to get Jitsi join URL: ${error.message}`);
        }
    }

    /**
     * Generate meeting configuration for embedding
     * This includes iframe configuration for embedding Jitsi in LMS
     * 
     * ROLE-BASED ACCESS:
     * - Moderator (Teachers/Admins): Full toolbar + mute-everyone + recording
     * - Participant (Students): Limited toolbar, cannot mute others
     */
    public async getEmbedConfig(params: JitsiMeetingParams): Promise<{
        domain: string;
        roomName: string;
        jwt?: string;
        jitsiEmbedUrl: string;
        options: any;
    }> {
        try {
            const domain = await this.getDomain();
            const token = await this.generateJWT(params);

            // ─── Build role-based toolbar buttons ─────────────────────────────
            // Buttons available to ALL users (students + teachers)
            const baseParticipantButtons = [
                'microphone',
                'camera',
                'desktop',              // Screen sharing - available to all
                'fullscreen',
                'fodeviceselection',    // Choose camera/mic
                'hangup',
                'profile',
                'chat',
                'settings',
                'raisehand',            // Can ask to speak
                'videoquality',
                'filmstrip',
                'feedback',
                'stats',
                'shortcuts',
                'tileview',             // Grid view
                'download',
                'help',
                'e2ee',                 // End-to-end encryption
                'security',
            ];

            // Buttons ONLY for moderators (teachers/admins)
            const moderatorOnlyButtons = [
                'recording',            // 🔴 Record the meeting
                'livestream',           // 🔴 Stream to YouTube/etc
                'whiteboard',           // 🔴 Excalidraw drawing whiteboard
                'sharedvideo',          // 🔴 Show YouTube videos to all
                'invite',               // 🔴 Invite external users
                'mute-everyone',        // 🔴 CRITICAL: Mute all participants
                'videobackgroundblur',  // 🔴 Advanced feature
            ];

            // Build final toolbar based on role
            const toolbarButtons = params.isHost === true
                ? [...baseParticipantButtons, ...moderatorOnlyButtons]  // Teachers/Admins get ALL
                : baseParticipantButtons;  // Students get LIMITED toolbar

            console.log(`[JITSI ROLE] ${params.displayName || 'User'} joining as ${params.isHost ? 'MODERATOR' : 'PARTICIPANT'} (${toolbarButtons.length} toolbar buttons)`);

            // Build options with role-based configuration
            const options = {
                roomName: params.roomName,
                width: '100%',
                height: 600,
                parentNode: 'jitsi-container',
                userInfo: {
                    displayName: params.displayName || 'Guest',
                    email: params.email,
                },
                configOverwrite: {
                    prejoinPageEnabled: false,
                    // Disable invite entirely for participants (toolbar + more menu + shortcuts)
                    disableInviteFunctions: params.isHost !== true,
                    // Hide lobby button for participants (only moderators can admit)
                    hideLobbyButton: params.isHost === false,
                },
                interfaceConfigOverwrite: {
                    SHOW_JITSI_WATERMARK: false,
                    // 🔒 CRITICAL: Apply role-based toolbar filtering
                    TOOLBAR_BUTTONS: toolbarButtons,
                },
            };

            console.log(`[JITSI CONFIG] Room: ${params.roomName} | Moderator: ${params.isHost} | Toolbar: ${toolbarButtons.length} buttons`);

            // ─── Build pre-configured embed URL with hash params ───────────────
            // Jitsi reads #config.* and #interfaceConfig.* from the URL hash.
            // This way the iframe gets the right config without the IFrame API.
            const domainWithProtocol = domain.startsWith('http') ? domain : `https://${domain}`;
            const baseUrl = `${domainWithProtocol}/${params.roomName}`;
            const jwtParam = token ? `?jwt=${token}` : '';

            // Build hash config params for participants (students)
            const apiUrl = (process.env.API_URL || process.env.BACKEND_URL || 'https://api.edunura.com').replace(/\/$/, '');
            const hashParts: string[] = [
                `config.prejoinPageEnabled=false`,
                `config.enableWelcomePage=false`,
                `config.dynamicBrandingUrl=${encodeURIComponent(`${apiUrl}/api/live-classes/branding`)}`,
            ];
            if (params.isHost !== true) {
                hashParts.push(`config.disableInviteFunctions=true`);
                hashParts.push(`config.toolbarButtons=${encodeURIComponent(JSON.stringify(toolbarButtons))}`);
            } else {
                hashParts.push(`config.toolbarButtons=${encodeURIComponent(JSON.stringify(toolbarButtons))}`);
            }

            const jitsiEmbedUrl = `${baseUrl}${jwtParam}#${hashParts.join('&')}`;

            return {
                domain,
                roomName: params.roomName,
                ...(token && { jwt: token }),
                jitsiEmbedUrl,  // Pre-built URL with all config — use this in the iframe
                options,
            };
        } catch (error: any) {
            console.error('[JITSI] Get embed config error:', error);
            throw new Error(`Failed to generate Jitsi embed config: ${error.message}`);
        }
    }

    /**
     * Delete/close a meeting (Jitsi doesn't have server-side deletion, just informational)
     * In Jitsi, meetings are ephemeral and auto-close when all participants leave
     */
    public async deleteMeeting(roomName: string): Promise<void> {
        try {
            console.log('[JITSI] Meeting auto-closed (ephemeral room):', roomName);
            // Jitsi doesn't require explicit deletion since rooms are ephemeral
            // This method is here for API compatibility with ZoomService
        } catch (error: any) {
            console.error('[JITSI] Delete meeting error:', error);
            // Don't throw - this is informational only
        }
    }

    /**
     * Update meeting details (Jitsi doesn't support this via API)
     * This is here for compatibility but limited functionality
     */
    public async updateMeeting(
        roomName: string,
        params: Partial<JitsiRoomConfig>
    ): Promise<void> {
        try {
            // Jitsi doesn't provide server-side update API
            // We can only update our stored metadata in the database
            console.log('[JITSI] Meeting metadata updated (local only):', { roomName, ...params });
        } catch (error: any) {
            console.error('[JITSI] Update meeting error:', error);
            throw new Error(`Failed to update Jitsi meeting: ${error.message}`);
        }
    }

    /**
     * Validate if a room name is accessible
     * This makes a simple check to validate the room format
     */
    public validateRoomName(roomName: string): boolean {
        // Jitsi room names should be alphanumeric, hyphens, underscores
        // Pattern: lms-{timestamp}-{random} or custom names
        return /^[a-zA-Z0-9_-]{3,}$/.test(roomName);
    }

    /**
     * Get configuration summary for UI/logging
     */
    public async getConfigSummary(): Promise<{
        domain: string;
        isAuthenticated: boolean;
        enabled: boolean;
    }> {
        try {
            const domain = await this.getDomain();
            const appId = await SystemSetting.findOne({ where: { key: 'jitsi_app_id' } });
            const envAppId = process.env.JITSI_APP_ID;
            const isAuthenticated = !!(appId?.value || envAppId);
            const enabled = await this.isEnabled();

            return {
                domain,
                isAuthenticated,
                enabled,
            };
        } catch {
            return {
                domain: process.env.JITSI_DOMAIN || 'https://meet.edunura.com',
                isAuthenticated: !!(process.env.JITSI_APP_ID && process.env.JITSI_APP_SECRET),
                enabled: false,
            };
        }
    }
}

export default JitsiService.getInstance();
