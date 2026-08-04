"use client";

import { useState, useEffect } from "react";
import { BuildCard } from "@/components/shell/BuildCard";

interface SharedBuild {
  id: string;
  name: string;
  className: string;
  ascendancy: string;
  level: number;
  totalDps: number;
  life: number;
  energyShield: number;
  pobCode: string;
  authorName: string;
  authorImage: string;
  createdAt: string;
}

export default function CommunityPage() {
  const [builds, setBuilds] = useState<SharedBuild[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/builds/shared?limit=30")
      .then((r) => r.json())
      .then((data) => {
        setBuilds(data.builds || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-dvh bg-bg-deep">
      <header className="border-b border-border-divider bg-bg-surface/60 backdrop-blur-sm px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="text-accent font-display text-lg font-bold"
            >
              Twilight Strand
            </a>
            <span className="text-text-dim font-mono text-sm">
              Community Builds
            </span>
          </div>
          <a
            href="/"
            className="text-xs font-mono text-text-dim hover:text-accent"
          >
            Back to Planner
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {loading ? (
          <div className="text-center py-12 text-text-dim font-mono">
            Loading builds...
          </div>
        ) : builds.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-dim font-mono">No shared builds yet.</p>
            <p className="text-text-dim/60 font-mono text-sm mt-2">
              Import a build and click Share to publish it.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {builds.map((build) => (
              <a
                key={build.id}
                href={`/#${build.pobCode}`}
                className="block"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <BuildCard
                      name={build.name}
                      className={build.className || ""}
                      ascendancy={build.ascendancy || ""}
                      level={build.level || 1}
                      dps={build.totalDps}
                      life={build.life}
                      es={build.energyShield}
                    />
                  </div>
                  {build.authorName && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {build.authorImage && (
                        <img
                          src={build.authorImage}
                          alt=""
                          className="w-4 h-4 rounded-full"
                        />
                      )}
                      <span className="text-[10px] font-mono text-text-dim">
                        {build.authorName}
                      </span>
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
