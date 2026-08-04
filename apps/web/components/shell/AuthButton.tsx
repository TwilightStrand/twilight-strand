"use client";

import { useState, useEffect } from "react";

interface User {
  name: string;
  image: string;
  email: string;
}

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(data => {
        setUser(data?.user || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.image && (
          <img src={user.image} alt="" className="w-5 h-5 rounded-full" />
        )}
        <span className="text-[10px] font-mono text-text-dim hidden lg:inline">
          {user.name}
        </span>
        <a
          href="/api/auth/signout"
          className="text-[10px] font-mono text-text-dim/40 hover:text-text-dim"
        >
          Logout
        </a>
      </div>
    );
  }

  return (
    <a
      href="/api/auth/signin"
      className="text-xs font-mono text-text-dim hover:text-accent transition-colors px-2 py-1 rounded hover:bg-bg-hover"
    >
      Login
    </a>
  );
}
