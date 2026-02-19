import axios from 'axios';
import jwt from 'jsonwebtoken';
import SystemSetting from '../models/SystemSetting';

interface ZoomMeetingParams {
    topic: string;
    start_time: string; // ISO 8601 format (should be in UTC with Z suffix)
    duration: number; // minutes
    agenda?: string;
    timezone?: string; // IANA timezone identifier (e.g., 'Asia/Kolkata')
}

interface ZoomTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
}

interface ZoomUser {
    id: string;
    email: string;
    type: number; // 1 = Basic, 2 = Licensed (Pro), 3 = On-premise
    first_name: string;
    last_name: string;
    account_id: string;
    plan_united_type?: string; // e.g., "1" for Pro
}

class ZoomService {
    private static instance: ZoomService;
    private accessToken: string | null = null;
    private tokenExpiry: Date | null = null;
    private baseUrl = 'https://api.zoom.us/v2';

    private constructor() { }

    public static getInstance(): ZoomService {
        if (!ZoomService.instance) {
            ZoomService.instance = new ZoomService();
        }
        return ZoomService.instance;
    }

    private async getSystemSetting(key: string): Promise<string> {
        const setting = await SystemSetting.findOne({ where: { key } });
        if (!setting || !setting.value) {
            throw new Error(`Missing Zoom Configuration: ${key}`);
        }
        return setting.value;
    }

    private async getAccessToken(): Promise<string> {
        // Return cached token if valid (with 5 min buffer)
        if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date(Date.now() + 5 * 60 * 1000)) {
            return this.accessToken;
        }

        const accountId = await this.getSystemSetting('zoom_account_id');
        const clientId = await this.getSystemSetting('zoom_client_id');
        const clientSecret = await this.getSystemSetting('zoom_client_secret');

        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        try {
            const response = await axios.post<ZoomTokenResponse>(
                'https://zoom.us/oauth/token',
                null,
                {
                    params: {
                        grant_type: 'account_credentials',
                        account_id: accountId,
                    },
                    headers: {
                        Authorization: `Basic ${auth}`,
                    },
                }
            );

            this.accessToken = response.data.access_token;
            // expires_in is usually 3600 seconds (1 hour)
            this.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
            return this.accessToken;

        } catch (error: any) {
            console.error('Zoom Token Error:', error.response?.data || error.message);
            throw new Error('Failed to authenticate with Zoom');
        }
    }

    public async getHostUser(): Promise<{ email: string; first_name: string; last_name: string }> {
        const token = await this.getAccessToken();

        try {
            const response = await axios.get(
                `${this.baseUrl}/users/me`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return {
                email: response.data.email,
                first_name: response.data.first_name,
                last_name: response.data.last_name,
            };
        } catch (error: any) {
            console.error('Zoom Get User Error:', error.response?.data || error.message);
            throw new Error('Failed to get Zoom user');
        }
    }

    public async createMeeting(params: ZoomMeetingParams): Promise<any> {
        const token = await this.getAccessToken();

        try {
            // Using 'me' to create meeting for the account owner/admin associated with the credentials
            const response = await axios.post(
                `${this.baseUrl}/users/me/meetings`,
                {
                    topic: params.topic,
                    type: 2, // 2 = Scheduled Meeting
                    start_time: params.start_time,
                    duration: params.duration,
                    ...(params.timezone && { timezone: params.timezone }), // Only include timezone if provided
                    agenda: params.agenda,
                    settings: {
                        host_video: true,
                        participant_video: false,
                        join_before_host: false,
                        mute_upon_entry: true,
                        waiting_room: true,
                        auto_recording: 'cloud', // Optional: auto record to cloud
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('Zoom Create Meeting Error:', error.response?.data || error.message);
            throw new Error('Failed to create Zoom meeting');
        }
    }

    public async updateMeeting(meetingId: string, params: Partial<ZoomMeetingParams>): Promise<any> {
        const token = await this.getAccessToken();
        try {
            const updateData: any = {};

            if (params.topic) updateData.topic = params.topic;
            if (params.start_time) updateData.start_time = params.start_time;
            if (params.duration) updateData.duration = params.duration;
            if (params.timezone) updateData.timezone = params.timezone;
            if (params.agenda) updateData.agenda = params.agenda;

            const response = await axios.patch(
                `${this.baseUrl}/meetings/${meetingId}`,
                updateData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('Zoom Update Meeting Error:', error.response?.data || error.message);
            throw new Error('Failed to update Zoom meeting');
        }
    }

    public async deleteMeeting(meetingId: string): Promise<void> {
        const token = await this.getAccessToken();
        try {
            await axios.delete(
                `${this.baseUrl}/meetings/${meetingId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
        } catch (error: any) {
            console.error('Zoom Delete Meeting Error:', error.response?.data || error.message);
            // Don't throw if it's just meant to clean up, or maybe throw if critical
            // throw new Error('Failed to delete Zoom meeting');
        }
    }

    /**
     * Generate JWT signature for Zoom Meeting SDK (Client View)
     * Used for embedding Zoom meetings directly in LMS frontend
     * @param meetingNumber - Zoom meeting ID
     * @param role - 0 = attendee, 1 = host, 5 = assistant
     * @returns JWT token for Zoom Web SDK
     */
    public async generateSignature(meetingNumber: string, role: number = 0): Promise<string> {
        try {
            // In Zoom Meeting SDK context:
            // zoom_client_id = SDK Key
            // zoom_client_secret = SDK Secret
            const sdkKey = await this.getSystemSetting('zoom_client_id');
            const sdkSecret = await this.getSystemSetting('zoom_client_secret');

            console.log('[ZOOM SIGNATURE] SDK Key exists:', !!sdkKey, 'SDK Secret exists:', !!sdkSecret);

            if (!sdkKey || !sdkSecret) {
                throw new Error('Zoom SDK credentials not configured. Please set zoom_client_id and zoom_client_secret in system settings.');
            }

            // Token valid for 2 hours
            const iat = Math.floor(Date.now() / 1000) - 30;
            const exp = iat + 60 * 60 * 2;

            const payload = {
                sdkKey: sdkKey,
                mn: meetingNumber,
                role: role,
                iat: iat,
                exp: exp,
                appKey: sdkKey, // Legacy compatibility
                tokenExp: exp
            };

            console.log('[ZOOM SIGNATURE] Payload:', JSON.stringify(payload));

            const token = jwt.sign(payload, sdkSecret, { algorithm: 'HS256' });
            console.log('[ZOOM SIGNATURE] Token generated, length:', token.length);
            return token;

        } catch (error: any) {
            console.error('[ZOOM SIGNATURE] Error:', error.message);
            throw new Error('Failed to generate Zoom signature: ' + error.message);
        }
    }

    /**
     * Get Zoom account information including plan type
     * @returns Account information with plan type (1 = Basic/Free, 2 = Pro/Licensed, 3 = On-premise)
     */
    public async getAccountInfo(): Promise<{
        email: string;
        planType: 'Basic (Free)' | 'Pro (Licensed)' | 'On-premise' | 'Unknown';
        type: number;
        firstName: string;
        lastName: string;
        accountId: string;
    }> {
        const token = await this.getAccessToken();

        try {
            const response = await axios.get<ZoomUser>(
                `${this.baseUrl}/users/me`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const user = response.data;
            let planType: 'Basic (Free)' | 'Pro (Licensed)' | 'On-premise' | 'Unknown';

            switch (user.type) {
                case 1:
                    planType = 'Basic (Free)';
                    break;
                case 2:
                    planType = 'Pro (Licensed)';
                    break;
                case 3:
                    planType = 'On-premise';
                    break;
                default:
                    planType = 'Unknown';
            }

            return {
                email: user.email,
                planType,
                type: user.type,
                firstName: user.first_name,
                lastName: user.last_name,
                accountId: user.account_id,
            };

        } catch (error: any) {
            console.error('Zoom Get Account Info Error:', error.response?.data || error.message);
            throw new Error('Failed to get Zoom account information');
        }
    }

    public async getSdkKey(): Promise<string> {
        return this.getSystemSetting('zoom_client_id');
    }
}

export default ZoomService.getInstance();
