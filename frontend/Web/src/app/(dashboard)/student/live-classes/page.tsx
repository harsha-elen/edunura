import { Metadata } from 'next';
import LiveClassesPage from '@/components/student/LiveClassesPage';

export const metadata: Metadata = {
    title: 'Live Classes | Student Portal',
    description: 'Join scheduled live classes and sessions',
};

export default function Page() {
    return <LiveClassesPage />;
}
