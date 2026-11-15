import { expect, test, type WebSocketRoute } from "@playwright/test";
import { loginAs, STUDENT } from "../design/helpers";

for (const width of [1280, 390]) {
  test(`message history and reconnect catch-up at ${String(width)}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await loginAs(page, STUDENT);
    const message = (id: number) => ({
      id,
      conversation_id: 901,
      sender_id: 9999,
      body: `Sync message ${String(id)}`,
      created_at: "2026-11-15T00:00:00Z",
      is_mine: false,
      is_unsent: false,
    });
    const messages = Array.from({ length: 501 }, (_, index) => message(index + 1));
    let releaseInitial!: () => void;
    const initialGate = new Promise<void>((resolve) => {
      releaseInitial = resolve;
    });
    let firstRequest = true;
    let reads = 0;
    const cursors: number[] = [];
    const sockets: WebSocketRoute[] = [];
    let subscriptions = 0;
    await page.route("**/broadcasting/auth", (route) =>
      route.fulfill({ json: { auth: "test:signature" } }),
    );
    await page.route(/\/api\/conversations(?:\?|$)/, (route) =>
      route.fulfill({
        json: {
          data: [
            {
              id: 901,
              student_id: 1,
              landlord_id: 9999,
              other_user: { id: 9999, name: "Sync test", role: "landlord" },
              listing: null,
              unread_count: 501,
            },
          ],
        },
      }),
    );
    await page.route("**/api/conversations/901/read", (route) => {
      reads += 1;
      return route.fulfill({ json: { data: null } });
    });
    await page.route(/\/api\/conversations\/901\/messages(?:\?|$)/, async (route) => {
      const after = Number(new URL(route.request().url()).searchParams.get("after_id") ?? 0);
      cursors.push(after);
      const snapshot = messages.filter((row) => row.id > after).slice(0, 500);
      if (firstRequest) {
        firstRequest = false;
        await initialGate;
      }
      await route.fulfill({ json: { data: snapshot } });
    });
    await page.routeWebSocket(/\/app\//, (socket) => {
      sockets.push(socket);
      socket.send(
        JSON.stringify({
          event: "pusher:connection_established",
          data: JSON.stringify({
            socket_id: `${String(sockets.length)}.123`,
            activity_timeout: 120,
          }),
        }),
      );
      socket.onMessage((data) => {
        if (typeof data !== "string") return;
        const frame = JSON.parse(data) as { event: string; data: { channel?: string } };
        if (frame.event === "pusher:subscribe") {
          socket.send(
            JSON.stringify({
              event: "pusher_internal:subscription_succeeded",
              channel: frame.data.channel,
              data: {},
            }),
          );
          if (frame.data.channel === "private-conversation.901") subscriptions += 1;
        }
        if (frame.event === "pusher:ping")
          socket.send(JSON.stringify({ event: "pusher:pong", data: {} }));
      });
    });
    await page.goto("/messages/901");
    await expect.poll(() => subscriptions).toBe(1);
    await expect.poll(() => cursors.length).toBe(1);
    messages.push(message(502), message(503));
    sockets[0]!.send(
      JSON.stringify({
        event: "message.sent",
        channel: "private-conversation.901",
        data: { message: message(503) },
      }),
    );
    expect(reads).toBe(0);
    releaseInitial();
    const thread = page.getByTestId("thread");
    await expect(thread.getByText("Sync message 501", { exact: true })).toHaveCount(1);
    await expect(thread.getByText("Sync message 502", { exact: true })).toHaveCount(1);
    await expect(thread.getByText("Sync message 503", { exact: true })).toHaveCount(1);
    await expect.poll(() => reads).toBeGreaterThan(0);
    expect(cursors).toContain(500);
    messages.push(message(504)); // Persisted while disconnected; no realtime event.
    await sockets[0]!.close({ code: 4200, reason: "Simulated reconnect" });
    await expect.poll(() => subscriptions, { timeout: 15000 }).toBe(2);
    await expect(thread.getByText("Sync message 504", { exact: true })).toHaveCount(1);
    expect(cursors).toContain(503);
  });
}
