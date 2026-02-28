'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const VideoPlayer = dynamic(() => import('../../components/VideoPlayer'), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const BACKEND_URL = API_URL.replace(/\/api\/?$/, '');
const STUDENT_APP_URL = process.env.NEXT_PUBLIC_STUDENT_APP_URL || 'http://localhost:3003';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Lesson {
    id: number;
    title: string;
    content_type: 'video' | 'quiz' | 'text' | 'document' | 'live';
    duration?: number;
    order: number;
    is_free_preview: boolean;
}
interface Section {
    id: number;
    title: string;
    order: number;
    lessons: Lesson[];
}
interface Creator {
    id: number;
    first_name: string;
    last_name: string;
    avatar: string | null;
}
interface CourseDetail {
    id: number;
    title: string;
    slug: string;
    description: string;
    short_description?: string;
    thumbnail?: string;
    intro_video?: string;
    price: string;
    discounted_price?: string;
    is_free: boolean;
    level: string;
    category?: string;
    total_enrollments: number;
    rating?: number;
    total_reviews: number;
    outcomes?: string[];
    prerequisites?: string[];
    enable_certificate?: boolean;
    duration_hours?: number;
    updated_at?: string;
    creator?: Creator;
    sections?: Section[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function assetUrl(p?: string | null): string | null {
    if (!p) return null;
    return `${BACKEND_URL}${p.startsWith('/') ? '' : '/'}${p}`;
}
function fmtPrice(p: string) {
    return `₹${parseFloat(p).toLocaleString('en-IN')}`;
}
function lessonIcon(t: Lesson['content_type']) {
    return ({ video: 'play_circle', quiz: 'quiz', text: 'article', document: 'description', live: 'sensors' })[t] ?? 'play_circle';
}
function fmtDuration(mins?: number) {
    if (!mins) return '';
    const h = Math.floor(mins / 60), m = mins % 60;
    return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}
function sectionsTotal(sections: Section[]) {
    return sections.flatMap(s => s.lessons).reduce((a, l) => a + (l.duration ?? 0), 0);
}
function totalLessons(sections: Section[]) {
    return sections.flatMap(s => s.lessons).length;
}
function sectionDuration(s: Section) {
    return s.lessons.reduce((a, l) => a + (l.duration ?? 0), 0);
}
function starFill(i: number, r: number) {
    if (r >= i + 1) return 'star';
    if (r >= i + 0.5) return 'star_half';
    return 'star_border';
}
// Safely coerce a DB value that may arrive as a JSON string or already-parsed array
function toArray<T>(v: T[] | string | undefined | null): T[] {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    try { const p = JSON.parse(v as string); return Array.isArray(p) ? p : []; } catch { return []; }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonDetail = () => (
    <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
            <div className="lg:col-span-2 space-y-8">
                <div className="h-80 bg-slate-200 rounded-xl" />
                <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-4">
                    <div className="h-6 w-48 bg-slate-200 rounded" />
                    <div className="grid md:grid-cols-2 gap-3">
                        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-4 bg-slate-200 rounded" />)}
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-3">
                    <div className="h-6 w-48 bg-slate-200 rounded" />
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-lg" />)}
                </div>
            </div>
            <div className="lg:col-span-1">
                <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
                    <div className="h-48 bg-slate-200" />
                    <div className="p-6 space-y-4">
                        <div className="h-8 w-32 bg-slate-200 rounded" />
                        <div className="h-12 bg-slate-200 rounded-lg" />
                        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-4 bg-slate-100 rounded" />)}
                    </div>
                </div>
            </div>
        </div>
    </main>
);

// ── Section accordion ─────────────────────────────────────────────────────────
const SectionAccordion = ({ section, defaultOpen }: { section: Section; defaultOpen: boolean }) => (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
        <details className="group" open={defaultOpen}>
            <summary className="flex items-center justify-between p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors list-none select-none">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-500 transition-transform group-open:rotate-180">expand_more</span>
                    <span className="font-bold text-slate-900">{section.title}</span>
                </div>
                <span className="text-xs text-slate-500 font-medium font-display shrink-0">
                    {section.lessons.length} lecture{section.lessons.length !== 1 ? 's' : ''}
                    {sectionDuration(section) ? ` • ${fmtDuration(sectionDuration(section))}` : ''}
                </span>
            </summary>
            <div className="bg-white">
                {section.lessons.map((lesson, idx) => (
                    <div key={lesson.id} className={`flex items-center justify-between py-3 px-6 hover:bg-slate-50 transition-colors ${idx < section.lessons.length - 1 ? 'border-b border-slate-100' : ''}`}>
                        <div className="flex items-center gap-3 text-sm">
                            <span className="material-symbols-outlined text-[18px] text-slate-400">{lessonIcon(lesson.content_type)}</span>
                            <span className={lesson.is_free_preview ? 'text-primary hover:underline cursor-pointer' : 'text-slate-700'}>
                                {lesson.title}
                            </span>
                            {lesson.is_free_preview && (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500">Preview</span>
                            )}
                        </div>
                        {lesson.duration ? <span className="text-xs text-slate-500 shrink-0">{fmtDuration(lesson.duration)}</span> : null}
                    </div>
                ))}
                {section.lessons.length === 0 && (
                    <p className="px-6 py-4 text-sm text-slate-400">No lessons in this section yet.</p>
                )}
            </div>
        </details>
    </div>
);

// ── Page content (needs useSearchParams) ──────────────────────────────────────
const CourseDetailsContent = () => {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [videoOpen, setVideoOpen] = useState(false);

    const fetchCourse = useCallback(async () => {
        if (!id) { setError('No course ID provided.'); setLoading(false); return; }
        try {
            setLoading(true); setError(null);
            const res = await fetch(`${API_URL}/courses/public/${id}`);
            const json = await res.json();
            if (!res.ok || json.status !== 'success') setError(json.message || 'Course not found.');
            else setCourse(json.data);
        } catch { setError('Failed to load course. Please try again.'); }
        finally { setLoading(false); }
    }, [id]);

    useEffect(() => { fetchCourse(); }, [fetchCourse]);

    const thumbUrl = assetUrl(course?.thumbnail);
    const avatarUrl = assetUrl(course?.creator?.avatar);
    const instructorName = course?.creator ? `${course.creator.first_name} ${course.creator.last_name}` : 'Instructor';
    const rating = course?.rating ?? 0;
    const sections = toArray(course?.sections);
    const discountPct = course && !course.is_free && course.discounted_price && parseFloat(course.discounted_price) > 0 && parseFloat(course.price) > 0
        ? Math.round((1 - parseFloat(course.discounted_price) / parseFloat(course.price)) * 100) : 0;
    const displayPrice = !course ? '' : course.is_free ? 'Free' : course.discounted_price && parseFloat(course.discounted_price) > 0 ? fmtPrice(course.discounted_price) : fmtPrice(course.price);
    const originalPrice = !course || course.is_free ? '' : (course.discounted_price && parseFloat(course.discounted_price) > 0 ? fmtPrice(course.price) : '');

    return (
        <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 md:px-8 py-6">
            {/* Loading */}
            {loading && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="h-80 bg-slate-200 rounded-xl" />
                        <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-4">
                            <div className="h-6 w-48 bg-slate-200 rounded" />
                            <div className="grid md:grid-cols-2 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-4 bg-slate-200 rounded" />)}</div>
                        </div>
                        <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-3">
                            <div className="h-6 w-48 bg-slate-200 rounded" />
                            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-lg" />)}
                        </div>
                    </div>
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
                            <div className="h-48 bg-slate-200" />
                            <div className="p-6 space-y-4">
                                <div className="h-8 w-32 bg-slate-200 rounded" />
                                <div className="h-12 bg-slate-200 rounded-lg" />
                                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-4 bg-slate-100 rounded" />)}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="text-center py-24">
                    <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 block">error_outline</span>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <button onClick={fetchCourse} className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors">Try Again</button>
                </div>
            )}

            {/* Content */}
            {!loading && !error && course && (
                <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative items-start">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Hero */}
                        <div className="relative overflow-hidden rounded-xl bg-slate-900 text-white">
                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40 z-10" />
                            {thumbUrl
                                ? <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${thumbUrl}")` }} />
                                : <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />}
                            <div className="relative z-20 p-8 md:p-10 flex flex-col gap-4 h-full justify-end min-h-[320px]">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    {course.category && <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">{course.category}</span>}
                                    {course.level && <span className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded capitalize">{course.level}</span>}
                                    {course.updated_at && <span className="text-slate-300 text-xs font-medium">Updated {new Date(course.updated_at).toLocaleString('en-IN', { month: 'short', year: 'numeric' })}</span>}
                                </div>
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight font-display">{course.title}</h1>
                                <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-white/10">
                                    {rating > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-yellow-400 font-bold text-lg">{rating.toFixed(1)}</span>
                                            <div className="flex text-yellow-400">{[0,1,2,3,4].map(i => <span key={i} className="material-symbols-outlined text-[18px] fill-current">{starFill(i, rating)}</span>)}</div>
                                            <span className="text-slate-300 text-sm">({course.total_reviews.toLocaleString()} ratings)</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        {avatarUrl
                                            ? <img className="w-8 h-8 rounded-full object-cover border border-white/30" src={avatarUrl} alt={instructorName} />
                                            : <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center border border-white/30 text-white text-sm font-bold">{instructorName.charAt(0)}</div>}
                                        <span className="text-sm font-medium">Created by <span className="text-primary">{instructorName}</span></span>
                                    </div>
                                    {course.total_enrollments > 0 && (
                                        <div className="flex items-center gap-1 text-sm text-slate-300">
                                            <span className="material-symbols-outlined text-[16px]">group</span>
                                            <span>{course.total_enrollments.toLocaleString('en-IN')} students</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Short Description */}
                        {course.short_description && (
                            <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2 font-display">About This Course</h3>
                                <p className="text-slate-700 text-base leading-relaxed">{course.short_description}</p>
                            </section>
                        )}

                        {/* Outcomes */}
                        {toArray(course.outcomes).length > 0 && (
                            <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                <h3 className="text-2xl font-bold mb-6 text-slate-900 font-display">What you&apos;ll learn</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {toArray(course.outcomes).map((item, i) => (
                                        <div key={i} className="flex gap-3">
                                            <span className="material-symbols-outlined text-primary shrink-0">check</span>
                                            <span className="text-slate-700 text-sm leading-relaxed">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Description & Prerequisites */}
                        {course.description && (
                            <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                <h3 className="text-2xl font-bold mb-4 text-slate-900 font-display">Description</h3>
                                <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{course.description}</div>
                            </section>
                        )}

                        {/* Prerequisites */}
                        {toArray(course.prerequisites).length > 0 && (
                            <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                <h3 className="text-2xl font-bold mb-4 text-slate-900 font-display">Prerequisites</h3>
                                <ul className="space-y-2">
                                    {toArray(course.prerequisites).map((p, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <span className="material-symbols-outlined text-primary shrink-0 text-[18px] mt-0.5">arrow_right</span>
                                            <span className="text-slate-700 text-sm leading-relaxed">{p}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Course Content */}
                        {sections.length > 0 && (
                            <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-end mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900 font-display">Course Content</h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {sections.length} section{sections.length !== 1 ? 's' : ''} &bull; {totalLessons(sections)} lecture{totalLessons(sections) !== 1 ? 's' : ''}
                                            {sectionsTotal(sections) ? ` • ${fmtDuration(sectionsTotal(sections))} total` : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {sections.map((s, i) => <SectionAccordion key={s.id} section={s} defaultOpen={i === 0} />)}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right Column — Sticky Enrollment Card */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 flex flex-col gap-6">
                            <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
                                <div className="h-48 w-full bg-slate-100 relative group cursor-pointer" onClick={() => course.intro_video && setVideoOpen(true)}>
                                    {thumbUrl
                                        ? <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${thumbUrl}")` }} />
                                        : <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-400" />}
                                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-4xl text-primary pl-1">play_arrow</span>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white font-bold text-sm tracking-wide drop-shadow-md whitespace-nowrap">Preview this course</div>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-3xl font-bold text-slate-900 font-display">{displayPrice}</span>
                                        {originalPrice && <span className="text-lg text-slate-400 line-through decoration-1">{originalPrice}</span>}
                                        {discountPct > 0 && <span className="text-xs font-bold text-white bg-red-500 px-2 py-1 rounded">{discountPct}% OFF</span>}
                                    </div>
                                    <div className="flex flex-col gap-3 mb-6">
                                        <button onClick={() => {
                                            const token = localStorage.getItem('token');
                                            if (token) {
                                                window.location.href = `${STUDENT_APP_URL}/checkout/${course.id}`;
                                            } else {
                                                // Extract just the path for returnTo (remove domain)
                                                const checkoutPath = `/checkout/${course.id}`;
                                                // Construct the login URL with the path parameter
                                                const loginUrl = `${STUDENT_APP_URL}/login?returnTo=${encodeURIComponent(checkoutPath)}`;
                                                window.location.href = loginUrl;
                                            }
                                        }} className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded-lg transition-colors shadow-md shadow-primary/20 text-lg text-center block cursor-pointer border-none">
                                            Enroll Now
                                        </button>
                                    </div>
                                    <p className="text-xs text-center text-slate-500 mb-6 font-display">30-Day Money-Back Guarantee</p>
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-slate-900 text-sm font-display">This course includes:</h4>
                                        <ul className="space-y-3">
                                            {course.duration_hours ? (
                                                <li className="flex items-center gap-3 text-sm text-slate-600">
                                                    <span className="material-symbols-outlined text-[20px] text-slate-400">ondemand_video</span>
                                                    <span className="font-display">{course.duration_hours}h on-demand video</span>
                                                </li>
                                            ) : null}
                                            {totalLessons(sections) > 0 && (
                                                <li className="flex items-center gap-3 text-sm text-slate-600">
                                                    <span className="material-symbols-outlined text-[20px] text-slate-400">menu_book</span>
                                                    <span className="font-display">{totalLessons(sections)} lessons</span>
                                                </li>
                                            )}
                                            <li className="flex items-center gap-3 text-sm text-slate-600">
                                                <span className="material-symbols-outlined text-[20px] text-slate-400">all_inclusive</span>
                                                <span className="font-display">Full lifetime access</span>
                                            </li>
                                            <li className="flex items-center gap-3 text-sm text-slate-600">
                                                <span className="material-symbols-outlined text-[20px] text-slate-400">smartphone</span>
                                                <span className="font-display">Access on mobile and desktop</span>
                                            </li>
                                            {course.enable_certificate && (
                                                <li className="flex items-center gap-3 text-sm text-slate-600">
                                                    <span className="material-symbols-outlined text-[20px] text-slate-400">emoji_events</span>
                                                    <span className="font-display">Certificate of completion</span>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Video Modal */}
                {videoOpen && course.intro_video && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                        onClick={() => setVideoOpen(false)}
                    >
                        <div
                            className="relative w-full max-w-3xl mx-4"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setVideoOpen(false)}
                                className="absolute -top-10 right-0 text-white hover:text-slate-300 flex items-center gap-1 text-sm"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span> Close
                            </button>
                            <VideoPlayer
                                src={assetUrl(course.intro_video) ?? ''}
                                title={course.title}
                                autoPlay
                                aspectRatio="16/9"
                            />
                        </div>
                    </div>
                )}
            </>
            )}
        </main>
    );
};

// Wrap in Suspense because useSearchParams requires it in Next.js
const CourseDetailsPage = () => (
    <Suspense fallback={<SkeletonDetail />}>
        <CourseDetailsContent />
    </Suspense>
);

export default CourseDetailsPage;
