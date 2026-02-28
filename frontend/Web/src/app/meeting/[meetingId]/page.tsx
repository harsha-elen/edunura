import StandaloneLiveClass from '@/components/StandaloneLiveClass';

interface MeetingPageProps {
    params: Promise<{ meetingId: string }>;
}

export default async function MeetingPage({ params }: MeetingPageProps) {
    const { meetingId } = await params;
    return <StandaloneLiveClass meetingId={meetingId} />;
}
