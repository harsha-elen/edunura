'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const BACKEND_URL = API_URL.replace(/\/api\/?$/, '');

interface Course {
    id: number;
    title: string;
    slug: string;
    short_description: string | null;
    thumbnail: string | null;
    price: string;
    discounted_price: string;
    is_free: boolean;
    level: string;
    category: string;
    total_enrollments: number;
    rating: string | null;
    total_reviews: number;
    creator: {
        id: number;
        first_name: string;
        last_name: string;
        avatar: string | null;
    } | null;
}

interface CoursesResponse {
    status: string;
    data: {
        courses: Course[];
        total: number;
        page: number;
        pages: number;
    };
}

// ---- Skeleton Card ----
const SkeletonCard = () => (
    <div className="bg-white rounded-xl overflow-hidden border border-slate-200 opacity-70 flex flex-col h-full animate-pulse">
        <div className="relative aspect-video bg-slate-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-300 text-4xl">image</span>
        </div>
        <div className="p-5 flex flex-col flex-1">
            <div className="h-3 w-20 bg-slate-100 rounded mb-3"></div>
            <div className="h-5 w-full bg-slate-100 rounded mb-2"></div>
            <div className="h-5 w-2/3 bg-slate-100 rounded mb-4"></div>
            <div className="h-3 w-full bg-slate-100 rounded mb-1"></div>
            <div className="h-3 w-4/5 bg-slate-100 rounded mb-6"></div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                <div className="h-6 w-16 bg-slate-100 rounded"></div>
                <div className="h-10 w-24 bg-slate-100 rounded-lg"></div>
            </div>
        </div>
    </div>
);

// ---- Course Card ----
const CourseCard = ({ course, siteName }: { course: Course; siteName: string }) => {
    const instructorName = siteName ? `by ${siteName} Team` : 'Instructor';

    const instructorAvatar = course.creator?.avatar
        ? `${BACKEND_URL}${course.creator.avatar.startsWith('/') ? '' : '/'}${course.creator.avatar}`
        : null;

    const thumbnailUrl = course.thumbnail
        ? `${BACKEND_URL}${course.thumbnail.startsWith('/') ? '' : '/'}${course.thumbnail}`
        : null;

    const displayPrice = course.is_free
        ? 'Free'
        : course.discounted_price && parseFloat(course.discounted_price) > 0
            ? `₹${parseFloat(course.discounted_price).toLocaleString('en-IN')}`
            : `₹${parseFloat(course.price).toLocaleString('en-IN')}`;

    const originalPrice =
        !course.is_free &&
        course.discounted_price &&
        parseFloat(course.discounted_price) > 0 &&
        parseFloat(course.price) > parseFloat(course.discounted_price)
            ? `₹${parseFloat(course.price).toLocaleString('en-IN')}`
            : null;

    return (
        <Link href={`/course-details?id=${course.id}`} className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-xl transition-all group flex flex-col h-full cursor-pointer">
            <div className="relative aspect-video overflow-hidden bg-slate-100">
                {thumbnailUrl ? (
                    <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        src={thumbnailUrl}
                        alt={course.title}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
                        <span className="material-symbols-outlined text-primary/40 text-6xl">school</span>
                    </div>
                )}
                {course.is_free && (
                    <div className="absolute top-3 right-3">
                        <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm">Free</span>
                    </div>
                )}
            </div>
            <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded uppercase font-display">
                        {course.category}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">{course.level}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors font-display">
                    {course.title}
                </h3>
                {course.short_description && (
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">{course.short_description}</p>
                )}
                {course.rating && parseFloat(course.rating) > 0 && (
                    <div className="flex items-center gap-1 mb-3">
                        <span className="text-yellow-500 font-bold text-sm">{parseFloat(course.rating).toFixed(1)}</span>
                        <div className="flex text-yellow-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <span key={s} className="material-symbols-outlined text-[13px]">star</span>
                            ))}
                        </div>
                        <span className="text-slate-400 text-xs">({course.total_reviews})</span>
                    </div>
                )}
                <div className="flex items-center gap-2 mt-auto mb-4">
                    {instructorAvatar ? (
                        <img className="w-7 h-7 rounded-full object-cover border border-slate-100" src={instructorAvatar} alt={siteName} />
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-primary text-xs font-bold">E</span>
                        </div>
                    )}
                    <span className="text-xs font-medium text-slate-600 font-display">{instructorName}</span>
                    {course.total_enrollments > 0 && (
                        <span className="text-xs text-slate-400 ml-auto">{course.total_enrollments.toLocaleString()} enrolled</span>
                    )}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div>
                        <span className="text-xl font-bold text-slate-900 font-display">{displayPrice}</span>
                        {originalPrice && (
                            <span className="text-xs text-slate-400 line-through ml-2 font-display">{originalPrice}</span>
                        )}
                    </div>
                    <span className="bg-primary/10 text-primary font-bold px-4 py-2 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors text-sm border border-primary/20 font-display">
                        View Course
                    </span>
                </div>
            </div>
        </Link>
    );
};

// ---- Main Page ----
const CoursesPage = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [siteName, setSiteName] = useState('Edunura');
    const LIMIT = 12;

    // Load site name from settings API
    useEffect(() => {
        fetch(`${API_URL}/settings`)
            .then(r => r.json())
            .then(data => {
                const name = data?.data?.site_name;
                if (name) setSiteName(name);
            })
            .catch(() => {});
    }, []);

    const fetchCourses = useCallback(async (searchTerm: string, pageNum: number) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: String(pageNum),
                limit: String(LIMIT),
            });
            if (searchTerm.trim()) params.append('search', searchTerm.trim());

            const res = await fetch(`${API_URL}/courses/public?${params.toString()}`);
            if (!res.ok) throw new Error(`Failed to fetch courses (${res.status})`);

            const json: CoursesResponse = await res.json();
            if (json.status !== 'success') throw new Error('Unexpected response from server');

            if (pageNum === 1) {
                setCourses(json.data.courses);
            } else {
                setCourses((prev) => [...prev, ...json.data.courses]);
            }
            setTotal(json.data.total);
            setTotalPages(json.data.pages);
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setPage(1);
        fetchCourses(search, 1);
    }, [search, fetchCourses]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchCourses(search, nextPage);
    };

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Content Area */}
                <div className="flex-1">
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                        <div className="relative w-full md:w-96">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-shadow outline-none shadow-sm text-sm"
                                placeholder="Search courses..."
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="hidden">Search</button>
                        {total > 0 && !loading && (
                            <p className="text-sm text-slate-500 whitespace-nowrap">
                                {total} course{total !== 1 ? 's' : ''} found
                            </p>
                        )}
                    </form>

                    {/* Error State */}
                    {error && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <span className="material-symbols-outlined text-red-400 text-5xl mb-4">error</span>
                            <p className="text-red-500 font-semibold mb-2">Failed to load courses</p>
                            <p className="text-slate-400 text-sm mb-6">{error}</p>
                            <button
                                onClick={() => fetchCourses(search, 1)}
                                className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-600 transition-colors text-sm"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Course Grid */}
                    {!error && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {courses.map((course) => (
                                <CourseCard key={course.id} course={course} siteName={siteName} />
                            ))}
                            {loading && Array.from({ length: page === 1 ? 6 : 3 }).map((_, i) => (
                                <SkeletonCard key={`skeleton-${i}`} />
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && !error && courses.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <span className="material-symbols-outlined text-slate-300 text-7xl mb-4">school</span>
                            <h3 className="text-xl font-bold text-slate-700 mb-2">No courses found</h3>
                            <p className="text-slate-400 text-sm">
                                {search
                                    ? `No results for "${search}". Try a different search.`
                                    : 'No published courses available yet. Check back soon!'}
                            </p>
                            {search && (
                                <button
                                    onClick={() => { setSearchInput(''); setSearch(''); }}
                                    className="mt-4 text-primary font-bold text-sm hover:underline"
                                >
                                    Clear search
                                </button>
                            )}
                        </div>
                    )}

                    {/* Load More */}
                    {!loading && !error && courses.length > 0 && page < totalPages && (
                        <div className="mt-12 flex flex-col items-center gap-4">
                            <button
                                onClick={handleLoadMore}
                                className="bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all px-12 py-3 rounded-xl font-bold text-lg shadow-sm font-display"
                            >
                                Load More Courses
                            </button>
                            <p className="text-slate-500 text-sm italic">
                                Showing {courses.length} of {total} courses
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default CoursesPage;
