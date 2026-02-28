import LiveClassSession from '@/components/admin/LiveClassSession';

interface LiveClassPageProps {
    params: Promise<{ meetingId: string }>;
}

export default async function LiveClassPage({ params }: LiveClassPageProps) {
    const { meetingId } = await params;
    return <LiveClassSession meetingId={meetingId} />;
}
