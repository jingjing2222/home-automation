import type { PGlite } from "@electric-sql/pglite";

interface Device {
  id: number;
  name: string;
  status: "on" | "off";
  location: string;
}

export const createDeviceRepository = (db: PGlite) => ({
  getAll: async (): Promise<Device[]> => {
    const result = await db.query("SELECT * FROM devices");
    return result.rows as Device[];
  },

  getById: async (id: number): Promise<Device> => {
    const result = await db.query("SELECT * FROM devices WHERE id = $1", [id]);
    if (result.rows.length === 0) throw new Error("Device not found");
    return result.rows[0] as Device;
  },

  create: async (
    name: string,
    status: "on" | "off",
    location: string
  ): Promise<Device> => {
    const result = await db.query(
      "INSERT INTO devices (name, status, location) VALUES ($1, $2, $3) RETURNING *",
      [name, status, location]
    );
    return result.rows[0] as Device;
  },

  updateStatus: async (id: number, status: "on" | "off"): Promise<Device> => {
    const result = await db.query(
      "UPDATE devices SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );
    if (result.rows.length === 0) throw new Error("Device not found");
    return result.rows[0] as Device;
  },

  delete: async (id: number): Promise<void> => {
    await db.query("DELETE FROM devices WHERE id = $1", [id]);
  }
});

export type DeviceRepository = ReturnType<typeof createDeviceRepository>;
