import React from 'react';

const Testimonials = () => {
    const testimonials = [
        {
            name: "Sarah Jenkins",
            role: "Software Engineer",
            quote: "The quality of the content here is exceptional. I managed to land a job at a top tech firm just three months after finishing the Web Development bootcamp.",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAazSRsY8Q6Nael4iMvGUk2d8U1Fu71O56pgVIoCzsxweOx2db935_e-K5VvLdBJUEZvg7IY6j0RQVZ-DCs3X5-6IE62b4QjEJuRMSq-lmn1P8sFXbdaR57DbODZdcyagKi9s7FW8RD5J1rh-4vss1w3GNbrixLReTX435u0W1lXsNf96lu1ym6F2NHBm-NnCTLQA58U9SoIJ72EAWqKph5_sLwPRqRK9SVocPfTNjIe1ulOfprIzciRe2YPIXF6M30SsWtZNVWEycT"
        },
        {
            name: "Michael Roberts",
            role: "Product Designer",
            quote: "The flexible schedule allowed me to learn UI Design while working full-time. The projects were practical and my portfolio looks amazing now.",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCpRZCBMA32lZZR7JeuAs0CQfyp604H6gB3f285BClLal0TIsSHLMF_vwEHEosFzGDMQKfw9vQfNSW3QPXzo7Dc6djMCpxZulOUn3H1zBRIWVhVviGN6lGiiZb9Q8fDB-9_s9kK6R7RDtertsPOAnrBAYfaIvPGZXLUCvqlLVzhy-oytgxBATnIk8QYsQM1hxRJ5zD6PSn1S1U79NZ10V_yFOSRlBLaBKwD6f4ntaYAdELaldSwrR4InZQhQEcnMPdgsCR8t_hE2zu8"
        },
        {
            name: "Elena Kostas",
            role: "Data Analyst",
            quote: "Highly recommended for anyone looking to transition into data science. The instructors explain complex concepts in a very simple way.",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDSm5TOiPyVQ9XE0uQIHNPsBc5SkVjuUcmUUSUUvzQh8cOpEhEPzzA8_ZCzUcIAHIyoldkZ94UhTACRCIyGtNNicZb0jUncgAMlYLW55BX2j2moYjrCDmY6RRlHC2S6XSIu1b1gY1OV1iyB-P0-09gIz7vu2bqMpzOX7Gf0xWlqFDYE_sznv3joZAJgxU9iAe2fFjcr0BOwN9htZcmvTa-oZ3uIGE5t7B7Nc3Ggqtg_hwx2lc41Dlzm5ihbNCIAXHAR3SvX7iQppg6l"
        }
    ];

    return (
        <section className="py-24 bg-primary/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-extrabold text-slate-900">Trusted by Learners Worldwide</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testimonials.map((t, i) => (
                        <div key={i} className="bg-white p-8 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-1 text-yellow-400 mb-4">
                                {[...Array(5)].map((_, j) => (
                                    <span key={j} className="material-icons text-sm">star</span>
                                ))}
                            </div>
                            <p className="text-slate-600 mb-6 italic">"{t.quote}"</p>
                            <div className="flex items-center gap-4">
                                <img alt={t.name} className="w-12 h-12 rounded-full object-cover" src={t.image} />
                                <div>
                                    <h4 className="font-bold">{t.name}</h4>
                                    <p className="text-sm text-slate-500">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
