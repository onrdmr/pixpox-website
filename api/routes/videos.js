import { Hono } from "hono";
// import { selectDataSource, booksMockUtils } from "../lib/utils.js";

const videosRouter = new Hono();

videosRouter.get("/random", async (c) => {
  const sql = c.env.SQL;

  const query = sql`
    WITH time_seed AS (
      SELECT floor(extract(epoch from now()) / 10)::text AS seed
    )
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
    CROSS JOIN time_seed
    WHERE v.is_deleted = false
      AND v.is_active = true
    ORDER BY md5(v.id::text || time_seed.seed)
    LIMIT 1
  `;

  const videos = await query;

  return c.json({
    video: videos[0] ?? null,
    source: "database",
    strategy: "10s-deterministic-random",
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
