import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  return (
    <div style={{ padding: 32, fontFamily: "monospace", color: "#8ab4f8" }}>
      <h1>Twilight Strand - TanStack Start</h1>
      <p>Scaffold working. Next step: port the full app.</p>
    </div>
  );
}
