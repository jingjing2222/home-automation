import { serve } from "@hono/node-server";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { appRouter } from "./router";

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
  return c.text("Hello Hono!");
});

serve(
  {
    fetch: app.fetch,
    port: 3000
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
