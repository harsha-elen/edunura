'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { Box, Typography } from '@mui/material';

interface JitsiMeetingProps {
    domain: string;
    roomName: string;
    jwt?: string;
    displayName: string;
    email?: string;
    isModerator: boolean;
    logoUrl?: string;
    onConferenceJoined?: () => void;
    onConferenceLeft?: () => void;
    sendHeartbeat?: () => void;
}

// Participants get a restricted toolbar — no recording, mute-everyone, etc.
const PARTICIPANT_BUTTONS = [
    'microphone',
    'camera',
    'desktop',
    'fullscreen',
    'fodeviceselection',
    'hangup',
    'profile',
    'chat',
    'settings',
    'raisehand',
    'videoquality',
    'filmstrip',
    'feedback',
    'stats',
    'shortcuts',
    'tileview',
    'download',
    'help',
    'e2ee',
    'security',
];

// Moderators get ALL toolbar buttons explicitly listed.
// IMPORTANT: In iframe mode, Jitsi uses a reduced default toolbar that
// EXCLUDES 'recording'. We must explicitly include every button we want.
// (When visiting class.edunura.com directly, all buttons show by default,
// but inside an iframe, only the iframe-default subset shows.)
const MODERATOR_BUTTONS = [
    'microphone',
    'camera',
    'desktop',
    'fullscreen',
    'fodeviceselection',
    'hangup',
    'profile',
    'chat',
    'closedcaptions',
    'settings',
    'raisehand',
    'videoquality',
    'filmstrip',
    'feedback',
    'stats',
    'shortcuts',
    'tileview',
    'download',
    'help',
    'e2ee',
    'security',
    'recording',
    'livestreaming',
    'noisesuppression',
    'participants-pane',
    'select-background',
    'shareaudio',
    'sharedvideo',
    'toggle-camera',
    'whiteboard',
    'highlight',
    'invite',
    'embedmeeting',
    'etherpad',
];

const JitsiMeetingComponent: React.FC<JitsiMeetingProps> = ({
    domain,
    roomName,
    jwt,
    displayName,
    email,
    isModerator,
    logoUrl,
    onConferenceJoined,
    onConferenceLeft,
    sendHeartbeat,
}) => {
    const apiRef = useRef<any>(null);
    const hasLeftRef = useRef(false);
    const onConferenceLeftRef = useRef(onConferenceLeft);
    const [apiReady, setApiReady] = useState(false);
    const [meetingEnded, setMeetingEnded] = useState(false);

    // Keep ref current so the useEffect below always calls the latest callback,
    // regardless of stale closures from the Jitsi event listener.
    useEffect(() => {
        onConferenceLeftRef.current = onConferenceLeft;
    });

    // When the meeting ends, call onConferenceLeft from React lifecycle context.
    // Calling router.replace/push() from inside a Jitsi event listener (postMessage)
    // can silently fail in Next.js App Router — running it from useEffect is reliable.
    useEffect(() => {
        if (meetingEnded) {
            onConferenceLeftRef.current?.();
        }
    }, [meetingEnded]);
    // Moderators: explicit full toolbar (iframe mode hides recording by default).
    // Participants: restricted toolbar.
    const toolbarButtons = isModerator ? MODERATOR_BUTTONS : PARTICIPANT_BUTTONS;

    useEffect(() => {
        if (!sendHeartbeat || !isModerator || !apiReady) return;

        // Send first heartbeat immediately, then every 15s
        sendHeartbeat();
        const interval = setInterval(() => {
            sendHeartbeat();
        }, 15000);

        return () => clearInterval(interval);
    }, [sendHeartbeat, isModerator, apiReady]);

    const handleApiReady = useCallback((api: any) => {
        apiRef.current = api;
        hasLeftRef.current = false;
        setApiReady(true);
        console.log('[JITSI] API ready, isModerator (LMS):', isModerator);

        // Set iframe permissions using the External API's own getIFrame() method.
        // This is more reliable than querying the DOM from getIFrameRef callback.
        try {
            const iframe = api.getIFrame();
            if (iframe) {
                iframe.allow = 'camera; microphone; display-capture; fullscreen; autoplay; clipboard-write; clipboard-read; storage-access; downloads';
                iframe.setAttribute('allowfullscreen', 'true');
                console.log('[JITSI DEBUG] iframe allow set via api.getIFrame():', iframe.allow);
                console.log('[JITSI DEBUG] iframe src:', iframe.src);
            }
        } catch (e) {
            console.warn('[JITSI DEBUG] getIFrame() failed:', e);
        }

        const handleLeave = () => {
            if (hasLeftRef.current) return;
            hasLeftRef.current = true;
            setMeetingEnded(true);
            console.log('[JITSI] Conference ended — hiding iframe, redirecting back to app');
        };

        api.addListener('videoConferenceJoined', (data: any) => {
            console.log('[JITSI] Conference joined:', JSON.stringify(data));
            onConferenceJoined?.();
        });

        // Fires when user leaves/hangs up
        api.addListener('videoConferenceLeft', handleLeave);

        // Fires when Jitsi close page would normally show (prevents redirect to Jitsi homepage)
        api.addListener('readyToClose', handleLeave);

        // Track ALL role changes for debugging + auto-kick students promoted to moderator.
        api.addListener('participantRoleChanged', (event: { id: string; role: string }) => {
            console.log('[JITSI DEBUG] participantRoleChanged:', JSON.stringify(event));
            if (!isModerator && event.role === 'moderator') {
                console.log('[JITSI] Student auto-promoted to moderator — leaving meeting');
                handleLeave();
            }
        });
    }, [onConferenceJoined, isModerator]);

    // Jitsi SDK expects domain name only (e.g., "meet.edunura.com"), not full URL
    const cleanDomain = domain.replace(/^https?:\/\//, '');

    console.log('[JITSI] Original domain:', domain, '| Clean domain:', cleanDomain);

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ 
                px: 3, 
                py: 1.5, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                bgcolor: '#111',
                borderBottom: '1px solid #333'
            }}>
                <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }}>
                    {displayName} — {isModerator ? 'Host' : 'Participant'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#888' }}>
                    {roomName}
                </Typography>
            </Box>
            <Box sx={{ flex: 1, position: 'relative', '& iframe': { border: 'none' } }}>
                {meetingEnded ? (
                    <Box sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: '#111',
                        flexDirection: 'column',
                        gap: 2,
                    }}>
                        <Typography variant="h6" sx={{ color: '#fff' }}>Meeting ended</Typography>
                        <Typography variant="body2" sx={{ color: '#888' }}>Redirecting you back...</Typography>
                    </Box>
                ) : (
                <JitsiMeeting
                    domain={cleanDomain}
                    roomName={roomName}
                    jwt={jwt}
                    configOverwrite={{
                        prejoinPageEnabled: false,
                        startWithAudioMuted: false,
                        startWithVideoMuted: false,
                        disableInviteFunctions: true,
                        hideLobbyButton: true,
                        disableShareRoom: true,
                        enableClosePage: false,
                        enableUserRolesBasedOnToken: true,
                        // Explicitly list all toolbar buttons. In iframe mode, Jitsi
                        // uses a reduced default set that EXCLUDES 'recording'.
                        toolbarButtons,
                        // Modern Jitsi: defaultLogoUrl replaces the top-left watermark image
                        defaultLogoUrl: logoUrl || '',
                        branding: {
                            logoUrl: logoUrl || '',
                            watermarkLink: '',
                        },
                    }}
                    interfaceConfigOverwrite={{
                        // Legacy flags — kept for older Jitsi versions
                        SHOW_JITSI_WATERMARK: false,
                        SHOW_BRAND_WATERMARK: false,
                        SHOW_WATERMARK_FOR_GUESTS: false,
                        DEFAULT_LOGO_URL: logoUrl || '',
                        JITSI_WATERMARK_LINK: '',
                        BRAND_WATERMARK_LINK: '',
                        SHOW_PROMOTIONAL_CLOSE_PAGE: false,
                        SHOW_DOWNLOAD_PDF: false,
                        TOOLBAR_BUTTONS: toolbarButtons,
                        DEFAULT_BACKGROUND: '#000000',
                    }}
                    userInfo={{
                        displayName,
                        email: email || '',
                    }}
                    getIFrameRef={(parentNode) => {
                        if (parentNode) {
                            parentNode.style.height = '100%';
                            parentNode.style.width = '100%';
                        }
                    }}
                    onApiReady={handleApiReady}
                />
                )}
            </Box>
        </Box>
    );
};

export default JitsiMeetingComponent;
