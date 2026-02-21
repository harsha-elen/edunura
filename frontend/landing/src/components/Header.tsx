import React from 'react';
import Link from 'next/link';

const Header = () => {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white px-4 sm:px-6 lg:px-8 shadow-sm">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <img alt="eduNura Logo" className="h-16 sm:h-20 w-auto object-contain" src="/images/edunura-font-02.png" />
                </Link>
                <nav className="hidden lg:flex items-center gap-8">
                    <a className="text-sm font-medium text-primary transition-colors" href="/">Home</a>
                    <a className="text-sm font-medium text-secondary hover:text-primary transition-colors" href="/about">About Us</a>
                    <a className="text-sm font-medium text-secondary hover:text-primary transition-colors" href="/courses">Courses</a>
                    <a className="text-sm font-medium text-secondary hover:text-primary transition-colors" href="/contact">Contact Us</a>
                </nav>
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="relative hidden lg:block">
                        <input className="h-10 w-48 rounded-md border border-slate-200 pl-4 pr-10 text-sm focus:border-primary focus:ring-primary" placeholder="Search" type="text" />
                        <span className="material-symbols-outlined absolute right-3 top-2.5 text-lg text-slate-400">search</span>
                    </div>
                    <div className="relative cursor-pointer">
                        <span className="material-symbols-outlined text-secondary">shopping_cart</span>
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">0</span>
                    </div>
                    <button className="hidden sm:block h-10 rounded-md bg-primary px-4 lg:px-6 text-sm font-semibold text-white hover:bg-orange-600 transition-colors whitespace-nowrap">
                        Enroll Now
                    </button>
                    {/* Mobile Menu Toggle (Simplified) */}
                    <button className="lg:hidden p-2 text-secondary">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
