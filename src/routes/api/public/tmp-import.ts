import { createFileRoute } from "@tanstack/react-router";

// TEMPORARY one-off import endpoint. Delete after the CSV import is done.
export const Route = createFileRoute("/api/public/tmp-import")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = request.headers.get("x-import-secret");
        if (secret !== "pkmr-one-off-import") {
          return new Response("no", { status: 401 });
        }
        const rows = (await request.json()) as Record<string, unknown>[];
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("products").upsert(rows);
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
        return new Response(JSON.stringify({ inserted: rows.length }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
