import React from 'react';
import Link from 'next/link';

const CoursesPage = () => {
    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Promo Banner */}
            <div className="mb-8 relative overflow-hidden rounded-xl bg-primary px-6 py-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-full">
                        <span className="material-symbols-outlined text-white">local_offer</span>
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-lg">Start Learning Today - 20% off for new students!</h2>
                        <p className="text-white/80 text-sm">Unlock access to over 500+ professional courses.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="bg-white/20 border border-white/30 text-white px-4 py-2 rounded-lg font-mono font-bold tracking-widest uppercase text-xs">LEARN20</span>
                    <button className="bg-white text-primary px-6 py-2 rounded-lg font-bold hover:bg-slate-50 transition-colors text-sm">Claim Now</button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filters */}
                <aside className="w-full lg:w-72 flex-shrink-0">
                    <div className="lg:sticky lg:top-24 space-y-8 bg-white p-6 rounded-xl border border-primary/5 shadow-sm">
                        <div>
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 border-none font-display">
                                <span className="material-symbols-outlined text-primary text-xl">filter_alt</span>
                                Filters
                            </h3>
                            <div className="space-y-6">
                                {/* Topic */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 block font-display">Topic</label>
                                    <div className="space-y-2">
                                        {['Technology', 'Business', 'Creative Arts', 'Health & Wellness'].map((topic, i) => (
                                            <label key={topic} className="flex items-center gap-3 cursor-pointer group">
                                                <input defaultChecked={i === 0} className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" />
                                                <span className="text-slate-600 group-hover:text-primary transition-colors text-sm">{topic}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                {/* Level */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 block font-display">Level</label>
                                    <div className="space-y-2">
                                        {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                                            <label key={level} className="flex items-center gap-3 cursor-pointer group">
                                                <input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" />
                                                <span className="text-slate-600 group-hover:text-primary transition-colors text-sm">{level}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                {/* Price Range */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 block font-display">Price Range</label>
                                    <div className="space-y-2">
                                        {['Free', 'Paid', 'Subscription Included'].map((price, i) => (
                                            <label key={price} className="flex items-center gap-3 cursor-pointer group">
                                                <input defaultChecked={i === 1} className="rounded-full border-slate-300 text-primary focus:ring-primary h-4 w-4" name="price" type="radio" />
                                                <span className="text-slate-600 group-hover:text-primary transition-colors text-sm">{price}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button className="mt-8 w-full py-2 border border-slate-200 rounded-lg text-slate-500 hover:text-primary hover:border-primary transition-all text-sm font-medium">Clear All Filters</button>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1">
                    {/* Search and Sorting */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                        <div className="relative w-full md:w-96">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-shadow outline-none shadow-sm text-sm" placeholder="Search courses, instructors, topics..." type="text" />
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <span className="text-sm text-slate-500 whitespace-nowrap">Sort by:</span>
                            <div className="relative w-full md:w-48">
                                <select className="w-full bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-1 focus:ring-primary appearance-none pr-10">
                                    <option>Most Popular</option>
                                    <option>Newest First</option>
                                    <option>Price: Low to High</option>
                                    <option>Price: High to Low</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                            </div>
                        </div>
                    </div>

                    {/* Course Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {/* Course Cards */}
                        <CourseCard
                            title="Advanced Web Development Bootcamp 2024"
                            category="Development"
                            instructor="Alex Thompson"
                            instructorImg="https://lh3.googleusercontent.com/aida-public/AB6AXuCO33a2J6CPOLvjjSTcNlVD6DMYoT2f_Pxc8TWU-MLAK82tcOipW3hkscLbdNgIQU55OVg-v__hUI36OxW5LpaCV4WU4mncJx5lkWFdAr4ApWLNMa2INPFtX3SLow2BELwvDFwW-L860249AmuErCF5q_03P-GtNwB_D2BLlA9ZDGB9AuOtSIozTv5uLVYk9W4tXzNHYhMXqrjLCBtgfB4WtyU9Bi8gC9Vz0JXId1XKVkNQlgyWTn8lsdzhG1Yq0BpkGDKxLAWIlcEs"
                            price="$89.99"
                            oldPrice="$120.00"
                            tag="Bestseller"
                            image="https://lh3.googleusercontent.com/aida-public/AB6AXuB65iw-vaZ1fLIG4b5gZWCQz8Lre5YomCuISdrrEBSqbzgIP2NVFeN3Oiw1nfNp6JDY0AKIvKy0O6WFlobFugriW4bJPpeql70QgV5tq7XgiiLipol3P2D7zI0yj6S8R66j1SPTAt9NXNH-CCrNJMCaOlqf3X_V1ksdesiYN_-7ZJYU3zY0h3UtPDIC4yXYDKIa2n25n3etsN4ZCCx5Dat7J_tcgh8TJtnd82ndTAI9_7ochxarefda_JbANyzDefZI33xIG5u6Zo0k"
                            description="Master React, Node.js, and Tailwind CSS while building 10+ real-world production projects."
                        />
                        <CourseCard
                            title="Digital Marketing Strategy Masterclass"
                            category="Marketing"
                            instructor="Sarah Jenkins"
                            instructorImg="https://lh3.googleusercontent.com/aida-public/AB6AXuBNMRoXXLD9S__Ktuih3gR7u5YmXKqjo8EdbNt09fy9sdFpyCfG96KmmExp4oIHCY7wWtnLqLSJKjqhqldEfqBQNxGryGTHKPZQJH2YNGOuAsQfYDMjYVCrVPlCI-Ff-449sMKD17RKhuQxJjVPrDEzlBQGJDrkmblngTyPW6x6iQtgURhLtLtsYPdj_8n8UOysqwyLUxc5_KLjPW5xBGlNbZAfFdyCWl9AvaLbRgX17CB1Zeiud8HoO1-DYyH8DtDu35IwDQ017v4T"
                            price="$49.99"
                            tag="Certificate"
                            tagColor="bg-green-500"
                            image="https://lh3.googleusercontent.com/aida-public/AB6AXuB3TNqurclHBjDVViRbf8usnWx2OozoytImqFY3JxcbkL-J6t6BbLAUkJp178XfRvCUOU4C_ZQVkllIZRyXlcLH9u2LmAxdykdMbGpwslrVUKaWgjxlgudVV9DXIgh2m31VAgc8FynXZ6xP76hRL32f2fdvBMQ-PdVteu2BPEbOjzUASr7q7iGj8tokEHh5w6UlhjnHVO9dQXyuC8m1sBIY03XnmElNAqfo7Qb_Hhfb_mb3o5Uy8KLENu_YNNh4D3dL4dcFCiTtqN4d"
                            description="Learn to grow your brand through SEO, SEM, and advanced social media automation tactics."
                        />
                        <CourseCard
                            title="UI/UX Design Fundamentals"
                            category="Design"
                            instructor="Marcus Lee"
                            instructorImg="https://lh3.googleusercontent.com/aida-public/AB6AXuDcBrxysjEY6uW-OCeQNsrG0AR4j0x2LqZ4ZVTuOJ6H6Fk75qbFX47Nfl592vNKG33bRyI6OOf7u9fHfkxycDWcTvLUF-tY97FBHdBg6VJK1NC4fXo_R5HzoB1MKKdcOCJbOlhtoDMRWpR1Hkr35Wj3NnxD-XwloJktsAx4QpbW4wZQslc-rlHt_xrMhsCfY_LJvm6JnYlo1syUFDdEtRo5UHVHYWYEt_6ziw37dLOCxi7TGo3xQbpNvHxD8onLT_Vz2_sCsByTMbCK"
                            price="$54.99"
                            image="https://lh3.googleusercontent.com/aida-public/AB6AXuCQgqWQYEpSS3aKDrzUluuIgdEWO7L0Z43kWaT_elgVL1DD4ad961ZLK2AJqF3zlgm2sq1s_egfVnn2-zPoRfv5mt4Ds-6faM33T-ncUycIT9J4FIV1AxukWT5zSC9PfBxoT493JRgbDdjBylL8NxJHTrZOiQ8Il8qWErjbI7RBB_GTGK6RJ9ai8VPkJfaGOAEM8IZdtkD6K8-hDav33TCN3zBnIsQELHB_FyCb_8SiaKxIZBhf5t22x5LRJeqM2PZ0RQVYXksJ1mzm"
                            description="From wireframes to high-fidelity prototypes. Master Figma and Adobe XD in this practical course."
                        />
                        <CourseCard
                            title="Python for Data Analysis & Visualization"
                            category="Data Science"
                            instructor="Dr. Emily Chen"
                            instructorImg="https://lh3.googleusercontent.com/aida-public/AB6AXuBzj7xXcREcpuZiYIs1wFTWnYdwAlMEpspa0RTrBpWIJp33tSK3Kbuu1yUy_B7Z_Pa1IdOP_EIsQJqKHmW61MRqV_d1tJvh4P5xOGxW22oWX2fo_4DQZHBiCkPZnyZR3IpBx7Yg0GW7DkUocDS5VoQeSdXxCMPdNXX1gVLdvTCXZqWZ-_DQreI4DXJfn_nF71NIUKgn0vXi1FYsA_EXykitlNJC3ZTyfQLVSXUzkfa2st1Y8kaYukkAnS1Tw2vRi0umb-0SSe-OnU5k"
                            price="$74.99"
                            tag="New"
                            tagColor="bg-amber-500"
                            image="https://lh3.googleusercontent.com/aida-public/AB6AXuBjla-2i6l7_3b3fO9F1KnCMhTNgJWLfPqNBm81eIUe6KSYWWukscbcY5gxI7gaQ4naLV0NLIoE_phddWt297UK-Lt7zRMBVCxNYORPE1eP-7Biv2Ceu0uzpSRARP9ir3cD8qoeqUz4-MRtX4oHVr9Hm8fJW8pDsTmZlIexck25wJCHEzzzIBfmpSIBw50OWtMpOqMJf9Q0FSj_7LNcLlXKDP5YmQ7nTydfIlMoVyqjx2kfbtZJ7-ocyl1bCmY2MZ8bDH_eJ5dxYVSi"
                            description="Learn Pandas, Matplotlib, and Scikit-Learn to turn raw data into actionable insights."
                        />
                        {/* Skeleton Card Example */}
                        <div className="bg-white rounded-xl overflow-hidden border border-slate-200 opacity-60 flex flex-col h-full">
                            <div className="relative aspect-video bg-slate-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-slate-300 animate-pulse text-4xl">image</span>
                            </div>
                            <div className="p-5 flex flex-col flex-1">
                                <div className="h-3 w-20 bg-slate-100 rounded animate-pulse mb-3"></div>
                                <div className="h-5 w-full bg-slate-100 rounded animate-pulse mb-2"></div>
                                <div className="h-5 w-2/3 bg-slate-100 rounded animate-pulse mb-4"></div>
                                <div className="h-3 w-full bg-slate-100 rounded animate-pulse mb-1"></div>
                                <div className="h-3 w-full bg-slate-100 rounded animate-pulse mb-6"></div>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                                    <div className="h-6 w-16 bg-slate-100 rounded animate-pulse"></div>
                                    <div className="h-10 w-24 bg-slate-100 rounded-lg animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="mt-12 flex flex-col items-center gap-4">
                        <button className="bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all px-12 py-3 rounded-xl font-bold text-lg shadow-sm font-display">
                            Load More Courses
                        </button>
                        <p className="text-slate-500 text-sm italic">Showing 4 of 542 courses available</p>
                    </div>
                </div>
            </div>
        </main>
    );
};

const CourseCard = ({ title, category, instructor, instructorImg, price, oldPrice, tag, tagColor = 'bg-primary', image, description }: any) => (
    <div className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-xl transition-all group flex flex-col h-full">
        <div className="relative aspect-video overflow-hidden">
            <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src={image} alt={title} />
            {tag && (
                <div className="absolute top-3 right-3">
                    <span className={`${tagColor} text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm font-display`}>{tag}</span>
                </div>
            )}
        </div>
        <div className="p-5 flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded uppercase font-display">{category}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors font-display">{title}</h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{description}</p>
            <div className="flex items-center gap-2 mb-6 mt-auto">
                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-100">
                    <img className="w-full h-full object-cover font-display" src={instructorImg} alt={instructor} />
                </div>
                <span className="text-xs font-medium text-slate-600 font-display">{instructor}</span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div>
                    <span className="text-xl font-bold text-slate-900 font-display">{price}</span>
                    {oldPrice && <span className="text-xs text-slate-400 line-through ml-1 font-display">{oldPrice}</span>}
                </div>
                <Link href="/course-details" className="bg-primary/10 text-primary font-bold px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors text-sm border border-primary/20 font-display">Enroll</Link>
            </div>
        </div>
    </div>
);

export default CoursesPage;
