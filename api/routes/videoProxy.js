// routes/videoProxy.js
import { Hono } from 'hono';

const proxy = new Hono();

proxy.get('/:id', async (c) => {
  const videoId = c.req.param('id');
  const sql = c.env.SQL;

  // 1) Video bilgisini al
  const [video] = await sql`SELECT * FROM public."Video" WHERE id = ${videoId} AND is_deleted = false`;
  if (!video) return c.json({ error: 'Video not found' }, 404);

  const videoUrl = video.video_url.trim();

  // 2) R2'den stream başlat
  const res = await fetch(videoUrl, {
    headers: {
      Range: c.req.header('Range') || 'bytes=0-',
    },
  });

  if (!res.ok) return c.json({ error: 'R2 stream failed' }, 502);

  // 3) Yanıt başlıklarını ayarla
  c.header('Content-Type', 'video/ogg');
  c.header('Content-Disposition', 'inline');
  c.header('Accept-Ranges', 'bytes');
  c.header('Content-Length', res.headers.get('Content-Length'));
  c.header('Content-Range', res.headers.get('Content-Range'));

  // 4) Stream’i döndür
  return c.body(res.body, res.status);
});

export default proxy;