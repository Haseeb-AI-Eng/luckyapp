import React from 'react';
import Card from './Card';

const App = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-5 bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_100%)]">

      {/* Rendering our component */}
      <Card />

      {/* External Footer */}
      <div className="text-center mt-6">
        <p className="text-white/40 text-[9px] font-bold tracking-[0.3em] uppercase">
          Powered by SecureCloud Systems
        </p>
      </div>
    </div>
  );
};

export default App;