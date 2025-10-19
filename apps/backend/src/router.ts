import { z } from "zod";
import { publicProcedure, router } from "./trpc";
import { getRepositories } from "./db";

// 스키마 정의
const HelloInput = z.object({ name: z.string().optional() });
const GetUserByIdInput = z.object({ id: z.number() });
const CreateUserInput = z.object({ name: z.string(), email: z.string().email() });
const UpdateDeviceStatusInput = z.object({
  id: z.number(),
  status: z.enum(["on", "off"])
});

// 타입 추출
export type HelloInput = z.infer<typeof HelloInput>;
export type GetUserByIdInput = z.infer<typeof GetUserByIdInput>;
export type CreateUserInput = z.infer<typeof CreateUserInput>;
export type UpdateDeviceStatusInput = z.infer<typeof UpdateDeviceStatusInput>;

export const appRouter = router({
  hello: publicProcedure.input(HelloInput).query(({ input }) => {
    return {
      greeting: `Hello ${input.name || "World"}!`
    };
  }),

  // Users procedures
  getUsers: publicProcedure.query(async () => {
    const { users } = await getRepositories();
    return users.getAll();
  }),

  getUserById: publicProcedure
    .input(GetUserByIdInput)
    .query(async ({ input }) => {
      const { users } = await getRepositories();
      return users.getById(input.id);
    }),

  createUser: publicProcedure
    .input(CreateUserInput)
    .mutation(async ({ input }) => {
      const { users } = await getRepositories();
      return users.create(input.name, input.email);
    }),

  // Devices procedures
  getDevices: publicProcedure.query(async () => {
    const { devices } = await getRepositories();
    return devices.getAll();
  }),

  updateDeviceStatus: publicProcedure
    .input(UpdateDeviceStatusInput)
    .mutation(async ({ input }) => {
      const { devices } = await getRepositories();
      return devices.updateStatus(input.id, input.status);
    })
});

export type AppRouter = typeof appRouter;
