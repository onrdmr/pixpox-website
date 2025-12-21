import { Hono } from "hono";
// import { selectDataSource, booksMockUtils } from "../lib/utils.js";

const videosRouter = new Hono();
videosRouter.get("/random", async (c) => {
  const sql = c.env.SQL;

  // TEK SORGULUK KESİN ÇÖZÜM:
  // Bu sorgu: 10 saniye geçtiyse günceller, geçmediyse sadece mevcut olanı getirir.
  const result = await sql`
    WITH check_time AS (
      SELECT 
        id, 
        video_id,
        (updated_at < NOW() - INTERVAL '10 seconds') as needs_update
      FROM public."VideoSeed"
      WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
    ),
    updater AS (
      INSERT INTO public."VideoSeed" (id, video_id, updated_at)
      SELECT 
        '00000000-0000-0000-0000-000000000001'::uuid, 
        (SELECT v.id FROM public."Video" v 
         INNER JOIN "Beatmap" b ON v.id = b.id 
         WHERE v.is_active = true AND v.is_deleted = false 
         ORDER BY RANDOM() LIMIT 1), 
        NOW()
      WHERE NOT EXISTS (SELECT 1 FROM check_time) OR (SELECT needs_update FROM check_time)
      ON CONFLICT (id) DO UPDATE SET 
        video_id = EXCLUDED.video_id, 
        updated_at = EXCLUDED.updated_at
      RETURNING video_id
    )
    SELECT
      b.json_data,
      v.*,
      cu.comment_urls,
      vs.updated_at as last_sync -- Ne zaman güncellendiğini görelim
    FROM public."Video" v
    INNER JOIN "Beatmap" b ON v.id = b.id
    INNER JOIN public."VideoSeed" vs ON vs.video_id = v.id
    LEFT JOIN LATERAL (
      SELECT json_agg(c.comment_url) AS comment_urls
      FROM "Comment" c
      WHERE c.video_id = v.id
    ) cu ON TRUE
    WHERE vs.id = '00000000-0000-0000-0000-000000000001'::uuid
    LIMIT 1;
  `;

  return c.json({ 
    videos: result,
    strategy: "atomic-10s-sync"
  });
});
// ✅ List videos (with filtering, sorting, pagination, and random selection)
videosRouter.get("/", async (c) => {
  const { genre, sort, limit = "10", offset = "0" } = c.req.query();
  const sql = c.env.SQL;

  const limitVal = Math.min(parseInt(limit, 10) || 10, 100); // max 100
  const offsetVal = parseInt(offset, 10) || 0;

  let query = sql`SELECT
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
WHERE v.is_deleted = false
  AND v.is_active = true`;

  // 🔹 Filter by genre
  if (genre) {
    query = sql`SELECT v.* FROM public."Video" v on WHERE v.is_deleted = false AND v.is_active = true AND v.genre = ${genre}`;
  }

  // 🔹 Apply sorting
  switch (sort) {
    case "title_asc":
      query = sql`${query} ORDER BY title ASC`;
      break;
    case "title_desc":
      query = sql`${query} ORDER BY title DESC`;
      break;
    case "author_asc":
      query = sql`${query} ORDER BY author ASC`;
      break;
    case "author_desc":
      query = sql`${query} ORDER BY author DESC`;
      break;
    case "random":
      query = sql`${query} ORDER BY RANDOM()`;
      break;
    default:
      query = sql`${query} ORDER BY created_at DESC`;
      break;
  }

  // 🔹 Apply pagination
  query = sql`${query} LIMIT ${limitVal} OFFSET ${offsetVal}`;

  const videos = await query;

  return c.json({
    videos,
    pagination: {
      limit: limitVal,
      offset: offsetVal,
      count: videos.length,
    },
    source: "database",
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
