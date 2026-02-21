
import React from 'react';

export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:py-24 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="flex flex-col items-start gap-6">
            <h1 className="font-[family-name:var(--font-poppins)] font-medium text-4xl sm:text-5xl lg:text-[60px] leading-tight lg:leading-[66px] text-[#212121]">
              From anywhere to everywhere, <span className="text-primary">EduNura</span> brings education to your fingertips.
            </h1>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
              OWN IT, LIVE IT, LOVE IT.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-square overflow-hidden rounded-lg bg-slate-100">
              <img alt="Student learning" className="h-full w-full object-cover" src="/images/studemt-3.jpeg" />
            </div>
            <div className="aspect-square overflow-hidden rounded-lg bg-slate-100">
              <img alt="Student learning" className="h-full w-full object-cover" src="/images/student-2.jpeg" />
            </div>
            <div className="aspect-square overflow-hidden rounded-lg bg-slate-100">
              <img alt="Student learning" className="h-full w-full object-cover" src="/images/student-4.jpeg" />
            </div>
            <div className="aspect-square overflow-hidden rounded-lg bg-slate-100">
              <img alt="Student learning" className="h-full w-full object-cover" src="/images/student-1.jpeg" />
            </div>
          </div>
        </div>
      </section>
      <div className="relative z-10 mx-auto -mt-29 max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-white px-10 py-10 shadow-[0px_10px_40px_rgba(0,0,0,0.08)] md:flex-row">
          <h2 className="font-[family-name:var(--font-quicksand)] text-2xl sm:text-3xl lg:text-[36px] font-bold leading-tight text-[#181818]">
            OWN IT, LIVE IT, LOVE IT.
          </h2>
          <div className="flex items-center">
            <img alt="Edunura Logo" className="h-16 sm:h-20 lg:h-26 w-auto object-contain" src="/images/edunura-font-02.png" />
          </div>
        </div>
      </div>
      <section className="bg-white py-20 px-4">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="mb-12 font-[family-name:var(--font-quicksand)] text-2xl sm:text-3xl lg:text-[36px] font-semibold leading-tight text-[#191615]">
            Explore Course Categories
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center justify-center rounded-xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
              <span className="material-symbols-outlined mb-6 text-7xl sm:text-9xl lg:text-[120px] text-primary">fitness_center</span>
              <h3 className="text-lg font-bold text-secondary">Fitness</h3>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
              <span className="material-symbols-outlined mb-6 text-7xl sm:text-9xl lg:text-[120px] text-primary">theater_comedy</span>
              <h3 className="text-lg font-bold text-secondary">Cultural</h3>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
              <span className="material-symbols-outlined mb-6 text-7xl sm:text-9xl lg:text-[120px] text-primary">psychology</span>
              <h3 className="text-lg font-bold text-secondary">Skill Development</h3>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
              <span className="material-symbols-outlined mb-6 text-7xl sm:text-9xl lg:text-[120px] text-primary">school</span>
              <h3 className="text-lg font-bold text-secondary">Academics</h3>
            </div>
          </div>
        </div>
      </section>
      <div className="relative w-full min-h-[600px] lg:h-[85vh]">
        <img alt="Banner" className="absolute inset-0 h-full w-full object-cover object-bottom" src="/images/Untitled-design-9-1.png" />
        <div className="absolute inset-0 flex flex-col lg:grid lg:grid-cols-2 lg:items-center bg-black/20 lg:bg-transparent">
          <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 text-center lg:text-right lg:justify-end">
            <p className="max-w-lg text-lg sm:text-xl lg:text-2xl leading-relaxed text-white drop-shadow-md">
              At Edunura, education goes beyond academics – nurturing curiosity, creativity, and real-world skills to help students thrive in a rapidly changing world.
            </p>
          </div>
          <div className="flex-1 flex flex-col items-center lg:items-start justify-center p-6 sm:p-10 lg:p-16">
            <h2 className="mb-4 text-4xl sm:text-6xl lg:text-7xl font-light uppercase tracking-wide text-primary drop-shadow-sm">
              Brand<br /><span className="font-bold">Philosophy</span>
            </h2>
          </div>
        </div>
      </div>
      <div className="relative w-full min-h-[700px] lg:h-[85vh]">
        <img alt="Mission Banner" className="absolute inset-0 h-full w-full object-cover object-bottom" src="/images/Untitled-design-12-1.png" />
        <div className="absolute inset-0 flex flex-col lg:grid lg:grid-cols-2 lg:items-center bg-black/20 lg:bg-transparent">
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-16 lg:items-end text-center lg:text-right">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-light uppercase tracking-wide text-primary drop-shadow-sm">Mission</h2>
          </div>
          <div className="flex-1 flex flex-col justify-center p-6 sm:p-10 lg:p-16">
            <div className="max-w-lg text-white drop-shadow-md">
              <p className="mb-6 text-lg sm:text-xl leading-relaxed">Edunura's mission is to transform the way students experience education — shifting it from pressure and rote learning to clarity, curiosity, and guided growth.</p>
              <ul className="space-y-4 text-left">
                <li className="flex items-start gap-3 text-base sm:text-lg">
                  <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary border border-white"></span>
                  <span>For Student: A safe and joyful space where concepts come alive and confidence grows naturally</span>
                </li>
                <li className="flex items-start gap-3 text-base sm:text-lg">
                  <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary border border-white"></span>
                  <span>For Parents: Reassurance that their child is learning in a way that builds both knowledge and resilience, without unnecessary stress.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="relative w-full min-h-[500px] lg:h-[85vh]">
        <img alt="Vision Banner" className="absolute inset-0 h-full w-full object-cover object-bottom" src="/images/bulb.png" />
        <div className="absolute inset-0 flex flex-col lg:grid lg:grid-cols-2 lg:items-center bg-black/10 lg:bg-transparent">
          <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 text-center lg:text-right lg:justify-end">
            <p className="max-w-md text-lg sm:text-xl lg:text-2xl leading-relaxed text-white drop-shadow-md">
              Edunura's vision is to transform the landscape of education by making it simpler, friendlier, and more meaningful for students and parents alike.
            </p>
          </div>
          <div className="flex-1 flex flex-col items-center lg:items-start justify-center p-6 sm:p-10 lg:p-16">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-normal uppercase tracking-wide text-primary drop-shadow-sm">Vision</h2>
          </div>
        </div>
      </div>
      <section className="bg-white px-4 py-8 my-12 relative overflow-hidden h-auto lg:h-[250px] flex items-center">
        <div className="mx-auto max-w-[1300px] w-full bg-secondary rounded-[2.5rem] p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          <div className="text-white text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-2 text-primary text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">person</span> Become a Mentor
            </div>
            <h2 className="font-[family-name:var(--font-quicksand)] font-bold text-2xl sm:text-3xl lg:text-[36px] leading-[1.2] text-white lg:max-w-2xl">
              Are you ready to guide students from Roots to Radiance? Join us ...
            </h2>
          </div>
          <div className="hidden lg:flex items-center justify-center">
            <img alt="Edunura Symbol" className="h-24 lg:h-32 w-auto object-contain" src="/images/edunura-symbool-scaled-1.png" />
          </div>
          <button className="bg-[#FD9A7C] hover:bg-[#E94F13] text-white px-8 lg:px-10 py-4 lg:py-5 rounded-full font-bold transition-all shadow-xl whitespace-nowrap">
            Join the Journey
          </button>
        </div>
      </section>
      <section className="bg-[#f0f8ff] relative overflow-hidden py-24 px-4 lg:px-8">
        <div className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-purple-100/50 to-transparent blur-3xl"></div>
        <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 relative z-10">
          <div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">YOUR QUESTIONS ANSWERED</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-12">Common questions</h2>
            <div className="space-y-6">
              <div className="border-b border-slate-300 pb-4">
                <button className="flex w-full items-center justify-between text-left text-lg font-bold text-secondary">
                  What is your approach to social media?
                </button>
              </div>
              <div className="border-b border-slate-300 pb-4">
                <button className="flex w-full items-center justify-between text-left text-lg font-bold text-secondary">
                  What is your approach to branding?
                </button>
              </div>
              <div className="border-b border-slate-300 pb-4">
                <button className="flex w-full items-center justify-between text-left text-lg font-bold text-secondary">
                  What is your approach to web design?
                </button>
              </div>
              <div className="border-b border-slate-300 pb-4">
                <button className="flex w-full items-center justify-between text-left text-lg font-bold text-secondary">
                  What is your approach to influencer marketing?
                </button>
              </div>
              <div className="border-b border-slate-300 pb-4">
                <button className="flex w-full items-center justify-between text-left text-lg font-bold text-secondary">
                  What is your approach to influencer marketing?
                </button>
              </div>
            </div>
          </div>
          <div className="relative h-full min-h-[300px] sm:min-h-[400px]">
            <div className="absolute top-0 left-0 w-40 h-40 sm:w-64 sm:h-64 overflow-hidden rounded-[40px_10px_60px_20px]">
              <img alt="Student smiling" className="h-full w-full object-cover" src="/images/student.jpeg" />
            </div>
            <div className="absolute bottom-0 right-4 sm:right-10 w-40 h-40 sm:w-64 sm:h-64 overflow-hidden rounded-[10px_80px_20px_60px] border-4 border-white shadow-xl">
              <img alt="Classroom" className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-500" src="/images/class-room.jpeg" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
