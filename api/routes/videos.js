import { Hono } from "hono";
// import { selectDataSource, booksMockUtils } from "../lib/utils.js";

const videosRouter = new Hono();
videosRouter.get("/random", async (c) => {
  const sql = c.env.SQL;

  // Sadece VideoSeed tablosundaki o tek satırı ve ona bağlı video detaylarını getir
  const result = await sql`
    SELECT
      b.json_data,
      v.*,
      cu.comment_urls,
      vs.updated_at as global_sync_time
    FROM public."VideoSeed" vs
    INNER JOIN public."Video" v ON vs.video_id = v.id
    INNER JOIN "Beatmap" b ON v.id = b.id
    LEFT JOIN LATERAL (
      SELECT json_agg(c.comment_url) AS comment_urls
      FROM "Comment" c
      WHERE c.video_id = v.id
    ) cu ON TRUE
    WHERE vs.id = '00000000-0000-0000-0000-000000000001'::uuid
    LIMIT 1;
  `;

  // Eğer tablo boşsa (henüz cron çalışmadıysa) boş dizi dön
  return c.json({ 
    videos: result,
    source: "global-synced-seed"
  });
});
// ✅ List videos (with filtering, sorting, pagination, and random selection)
videosRouter.get("/", async (c) => {
  const { genre, sort, limit = "8", offset = "0" } = c.req.query();
  const sql = c.env.SQL;

  const limitVal = parseInt(limit, 10) || 8;
  const offsetVal = parseInt(offset, 10) || 0;

  // 1. Filtreleme Bloğu
  const whereClause = sql`
    WHERE v.is_deleted = false 
    AND v.is_active = true 
    ${genre ? sql`AND v.genre = ${genre}` : sql``}
  `;

  // 2. Toplam Kayıt Sayısını Al
  const totalRes = await sql`
    SELECT count(*)::int as total 
    FROM public."Video" v 
    ${whereClause}
  `;
  const totalCount = totalRes[0].total;

  // 3. Sayfa Hesaplamaları
  const totalPages = Math.ceil(totalCount / limitVal);
  const currentPage = Math.floor(offsetVal / limitVal) + 1;

  // 4. Videoları Getir
  const videos = await sql`
    SELECT
        b.json_data,
        v.*,
        cu.comment_urls
    FROM public."Video" v
    INNER JOIN "Beatmap" b ON v.id = b.id
    LEFT JOIN LATERAL (
        SELECT json_agg(c.comment_url) AS comment_urls
        FROM "Comment" c
        WHERE c.video_id = v.id
    ) cu ON TRUE
    ${whereClause}
    ORDER BY v.created_at DESC -- Sıralama tercihini buraya ekleyebilirsin
    LIMIT ${limitVal} OFFSET ${offsetVal}
  `;

  // 5. Genişletilmiş JSON Yanıtı
  return c.json({
    videos,
    pagination: {
      totalItems: totalCount,    // Toplam video sayısı (örn: 200)
      totalPages: totalPages,    // Toplam sayfa sayısı (örn: 25)
      currentPage: currentPage,  // Şu anki sayfa (örn: 1)
      limit: limitVal,           // Sayfa başına video
      offset: offsetVal          // Başlangıç noktası
    },
    source: "database"
  });
});

// ✅ Get single video by ID
videosRouter.get("/:id", async (c) => {
  const videoId = c.req.param("id");
  const sql = c.env.SQL;

  const result = await sql`SELECT * FROM public."Video" WHERE id = ${videoId} AND is_deleted = false`;

  if (result.length === 0) {
    return c.json({ error: "Video not found" }, 404);
  }

  return c.json({
    video: result[0],
    source: "database",
  });
});

export default videosRouter;
