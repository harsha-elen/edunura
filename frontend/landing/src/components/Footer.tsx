import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 lg:col-span-1">
                        <div className="flex items-center mb-6">
                            <img src="/images/logo.png" alt="EduFlow Logo" className="h-14 w-auto object-contain" />
                        </div>
                        <p className="text-slate-500 mb-6">Empowering learners worldwide through high-quality online education and professional development.</p>
                        <div className="flex gap-4">
                            <a className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" href="#">
                                <span className="material-icons text-lg">facebook</span>
                            </a>
                            <a className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" href="#">
                                <span className="material-icons text-lg">alternate_email</span>
                            </a>
                            <a className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" href="#">
                                <span className="material-icons text-lg">public</span>
                            </a>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 mb-6">Platform</h4>
                        <ul className="space-y-4">
                            <li><a className="text-slate-500 hover:text-primary transition-colors" href="#">Courses</a></li>
                            <li><a className="text-slate-500 hover:text-primary transition-colors" href="#">Learning Paths</a></li>
                            <li><a className="text-slate-500 hover:text-primary transition-colors" href="#">Mentors</a></li>
                            <li><a className="text-slate-500 hover:text-primary transition-colors" href="#">Certifications</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 mb-6">Company</h4>
                        <ul className="space-y-4">
                            <li><a className="text-slate-500 hover:text-primary transition-colors" href="/about">About Us</a></li>
                            <li><a className="text-slate-500 hover:text-primary transition-colors" href="/contact">Contact</a></li>
                            <li><a className="text-slate-500 hover:text-primary transition-colors" href="#">Careers</a></li>
                            <li><a className="text-slate-500 hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 mb-6">Join Newsletter</h4>
                        <p className="text-slate-500 mb-4 text-sm">Stay updated with the latest courses and learning resources.</p>
                        <form className="space-y-3">
                            <input className="w-full bg-background-light border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Enter your email" type="email" />
                            <button className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20" type="button">
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>
                <div className="pt-8 border-t border-slate-200 text-center">
                    <p className="text-slate-400 text-sm">© 2024 EduFlow Learning Management System. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
