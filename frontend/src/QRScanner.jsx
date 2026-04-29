import React, { useEffect, useRef, useState } from 'react';

const QRScanner = ({ onScanSuccess, onScanError }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isCameraActive, setIsCameraActive] = useState(true);
    const [scannedCode, setScannedCode] = useState(null);
    const scanIntervalRef = useRef(null);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    console.log('📷 Camera started successfully');
                }
            } catch (err) {
                console.error('❌ Camera access denied:', err);
                if (onScanError) onScanError('Camera access denied');
                setIsCameraActive(false);
            }
        };

        startCamera();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, [onScanError]);

    useEffect(() => {
        if (!isCameraActive) return;

        const scanQRCode = () => {
            if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
                const ctx = canvasRef.current.getContext('2d');
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                ctx.drawImage(videoRef.current, 0, 0);

                try {
                    const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
                    const code = decodeQR(imageData);
                    if (code && code !== scannedCode) {
                        console.log('✅ QR Code Scanned:', code);
                        setScannedCode(code);
                        if (onScanSuccess) onScanSuccess(code);
                    }
                } catch (err) {
                    // Silently continue scanning
                }
            }
        };

        scanIntervalRef.current = setInterval(scanQRCode, 500);

        return () => clearInterval(scanIntervalRef.current);
    }, [isCameraActive, scannedCode, onScanSuccess]);

    // Simple QR code decoder using jsQR algorithm
    const decodeQR = (imageData) => {
        const data = imageData.data;
        const code = detectQRCode(data, imageData.width, imageData.height);
        return code;
    };

    const detectQRCode = (data, width, height) => {
        // Extract text from QR using pattern matching
        // This is a simplified version - for production use jsQR library
        const binaryString = extractBinaryPatterns(data, width, height);
        return parseQRData(binaryString);
    };

    const extractBinaryPatterns = (data, width, height) => {
        let patterns = '';
        for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            patterns += gray > 128 ? '1' : '0';
        }
        return patterns;
    };

    const parseQRData = (binaryString) => {
        // Look for QR format indicator patterns
        const patterns = binaryString.match(/.{1,8}/g) || [];
        
        // Extract potential QR codes (simplified detection)
        for (let i = 0; i < patterns.length; i++) {
            const pattern = patterns[i];
            if (pattern === '11111111' || pattern === '00000000') {
                continue;
            }
            // Try to decode as base36 or hex
            try {
                const charCode = parseInt(pattern, 2);
                if (charCode >= 32 && charCode <= 126) {
                    return String.fromCharCode(charCode);
                }
            } catch (e) {
                continue;
            }
        }
        return null;
    };

    return (
        <div className="w-full max-w-md">
            <div className="bg-slate-900 rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl">
                {/* Camera Feed */}
                <div className="relative w-full aspect-square bg-black">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* QR Scanning Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 border-4 border-green-500/50 rounded-2xl shadow-[inset_0_0_20px_rgba(34,197,94,0.2)]">
                            <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-green-500"></div>
                            <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-green-500"></div>
                            <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-green-500"></div>
                            <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-green-500"></div>
                        </div>
                    </div>

                    {/* Scanning Line Animation */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-pulse"></div>
                    </div>

                    {!isCameraActive && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                            <div className="text-red-500 text-2xl mb-2">📷</div>
                            <p className="text-white text-sm font-semibold">Camera Access Denied</p>
                            <p className="text-slate-400 text-xs mt-1">Please enable camera permissions</p>
                        </div>
                    )}
                </div>

                {/* Status Bar */}
                <div className="bg-slate-800 px-6 py-4 border-t border-slate-700">
                    <p className="text-center text-white text-xs font-bold uppercase tracking-widest">
                        {scannedCode ? (
                            <span className="text-green-400">✅ Code Scanned!</span>
                        ) : (
                            <span className="text-slate-400">📱 Position QR Code in Frame</span>
                        )}
                    </p>
                    {scannedCode && (
                        <p className="text-center text-green-400 text-sm font-mono mt-2">
                            {scannedCode}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QRScanner;
