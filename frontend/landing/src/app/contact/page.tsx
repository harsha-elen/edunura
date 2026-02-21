import React from 'react';

const ContactPage = () => {
    return (
        <div className="font-display bg-background-light text-slate-800 transition-colors duration-200 min-h-screen">
            {/* Hero Section Header */}
            <header className="py-16 bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Get in Touch</h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Have questions about our LMS features or need technical assistance? Our team is here to help you succeed in your learning journey.
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Contact Form Section (Left 2/3) */}
                    <div className="lg:col-span-2">
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                            <h2 className="text-2xl font-bold mb-8 text-slate-900">Send us a message</h2>
                            <form action="#" className="space-y-6" method="POST">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700" htmlFor="name">Full Name</label>
                                        <input className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-400" id="name" name="name" placeholder="John Doe" type="text" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700" htmlFor="email">Email Address</label>
                                        <input className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-400" id="email" name="email" placeholder="john@example.com" type="email" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700" htmlFor="subject">Subject</label>
                                    <select className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" id="subject" name="subject">
                                        <option value="">Select a topic</option>
                                        <option value="technical">Technical Support</option>
                                        <option value="billing">Billing Inquiry</option>
                                        <option value="partnership">Partnerships</option>
                                        <option value="other">General Feedback</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700" htmlFor="message">Your Message</label>
                                    <textarea className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-400" id="message" name="message" placeholder="How can we help you?" rows={5}></textarea>
                                </div>
                                <button className="w-full md:w-auto bg-primary text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-opacity-90 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2" type="submit">
                                    Send Message
                                    <span className="material-symbols-outlined text-sm">send</span>
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Contact Information Sidebar (Right 1/3) */}
                    <div className="space-y-8">
                        {/* Contact Card */}
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-xl font-bold mb-6 text-slate-900">Contact Information</h3>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/10 p-2 rounded-lg">
                                        <span className="material-symbols-outlined text-primary">place</span>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900">Office Address</h4>
                                        <p className="text-slate-500 text-sm leading-relaxed mt-1">
                                            Flat No. 401, 4th floor,<br />
                                            Kolan Krishna Reddy Complex, Bachupally,<br />
                                            Medchal-Malkajgiri district, Telangana - 500090.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/10 p-2 rounded-lg">
                                        <span className="material-symbols-outlined text-primary">mail</span>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900">Support Email</h4>
                                        <p className="text-slate-500 text-sm mt-1">
                                            support@edunura.com
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/10 p-2 rounded-lg">
                                        <span className="material-symbols-outlined text-primary">phone</span>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900">Phone Number</h4>
                                        <p className="text-slate-500 text-sm mt-1">
                                            +91 9502331577
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 pt-8 border-t border-slate-100">
                                <h4 className="font-semibold text-slate-900 mb-4">Follow Our Updates</h4>
                                <div className="flex gap-4">
                                    <a className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-primary hover:text-white transition-all" href="#">
                                        <span className="material-symbols-outlined text-sm">public</span>
                                    </a>
                                    <a className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-primary hover:text-white transition-all" href="#">
                                        <span className="material-symbols-outlined text-sm">alternate_email</span>
                                    </a>
                                    <a className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-primary hover:text-white transition-all" href="#">
                                        <span className="material-symbols-outlined text-sm">forum</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Map Component (Static representation) */}
                        <div className="rounded-xl overflow-hidden shadow-sm border border-slate-200 h-64 relative group">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3804.3720315179876!2d78.3640896!3d17.5374654!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb8dc02a531e87%3A0xeb59992603ecaa03!2sKolan%20Krishna%20Reddy%20Complex%2C%20Nizampet%20Rd%2C%20Bachupally%2C%20Hyderabad%2C%20Telangana%20500118!5e0!3m2!1sen!2sin!4v1771664165980!5m2!1sen!2sin"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Office Location"
                            ></iframe>
                        </div>
                    </div>
                </div>

                {/* FAQ Quick Link Footer Section */}
                <div className="mt-20 text-center">
                    <div className="inline-flex items-center gap-3 bg-primary/5 border border-primary/20 px-6 py-4 rounded-xl">
                        <span className="material-symbols-outlined text-primary">help_outline</span>
                        <p className="text-slate-700">
                            Have a quick question?
                            <a className="text-primary font-bold hover:underline ml-1" href="#">Check our Frequently Asked Questions</a>
                        </p>
                    </div>
                </div>
            </main>

        </div>
    );
};

export default ContactPage;
