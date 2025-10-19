import { serve } from "@hono/node-server";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { appRouter } from "./router";
import { initDb } from "./db";

const app = new Hono();

// CORS 설정
app.use(
  "/*",
  cors({
    origin: "http://localhost:3001",
    credentials: true
  })
);

// tRPC 라우터 연결
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter
  })
);

app.get("/", (c) => {
  return c.text("Hello Hono with pglite!");
});

// 서버 시작
(async () => {
  await initDb();
  console.log("Database initialized");

  serve(
    {
      fetch: app.fetch,
      port: 3000
    },
    (info) => {
      console.log(`Server is running on http://localhost:${info.port}`);
    }
  );
})();
