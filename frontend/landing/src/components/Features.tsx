import React from 'react';

const Features = () => {
    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Why Choose EduFlow?</h2>
                    <p className="mt-4 text-lg text-slate-600">We provide the tools and support you need to succeed in your learning journey.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <div className="p-8 bg-background-light rounded-2xl border border-transparent hover:border-primary/30 transition-all hover:shadow-lg">
                        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                            <span className="material-icons text-3xl">psychology</span>
                        </div>
                        <h3 className="text-xl font-bold mb-3">Expert Instructors</h3>
                        <p className="text-slate-600 leading-relaxed">Learn from industry professionals with years of experience in their respective fields.</p>
                    </div>
                    {/* Feature 2 */}
                    <div className="p-8 bg-background-light rounded-2xl border border-transparent hover:border-primary/30 transition-all hover:shadow-lg">
                        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                            <span className="material-icons text-3xl">schedule</span>
                        </div>
                        <h3 className="text-xl font-bold mb-3">Flexible Learning</h3>
                        <p className="text-slate-600 leading-relaxed">Access your courses 24/7 on any device. Study at the pace that works best for you.</p>
                    </div>
                    {/* Feature 3 */}
                    <div className="p-8 bg-background-light rounded-2xl border border-transparent hover:border-primary/30 transition-all hover:shadow-lg">
                        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                            <span className="material-icons text-3xl">verified_user</span>
                        </div>
                        <h3 className="text-xl font-bold mb-3">Certifications</h3>
                        <p className="text-slate-600 leading-relaxed">Earn recognized certificates upon completion to showcase your expertise on your resume.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Features;
