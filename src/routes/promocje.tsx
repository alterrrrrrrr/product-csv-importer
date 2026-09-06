import { createFileRoute } from "@tanstack/react-router";
import { usePromos } from "@/lib/store";

export const Route = createFileRoute("/promocje")({
  head: () => ({
    meta: [
      { title: "Promocje sklepów i produktów — PKMREPS" },
      {
        name: "description",
        content:
          "Aktualne promocje sprzedawców i produktów: przeceny, wyprzedaże i limitowane oferty.",
      },
      { property: "og:title", content: "Promocje sklepów i produktów — PKMREPS" },
      {
        property: "og:description",
        content: "Linki do sklepów i produktów z informacją o aktualnych promocjach.",
      },
    ],
  }),
  component: PromocjePage,
});

function PromocjePage() {
  const { data: promos } = usePromos();
  const list = promos ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-black">
        Aktualne <span className="text-gradient-brand">promocje</span>
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sklepy i produkty z aktywnymi przecenami — dodawane na bieżąco.
      </p>

      {list.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted-foreground">
          Brak aktywnych promocji. Zajrzyj później.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <article
              key={p.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:-translate-y-1 hover:border-primary hover:glow-ring"
            >
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt={p.title}
                  loading="lazy"
                  decoding="async"
                  className="aspect-video w-full object-cover"
                />
              ) : null}
              <div className="flex flex-1 flex-col gap-2 p-5">
                <h2 className="text-base font-bold">{p.title}</h2>
                {p.description ? (
                  <p className="text-xs leading-relaxed text-muted-foreground">{p.description}</p>
                ) : null}
                {p.link_url ? (
                  <a
                    href={p.link_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-auto rounded-lg gradient-brand px-4 py-2 text-center text-xs font-extrabold uppercase tracking-wide text-surface-deep transition-all hover:brightness-110"
                  >
                    Sprawdź promocję →
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
