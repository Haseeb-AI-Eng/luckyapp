import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const RegistrationForm = ({ scannedCode, onFormFocus }) => {
    const formRef = useRef(null);
    const [formData, setFormData] = useState({
        userCode: '',
        name: '',
        email: '',
        organization: '',
        contact: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (scannedCode) {
            setFormData(prev => ({ ...prev, userCode: scannedCode }));
            console.log('📝 Form updated with scanned code:', scannedCode);
            if (onFormFocus) onFormFocus();
            setTimeout(() => {
                if (formRef.current) {
                    formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        }
    }, [scannedCode, onFormFocus]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        const newErrors = {};
        const codeRegex = /^[A-Za-z0-9]{3}-[0-9]{5}$/;

        if (!formData.userCode.trim()) {
            newErrors.userCode = "User code is required";
        } else if (!codeRegex.test(formData.userCode)) {
            newErrors.userCode = "Invalid format! Use XXX-00000 (e.g., Z5G-12345)";
        }
        if (!formData.name.trim()) newErrors.name = "Full name is required";
        if (!formData.email.trim()) {
            newErrors.email = "Email address is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email";
        }
        if (!formData.contact.trim()) newErrors.contact = "Contact number is required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setLoading(false);
            return;
        }

        try {
            const res = await axios.post('https://error-debugger--hejaz6784.replit.app/api/register', formData);
            if (res.data.success) {
                setErrors({ success: "Success! You are in the draw." });
                setFormData({ userCode: '', name: '', email: '', organization: '', contact: '' });
                setTimeout(() => setErrors({}), 3000);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Registration failed.";
            setErrors({ submit: errorMsg });
        }
        setLoading(false);
    };

    return (
        <div ref={formRef} className="w-full max-w-xl px-4">
            <div className="bg-white p-5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100">

                {errors.submit && (
                    <div className="mb-2 p-2 bg-red-50 border-l-4 border-red-500 rounded-lg animate-in slide-in-from-top duration-300">
                        <p className="text-red-700 text-xs font-semibold">❌ {errors.submit}</p>
                    </div>
                )}
                {errors.success && (
                    <div className="mb-2 p-2 bg-green-50 border-l-4 border-green-500 rounded-lg animate-in slide-in-from-top duration-300">
                        <p className="text-green-700 text-xs font-semibold">✅ {errors.success}</p>
                    </div>
                )}

                <div className="mb-3 text-center">
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">Participant Details</h2>
                    <p className="text-slate-400 text-xs mt-0.5 font-medium uppercase tracking-widest">Complete the fields below</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-2">
                    <div className="group">
                        <label className={`block text-[11px] font-bold uppercase mb-1.5 ml-1 transition-colors ${
                            errors.userCode ? 'text-red-600' : 'text-slate-500 group-focus-within:text-blue-600'
                        }`}>User Code</label>
                        <input
                            type="text"
                            name="userCode"
                            placeholder="e.g. Z5G-00000"
                            required
                            pattern="[A-Za-z0-9]{3}-[0-9]{5}"
                            value={formData.userCode}
                            onChange={handleChange}
                            className={`w-full px-5 py-3 bg-slate-50 border rounded-2xl text-sm font-medium outline-none focus:bg-white focus:ring-4 transition-all placeholder:text-slate-300 ${
                                errors.userCode
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'
                            }`}
                        />
                        {errors.userCode && <p className="text-red-600 text-xs mt-1 ml-1 font-medium">{errors.userCode}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="group">
                            <label className={`block text-[11px] font-bold uppercase mb-1.5 ml-1 transition-colors ${
                                errors.name ? 'text-red-600' : 'text-slate-500 group-focus-within:text-blue-600'
                            }`}>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Bilal..."
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full px-5 py-3 bg-slate-50 border rounded-2xl text-sm font-medium outline-none focus:bg-white focus:ring-4 transition-all placeholder:text-slate-300 ${
                                    errors.name
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                                        : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'
                                }`}
                            />
                            {errors.name && <p className="text-red-600 text-xs mt-1 ml-1 font-medium">{errors.name}</p>}
                        </div>
                        <div className="group">
                            <label className={`block text-[11px] font-bold uppercase mb-1.5 ml-1 transition-colors ${
                                errors.email ? 'text-red-600' : 'text-slate-500 group-focus-within:text-blue-600'
                            }`}>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="bilal@example.com"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full px-5 py-3 bg-slate-50 border rounded-2xl text-sm font-medium outline-none focus:bg-white focus:ring-4 transition-all placeholder:text-slate-300 ${
                                    errors.email
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                                        : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'
                                }`}
                            />
                            {errors.email && <p className="text-red-600 text-xs mt-1 ml-1 font-medium">{errors.email}</p>}
                        </div>
                    </div>

                    <div className="group">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5 ml-1 group-focus-within:text-blue-600">
                            Organization
                        </label>
                        <input
                            type="text"
                            name="organization"
                            placeholder="University / Company Name"
                            value={formData.organization}
                            onChange={handleChange}
                            className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300"
                        />
                    </div>

                    <div className="group">
                        <label className={`block text-[11px] font-bold uppercase mb-1.5 ml-1 transition-colors ${
                            errors.contact ? 'text-red-600' : 'text-slate-500 group-focus-within:text-blue-600'
                        }`}>Contact Number</label>
                        <input
                            type="tel"
                            name="contact"
                            placeholder="+92 300 1234567"
                            required
                            value={formData.contact}
                            onChange={handleChange}
                            className={`w-full px-5 py-3 bg-slate-50 border rounded-2xl text-sm font-medium outline-none focus:bg-white focus:ring-4 transition-all placeholder:text-slate-300 ${
                                errors.contact
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'
                            }`}
                        />
                        {errors.contact && <p className="text-red-600 text-xs mt-1 ml-1 font-medium">{errors.contact}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 mt-4 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 group
                            ${loading
                                ? 'bg-emerald-400 cursor-not-allowed scale-[0.98]'
                                : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30 active:scale-[0.98]'
                            }`}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <span>Register Now</span>
                                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RegistrationForm;