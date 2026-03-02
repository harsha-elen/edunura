import { Metadata } from 'next';
import MyCoursesPage from '@/components/student/MyCoursesPage';

export const metadata: Metadata = {
    title: 'My Courses',
    description: 'View and manage your enrolled courses',
};

export default function Page() {
    return <MyCoursesPage />;
}
