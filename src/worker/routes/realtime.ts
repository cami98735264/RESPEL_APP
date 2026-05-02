import { Hono } from "hono";

const realtime = new Hono<{ Bindings: Env }>();

function getStub(env: Env): DurableObjectStub {
  const id = env.NOTIFICATION_HUB.idFromName("global");
  return env.NOTIFICATION_HUB.get(id);
}

realtime.get("/ws", async (c) => {
  const upgrade = c.req.header("Upgrade");
  if (upgrade !== "websocket") {
    return c.text("Se esperaba conexion websocket", 426);
  }
  const stub = getStub(c.env);
  const url = new URL(c.req.url);
  url.pathname = "/ws";
  const forwarded = new Request(url.toString(), c.req.raw);
  return stub.fetch(forwarded);
});

realtime.get("/snapshot", async (c) => {
  const stub = getStub(c.env);
  const url = new URL(c.req.url);
  url.pathname = "/snapshot";
  const res = await stub.fetch(url.toString(), { method: "GET" });
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
});

export default realtime;
