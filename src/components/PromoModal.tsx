import { useEffect, useMemo, useState } from "react";
import { useAgents, useSettings } from "@/lib/store";
import { useLang } from "@/lib/i18n";

/** 12 godzin w sekundach — licznik odlicza od nowa przy każdym wejściu. */
const COUNTDOWN = 12 * 60 * 60;

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-primary/40 bg-secondary text-sm">
        {icon}
      </span>
      <span className="flex-1 text-left text-[13px] font-semibold leading-tight">{label}</span>
      <span className="text-sm font-extrabold text-primary">{value}</span>
    </div>
  );
}

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 rounded-2xl border border-border bg-surface py-2 text-center">
      <p className="font-display text-xl font-black leading-none">{value}</p>
      <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export function PromoModal() {
  const { t } = useLang();
  const { data: settings } = useSettings();
  const { data: agents } = useAgents();
  const [open, setOpen] = useState(false);
  const [left, setLeft] = useState(COUNTDOWN);
  const [agentId, setAgentId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const i = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(i);
  }, [open]);

  const list = useMemo(() => (agents ?? []).filter((a) => a.referral_url), [agents]);
  const agent = list.find((a) => a.id === agentId) ?? list[0] ?? null;

  if (!open || !settings) return null;

  const banner = agent?.avatar_url || settings["promo_banner_url"] || settings["agent_logo_url"];
  const link = agent?.referral_url || settings["primary_agent_url"] || "#";

  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-deep/85 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl border border-primary/30 bg-surface-deep p-5 glow-ring">
        <button
          onClick={() => setOpen(false)}
          aria-label={t("ui.close")}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:border-primary hover:text-primary"
        >
          ✕
        </button>

        {/* Wybór agenta — lewy górny róg */}
        <div className="flex items-center gap-2 pr-10">
          {banner ? (
            <img
              src={banner}
              alt={agent?.name ?? "Agent"}
              className="h-9 w-9 rounded-xl object-cover glow-ring"
            />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-sm">
              🛍
            </span>
          )}
          <div className="flex flex-wrap items-center gap-1">
            {list.map((a) => (
              <button
                key={a.id}
                onClick={() => setAgentId(a.id)}
                title={a.name}
                className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                  agent?.id === a.id
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {a.avatar_url ? (
                  <img src={a.avatar_url} alt="" className="h-4 w-4 rounded-full object-cover" />
                ) : null}
                {a.name}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          {t("promo.kicker")}{agent ? ` ${agent.name}` : ""}.
        </p>
        <h2 className="mt-1 text-2xl font-black leading-tight">
          {t("promo.title1")} <span className="text-gradient-brand">{t("promo.title2")}</span>
        </h2>
        <p className="mt-2 text-[13px] text-muted-foreground">
          {t("promo.desc")}
        </p>

        <div className="mt-4 space-y-2">
          <Row icon="🏷" label={t("promo.row1")} value="+3 500 PLN" />
          <Row icon="🚚" label={t("promo.row2")} value="−40%" />
          <Row icon="%" label={t("promo.row3")} value="−40%" />
        </div>

        <div className="mt-4 flex gap-2">
          <Unit value={pad(h)} label={t("promo.hours")} />
          <Unit value={pad(m)} label={t("promo.minutes")} />
          <Unit value={pad(s)} label={t("promo.seconds")} />
        </div>

        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="mt-4 block rounded-2xl gradient-brand px-6 py-3.5 text-center text-sm font-extrabold text-surface-deep transition-transform hover:scale-[1.02]"
        >
          {t("promo.cta")}
        </a>

        <button
          onClick={() => setOpen(false)}
          className="mt-2 w-full text-center text-[11px] text-muted-foreground hover:text-foreground"
        >
          {t("promo.decline")}
        </button>
      </div>
    </div>
  );
}
