import { createFileRoute } from "@tanstack/react-router";

const SECRET = "tmp-8f2a91c4-backfill";

export const Route = createFileRoute("/api/public/tmp-backfill")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("key") !== SECRET) return new Response("no", { status: 401 });
        const body = (await request.json()) as {
          updates: { id: string; images: string[]; qc: string[] }[];
        };
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        let saved = 0;
        for (const u of body.updates ?? []) {
          const patch: Record<string, unknown> = {};
          if (u.images?.length) {
            patch["images"] = u.images.slice(0, 24);
            patch["image_url"] = u.images[0];
          }
          if (u.qc?.length) patch["qc_images"] = u.qc.slice(0, 40);
          if (!Object.keys(patch).length) continue;
          const { error } = await supabaseAdmin.from("products").update(patch).eq("id", u.id);
          if (!error) saved++;
        }
        return Response.json({ saved });
      },
      GET: async ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("key") !== SECRET) return new Response("no", { status: 401 });
        const offset = Number(url.searchParams.get("offset") ?? 0);
        const listOnly = url.searchParams.get("list") === "1";
        const limit = Math.min(40, Number(url.searchParams.get("limit") ?? 20));

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { fetchAgentDetails, productSourceUrl } = await import("@/lib/agentApi");

        const { data: rows, error } = await supabaseAdmin
          .from("products")
          .select("id, image_url, images, qc_images, store_url, qc_url, agent_links")
          .like("image_url", "/api/public/%")
          .order("created_at")
          .range(offset, offset + limit - 1);

        if (error) return Response.json({ error: error.message }, { status: 500 });

        if (listOnly) return Response.json({ rows });
        let updated = 0;
        let skipped = 0;
        const diag: string[] = [];
        const items = rows ?? [];
        for (let i = 0; i < items.length; i += 5) {
          await Promise.all(
            items.slice(i, i + 5).map(async (p: any) => {
              const src = productSourceUrl(p);
              if (!src) return void (skipped++, diag.push("nosrc"));
              const d = await fetchAgentDetails(src).catch((e) => {
                diag.push("err:" + String(e).slice(0, 80));
                return null;
              });
              if (!d) return void (skipped++, diag.push("nodata:" + src.slice(0, 60)));

              const ext = (u: string) => /^https?:\/\//i.test(u);
              const images = Array.from(
                new Set([...d.images, ...(p.images ?? []).filter(ext)]),
              ).slice(0, 24);
              const qc = Array.from(
                new Set([...(p.qc_images ?? []).filter(ext), ...d.qcImages]),
              ).slice(0, 40);
              const patch: Record<string, unknown> = {};
              if (images.length) patch["images"] = images;
              if (qc.length) patch["qc_images"] = qc;
              if ((!p.image_url || !ext(p.image_url)) && images.length) patch["image_url"] = images[0];
              if (!Object.keys(patch).length) return void skipped++;
              const { error: e2 } = await supabaseAdmin.from("products").update(patch).eq("id", p.id);
              if (e2) skipped++;
              else updated++;
            }),
          );
        }
        return Response.json({ count: items.length, updated, skipped, diag: diag.slice(0,6), next: offset + items.length });
      },
    },
  },
});
