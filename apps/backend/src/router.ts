import { z } from "zod";
import { publicProcedure, router } from "./trpc";

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

// 샘플 데이터
const users = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" }
];

const devices = [
  { id: 1, name: "Smart Light", status: "on", location: "Living Room" },
  { id: 2, name: "Smart AC", status: "off", location: "Bedroom" }
];

export const appRouter = router({
  hello: publicProcedure.input(HelloInput).query(({ input }) => {
    return {
      greeting: `Hello ${input.name || "World"}!`
    };
  }),

  getUsers: publicProcedure.query(() => {
    return users;
  }),

  getUserById: publicProcedure
    .input(GetUserByIdInput)
    .query(({ input }) => {
      const user = users.find((u) => u.id === input.id);
      if (!user) throw new Error("User not found");
      return user;
    }),

  createUser: publicProcedure
    .input(CreateUserInput)
    .mutation(({ input }) => {
      const newUser = {
        id: Math.max(...users.map((u) => u.id)) + 1,
        name: input.name,
        email: input.email
      };
      users.push(newUser);
      return newUser;
    }),

  getDevices: publicProcedure.query(() => {
    return devices;
  }),

  updateDeviceStatus: publicProcedure
    .input(UpdateDeviceStatusInput)
    .mutation(({ input }) => {
      const device = devices.find((d) => d.id === input.id);
      if (!device) throw new Error("Device not found");
      device.status = input.status;
      return device;
    })
});

export type AppRouter = typeof appRouter;
