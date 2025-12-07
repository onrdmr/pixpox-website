import { Hono } from "hono";

const mangaRouter = new Hono();

// =======================================
// 📌 TEK ENDPOINT: GET /manga
// - aktif mangayı döndürür
// - manga sayfalarını ekler
// =======================================
mangaRouter.get("/", async (c) => {
  const sql = c.env.SQL;

  // 1) Aktif manga (zaten 1 tane var)
  const mangaResult = await sql`
      SELECT *
      FROM "Manga"
      WHERE is_deleted = false
        AND is_active = true
      LIMIT 1
  `;

  if (mangaResult.length === 0) {
    return c.json({ error: "No active manga found" }, 404);
  }

  const manga = mangaResult[0];

  // 2) Manga sayfaları
  const pages = await sql`
      SELECT page_number, image_url
      FROM "MangaPages"
      WHERE manga_id = ${manga.id}
      ORDER BY page_number ASC
  `;

  return c.json({
    manga,
    pages,
    source: "database"
  });
});

export default mangaRouter;
