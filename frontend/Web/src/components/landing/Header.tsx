'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const Header = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white px-4 sm:px-6 lg:px-8 shadow-sm">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between">
                <Link href="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
                    <img alt="eduNura Logo" className="h-14 sm:h-16 lg:h-20 w-auto object-contain" src="/images/edunura-font-02.png" />
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-8">
                    <a className="text-sm font-medium text-primary transition-colors" href="/">Home</a>
                    <a className="text-sm font-medium text-secondary hover:text-primary transition-colors" href="/#brand-philosophy" style={{ scrollBehavior: 'smooth' }}>About Us</a>
                    <a className="text-sm font-medium text-secondary hover:text-primary transition-colors" href="/courses">Courses</a>
                    <a className="text-sm font-medium text-secondary hover:text-primary transition-colors" href="/contact">Contact Us</a>
                </nav>

                {/* Right Section */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="relative hidden lg:block">
                        <input className="h-10 w-48 rounded-md border border-slate-200 pl-4 pr-10 text-sm focus:border-primary focus:ring-primary" placeholder="Search" type="text" />
                        <span className="material-symbols-outlined absolute right-3 top-2.5 text-lg text-slate-400">search</span>
                    </div>
                    <a href="/login" className="hidden sm:inline-flex items-center h-10 rounded-md bg-primary px-4 lg:px-6 text-sm font-semibold text-white hover:bg-orange-600 transition-colors whitespace-nowrap">
                        Login
                    </a>
                    {/* Mobile Menu Toggle */}
                    <button onClick={toggleMobileMenu} className="lg:hidden p-2 text-secondary hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
                <div className="lg:hidden border-t border-slate-100 bg-white">
                    <nav className="flex flex-col divide-y divide-slate-100 py-2">
                        <a 
                            href="/" 
                            onClick={closeMobileMenu}
                            className="px-4 py-3 text-sm font-medium text-primary hover:bg-slate-50 transition-colors"
                        >
                            Home
                        </a>
                        <a 
                            href="/#brand-philosophy" 
                            onClick={closeMobileMenu}
                            className="px-4 py-3 text-sm font-medium text-secondary hover:text-primary hover:bg-slate-50 transition-colors"
                        >
                            About Us
                        </a>
                        <a 
                            href="/courses" 
                            onClick={closeMobileMenu}
                            className="px-4 py-3 text-sm font-medium text-secondary hover:text-primary hover:bg-slate-50 transition-colors"
                        >
                            Courses
                        </a>
                        <a 
                            href="/contact" 
                            onClick={closeMobileMenu}
                            className="px-4 py-3 text-sm font-medium text-secondary hover:text-primary hover:bg-slate-50 transition-colors"
                        >
                            Contact Us
                        </a>
                        <div className="relative px-4 py-3">
                            <input 
                                className="w-full h-10 rounded-md border border-slate-200 pl-4 pr-10 text-sm focus:border-primary focus:ring-primary" 
                                placeholder="Search" 
                                type="text" 
                            />
                            <span className="material-symbols-outlined absolute right-7 top-5 text-lg text-slate-400">search</span>
                        </div>
                        <a 
                            href="/login" 
                            onClick={closeMobileMenu}
                            className="block sm:hidden px-4 py-3 text-sm font-semibold text-white bg-primary hover:bg-orange-600 text-center transition-colors mx-4 mb-2 rounded-md"
                        >
                            Login
                        </a>
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;
