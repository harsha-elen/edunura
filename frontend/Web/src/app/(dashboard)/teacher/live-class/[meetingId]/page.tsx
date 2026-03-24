import StandaloneLiveClass from '@/components/teacher/StandaloneLiveClass';

interface LiveClassPageProps {
    params: Promise<{ meetingId: string }>;
}

export default async function LiveClassPage({ params }: LiveClassPageProps) {
    const { meetingId } = await params;
    return <StandaloneLiveClass meetingId={meetingId} />;
}
