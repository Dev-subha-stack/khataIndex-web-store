import { AppVersion } from '../types';
import { Download, Calendar, HardDrive, Sparkles, Lock } from 'lucide-react';

interface VersionHistoryProps {
  versions: AppVersion[];
  onDownload: (id: string, filename: string) => void;
  isLoggedIn: boolean;
  onOpenAuth: () => void;
}

export default function VersionHistory({
  versions,
  onDownload,
  isLoggedIn,
  onOpenAuth,
}: VersionHistoryProps) {
  return (
    <section id="versions" className="scroll-mt-16 py-10">
      <div className="border-b border-white/10 pb-5 mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-blue-400" />
          <span>All Available Builds & Archives</span>
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Access historical builds of KhataIndex. Standard users must be authenticated to trigger binary downloads.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {versions.length === 0 ? (
          <div className="col-span-full text-center py-16 rounded-3xl border border-dashed border-white/10 bg-white/5 text-slate-400">
            <p className="text-sm font-semibold">No versions published yet.</p>
          </div>
        ) : (
          versions.map((ver, idx) => (
            <div
              key={ver.id}
              className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-6 shadow-xl transition-all duration-300 hover:border-white/20 hover:bg-slate-900/85 hover:shadow-2xl"
            >
              {/* Card Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-sans text-xl font-black text-white">
                      V{ver.versionString}
                    </span>
                    {idx === 0 && (
                      <span className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-300">
                        Latest Release
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full flex items-center">
                    <HardDrive className="h-3 w-3 mr-1 text-indigo-400" />
                    {ver.fileSize}
                  </span>
                </div>

                {/* Release Notes */}
                <div className="space-y-1.5 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Release Notes
                  </h4>
                  <p className="text-xs text-slate-300 font-sans whitespace-pre-line leading-relaxed max-h-24 overflow-y-auto pr-1">
                    {ver.releaseNotes}
                  </p>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-3 text-xs text-slate-400">
                  <span className="flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    {new Date(ver.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-white/10" />
                  <span>{ver.downloadCount} downloads</span>
                </div>

                {isLoggedIn ? (
                  <button
                    onClick={() => onDownload(ver.id, ver.filename)}
                    className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-indigo-500 transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </button>
                ) : (
                  <button
                    onClick={onOpenAuth}
                    className="inline-flex items-center space-x-1.5 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-bold text-blue-300 hover:bg-white/10 transition"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Login to Download</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
