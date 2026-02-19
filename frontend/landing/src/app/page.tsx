import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Courses from "@/components/Courses";
import Testimonials from "@/components/Testimonials";

export default function Home() {
    return (
        <main className="min-h-screen">
            <Hero />
            <Features />
            <Courses />
            <Testimonials />
        </main>
    );
}
