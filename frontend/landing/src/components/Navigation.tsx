import React from 'react';

const Navigation = () => {
    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-primary/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex items-center">
                        <img src="/images/logo.png" alt="EduFlow Logo" className="h-16 w-auto object-contain" />
                    </div>
                    <div className="hidden md:flex items-center space-x-8">
                        <a className="font-medium text-slate-600 hover:text-primary transition-colors" href="/">Home</a>
                        <a className="font-medium hover:text-primary transition-colors" href="/courses">Courses</a>
                        <a className="font-medium text-primary" href="/about">About Us</a>
                        <a className="font-medium hover:text-primary transition-colors" href="/contact">Contact</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="hidden sm:block font-medium text-slate-600 hover:text-primary transition-colors">Login</button>
                        <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-primary/20">
                            Get Started
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;
