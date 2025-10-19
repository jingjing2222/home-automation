import type { PGlite } from "@electric-sql/pglite";

interface User {
  id: number;
  name: string;
  email: string;
}

export const createUserRepository = (db: PGlite) => ({
  getAll: async (): Promise<User[]> => {
    const result = await db.query("SELECT * FROM users");
    return result.rows as User[];
  },

  getById: async (id: number): Promise<User> => {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    if (result.rows.length === 0) throw new Error("User not found");
    return result.rows[0] as User;
  },

  create: async (name: string, email: string): Promise<User> => {
    const result = await db.query(
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
      [name, email]
    );
    return result.rows[0] as User;
  },

  update: async (id: number, name: string, email: string): Promise<User> => {
    const result = await db.query(
      "UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *",
      [name, email, id]
    );
    if (result.rows.length === 0) throw new Error("User not found");
    return result.rows[0] as User;
  },

  delete: async (id: number): Promise<void> => {
    await db.query("DELETE FROM users WHERE id = $1", [id]);
  }
});

export type UserRepository = ReturnType<typeof createUserRepository>;
