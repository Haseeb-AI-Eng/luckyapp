import React, { useState } from 'react';
import axios from 'axios';
import bgImage from './assets/green-background.jpeg';
import logo from './assets/Zong-Business-Logo.png';

const AdminPage = () => {
    const [winner, setWinner] = useState(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [isLeverPulled, setIsLeverPulled] = useState(false);
    const [displayCode, setDisplayCode] = useState("--- ---");

    const startDraw = async () => {
        if (isSpinning) return;

        setIsLeverPulled(true);
        setTimeout(() => setIsLeverPulled(false), 500);

        setIsSpinning(true);
        setWinner(null);

        const spinInterval = setInterval(() => {
            const randomCode = Math.random().toString(36).substring(2, 5).toUpperCase() + "-" + Math.floor(10000 + Math.random() * 90000);
            setDisplayCode(randomCode);
        }, 80);

        try {
            const res = await axios.get('https://error-debugger--hejaz6784.replit.app/api/pick-winner');

            setTimeout(() => {
                clearInterval(spinInterval);
                setWinner(res.data.winner);
                setDisplayCode(res.data.winner.userCode);
                setIsSpinning(false);
            }, 3500);
        } catch (err) {
            clearInterval(spinInterval);
            setIsSpinning(false);
            setDisplayCode("ERROR");
            console.error("Draw failed:", err);
        }
    };

    return (
        <div
            className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-2 overflow-hidden font-sans bg-cover bg-center bg-no-repeat relative"
            style={{ backgroundImage: `url(${bgImage})` }}
        >
            {/* DARK OVERLAY */}
            <div className="absolute inset-0 bg-black/60 z-0"></div>

            {/* ✅ LOGO: Top Right — No background box, clean & bigger */}
            <div className="absolute top-4 right-4 z-20">
                <img
                    src={logo}
                    alt="Zong Business Logo"
                    className="h-24 md:h-28 w-auto object-contain drop-shadow-2xl"
                />
            </div>

            {/* CONTENT WRAPPER */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md scale-90 md:scale-100 gap-2">

                {/* LEVER */}
                <div className="absolute -right-12 top-1/4 h-48 w-10 flex flex-col items-center">
                    <div className="absolute bottom-0 w-8 h-12 bg-slate-800 rounded-lg border-2 border-slate-900 z-0" />
                    <div
                        className={`flex flex-col items-center transition-transform duration-500 ease-in-out origin-bottom
                            ${isLeverPulled ? 'rotate-[45deg] translate-y-8' : 'rotate-0'}`}
                        style={{ height: '140px' }}
                    >
                        <div className="w-10 h-10 bg-rose-600 rounded-full shadow-[inset_-4px_-4px_10px_rgba(0,0,0,0.5),0_5px_15px_rgba(225,29,72,0.4)] border-2 border-rose-800" />
                        <div className="w-3 h-full bg-gradient-to-r from-slate-400 to-slate-600 border-x border-slate-700 shadow-lg" />
                    </div>
                </div>

                {/* MACHINE BODY */}
                <div className="relative bg-slate-300 rounded-t-[6rem] rounded-b-[2rem] p-4 border-[10px] border-slate-900 shadow-2xl overflow-hidden">

                    {/* Metallic Texture */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(135deg, #000, #000 1px, transparent 1px, transparent 8px)' }} />

                    <div className="bg-slate-800 text-yellow-500 py-1 px-4 rounded-full border-2 border-slate-950 text-[10px] font-black uppercase tracking-[0.3em] w-fit mx-auto mb-4 relative z-20 shadow-lg">
                        Lucky Slot
                    </div>

                    {/* REEL AREA */}
                    <div className="bg-slate-900 py-6 px-3 rounded-2xl border-[6px] border-slate-950 shadow-[inset_0_0_40px_rgba(0,0,0,1)] relative z-10 mx-2 flex justify-center items-center gap-1">
                        {displayCode.split('').map((char, index) => (
                            <div
                                key={index}
                                className={`
                                    ${char === '-' ? 'bg-transparent w-4' : 'bg-white w-10 h-14 rounded-md border-2 border-slate-400'}
                                    relative flex items-center justify-center overflow-hidden shadow-inner
                                `}
                            >
                                {char !== '-' && (
                                    <>
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 pointer-events-none" />
                                        <span className={`text-3xl font-mono font-black text-slate-900 transition-all
                                            ${isSpinning ? 'animate-pulse blur-[1px]' : 'scale-110'}`}>
                                            {char}
                                        </span>
                                    </>
                                )}
                                {char === '-' && <span className="text-white font-bold text-2xl">-</span>}
                            </div>
                        ))}
                    </div>

                    {/* Action Button */}
                    <div className="mt-8 mb-4 px-6 text-center relative z-20">
                        <button
                            onClick={startDraw}
                            disabled={isSpinning}
                            className={`w-full py-4 rounded-2xl font-black text-xl uppercase transition-all shadow-xl active:scale-95
                                ${isSpinning
                                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-80'
                                    : 'bg-pink-500 text-white border-b-8 border-slate-900 hover:bg-pink-600'}`}
                        >
                            {isSpinning ? 'SPINNING...' : 'PULL TO START'}
                        </button>
                    </div>

                    {/* Hardware Details */}
                    <div className="flex justify-between px-4 opacity-50">
                        <div className="w-2 h-2 rounded-full bg-slate-900" />
                        <div className="flex gap-1">
                            {[...Array(3)].map((_, i) => <div key={i} className="w-8 h-1 bg-slate-900 rounded-full" />)}
                        </div>
                        <div className="w-2 h-2 rounded-full bg-slate-900" />
                    </div>
                </div>

                {/* Winner Pop-up */}
                <div className="h-auto flex items-center justify-center mt-2 w-full max-w-sm">
                    {winner && !isSpinning && (
                        <div className="bg-slate-900 border-2 border-green-500/30 p-3 rounded-2xl w-full text-center shadow-2xl animate-in fade-in zoom-in duration-300">
                            <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Winner Picked</p>
                            <h2 className="text-lg text-white font-black">{winner.name}</h2>
                            <p className="text-slate-500 text-[9px] truncate">{winner.email}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;