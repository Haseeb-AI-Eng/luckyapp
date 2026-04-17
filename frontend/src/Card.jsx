import React from 'react';
import qrCode from './assets/registration_qr.png';

const Card = () => {
    return (
        <div className="w-full max-w-[650px] bg-white rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-[10px]">

            {/* Header */}
            <div className="bg-blue-600 py-4 px-6 text-center text-white">
                <h1 className="text-xl font-black tracking-tight leading-none uppercase">
                    Lucky Draw Registration
                </h1>
                <p className="opacity-70 text-[10px] font-bold mt-1 uppercase tracking-[0.2em]">
                    Official Event Portal 2026
                </p>
            </div>

            {/* Side-by-Side Content */}
            <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-8">

                {/* Info Section */}
                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-black text-slate-800 leading-tight">
                        Win Big with <span className="bg-gradient-to-r from-blue-800 to-blue-500 bg-clip-text text-transparent">SecureCloud</span>
                    </h2>
                    <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                        Join our exclusive 2026 giveaway! We are selecting <span className="font-bold text-blue-600">30% of all participants</span> to win exciting prizes.
                    </p>

                    <ul className="mt-4 space-y-2 text-left inline-block md:block">
                        <li className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
                            <span className="text-blue-500 font-black">✓</span> Instant Email Confirmation
                        </li>
                        <li className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
                            <span className="text-blue-500 font-black">✓</span> Automated Random Selection
                        </li>
                        <li className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
                            <span className="text-blue-500 font-black">✓</span> Live Dashboard Tracking
                        </li>
                    </ul>
                </div>

                {/* QR & Action Section */}
                <div className="flex flex-col items-center gap-4 min-w-[200px]">
                    <div className="relative p-3 border-2 border-dashed border-blue-500 rounded-[1.25rem] bg-white shadow-xl w-48 h-48 flex items-center justify-center">
                        <img
                            src={qrCode}
                            alt="Scan Me"
                            className="w-full h-full object-contain"
                        />
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-xl w-full">
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-[10px]">
                            !
                        </span>
                        <p className="text-[9px] text-blue-900 font-bold leading-tight">
                            Scan with your phone camera to enter.
                        </p>
                    </div>

                    <a
                        href="https://forms.gle/PaeR46GeuVPYCTPm6"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-center py-2 bg-slate-900 text-white text-[10px] font-bold rounded-xl hover:bg-black transition-all active:scale-95 shadow-md"
                    >
                        Enter Manually
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Card;