import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAgents, useGuideSteps, useSettings } from "@/lib/store";
import { HaulCalculator } from "@/components/HaulCalculator";
import { convertLink, extractSourceLink } from "@/lib/linkConverter";
import { useLang } from "@/lib/i18n";
import { useServerFn } from "@tanstack/react-start";
import { trackParcel, type TrackResult } from "@/lib/tracking.functions";

export const Route = createFileRoute("/poradnik")({
  head: () => ({
    meta: [
      { title: "Poradnik & Narzędzia — PKMREPS" },
      {
        name: "description",
        content:
          "Śledzenie paczek, QC Inspector i konwerter linków 1688/Taobao oraz poradniki krok po kroku.",
      },
      { property: "og:title", content: "Poradnik & Narzędzia — PKMREPS" },
      {
        property: "og:description",
        content: "Interaktywne narzędzia i instrukcje zamawiania przez agenta.",
      },
    ],
  }),
  component: PoradnikPage,
});

const card = "rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-primary/50";
const field =
  "w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm outline-none focus:border-primary";
const cta = "mt-3 w-full rounded-lg gradient-brand px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-surface-deep";

function addDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" });
}

function PackageTracker() {
  const { t } = useLang();
  const track = useServerFn(trackParcel);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);

  const run = async () => {
    const value = code.trim();
    if (value.length < 6) {
      setError(t("guide.trackShort"));
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await track({ data: { code: value } });
      if (!res.ok) setError(t("guide.trackNotFound"));
      else setResult(res);
    } catch {
      setError(t("guide.trackNotFound"));
    } finally {
      setLoading(false);
    }
  };

  const eta = (() => {
    if (!result) return "";
    const min = result.minDays ?? 0;
    const max = result.maxDays ?? 0;
    if (max === 0) return t("guide.trackToday");
    if (min === max) return `${max} ${max === 1 ? t("guide.trackDay") : t("guide.trackDays")}`;
    if (min === 0) return `≤ ${max} ${t("guide.trackDays")}`;
    return `${min}–${max} ${t("guide.trackDays")}`;
  })();

  return (
    <div className={card}>
      <h3 className="text-base font-bold">{t("guide.trackTitle")}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{t("guide.trackDesc")}</p>
      <input
        className={`${field} mt-3`}
        placeholder={t("guide.trackPlaceholder")}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void run();
        }}
      />
      <button type="button" className={cta} onClick={() => void run()} disabled={loading}>
        {loading ? t("guide.trackLoading") : t("guide.trackCta")}
      </button>

      {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}

      {result ? (
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("guide.trackEta")}
          </p>
          <p className="mt-1 text-lg font-extrabold text-primary">{eta}</p>
          {(result.maxDays ?? 0) > 0 ? (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t("guide.trackArrival")}: {addDays(result.minDays ?? 0)}
              {result.minDays === result.maxDays ? "" : ` – ${addDays(result.maxDays ?? 0)}`}
            </p>
          ) : null}
          <p className="mt-3 text-xs font-bold text-foreground">{t(`track.${result.stageKey}`)}</p>
          {result.estimated ? (
            <p className="mt-1 text-[11px] text-muted-foreground">{t("guide.trackEstimated")}</p>
          ) : (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {result.lastStatus}
              {result.lastTime ? ` · ${result.lastTime}` : ""}
            </p>
          )}

          <p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
            {t("guide.trackSource")}: {result.source}
          </p>
        </div>
      ) : null}
    </div>
  );
}


function QcInspector() {
  const { t } = useLang();
  const [id, setId] = useState("");
  const link = id.trim() ? `https://cnfans.com/qc?id=${encodeURIComponent(id.trim())}` : "";

  return (
    <div className={card}>
      <h3 className="text-base font-bold">{t("guide.qcTitle")}</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("guide.qcDesc")}
      </p>
      <input
        className={`${field} mt-3`}
        placeholder={t("guide.qcPlaceholder")}
        value={id}
        onChange={(e) => setId(e.target.value)}
      />
      <a
        href={link || "#"}
        target="_blank"
        rel="noreferrer"
        aria-disabled={!link}
        className={`${cta} block text-center ${link ? "" : "pointer-events-none opacity-50"}`}
      >
        {t("guide.qcCta")}
      </a>
    </div>
  );
}

function LinkConverter() {
  const { t } = useLang();
  const { data: agents } = useAgents();
  const { data: settings } = useSettings();
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState("");

  const list = agents ?? [];
  const source = extractSourceLink(url);
  const invalid = url.trim().length > 0 && !source;

  const linkFor = (name: string) =>
    convertLink(source?.url ?? "", name, settings?.[`converter_${name.trim().toLowerCase()}`]);

  return (
    <div className={card}>
      <h3 className="text-base font-bold">{t("guide.convTitle")}</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("guide.convDesc")}
      </p>
      <input
        className={`${field} mt-3`}
        placeholder={t("guide.convPlaceholder")}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      {invalid ? (
        <p className="mt-3 text-[11px] text-destructive">
          {t("guide.convInvalid")}
        </p>
      ) : null}

      {source ? (
        <>
          <p className="mt-3 break-all rounded-lg border border-border bg-secondary px-2 py-1.5 text-[11px] text-muted-foreground">
            {t("guide.source")} <span className="text-brand-cyan">{source.url}</span>
          </p>
          <div className="mt-3 space-y-2">
            {list.map((a) => {
              const out = linkFor(a.name);
              return (
                <div key={a.id} className="flex items-center gap-2">
                  <a
                    href={out}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-1 items-center gap-2 rounded-lg gradient-brand px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide text-surface-deep transition-transform hover:scale-[1.02]"
                  >
                    {a.avatar_url ? (
                      <img src={a.avatar_url} alt="" className="h-4 w-4 rounded-full object-cover" />
                    ) : null}
                    {t("guide.openIn")} {a.name}
                  </a>
                  <button
                    className="rounded-lg border border-border px-2 py-2 text-[11px] font-semibold hover:border-primary hover:text-primary"
                    onClick={() => {
                      void navigator.clipboard.writeText(out);
                      setCopied(a.id);
                      setTimeout(() => setCopied(""), 1500);
                    }}
                  >
                    {copied === a.id ? "OK" : t("guide.copy")}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}



function PoradnikPage() {
  const { t } = useLang();
  const { data: steps } = useGuideSteps();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-black">
        {t("guide.title1")} <span className="text-gradient-brand">{t("guide.title2")}</span>
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("guide.subtitle")}
      </p>

      <section className="mt-8 grid gap-5 lg:grid-cols-3">
        <PackageTracker />
        <QcInspector />
        <LinkConverter />
      </section>

      <section className="mt-8">
        <HaulCalculator />
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-black">
          {t("guide.stepsTitle1")} <span className="text-gradient-brand">{t("guide.stepsTitle2")}</span>
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("guide.stepsSubtitle")}
        </p>

        <div className="mt-6 space-y-5">
          {(steps ?? []).map((s) => (
            <article
              key={s.id}
              className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-primary/50 sm:flex-row"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-brand font-display text-lg font-black text-surface-deep">
                {s.step_number}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">
                  {t("guide.step")} {s.step_number}: {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.description}
                </p>
                {s.image_url ? (
                  <img
                    src={s.image_url}
                    alt={s.title}
                    loading="lazy"
                    className="mt-4 w-full rounded-xl border border-border object-cover"
                  />
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
