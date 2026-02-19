import React from 'react';

const Hero = () => {
    return (
        <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
                    <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary mb-6">
                            🚀 The Future of Learning
                        </span>
                        <h1 className="text-4xl tracking-tight font-extrabold text-slate-900 sm:text-5xl md:text-6xl lg:leading-[1.1]">
                            Master New Skills with <span className="text-primary">Expert-Led</span> Courses
                        </h1>
                        <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                            Access world-class education from anywhere in the world. Learn from industry giants and get certified to accelerate your professional career growth today.
                        </p>
                        <div className="mt-10 sm:flex sm:justify-center lg:justify-start gap-4">
                            <button className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-xl shadow-primary/30">
                                Explore All Courses
                            </button>
                            <button className="mt-3 sm:mt-0 w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-lg hover:bg-slate-50 transition-colors">
                                How it Works
                            </button>
                        </div>
                        <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-500">
                            <div className="flex -space-x-2">
                                <img alt="User" className="w-8 h-8 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPHIAVdkLH8sPzfjQhzglK4kCuQ-U7uvvtg74jcTidHASwyNJPyGZhFJMAeFfD5c2IGdB7zKQIvKbYhmzBqjPQsq4-Yn2A9FYMs8APYY29hePGExA_NYy8kFAm0vSMoV8bfdhsTia9Hy9v1BsOMjjnQISSrJgbGvH4up9VmvZo8aINdFniuWO8UyHPBCPyLVlwXIAWgpgXaGGUbjAwZ5rPFKxDHIeqjNGTAyjysRWngTGXliI2qZDsvCOVTLk_KadagRSzopItcZsf" />
                                <img alt="User" className="w-8 h-8 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2KJM6ZIpjmSPzDCDoWtxLBbWNKJs4GHOxQR1kOQMabOWITiCfoRwilmSs_OX6NW0im-mg0UGVKPg4CEvfLGFTwXOFzY80FYibQ5Kugt4YPL7QSNNpUSH6i8AudnRot5wF2PNDp1CZxlH1q9RBy1cNiwNO0Vlhqa8NsL0ezFaWWwxBox_-IFJ1NpjtIIgmKZFMDZZ7eONNQT2-VWuGwGNbcsZXunQTlZFSa0wDjob7LnyI388M1I2CoEIrFNZoybOiE6TefnRcVpBn" />
                                <img alt="User" className="w-8 h-8 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUtxunCUqVHSUoFu6o5aAPv2zBdAEqhGRzkQxHGHuOwVxRTHORqFhL4vwuMxVC9EQ6LOE4kvuT6D8-4Aw7S8eF4SKTyitv_MvJuXdoBddJ5nH65Pj9gKUT3h6m_3fteK3EkYlr_-c6iMpIDwyLufpF_1sfbO4dSNcDUuMDT4naMP6RAiVszdvrC7bybLN_lUiMYwo4-PazF_JJEDhfIFCkhw39klgEQ9X8HgUsicr8rldsuBeip5z5FHkb0HULK1Yp6u8OrE27Ku6W" />
                            </div>
                            <span>Join 50k+ learners already growing with us</span>
                        </div>
                    </div>
                    <div className="mt-16 sm:mt-24 lg:mt-0 lg:col-span-6 relative">
                        <div className="relative mx-auto w-full rounded-2xl shadow-2xl overflow-hidden aspect-square lg:aspect-video">
                            <img alt="Online Learning" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2WA7NGhGAoIER_ldTWo3-0hdUC5r1wfwMOSpdz8zs-06loKe3VPYNnoB1u9W3Egi81nsdu455FR8w28G2d3hBHVPS0b5w0vienYTcCwEzn_hjEfajkwdZhaCLlNbHwZBWfR3NsOeG0-kTUD7H53q-X7yP_Q5kjtoVqElCwarJq_qGqbJaS1rOjEOpS0mRgubji6Ah6ALSsMV6Z9AJbo-WOmWfNaa_EgMC79J7bGm1UHVyhf4dDXyvyX5wWe41xNCeJ-yBb2eHGYw1" />
                            <div className="absolute inset-0 bg-primary/10 mix-blend-multiply"></div>
                        </div>
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/30 rounded-full blur-3xl"></div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
