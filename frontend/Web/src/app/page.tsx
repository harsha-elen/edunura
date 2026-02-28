export default function HomePage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <main className="flex-grow">
        <section className="flex flex-col items-center justify-center min-h-screen text-center px-4">
          <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
            Edunura
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Roots to Radiance — Learning Management System
          </p>
          <p className="text-gray-400 text-sm">
            Unified frontend — Landing page will be ported here.
          </p>
        </section>
      </main>
    </div>
  );
}
