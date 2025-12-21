import { Hono } from "hono";
// import { selectDataSource, booksMockUtils } from "../lib/utils.js";

const videosRouter = new Hono();

videosRouter.get("/random", async (c) => {
  const sql = c.env.SQL;

  // 1. Mevcut seed'i ve süresini kontrol et
  const current = await sql`SELECT updated_at FROM public."VideoSeed" LIMIT 1`;
  
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  // 2. Eğer kayıt yoksa veya 5 dakikadan eskiyse GÜNCELLE
  if (current.length === 0 || new Date(current[0].updated_at) < fiveMinutesAgo) {
    await sql`
      INSERT INTO public."VideoSeed" (id, video_id, updated_at)
      SELECT '00000000-0000-0000-0000-000000000001'::uuid, id, NOW()
      FROM public."Video" 
      WHERE is_active = true AND is_deleted = false
      ORDER BY RANDOM() LIMIT 1
      ON CONFLICT (id) DO UPDATE SET video_id = EXCLUDED.video_id, updated_at = EXCLUDED.updated_at;
    `;
  }

  // 3. Güncel videoyu getir
  const video = await sql`
    SELECT v.* FROM public."VideoSeed" vs 
    JOIN public."Video" v ON vs.video_id = v.id 
    WHERE vs.id = '00000000-0000-0000-0000-000000000001'
  `;

  return c.json({ videos: [video[0]] });
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
