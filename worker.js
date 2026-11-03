export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/draw") {
      if (request.method !== "POST") return Response.json({ error: "この操作は利用できません。" }, { status: 405 });
      try {
        const body = await request.json();
        const number = String(body.number ?? "").trim();
        if (!/^\d{4}$/.test(number)) return Response.json({ error: "抽選番号を4桁の数字で入力してください。" }, { status: 400 });
        const id = env.TICKET_STORE.idFromName("global-ticket-draw");
        const store = env.TICKET_STORE.get(id);
        return await store.fetch("https://ticket-store/draw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ number })
        });
      } catch {
        return Response.json({ error: "通信に失敗しました。もう一度お試しください。" }, { status: 400 });
      }
    }
    return env.ASSETS.fetch(request);
  }
};

export class TicketStore {
  constructor(ctx) { this.ctx = ctx; }
  async fetch(request) {
    const { number } = await request.json();
    return this.ctx.storage.transaction(async (txn) => {
      const used = await txn.get(number);
      if (used) return Response.json({ error: "この番号は抽選済みです。" }, { status: 409 });
      const win = Math.random() < 0.15;
      await txn.put(number, { win, usedAt: new Date().toISOString() });
      return Response.json({ win });
    });
  }
}
