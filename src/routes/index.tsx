import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RepoView — Veja sites do GitHub" },
      { name: "description", content: "Cole o link de um repositório do GitHub e veja o site carregado." },
      { property: "og:title", content: "RepoView — Veja sites do GitHub" },
      { property: "og:description", content: "Cole o link de um repositório do GitHub e veja o site carregado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function parse(url: string) {
  const m = url.trim().match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/i);
  if (!m) return null;
  return { owner: m[1] ?? "", repo: (m[2] ?? "").replace(/\.git$/, "") };
}

function Index() {
  const [link, setLink] = useState("");
  const [src, setSrc] = useState<string | null>(null);
  const [options, setOptions] = useState<{ label: string; url: string }[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const p = parse(link);
    if (!p) return setError("Link inválido. Ex: https://github.com/usuario/projeto");
    setLoading(true);
    let branch = "main";
    let pages = false;
    try {
      const r = await fetch(`https://api.github.com/repos/${p.owner}/${p.repo}`);
      if (r.ok) {
        const d = await r.json();
        branch = d.default_branch || "main";
        pages = !!d.has_pages;
      }
    } catch {}
    const ghPages = `https://${p.owner}.github.io/${p.repo}/`;
    const raw = (path: string) => `https://raw.githack.com/${p.owner}/${p.repo}/${branch}/${path}`;
    const opts = [
      { label: "GitHub Pages", url: ghPages },
      { label: "index.html", url: raw("index.html") },
      { label: "docs/", url: raw("docs/index.html") },
      { label: "dist/", url: raw("dist/index.html") },
      { label: "build/", url: raw("build/index.html") },
      { label: "public/", url: raw("public/index.html") },
    ];
    setOptions(opts);
    setSrc(pages ? ghPages : raw("index.html"));
    setLoading(false);
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <form onSubmit={load} className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <span className="font-mono text-sm font-bold text-primary">RepoView</span>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://github.com/usuario/projeto"
          className="min-w-0 flex-1 rounded-md border border-input bg-card px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          {loading ? "Carregando..." : "Carregar"}
        </button>
        {src && (
          <a href={src} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground underline">
            Abrir em nova aba
          </a>
        )}
      </form>
      {options.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-border px-3 py-2 text-xs">
          <span className="text-muted-foreground">Não apareceu? Tente:</span>
          {options.map((o) => (
            <button
              key={o.url}
              onClick={() => setSrc(o.url)}
              className={`rounded px-2 py-1 font-mono ${src === o.url ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
      {error && <p className="p-3 text-sm text-destructive">{error}</p>}
      {src ? (
        <iframe key={src} src={src} title="Site" className="w-full flex-1 border-0 bg-card" />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Cole um link do GitHub</h1>
          <p className="max-w-md text-muted-foreground">O site do repositório será carregado aqui.</p>
        </div>
      )}
    </div>
  );
}
