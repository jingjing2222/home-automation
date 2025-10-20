import { serve } from "@hono/node-server";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getRepositories, initDb } from "./db";
import { appRouter } from "./router";

const app = new Hono();

// CORS 설정
app.use(
  "/*",
  cors({
    origin: "*",
    credentials: false
  })
);

// tRPC 라우터 연결
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter
  })
);

// REST API - 센서용 엔드포인트
app.post("/sensor", async (c) => {
  try {
    const body = (await c.req.json()) as {
      duration: number;
    };

    if (!body.duration || body.duration <= 0) {
      return c.json(
        {
          success: false,
          error: "duration must be a positive number"
        },
        400
      );
    }

    const { logs } = await getRepositories();
    const log = await logs.create(body.duration);

    return c.json(
      {
        success: true,
        log
      },
      201
    );
  } catch (error) {
    console.error("Sensor error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to log sensor event"
      },
      500
    );
  }
});

app.get("/", (c) => {
  return c.text("Smart Entrance IoT Backend");
});

// 서버 시작
(async () => {
  await initDb();
  console.log("Database initialized");

  const port = parseInt(process.env.PORT || "8080", 10);

  serve(
    {
      fetch: app.fetch,
      port
    },
    (info) => {
      console.log(`Server is running on http://localhost:${info.port}`);
    }
  );
})();
