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

  try {
    const body = await request.json();
    const number = String(body.number || "").trim();

    if (!/^\d{1,20}$/.test(number)) {
      return new Response(
        JSON.stringify({ error: "抽選番号が正しくありません" }),
        { status: 400, headers }
      );
    }

    const store = getStore("naruto-draw");
    const key = `ticket-${number}`;

    // すでに抽選済みなら、保存されている同じ結果を返す
    // 新しい番号なら一度だけ結果を保存する
    const existing = await store.get(key, { type: "json", consistency: "strong" });
    if (existing && typeof existing.win === "boolean") {
      return new Response(
        JSON.stringify({ win: existing.win }),
        { status: 200, headers }
      );
    }

    const win = Math.random() < 0.15;
    await store.set(key, JSON.stringify({
      win,
      usedAt: new Date().toISOString()
    }), {
      onlyIfNew: true
    });

    // set() の戻り値に依存せず、保存された確定結果を読み直す
    const savedResult = await store.get(key, { type: "json", consistency: "strong" });
    if (!savedResult || typeof savedResult.win !== "boolean") {
      throw new Error("抽選結果を保存できませんでした");
    }

    return new Response(
      JSON.stringify({ win: savedResult.win }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error("draw function error:", error);
    return new Response(
      JSON.stringify({ error: "抽選エラー: " + (error?.message || String(error)) }),
      { status: 500, headers }
    );
  }
};
