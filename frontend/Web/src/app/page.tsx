import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import LandingHomePage from './landing/page';

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <Header />
      <main className="flex-grow">
        <LandingHomePage />
      </main>
      <Footer />
    </div>
  );
}
