import React from 'react';

const CourseDetailsPage = () => {
    return (
        <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 md:px-8 py-6">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative items-start">
                {/* Left Column: Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Hero Section */}
                    <div className="relative overflow-hidden rounded-xl bg-slate-900 text-white">
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40 z-10"></div>
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBB6-by6zVvpJY7f2ScgCGHqaJ4MMaXGWbRRxOZBQ3DHZ0bVe_F4mBZqCBemd4Mg7g51JjY-VkLzs3uZRDIM8aExTidXpM0p6ht72ocYhwRES0BfSu9QfI6I1MFqeqka4wp9fvtkY1yT3XCrmvo73ywerovt2kw_sxKFNcx_4XyhZLdcHKDHvC4RzMclqQ1VsRkYskmf7NyC8mGjoFET-rUDhuB3GvIBaKEiHRcgxD7UycwxfVRDEH4ESxjvXEYeBEZa9tTPfqkp9hM")' }}></div>
                        <div className="relative z-20 p-8 md:p-10 flex flex-col gap-4 h-full justify-end min-h-[320px]">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">Bestseller</span>
                                <span className="text-slate-300 text-xs font-medium">Updated Oct 2023</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight font-display">
                                Mastering Advanced React Patterns
                            </h1>
                            <p className="text-lg text-slate-200 max-w-2xl leading-relaxed">
                                Deep dive into component composition, Hooks, and Redux with industry experts. Build scalable applications from scratch.
                            </p>
                            <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-white/10">
                                <div className="flex items-center gap-2">
                                    <span className="text-yellow-400 font-bold text-lg">4.8</span>
                                    <div className="flex text-yellow-400">
                                        <span className="material-symbols-outlined text-[18px] fill-current">star</span>
                                        <span className="material-symbols-outlined text-[18px] fill-current">star</span>
                                        <span className="material-symbols-outlined text-[18px] fill-current">star</span>
                                        <span className="material-symbols-outlined text-[18px] fill-current">star</span>
                                        <span className="material-symbols-outlined text-[18px] fill-current">star_half</span>
                                    </div>
                                    <span className="text-slate-300 text-sm">(1,203 ratings)</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-cover bg-center border border-white/30" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBGQQImlsGOqkJeP3LecKRUfy3rvx7_E7CfRqmwZbThERgB-x1TCFCSfVTiNCQFNi_G4JJ0BZwXIj-PeG-gNA50u2SZEVBcLKP-SKnAlzvDSKwRTAR-Q_5JuwAkGj1jUC1xVR7XNL3DRf746kPZ7t9WZQjOt0VCxEI3bFiI5dPQU-m6r7NCRnRRTQ0oPWX0xOp96gWva4ALM6erkKveOjrspZlMZq8x9ce8ABH2SBptMWEBcprfDh8AeGvpRRGumEQB42rv1vAUZTaV")' }}></div>
                                    <span className="text-sm font-medium">Created by <a className="text-primary hover:text-blue-300 hover:underline" href="#">Sarah Jenkins</a></span>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-slate-300">
                                    <span className="material-symbols-outlined text-[16px]">language</span>
                                    <span>English</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* What you'll learn */}
                    <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <h3 className="text-2xl font-bold mb-6 text-slate-900 font-display">What you'll learn</h3>
                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                            {[
                                "Build powerful, reusable components using advanced patterns like Render Props and HOCs.",
                                "Master the React Context API for effective state management across large applications.",
                                "Implement complex hooks and custom hooks to abstract logic and improve code cleanliness.",
                                "Optimize performance using memoization, lazy loading, and code splitting techniques.",
                                "Integrate Redux Toolkit for predictable state updates and side-effect management.",
                                "Best practices for testing React components with Jest and React Testing Library."
                            ].map((item, i) => (
                                <div key={i} className="flex gap-3">
                                    <span className="material-symbols-outlined text-primary shrink-0">check</span>
                                    <span className="text-slate-700 text-sm leading-relaxed">{item}</span>
                                </div>
                            ))}
                        </div>
                        <h3 className="text-xl font-bold mb-4 mt-8 text-slate-900 font-display">Description</h3>
                        <div className="max-w-none text-slate-600 text-sm leading-relaxed">
                            <p className="mb-4">
                                React is one of the most popular libraries for building user interfaces, but moving beyond the basics can be challenging. This course is designed to take your React skills to the professional level. We move past simple state and props to explore the architectural patterns that power large-scale applications at top tech companies.
                            </p>
                            <p className="mb-4">
                                You will build a real-world project throughout the course, facing common challenges that senior developers solve daily. By the end of this journey, you won't just know how to write React code—you'll understand how to architect robust, maintainable frontend systems.
                            </p>
                            <p className="font-bold text-slate-900 mt-4 font-display">Prerequisites:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Basic understanding of JavaScript (ES6+)</li>
                                <li>Familiarity with HTML and CSS</li>
                                <li>Basic knowledge of React (components, props, state)</li>
                            </ul>
                        </div>
                    </section>

                    {/* Course Content */}
                    <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 font-display">Course Content</h3>
                                <p className="text-sm text-slate-500 mt-1">12 sections • 48 lectures • 14h 32m total length</p>
                            </div>
                            <button className="text-primary text-sm font-bold hover:underline">Expand all sections</button>
                        </div>
                        <div className="space-y-3">
                            {/* Module 1 */}
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <details className="group" open>
                                    <summary className="flex items-center justify-between p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors list-none select-none">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-slate-500 transition-transform group-open:rotate-180">expand_more</span>
                                            <span className="font-bold text-slate-900">Introduction to Advanced Patterns</span>
                                        </div>
                                        <span className="text-xs text-slate-500 font-medium font-display">3 lectures • 15m</span>
                                    </summary>
                                    <div className="p-0 bg-white">
                                        <div className="flex items-center justify-between py-3 px-6 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3 text-sm">
                                                <span className="material-symbols-outlined text-[18px] text-slate-400">play_circle</span>
                                                <span className="text-primary hover:underline cursor-pointer">Welcome to the Course</span>
                                                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500">Preview</span>
                                            </div>
                                            <span className="text-xs text-slate-500">04:20</span>
                                        </div>
                                        <div className="flex items-center justify-between py-3 px-6 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3 text-sm">
                                                <span className="material-symbols-outlined text-[18px] text-slate-400">play_circle</span>
                                                <span className="text-slate-700">Setting up the Environment</span>
                                            </div>
                                            <span className="text-xs text-slate-500">08:15</span>
                                        </div>
                                        <div className="flex items-center justify-between py-3 px-6 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3 text-sm">
                                                <span className="material-symbols-outlined text-[18px] text-slate-400">article</span>
                                                <span className="text-slate-700">Course Resources & Github Repo</span>
                                            </div>
                                            <span className="text-xs text-slate-500">02:30</span>
                                        </div>
                                    </div>
                                </details>
                            </div>
                            {/* More modules can be added here following the same structure */}
                        </div>
                    </section>
                </div>

                {/* Right Column: Sticky Enrollment Card */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 flex flex-col gap-6">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
                            <div className="h-48 w-full bg-slate-100 relative group cursor-pointer">
                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBhq19WcefTJH1x68jc8KmHt7-FlaWvw9e6T9Gd9Mxg3AMIlY4Bql2iX_oUKXh--Ja0NZKa5ncd6amdv0VQkRylJZ2oseRlJ9XoyZPcjcmC8sS408ZlWFKZdjUM5jac7R3wWJc9-4xf0HiMEae7BoGuZ1me_WWp2VFclHi7KpieuFiBw4ynX8qMQTSDkuAvfyz0iANrMD8tFgJUnGRu443q6cIIXNAFVfpsgDCMZsJW2SejM1XTumym6rN_LjkkQWPyBkfgx5wr5cOu")' }}></div>
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-4xl text-primary pl-1">play_arrow</span>
                                    </div>
                                </div>
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white font-bold text-sm tracking-wide drop-shadow-md whitespace-nowrap">Preview this course</div>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-3xl font-bold text-slate-900 font-display">$89.99</span>
                                    <span className="text-lg text-slate-400 line-through decoration-1">$129.99</span>
                                    <span className="text-xs font-bold text-white bg-red-500 px-2 py-1 rounded">30% OFF</span>
                                </div>
                                <div className="flex flex-col gap-3 mb-6">
                                    <button className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded-lg transition-colors shadow-md shadow-primary/20 text-lg">
                                        Enroll Now
                                    </button>
                                </div>
                                <p className="text-xs text-center text-slate-500 mb-6 font-display">30-Day Money-Back Guarantee</p>
                                <div className="space-y-4">
                                    <h4 className="font-bold text-slate-900 text-sm font-display">This course includes:</h4>
                                    <ul className="space-y-3">
                                        {[
                                            { icon: 'ondemand_video', text: '14.5 hours on-demand video' },
                                            { icon: 'description', text: '5 articles' },
                                            { icon: 'download', text: '24 downloadable resources' },
                                            { icon: 'all_inclusive', text: 'Full lifetime access' },
                                            { icon: 'smartphone', text: 'Access on mobile and TV' },
                                            { icon: 'emoji_events', text: 'Certificate of completion' }
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                                                <span className="material-symbols-outlined text-[20px] text-slate-400">{item.icon}</span>
                                                <span className="font-display">{item.text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default CourseDetailsPage;
