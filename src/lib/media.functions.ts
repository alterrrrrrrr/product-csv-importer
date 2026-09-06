import { createServerFn } from "@tanstack/react-start";

/** Publiczne wyszukiwanie zdjęć QC po linku Weidian / Taobao / 1688 / agenta. */
export const lookupQc = createServerFn({ method: "POST" })
  .inputValidator((data: { url: string }) => {
    const url = String(data?.url ?? "").trim().slice(0, 2000);
    if (!/^https?:\/\//i.test(url)) throw new Error("Nieprawidłowy link.");
    return { url };
  })
  .handler(async ({ data }) => {
    const { fetchAgentDetails } = await import("@/lib/agentApi");
    const details = await fetchAgentDetails(data.url).catch(() => null);
    if (!details) return { ok: false as const, error: "not-found" };
    return {
      ok: true as const,
      title: details.title,
      priceCny: details.priceCny,
      images: details.images,
      colorImages: details.colorImages,
      qcImages: details.qcImages,
      sizes: details.sizes,
    };
  });

/**
 * Uzupełnia zdjęcia produktów (galeria, kolorystyki, QC) z otwartego API agenta.
 * Wywoływane z panelu admina — wymaga podpisanego tokenu sesji.
 */
export const syncProductMedia = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string; limit?: number; onlyMissing?: boolean }) => ({
    token: String(data?.token ?? "").slice(0, 4000),
    limit: Math.min(100, Math.max(1, Number(data?.limit) || 40)),
    onlyMissing: data?.onlyMissing !== false,
  }))
  .handler(async ({ data }) => {
    const { verifyToken } = await import("@/lib/session.server");
    const session = verifyToken(data.token);
    if (!session || session.role !== "admin") throw new Error("Unauthorized");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { fetchAgentDetails, productSourceUrl } = await import("@/lib/agentApi");

    let query = supabaseAdmin
      .from("products")
      .select("id, image_url, images, qc_images, store_url, qc_url, agent_links")
      .limit(data.limit);
    if (data.onlyMissing) query = query.or("image_url.is.null,image_url.like./api/public/%");

    const { data: rows, error } = await query;
    if (error) throw new Error("Nie udało się pobrać produktów.");

    let updated = 0;
    let skipped = 0;
    const items = rows ?? [];
    for (let i = 0; i < items.length; i += 5) {
      const chunk = items.slice(i, i + 5);
      await Promise.all(
        chunk.map(async (p: any) => {
          const src = productSourceUrl(p);
          if (!src) return void skipped++;
          const details = await fetchAgentDetails(src).catch(() => null);
          if (!details) return void skipped++;

          const external = (u: string) => /^https?:\/\//i.test(u);
          const keep = (p.images ?? []).filter(external);
          const images = Array.from(new Set([...details.images, ...keep])).slice(0, 24);
          const qc = Array.from(
            new Set([...(p.qc_images ?? []).filter(external), ...details.qcImages]),
          ).slice(0, 40);
          const mainOk = p.image_url && external(p.image_url);
          const patch: { images?: string[]; qc_images?: string[]; image_url?: string } = {};
          if (images.length) patch["images"] = images;
          if (qc.length) patch["qc_images"] = qc;
          if (!mainOk && images.length) patch["image_url"] = images[0];
          if (!Object.keys(patch).length) return void skipped++;

          const { error: upErr } = await supabaseAdmin.from("products").update(patch).eq("id", p.id);
          if (upErr) skipped++;
          else updated++;
        }),
      );
    }

    return { ok: true as const, checked: items.length, updated, skipped };
  });
