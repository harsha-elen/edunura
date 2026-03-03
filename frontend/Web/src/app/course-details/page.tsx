import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import LandingCourseDetailsPage from '../landing/course-details/page';

export default function CourseDetailsPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <Header />
      <main className="flex-grow">
        <LandingCourseDetailsPage />
      </main>
      <Footer />
    </div>
  );
}
