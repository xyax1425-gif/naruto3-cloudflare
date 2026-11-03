
import { getStore } from "@netlify/blobs";

export default async (request) => {
  const headers = {
    "Content-Type": "application/json"
  };

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "不正なアクセスです" }),
      { status: 405, headers }
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "入力を確認してください" }),
      { status: 400, headers }
    );
  }

  const number = String(body.number ?? "").trim();

  if (!/^[0-9]{1,30}$/.test(number)) {
    return new Response(
      JSON.stringify({ error: "番号を確認してください" }),
      { status: 400, headers }
    );
  }

  try {
    const store = getStore("naruto-used-ticket-numbers");

    const win = Math.random() < 0.15;

    const { modified } = await store.set(
      number,
      JSON.stringify({
        win,
        usedAt: new Date().toISOString()
      }),
      { onlyIfNew: true }
    );

    if (!modified) {
      return new Response(
        JSON.stringify({ error: "この番号は使用済みです" }),
        { status: 409, headers }
      );
    }

    return new Response(
      JSON.stringify({ win }),
      { status: 200, headers }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "抽選に失敗しました。もう一度お試しください。"
      }),
      { status: 500, headers }
    );
  }
};
