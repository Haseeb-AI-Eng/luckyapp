import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

const QRDisplay = ({ onScanReady }) => {
    const canvasRef = useRef(null);
    const [registrationCode, setRegistrationCode] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Generate a unique registration code
        const generateCode = () => {
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            const codePrefix = 'Z5G';
            const randomPart = Math.floor(10000 + Math.random() * 90000);
            const code = `${codePrefix}-${randomPart}`;
            return code;
        };

        const code = generateCode();
        setRegistrationCode(code);

        // Generate QR code containing just the code string
        QRCode.toCanvas(canvasRef.current, code, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 0.92,
            margin: 2,
            width: 300,
            color: {
                dark: '#1e40af',
                light: '#ffffff',
            },
        }, (error) => {
            if (error) {
                console.error('❌ QR Code generation error:', error);
                setLoading(false);
            } else {
                console.log('✅ QR Code generated:', code);
                setLoading(false);
                if (onScanReady) onScanReady(code);
            }
        });
    }, []);

    return (
        <div className="w-full max-w-md">
            <div className="bg-white rounded-3xl overflow-hidden border-4 border-slate-200 shadow-2xl p-8">
                {/* Header */}
                <div className="text-center mb-6">
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-2">
                        📱 Scan with Your Phone
                    </p>
                    <h3 className="text-lg font-black text-slate-900">Registration Code</h3>
                </div>

                {/* QR Code Display */}
                <div className="flex justify-center mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-2xl border-2 border-blue-200 shadow-lg">
                        {loading ? (
                            <div className="w-80 h-80 flex items-center justify-center bg-slate-100 rounded-lg animate-pulse">
                                <span className="text-slate-400 font-semibold">Generating QR...</span>
                            </div>
                        ) : (
                            <canvas
                                ref={canvasRef}
                                className="rounded-lg shadow-md"
                            />
                        )}
                    </div>
                </div>

                {/* Code Display */}
                <div className="bg-slate-900 rounded-xl p-4 text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                        Your Code
                    </p>
                    <p className="text-white text-3xl font-mono font-black tracking-widest">
                        {registrationCode || '---'}
                    </p>
                </div>

                {/* Instructions */}
                <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <p className="text-blue-900 text-xs leading-relaxed">
                        <strong>✅ How to register:</strong><br />
                        1. Use your phone camera to scan this QR code<br />
                        2. Copy or note the code that appears<br />
                        3. Open the registration form below<br />
                        4. Enter the code and your details
                    </p>
                </div>

                {/* Alternative Manual Entry */}
                <div className="mt-4 text-center">
                    <p className="text-slate-500 text-xs">
                        Can't scan? Use code: <span className="font-mono font-bold text-slate-900">{registrationCode}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QRDisplay;
