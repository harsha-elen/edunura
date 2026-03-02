import { Metadata } from 'next';
import CalendarPage from '@/components/student/CalendarPage';

export const metadata: Metadata = {
    title: 'Calendar | Student Portal',
    description: 'View your scheduled live classes and sessions',
};

export default function Page() {
    return <CalendarPage />;
}
