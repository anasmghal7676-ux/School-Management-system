export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return new Response('Missing userId', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const send = async () => {
        try {
          const unread = await db.notification.count({
            where: { userId, isRead: false },
          });
          const data = `data: ${JSON.stringify({ unreadCount: unread })}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
        } catch {
          // ignore DB errors in stream
        }
      };

      // Send initial count immediately
      send();
      
      const interval = setInterval(send, 10000); // every 10 seconds

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
