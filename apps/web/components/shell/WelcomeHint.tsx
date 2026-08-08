
import { useState, useEffect } from "react";

export function WelcomeHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("tsc-welcomed")) {
        setShow(true);
      }
    } catch {}
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-bg-card border border-accent/30 rounded-lg shadow-xl px-4 py-3 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-xs font-mono text-text-primary mb-1">
              Welcome to Twilight Strand
            </p>
            <p className="text-[10px] font-mono text-text-dim leading-relaxed">
              Press{" "}
              <kbd className="px-1 py-0.5 bg-bg-inset border border-border-subtle rounded text-[9px]">
                Ctrl+I
              </kbd>{" "}
              to import a build, or click Import in the header. Press{" "}
              <kbd className="px-1 py-0.5 bg-bg-inset border border-border-subtle rounded text-[9px]">
                ?
              </kbd>{" "}
              for all shortcuts.
            </p>
          </div>
          <button
            onClick={() => {
              setShow(false);
              try {
                localStorage.setItem("tsc-welcomed", "1");
              } catch {}
            }}
            className="text-text-dim hover:text-text-primary text-xs shrink-0"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
