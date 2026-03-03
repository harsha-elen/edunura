import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import LandingContactPage from '../landing/contact/page';

export default function ContactPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <Header />
      <main className="flex-grow">
        <LandingContactPage />
      </main>
      <Footer />
    </div>
  );
}
