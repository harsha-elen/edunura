'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';
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
    validity_period?: number | null;
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

interface Category {
    id: number;
    name: string;
    slug: string;
    parent_id?: number | null;
    tags_enabled?: boolean;
    tags?: string[] | string | null;
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

    const basePrice = parseFloat(course.price || '0');
    const discountedPrice = parseFloat(course.discounted_price || '0');
    const effectivePrice = !course.is_free && discountedPrice > 0 && basePrice > discountedPrice
        ? discountedPrice
        : basePrice;

    const validityDays = Number(course.validity_period || 0);
    const validityMonths = validityDays > 0 && validityDays % 30 === 0 ? validityDays / 30 : 0;
    const monthlyPriceLabel =
        !course.is_free && validityMonths >= 1
            ? `₹${(effectivePrice / validityMonths).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/month`
            : null;

    const headlinePrice = course.is_free
        ? 'Free'
        : monthlyPriceLabel || `₹${effectivePrice.toLocaleString('en-IN')}`;

    const originalPrice =
        !course.is_free &&
        !monthlyPriceLabel &&
        discountedPrice > 0 &&
        basePrice > discountedPrice
            ? `₹${basePrice.toLocaleString('en-IN')}`
            : null;

    return (
        <Link href={`/course-details?id=${course.id}`} className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-xl transition-all group flex flex-col h-full cursor-pointer">
            <div className="relative aspect-video overflow-hidden bg-slate-100">
                {thumbnailUrl ? (
                    <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        src={thumbnailUrl}
                        alt={course.title}
                        width={1920}
                        height={1080}
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
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div>
                        <span className="text-xl font-bold text-slate-900 font-display">{headlinePrice}</span>
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
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeParent, setActiveParent] = useState<Category | null>(null);
    const [activeChild, setActiveChild] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
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

    // Load available categories
    useEffect(() => {
        fetch(`${API_URL}/categories`)
            .then(r => r.json())
            .then(data => {
                if (data.status === 'success') {
                    const cats = Array.isArray(data.data) ? data.data : data.data?.categories || [];
                    setCategories(cats);
                }
            })
            .catch(() => {});
    }, []);

    const fetchCourses = useCallback(async (searchTerm: string, pageNum: number, categoryFilter: string | null, tagFilters: string[]) => {
        if (pageNum === 1) {
            setCourses([]); // Clear grid immediately when switching categories/searching
        }
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: String(pageNum),
                limit: String(LIMIT),
            });
            if (searchTerm.trim()) params.append('search', searchTerm.trim());
            if (categoryFilter) params.append('category', categoryFilter);
            if (tagFilters.length > 0) params.append('tags', tagFilters.join(','));

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

    const parentCategories = categories.filter(c => !c.parent_id);
    const childCategories = activeParent ? categories.filter(c => c.parent_id === activeParent.id) : [];
    const selectedCategoryFilter = activeChild ? activeChild.slug : (activeParent ? activeParent.slug : null);
    const selectedCategory = activeChild || activeParent;

    const availableTags = useMemo(() => {
        if (!selectedCategory || !selectedCategory.tags_enabled || !selectedCategory.tags) return [];

        let parsedTags: string[] = [];
        if (typeof selectedCategory.tags === 'string') {
            try {
                const decoded = JSON.parse(selectedCategory.tags);
                parsedTags = Array.isArray(decoded) ? decoded : [];
            } catch {
                parsedTags = [];
            }
        } else if (Array.isArray(selectedCategory.tags)) {
            parsedTags = selectedCategory.tags;
        }

        const cleaned = parsedTags
            .map((tag) => String(tag).trim())
            .filter((tag) => tag.length > 0);

        return Array.from(new Set(cleaned));
    }, [selectedCategory]);

    const handleParentClick = (cat: Category | null) => {
        setActiveParent(cat);
        setActiveChild(null); // Reset child when changing parent
        setSelectedTags([]);
    };

    const handleChildClick = (cat: Category | null) => {
        setActiveChild(cat);
        setSelectedTags([]);
    };

    useEffect(() => {
        setPage(1);
        fetchCourses(search, 1, selectedCategoryFilter, selectedTags);
    }, [search, selectedCategoryFilter, selectedTags, fetchCourses]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchCourses(search, nextPage, selectedCategoryFilter, selectedTags);
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
                                onClick={() => fetchCourses(search, 1, selectedCategoryFilter, selectedTags)}
                                className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-600 transition-colors text-sm"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Category Filter Pills - Parents Level */}
                    {parentCategories.length > 0 && (
                        <div className={`flex overflow-x-auto gap-2 snap-x hide-scrollbar ${childCategories.length > 0 ? 'pb-2' : 'pb-4 mb-2'}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <button
                                onClick={() => handleParentClick(null)}
                                className={`snap-start whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
                                    activeParent === null
                                        ? 'bg-primary text-white border-primary shadow-sm'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:bg-slate-50'
                                }`}
                            >
                                All Courses
                            </button>
                            {parentCategories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleParentClick(cat)}
                                    className={`snap-start whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
                                        activeParent?.id === cat.id
                                            ? 'bg-primary text-white border-primary shadow-sm'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:bg-slate-50'
                                    }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Category Filter Pills - Children Level (Contextual Sub-Nav) */}
                    {childCategories.length > 0 && (
                        <div className="flex overflow-x-auto pb-4 mb-2 gap-2 snap-x hide-scrollbar animate-in slide-in-from-top-2 fade-in duration-300" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <button
                                onClick={() => handleChildClick(null)}
                                className={`snap-start whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                                    activeChild === null
                                        ? 'bg-primary/10 text-primary border-primary/30'
                                        : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100'
                                }`}
                            >
                                All {activeParent?.name}
                            </button>
                            {childCategories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleChildClick(cat)}
                                    className={`snap-start whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                                        activeChild?.id === cat.id
                                            ? 'bg-primary/10 text-primary border-primary/30 shadow-sm'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-primary/30 hover:bg-slate-100'
                                    }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Tags + Course Content (under tabs) */}
                    <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-start">
                        {selectedCategory && availableTags.length > 0 && (
                            <aside className="lg:sticky lg:top-24 lg:w-64 lg:flex-shrink-0 rounded-xl border border-slate-200 bg-white p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <p className="text-sm font-semibold text-slate-800">Filter by tags</p>
                                    {selectedTags.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedTags([])}
                                            className="text-xs font-semibold text-primary hover:underline"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>

                                <p className="mb-3 text-xs text-slate-500">{selectedCategory.name}</p>

                                <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                                    {availableTags.map((tag) => {
                                        const isSelected = selectedTags.includes(tag);
                                        return (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedTags((prev) => (
                                                        prev.includes(tag) ? [] : [tag]
                                                    ));
                                                }}
                                                className={`w-full rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                                                    isSelected
                                                        ? 'border-primary bg-primary text-white shadow-sm'
                                                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-primary/30 hover:bg-slate-100'
                                                }`}
                                            >
                                                {tag}
                                            </button>
                                        );
                                    })}
                                </div>
                            </aside>
                        )}

                        <div className="min-w-0 flex-1">
                            {/* Course Grid */}
                            {!error && (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
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
                </div>
            </div>
        </main>
    );
};

export default CoursesPage;
