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
                aud: 'jitsi',         // must be "jitsi" for standalone Jitsi server
                room: roomName,
                exp: Math.floor(Date.now() / 1000) + 24 * 3600, // Valid for 24 hours
                context: {
                    user: {
                        name: params.displayName || 'Guest',
                        email: params.email || '',
                        affiliation: params.isHost === true ? 'owner' : 'member',
                    },
                },
            };

            console.log('[JITSI JWT] Signing token with payload:', JSON.stringify(payload, null, 2));
            console.log('[JITSI JWT] appId:', appId, '| appSecret length:', appSecret.length);
            console.log('[JITSI JWT] isHost param:', params.isHost, '| affiliation:', payload.context.user.affiliation);

            const token = jwt.sign(payload, appSecret, { algorithm: 'HS256' });

            // Decode and log to verify what's actually in the token
            const decoded = jwt.decode(token);
            console.log('[JITSI JWT] Decoded token verification:', JSON.stringify(decoded, null, 2));

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
     * Generate simplified meeting configuration for Jitsi React SDK
     * Returns only essential fields - frontend handles UI config via SDK props
     */
    public async getEmbedConfig(params: JitsiMeetingParams): Promise<{
        domain: string;
        roomName: string;
        jwt?: string;
    }> {
        const domain = await this.getDomain();
        const token = await this.generateJWT(params);

        console.log(`[JITSI] Generating embed config for room: ${params.roomName}, isHost: ${params.isHost}, hasToken: ${!!token}`);

        return {
            domain,
            roomName: params.roomName,
            ...(token && { jwt: token }),
        };
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
