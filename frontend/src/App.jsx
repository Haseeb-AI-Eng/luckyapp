import React, { useState, useRef, useCallback } from 'react';
import RegistrationForm from './RegistrationForm';
import AdminPage from './AdminPage';
import QRDisplay from './QRDisplay';
import ZongLogo from './assets/Zong-Business-Logo.png';
import bgImage from './assets/green-background.jpeg';

const App = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [qrCode, setQrCode] = useState(null);
  const [hasScannedQR, setHasScannedQR] = useState(false);
  const scrollContainerRef = useRef(null);

  const handleQRScanned = useCallback((code) => {
    console.log('✅ QR Code scanned, ready for registration');
    setQrCode(code);
    // Don't auto-advance - let user confirm they've scanned
  }, []);

  const pages = [
    {
      id: 'admin',
      label: 'Admin',
      icon: '🎰',
      component: <AdminPage />
    },
    {
      id: 'registration',
      label: 'Register',
      icon: '📱',
      component: (
        <div
          className="w-full h-full flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat relative"
          style={{ backgroundImage: `url(${bgImage})` }}
        >
          {/* DARK OVERLAY — same as AdminPage */}
          <div className="absolute inset-0 bg-black/60 z-0"></div>

          {/* LOGO: Top Right — same as AdminPage */}
          <div className="absolute top-4 right-4 z-20">
            <img
              src={ZongLogo}
              alt="Zong Business Logo"
              className="h-24 md:h-28 w-auto object-contain drop-shadow-2xl"
            />
          </div>

          {!hasScannedQR ? (
            /* QR Code Display Section */
            <div className="relative z-10 w-full h-full flex flex-col items-center gap-1 animate-in fade-in duration-300 justify-center">
              <div className="w-full flex flex-col items-center gap-1">
                <div className="space-y-3 text-center">
                  <h1 className="text-4xl md:text-5xl font-black text-white">
                    📱 Scan to Register
                  </h1>
                  <p className="text-slate-300 text-base md:text-lg text-center max-w-md leading-relaxed">
                    Point your phone camera at the QR code to get your registration code
                  </p>
                </div>
                <div className="mt-0.5">
                  <QRDisplay onScanReady={(code) => { handleQRScanned(code); }} />
                </div>
                <button
                  onClick={() => setHasScannedQR(true)}
                  className="mt-6 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg"
                >
                  ✅ I've Scanned the QR Code
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form Section — all inside same background */
            <div className="relative z-10 w-full flex flex-col items-center gap-1 animate-in fade-in duration-500 -mt-12">
              <div className="text-center space-y-0.5 mb-1">
                <div className="inline-block">
                  <span className="text-4xl">✅</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-green-400">Code Scanned!</h2>
                <p className="text-slate-300 text-base">Complete your details below to register</p>
              </div>

              <RegistrationForm
                scannedCode={qrCode}
                onFormFocus={() => {}}
              />

              {/* Back to QR Button */}
              <button
                onClick={() => setHasScannedQR(false)}
                className="mt-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg transition-all active:scale-95"
              >
                ← Back to QR Code
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  const goToPage = (index) => {
    setCurrentPage(index);
    if (index !== 1) {
      setHasScannedQR(false);
    }
    console.log(`📄 Navigated to page: ${pages[index].label}`);
  };

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col">
      {/* Pages Container */}
      <div className="w-full flex-1 flex">
        {pages.map((page, index) => (
          <div
            key={page.id}
            className={`w-full flex-1 flex-shrink-0 transition-opacity duration-300 ${
              index === currentPage ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'
            }`}
          >
            <div className="w-full h-full flex flex-col items-center justify-center">
              {page.component}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Dots */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex gap-3 items-center">
        {pages.map((page, index) => (
          <button
            key={page.id}
            onClick={() => goToPage(index)}
            className={`relative group transition-all duration-300 ${
              index === currentPage
                ? 'w-12 h-12 bg-white shadow-2xl scale-110'
                : 'w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm'
            } rounded-full flex items-center justify-center`}
            title={page.label}
          >
            <span className="text-xl">{page.icon}</span>
            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap pointer-events-none">
              {page.label}
            </div>
            {index === currentPage && (
              <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-pulse"></div>
            )}
          </button>
        ))}
      </div>

      {/* Page Indicators */}
      <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 text-slate-400 text-xs font-bold uppercase tracking-widest">
        {currentPage + 1} / {pages.length}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 text-center py-2 z-40">
        <p className="text-white/20 text-[8px] font-bold tracking-[0.3em] uppercase">
          Powered by SecureCloud Systems
        </p>
      </div>
    </div>
  );
};

export default App;