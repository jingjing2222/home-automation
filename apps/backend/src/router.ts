import { z } from "zod";
import { publicProcedure, router } from "./trpc";

export const appRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }))
    .query(({ input }: { input: { name?: string } }) => {
      return {
        greeting: `Hello ${input.name || "World"}!`
      };
    }),

  getUsers: publicProcedure.query(() => {
    return [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" }
    ];
  })
});

export type AppRouter = typeof appRouter;
