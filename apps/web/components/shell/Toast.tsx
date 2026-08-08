
import { create } from "zustand";

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (message: string, type?: "success" | "error" | "info") => void;
  removeToast: (id: number) => void;
}

let nextId = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type = "success") => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(message: string, type: "success" | "error" | "info" = "success") {
  useToastStore.getState().addToast(message, type);
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-lg shadow-xl text-xs font-mono backdrop-blur ${
            t.type === "success"
              ? "bg-green-400/10 border border-green-400/20 text-green-400"
              : t.type === "error"
                ? "bg-red-400/10 border border-red-400/20 text-red-400"
                : "bg-accent/10 border border-accent/20 text-accent"
          }`}
        >
          <span>{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="opacity-40 hover:opacity-100 ml-1"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}
