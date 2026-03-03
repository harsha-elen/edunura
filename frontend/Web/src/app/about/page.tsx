import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import LandingAboutPage from '../landing/about/page';

export default function AboutPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <Header />
      <main className="flex-grow">
        <LandingAboutPage />
      </main>
      <Footer />
    </div>
  );
}
