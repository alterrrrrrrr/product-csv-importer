import { createServerFn } from "@tanstack/react-start";

/** Pobiera arkusz Google Sheets / plik CSV z publicznego linku (omija CORS). */
export const fetchSheetCsv = createServerFn({ method: "POST" })
  .inputValidator((data: { url: string }) => {
    const url = String(data?.url ?? "").trim();
    if (!/^https:\/\//i.test(url)) throw new Error("Podaj publiczny link https");
    return { url };
  })
  .handler(async ({ data }) => {
    let url = data.url;
    // Zwykły link do arkusza → eksport CSV.
    const m = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (m && !/output=csv|format=csv/.test(url)) {
      const gid = url.match(/[#&?]gid=(\d+)/)?.[1] ?? "0";
      url = `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=${gid}`;
    }
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error("Nie udało się pobrać arkusza (czy jest publiczny?)");
    const text = await res.text();
    if (text.trim().startsWith("<")) throw new Error("Arkusz nie jest publiczny (brak dostępu)");
    return { csv: text.slice(0, 2_000_000) };
  });
