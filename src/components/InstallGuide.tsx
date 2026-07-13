import { CheckCircle2, AlertCircle, Smartphone, Laptop, Settings } from 'lucide-react';

export default function InstallGuide() {
  const steps = [
    {
      title: 'Download APK Bundle',
      desc: 'Log in and click the "Download Latest Build" button. Save the APK file to your Downloads folder on your device.',
    },
    {
      title: 'Enable Unknown Sources',
      desc: 'Open Chrome or your file browser. If prompted, toggle on "Allow installation from this source", or navigate to Settings > Apps > Special App Access > Install Unknown Apps.',
    },
    {
      title: 'Initiate Installation',
      desc: 'Tap on the downloaded "KhataIndex-vX.X.X.apk" file in your browser downloads list or File Manager, and click "Install".',
    },
    {
      title: 'Launch & Track Ledgers',
      desc: 'Open KhataIndex from your application drawer. Enjoy real-time credit tracking and double-entry book calculations offline!',
    },
  ];

  return (
    <section id="install-guide" className="scroll-mt-16 py-16 border-t border-white/10">
      <div className="mx-auto max-w-4xl">
        <div className="text-center space-y-3 mb-12">
          <span className="inline-flex items-center rounded-full bg-white/10 border border-white/10 px-3.5 py-1 text-xs font-semibold text-blue-300 tracking-wide">
            Installation Support
          </span>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            How to Install KhataIndex on Android & PC
          </h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Since KhataIndex is distributed directly as an APK, follow these quick and safe instructions to get started.
          </p>
        </div>

        {/* Responsive Dual Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          {/* Mobile APK Guide (Left Column) */}
          <div className="md:col-span-7 bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6 shadow-xl">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2.5">
              <Smartphone className="h-5 w-5 text-blue-400" />
              <span>Android APK Guidelines</span>
            </h3>

            <div className="space-y-6">
              {steps.map((step, idx) => (
                <div key={idx} className="flex space-x-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/25 text-xs font-extrabold text-blue-300">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{step.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PC & Browser Web App Guide (Right Column) */}
          <div className="md:col-span-5 flex flex-col justify-between bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2.5">
                <Laptop className="h-5 w-5 text-indigo-400" />
                <span>PC & Browser Support</span>
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed">
                KhataIndex is built with absolute responsive versatility. You can use the fully functional web dashboard instantly from any desktop or mobile browser.
              </p>

              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-blue-400 animate-spin" style={{ animationDuration: '10s' }} />
                  <span className="text-xs font-bold text-white">Add to Home Screen (PWA)</span>
                </div>
                <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc list-inside">
                  <li>Open this site in Chrome or Safari</li>
                  <li>Tap the browser "Share" or "Menu" button</li>
                  <li>Click "Add to Home Screen" or "Install App"</li>
                  <li>Launch instantly like a native app</li>
                </ul>
              </div>
            </div>

            {/* Note box */}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 flex items-start space-x-2.5 text-xs text-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Play Protect Note:</span>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  As this APK is signed directly from our developer console and not distributed via Google Play Store, Play Protect might prompt a "Block by Play Protect" alert. Simply click <span className="font-bold text-white underline decoration-amber-400">Install Anyway</span> to finish setup safely.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
