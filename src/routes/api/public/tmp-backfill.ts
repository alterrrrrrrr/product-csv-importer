import { createFileRoute } from "@tanstack/react-router";

/** Tymczasowy endpoint serwisowy — uzupełnia zdjęcia i QC produktów. */
export const Route = createFileRoute("/api/public/tmp-backfill")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("key") !== "pkmr-fix-2026") {
          return new Response("no", { status: 401 });
        }
        const offset = Number(url.searchParams.get("offset") ?? 0);
        const limit = Math.min(40, Number(url.searchParams.get("limit") ?? 20));
        const mode = url.searchParams.get("mode") ?? "qc";

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { fetchAgentDetails, productSourceUrl } = await import("@/lib/agentApi");

        let q = supabaseAdmin
          .from("products")
          .select("id, image_url, images, qc_images, store_url, qc_url, agent_links")
          .order("created_at", { ascending: true })
          .range(offset, offset + limit - 1);
        if (mode === "qc") q = q.eq("qc_images", "{}");

        const { data: rows, error } = await q;
        if (error) return Response.json({ error: error.message }, { status: 500 });

        let updated = 0;
        let skipped = 0;
        const items = rows ?? [];
        for (let i = 0; i < items.length; i += 5) {
          await Promise.all(
            items.slice(i, i + 5).map(async (p: any) => {
              const src = productSourceUrl(p);
              if (!src) return void skipped++;
              const d = await fetchAgentDetails(src).catch(() => null);
              if (!d) return void skipped++;
              const external = (u: string) => /^https?:\/\//i.test(u);
              const images = Array.from(
                new Set([...d.images, ...(p.images ?? []).filter(external)]),
              ).slice(0, 24);
              const qc = Array.from(
                new Set([...(p.qc_images ?? []).filter(external), ...d.qcImages]),
              ).slice(0, 40);
              const patch: { images?: string[]; qc_images?: string[]; image_url?: string } = {};
              if (images.length) patch.images = images;
              if (qc.length) patch.qc_images = qc;
              if ((!p.image_url || !external(p.image_url)) && images.length) {
                patch.image_url = images[0]!;
              }
              if (!Object.keys(patch).length) return void skipped++;
              const { error: e } = await supabaseAdmin.from("products").update(patch).eq("id", p.id);
              if (e) skipped++;
              else updated++;
            }),
          );
        }
        return Response.json({ checked: items.length, updated, skipped });
      },
    },
  },
});
