import React from "react";

export function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre key={i} className="bg-bg-inset rounded px-3 py-2 text-xs font-mono text-text-primary overflow-x-auto my-2">
            {codeLines.join("\n")}
          </pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (line.startsWith("### ")) {
      elements.push(<h4 key={i} className="text-xs font-mono font-bold text-text-heading mt-3 mb-1">{formatInline(line.slice(4))}</h4>);
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(<h3 key={i} className="text-sm font-mono font-bold text-text-heading mt-3 mb-1">{formatInline(line.slice(3))}</h3>);
      continue;
    }
    if (line.startsWith("# ")) {
      elements.push(<h2 key={i} className="text-base font-mono font-bold text-text-heading mt-3 mb-1">{formatInline(line.slice(2))}</h2>);
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <div key={i} className="flex gap-1.5 text-xs font-mono text-text-primary ml-2">
          <span className="text-text-dim shrink-0">-</span>
          <span>{formatInline(line.slice(2))}</span>
        </div>
      );
      continue;
    }

    const numMatch = line.match(/^(\d+)\.\s/);
    if (numMatch) {
      elements.push(
        <div key={i} className="flex gap-1.5 text-xs font-mono text-text-primary ml-2">
          <span className="text-text-dim shrink-0 w-3 text-right">{numMatch[1]}.</span>
          <span>{formatInline(line.slice(numMatch[0].length))}</span>
        </div>
      );
      continue;
    }

    if (/^---+$/.test(line)) {
      elements.push(<hr key={i} className="border-border-subtle my-2" />);
      continue;
    }

    if (!line.trim()) {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    elements.push(<p key={i} className="text-xs font-mono text-text-primary">{formatInline(line)}</p>);
  }

  return <>{elements}</>;
}

function formatInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
    const codeMatch = remaining.match(/`(.*?)`/);
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/);

    let earliest: { index: number; length: number; node: React.ReactNode } | null = null as { index: number; length: number; node: React.ReactNode } | null;

    if (boldMatch?.index !== undefined) {
      const candidate = { index: boldMatch.index, length: boldMatch[0].length, node: <strong key={key++} className="font-bold text-text-heading">{boldMatch[1]}</strong> };
      if (!earliest || candidate.index < (earliest as { index: number }).index) earliest = candidate;
    }
    if (codeMatch?.index !== undefined) {
      const candidate = { index: codeMatch.index, length: codeMatch[0].length, node: <code key={key++} className="bg-bg-inset px-1 rounded text-accent text-[11px]">{codeMatch[1]}</code> };
      if (!earliest || candidate.index < (earliest as { index: number }).index) earliest = candidate;
    }
    if (italicMatch?.index !== undefined && (!boldMatch || italicMatch.index !== boldMatch.index)) {
      const candidate = { index: italicMatch.index, length: italicMatch[0].length, node: <em key={key++} className="italic">{italicMatch[1]}</em> };
      if (!earliest || candidate.index < earliest.index) earliest = candidate;
    }

    if (!earliest) {
      parts.push(remaining);
      break;
    }

    if (earliest.index > 0) {
      parts.push(remaining.slice(0, earliest.index));
    }
    parts.push(earliest.node);
    remaining = remaining.slice(earliest.index + earliest.length);
  }

  return <>{parts}</>;
}
