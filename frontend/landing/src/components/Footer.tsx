import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-secondary pt-16 pb-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            <div className="mx-auto max-w-7xl px-4 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <img alt="eduNura Logo" className="h-16 w-auto object-contain brightness-0 invert" src="/images/edunura-font-02.png" />
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed mb-6">
                            From anywhere to everywhere, EduNura brings education to your fingertips. We believe that true education is a journey of curiosity, clarity, and confidence.
                        </p>
                        <div className="flex gap-3">
                            <a className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8cdba] text-secondary hover:bg-primary hover:text-white transition-colors" href="#">
                                <span className="text-xs font-bold">f</span>
                            </a>
                            <a className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8cdba] text-secondary hover:bg-primary hover:text-white transition-colors" href="#">
                                <span className="text-xs font-bold">in</span>
                            </a>
                            <a className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8cdba] text-secondary hover:bg-primary hover:text-white transition-colors" href="#">
                                <span className="text-xs font-bold">ig</span>
                            </a>
                            <a className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8cdba] text-secondary hover:bg-primary hover:text-white transition-colors" href="#">
                                <span className="text-xs font-bold">x</span>
                            </a>
                            <a className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8cdba] text-secondary hover:bg-primary hover:text-white transition-colors" href="#">
                                <span className="material-symbols-outlined text-sm">play_arrow</span>
                            </a>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-6">Quick Links</h3>
                        <ul className="space-y-3 text-sm text-slate-300">
                            <li><a className="hover:text-primary transition-colors" href="#">About</a></li>
                            <li><a className="hover:text-primary transition-colors" href="#">Course</a></li>
                            <li><a className="hover:text-primary transition-colors" href="#">Instructor</a></li>
                            <li><a className="hover:text-primary transition-colors" href="#">Events</a></li>
                            <li><a className="hover:text-primary transition-colors" href="#">Instructor Details</a></li>
                            <li><a className="hover:text-primary transition-colors" href="#">Purchase Guide</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-6">Help & Support</h3>
                        <ul className="space-y-3 text-sm text-slate-300">
                            <li><a className="hover:text-primary transition-colors" href="#">Contact Us</a></li>
                            <li><a className="hover:text-primary transition-colors" href="#">Gallery</a></li>
                            <li><a className="hover:text-primary transition-colors" href="#">News & Articles</a></li>
                            <li><a className="hover:text-primary transition-colors" href="#">FAQ's</a></li>
                            <li><a className="hover:text-primary transition-colors" href="#">Coming Soon</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-6">Newsletter Subscription</h3>
                        <p className="text-sm text-slate-300 mb-4">Enter your email address to register to our newsletter subscription</p>
                        <div className="flex gap-2 mb-6">
                            <input className="w-full rounded bg-white px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Your email" type="email" />
                            <button className="bg-primary px-4 py-2 text-sm font-bold text-white rounded hover:bg-orange-600 transition-colors flex items-center gap-1">
                                Subscribe <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                        <div className="space-y-2 text-sm text-slate-300">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg text-primary">call</span>
                                <span>+91 9502331577</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-lg text-primary mt-1">mail</span>
                                <span>support@edunura.com</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-lg text-primary mt-1">location_on</span>
                                <span>Flat No. 401, 4th floor, Kolan Krishna Reddy Complex, Bachupally, Medchal-Malkajgiri district, Telangana - 500090.</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="border-t border-slate-800 pt-8 text-center">
                    <p className="text-[10px] text-slate-400">Copyright © 2025 Edunura. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
