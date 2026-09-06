import { createFileRoute } from "@tanstack/react-router";
import { useAgents, useSettings, useSocialLinks } from "@/lib/store";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/agenci")({
  head: () => ({
    meta: [
      { title: "Zaufani agenci i kupony — PKMREPS" },
      {
        name: "description",
        content:
          "Zaufani agenci zakupowi, kupony rejestracyjne $450 i 40% zniżki oraz społeczność Discord.",
      },
      { property: "og:title", content: "Zaufani agenci i kupony — PKMREPS" },
      {
        property: "og:description",
        content: "Odbierz kupony rejestracyjne i dołącz do społeczności.",
      },
    ],
  }),
  component: AgenciPage,
});

function AgenciPage() {
  const { data: agents } = useAgents();
  const { t } = useLang();
  const { data: settings } = useSettings();
  const { data: socials } = useSocialLinks();
  // Discord bierzemy z ręcznie dodanych linków social — nic nie dodaje się automatycznie.
  const discord = (socials ?? []).find((l) =>
    `${l.label} ${l.icon}`.toLowerCase().includes("discord"),
  )?.url;
  const code = settings?.["promo_code"] || "PKMR";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-black">
        {t("agents.title1")} <span className="text-gradient-brand">{t("agents.title2")}</span>
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("agents.subtitle")}
      </p>

      {discord ? (
        <a
          href={discord}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-block rounded-xl border border-primary/50 bg-surface px-5 py-2.5 text-xs font-extrabold uppercase tracking-wide text-primary transition-all hover:glow-ring-strong"
        >
          {t("agents.discord")}
        </a>
      ) : null}

      <div className="mt-8 rounded-2xl border border-primary/40 bg-surface p-6 glow-ring">
        <p className="text-sm uppercase tracking-widest text-primary animate-pulse-glow">
          {t("agents.limited")}
        </p>
        <p className="mt-2 text-2xl font-black">{t("agents.offer")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("agents.useCode1")} <span className="font-mono font-bold text-primary">{code}</span>{" "}
          {t("agents.useCode2")}
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(agents ?? []).map((a) => (
          <a
            key={a.id}
            href={a.referral_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-5 transition-all hover:-translate-y-1 hover:border-primary hover:glow-ring"
          >
            {a.avatar_url ? (
              <img
                src={a.avatar_url}
                alt={a.name}
                loading="lazy"
                className="h-11 w-11 rounded-xl object-cover"
              />
            ) : null}
            <div>
              <p className="font-bold">{a.name}</p>
              <p className="text-xs text-muted-foreground">{t("agents.cardCta")}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
