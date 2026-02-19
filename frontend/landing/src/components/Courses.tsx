import React from 'react';

const Courses = () => {
    const courses = [
        {
            title: "Complete Modern Web Development",
            category: "DEVELOPMENT",
            rating: "4.9",
            reviews: "12k reviews",
            lessons: "24 Lessons",
            price: "$89.99",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAGacmde_ez_Pxu4YEaByZ0kQGZSIczwKSM0asLxskFTD9WxDy4a_n_T8_2Kch-97lile9u-JubBJ8f2Aw_KlDq-q62vzGsHI99qnz7Nbl-L6hr-3-Qp09SW5HrnvWDgO2_3Pid2i9TDpOqniy3NKX2KDOfaWJbkoRRvAsC8blaJfvGOxhukD5RDfnIhPcLxn0GZqlUtq_8rJ-f1qT88DIAoRwhy3C32PqpamH-g8bJOjZC7PiRw3vDukaZIfKdLsWwsqrSjAcV-COL"
        },
        {
            title: "UX/UI Fundamentals Masterclass",
            category: "DESIGN",
            rating: "4.8",
            reviews: "8k reviews",
            lessons: "18 Lessons",
            price: "$64.99",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBX58rOZd_WUXokmsdz5I5sF0cfYwPhTzvUKizjnsh8uXX5h4wCXISwhUbbxnzbFUg3mLRh3K5q84ozUJkRsy6bzSOhmVg5s01Rtj9R3tzcWbkES9C2gFK2futbFBJ3Xzy4c6hyS_vodcNi4L6B3YxU1R82Ifxd-hNKUqAAG81fwoiqVyZGpN0rz9qpMFi_VY48Z3obZ8cxBi523tAjkrVLCXtuHxA74JrqGbTM952SG_iIaHz3Q4VFqbbMQbXtEfdN7YPe6Gr2Yw4j"
        },
        {
            title: "Python for Data Analysis 2024",
            category: "DATA SCIENCE",
            rating: "4.9",
            reviews: "15k reviews",
            lessons: "32 Lessons",
            price: "$99.99",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC53X6J_nw0Yekk7YBrhllhJVB3oG3qeIFX8dKQ84fANQ6GvTyGX0Fv_HBjzo_A1G89ET7XJl-gRjRFghGerCVO-kLZFHETx8xRIUBCTjUM8oPuQ0A8SBu64qvPo9021uzrTKQxlMRIau2XdGchvoQiKZmq-DbwASSs_LtN9j0heAkzzozcsulopabITHhNrDeZR6RwmAIj92wVNNF-XKc-TjdkZlZ98NsNaCcVqaJNV7zdq3n7uvmVFVzn0y0FngOu5YwzbfUHBTKg"
        },
        {
            title: "Digital Marketing Strategy",
            category: "BUSINESS",
            rating: "4.7",
            reviews: "5.5k reviews",
            lessons: "14 Lessons",
            price: "$49.99",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB6H-9lgZ3VTHQ-t-X2_5QIAnteFfRxFymLKan2xJHowkGXgbYzoM-themYKSBi4fJ2pDkcKB-3ENNsELMrpsb7chSiPq_X30U-mpo7EGidq7x_j-FWIhFBedBMMzF_tTVn4eISF_jQsQlyeQkXk3gcyfdlK5_DWcVjWR-nEwtW9p_dmWoBjywkoCO9_wX8afs5trmSMJwkPzpRdPAWvOs_wQC8vN_Dzl4zV2mAIq9oLiIOmjCWh1SNfWaV2KL6dVV8VkEIvAqHcRyT"
        }
    ];

    return (
        <section className="py-24 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900">Most Popular Courses</h2>
                        <p className="mt-2 text-slate-600">Explore our most requested learning paths</p>
                    </div>
                    <div className="hidden sm:flex gap-2">
                        <button className="p-3 rounded-full border border-slate-200 hover:bg-white transition-colors">
                            <span className="material-icons">chevron_left</span>
                        </button>
                        <button className="p-3 rounded-full border border-slate-200 hover:bg-white transition-colors">
                            <span className="material-icons">chevron_right</span>
                        </button>
                    </div>
                </div>
                <div className="flex overflow-x-auto gap-6 pb-8 hide-scrollbar">
                    {courses.map((course, index) => (
                        <div key={index} className="flex-none w-80 bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 group cursor-pointer">
                            <div className="h-48 relative overflow-hidden">
                                <img alt={course.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" src={course.image} />
                                <div className="absolute top-4 left-4 bg-primary text-white text-xs font-bold px-2 py-1 rounded">{course.category}</div>
                            </div>
                            <div className="p-6">
                                <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-yellow-400 material-icons text-sm">star</span>
                                    <span className="text-sm font-semibold">{course.rating}</span>
                                    <span className="text-xs text-slate-400">({course.reviews})</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-icons text-sm text-slate-400">list_alt</span>
                                        <span className="text-xs text-slate-500">{course.lessons}</span>
                                    </div>
                                    <span className="font-bold text-primary">{course.price}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Courses;
