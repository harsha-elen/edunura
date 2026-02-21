import React from 'react';

const AboutPage = () => {
    return (
        <div className="font-display bg-background-light text-slate-900 antialiased min-h-screen">
            {/* Hero Section */}
            <header className="relative py-24 overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 -z-10"></div>
                <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <span className="inline-block py-1 px-4 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6 uppercase tracking-wider">Our Journey</span>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">Empowering the Future of <span className="text-primary">Digital Learning</span></h1>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            Founded with a vision to democratize elite education, we bridge the gap between world-class knowledge and ambitious learners worldwide. Our platform is more than an LMS—it's a gateway to professional mastery.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button className="bg-primary text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:-translate-y-1 transition-transform w-full sm:w-auto">Explore Our Values</button>
                            <button className="border border-primary/20 bg-white px-8 py-4 rounded-xl font-bold hover:bg-slate-50 transition-colors w-full sm:w-auto">Watch Story</button>
                        </div>
                    </div>
                    <div className="relative">
                        <img alt="Team collaborating" className="rounded-2xl shadow-2xl relative z-10" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7kzwwLbcJlr6jC8QllTnZ1yXOSzIZeGHFgTSBcIgT_Dxm-dC0XDjLJvN8L1GrRUQQZYH-5PFOS-6fXNFI-kQojq-8fCtjFWCoTVI1R7IARXdxTDgJsYozoOSlzA4Fj15h7x0r-cDmMoixEPc2vY-8fwqy5YoYJSh1lQrsxM0vyaidF6QXs0EUyjnlUJ8qUUcIRqG_yMte6vwr5Pl0eCTyIDKijz9uzloTJKUEg9yZllnGdGzURFlGZz7raN5XhLvWPL_RVEujM0Da" />
                        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary rounded-2xl -z-10 opacity-20"></div>
                        <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary rounded-2xl -z-10 opacity-20"></div>
                    </div>
                </div>
            </header>

            {/* Impact Stats */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center p-6 sm:p-8 rounded-2xl bg-background-light border border-primary/5">
                            <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-2">50k+</div>
                            <div className="text-slate-500 font-medium text-sm sm:text-base">Students Enrolled</div>
                        </div>
                        <div className="text-center p-6 sm:p-8 rounded-2xl bg-background-light border border-primary/5">
                            <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-2">200+</div>
                            <div className="text-slate-500 font-medium text-sm sm:text-base">Expert Courses</div>
                        </div>
                        <div className="text-center p-6 sm:p-8 rounded-2xl bg-background-light border border-primary/5">
                            <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-2">95%</div>
                            <div className="text-slate-500 font-medium text-sm sm:text-base">Completion Rate</div>
                        </div>
                        <div className="text-center p-6 sm:p-8 rounded-2xl bg-background-light border border-primary/5">
                            <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-2">15</div>
                            <div className="text-slate-500 font-medium text-sm sm:text-base">Global Partners</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-4xl font-bold mb-6">Built on Strong Foundations</h2>
                        <p className="text-slate-600 text-lg">We are driven by the belief that high-quality education should be accessible, engaging, and directly linked to career success.</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="group p-10 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-transparent hover:border-primary/20 transition-all">
                            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                                <span className="material-symbols-outlined text-3xl">lightbulb</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                            <p className="text-slate-600 leading-relaxed">
                                To provide a seamless, intuitive learning experience that empowers individuals to acquire new skills, pivot careers, and reach their highest professional potential through technology and expert-led pedagogy.
                            </p>
                        </div>
                        <div className="group p-10 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-transparent hover:border-primary/20 transition-all">
                            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                                <span className="material-symbols-outlined text-3xl">visibility</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                            <p className="text-slate-600 leading-relaxed">
                                To become the global standard for digital corporate training and personal development, fostering a world where lifelong learning is an effortless and rewarding journey for everyone.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Meet the Team */}
            <section className="py-24 bg-background-light">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                        <div className="max-w-2xl">
                            <h2 className="text-4xl font-bold mb-4">The Minds Behind the Platform</h2>
                            <p className="text-slate-600">Our diverse team of educators, engineers, and creatives work tirelessly to redefine the learning landscape.</p>
                        </div>
                        <button className="text-primary font-bold flex items-center gap-2 hover:gap-3 transition-all">
                            Join our team <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Team Member 1 */}
                        <div className="bg-white p-4 rounded-2xl border border-primary/5 hover:shadow-xl transition-shadow group">
                            <div className="aspect-square mb-6 overflow-hidden rounded-xl">
                                <img alt="Robert Chen" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1kruMoEDzFsX0_0IZshW43bTtm-3P12T3O311yxXVUHwYap44gnOjEBQCOGLnvw11rdvfEpHyNEJSaUgLKTG0YH1KIrILvpn7YZC9opnGUHnOriRdBPJNg3HlRE213ilOuyxPO8tP2Nb8kXruQdZUcgAUJLOADHsI_XULLZi2cNrw1Eez2LV_lxoKWKxQwnPcrNC9JIxP2d4VGi2H9qeQMr8q8DaJWej6L3C3lD_9ePv4hL3Ol5WBju2X9JQRARJK-QJF1vWQSq5W" />
                            </div>
                            <h4 className="text-xl font-bold mb-1 border-none">Dr. Robert Chen</h4>
                            <p className="text-primary font-medium text-sm mb-4">Founder & CEO</p>
                            <p className="text-slate-500 text-sm leading-relaxed mb-4">Former EdTech lead with 15+ years experience in digital pedagogy and systems architecture.</p>
                            <div className="flex gap-3">
                                <a className="text-slate-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined text-xl">share</span></a>
                                <a className="text-slate-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined text-xl">link</span></a>
                            </div>
                        </div>
                        {/* Team Member 2 */}
                        <div className="bg-white p-4 rounded-2xl border border-primary/5 hover:shadow-xl transition-shadow group">
                            <div className="aspect-square mb-6 overflow-hidden rounded-xl">
                                <img alt="Sarah Jenkins" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3SMIgdKfXzkYy4cps_EyxH08sJaAJ1E3pGrrlbAw6xZ1cWPtTibGn1lg783AG23IuPqy9o0eeLB_MzLVWgjsQoHZ5n5Jg2CV1SdYWOJ27fW7gJeKrKGVHvPn3dE3CgbXOBeiSaE4fhm2_UoWBhRP29j_7tmCxqVVR6GPhowHGTRC-imgi5tgLh_1yR9AbXqld_H_V3Ku-4Lfb5KBvTKUc-dCnFAE2QW3lbWxSKkbisIoONfk7BJFHJGZAyIVzezhl7JHQhEkb3p0f" />
                            </div>
                            <h4 className="text-xl font-bold mb-1">Sarah Jenkins</h4>
                            <p className="text-primary font-medium text-sm mb-4">Chief Operating Officer</p>
                            <p className="text-slate-500 text-sm leading-relaxed mb-4">Strategic operations expert focused on scaling educational ecosystems and student success.</p>
                            <div className="flex gap-3">
                                <a className="text-slate-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined text-xl">share</span></a>
                                <a className="text-slate-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined text-xl">link</span></a>
                            </div>
                        </div>
                        {/* Team Member 3 */}
                        <div className="bg-white p-4 rounded-2xl border border-primary/5 hover:shadow-xl transition-shadow group">
                            <div className="aspect-square mb-6 overflow-hidden rounded-xl">
                                <img alt="Marcus Thorne" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0f8l93y0sOnMpY4g_Ua1lWF-yTAo4aXHA1dfLinzOTeDIzW8kcUi-vLvz4pTjTsD_RBCQTMMLAUhUtf2d0aGU24hzidooEoE_KVT3kWHx9eUbk4YaxcDU1JAP-CaBeL9grcS1GXl8-hx_svMEuGE_5a8J66Mz4yv8B6z9QWdmwnHWAukqFk9V_WvtMniEITzVrw-POC3WyIujY56TjikY64wIWxFyK3XQKFYB9sNvvqrGfhdwpIzigdM76NoaL5ZPtK96UwUCNR8X" />
                            </div>
                            <h4 className="text-xl font-bold mb-1">Marcus Thorne</h4>
                            <p className="text-primary font-medium text-sm mb-4">Chief Technology Officer</p>
                            <p className="text-slate-500 text-sm leading-relaxed mb-4">Cloud infrastructure pioneer building the next generation of interactive learning tools.</p>
                            <div className="flex gap-3">
                                <a className="text-slate-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined text-xl">share</span></a>
                                <a className="text-slate-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined text-xl">link</span></a>
                            </div>
                        </div>
                        {/* Team Member 4 */}
                        <div className="bg-white p-4 rounded-2xl border border-primary/5 hover:shadow-xl transition-shadow group">
                            <div className="aspect-square mb-6 overflow-hidden rounded-xl">
                                <img alt="Elena Rodriguez" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPlZC2JCakOGCndQjTYs2TWdcLv_jbOhSut6rr9Gp_2VDvRMMPQjnpC0TB9HTWO0uj4AcZpF_9pD6HLN6i3vscI8h8XaMbLSSyD8XynF7xZikY43wiN_yUcnZoGp6M4QuJrUOBK_F_9spnYcQUF9Zrf9nt_vrEWGE3GLlzW7JBq9F0sLoPyc6nTAwnqFCJqLkZZqm607XJeY-F2zY0wIlO83ZZm3c6Ono0ME4bDKG8BrDJOWL8skadjbqSBAR9PX1OCBPaBjBHRGbP" />
                            </div>
                            <h4 className="text-xl font-bold mb-1">Elena Rodriguez</h4>
                            <p className="text-primary font-medium text-sm mb-4">Academic Director</p>
                            <p className="text-slate-500 text-sm leading-relaxed mb-4">Curriculum designer specializing in cognitive load theory and online engagement.</p>
                            <div className="flex gap-3">
                                <a className="text-slate-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined text-xl">share</span></a>
                                <a className="text-slate-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined text-xl">link</span></a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Global Reach */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="bg-primary rounded-[2rem] p-12 relative overflow-hidden flex flex-col md:flex-row items-center gap-12">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent"></div>
                        <div className="relative z-10 flex-1">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">A Global Community of Lifelong Learners</h2>
                            <p className="text-lg mb-8 leading-relaxed text-blue-100">
                                From San Francisco to Singapore, our learners are transforming their lives. We provide support in 12 languages and have active study groups in over 45 countries.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full text-white text-sm">
                                    <span className="material-symbols-outlined text-sm">public</span> 45+ Countries
                                </div>
                                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full text-white text-sm">
                                    <span className="material-symbols-outlined text-sm">translate</span> 12 Languages
                                </div>
                                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full text-white text-sm">
                                    <span className="material-symbols-outlined text-sm">groups</span> 500+ Communities
                                </div>
                            </div>
                        </div>
                        <div className="relative z-10 w-full md:w-1/3">
                            <div className="aspect-square bg-white/5 rounded-2xl border border-white/10 p-4 backdrop-blur-xl">
                                <img alt="World Map" className="w-full h-full object-cover rounded-xl opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsc3tRj-CU9vitjhiSJSsGCRPhce_dLPiRpkZAR6xl_MMfjTXW9YkCJCr7esHHE_pdDwLPtFCyfR3MI4xsniRxAg1O_ko5HZgF_IA6qtsU-ysguIwTmhDmJwk_hXz7JJWtLhchMC8vZG_hb6Z05-6p0OMIXpDNb4qC0MhKCRR4qybeys8UKx8CFqUI4uKoZj_Lv8uBO6LwsrdKdVLP3NmLZkzmdJzNc57_a6DLzRv5Lq-Zyh3VEa4Xza68Ffsy7uEcOQ2qyiSMqhzZ" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 text-center">
                <div className="max-w-3xl mx-auto px-6">
                    <h2 className="text-4xl font-bold mb-8">Ready to start your journey?</h2>
                    <p className="text-lg text-slate-600 mb-10">Join thousands of professionals already mastering new skills with Edunura.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a className="bg-primary text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all" href="/courses">Explore Courses</a>
                        <a className="bg-white border border-slate-200 px-10 py-4 rounded-xl font-bold text-lg hover:border-primary transition-colors" href="/contact">Contact Sales</a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;
