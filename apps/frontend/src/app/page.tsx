"use client";

import { trpc } from "@/lib/trpc-react";

export default function Home() {
  const helloQuery = trpc.hello.useQuery({ name: "tRPC" });
  const usersQuery = trpc.getUsers.useQuery();

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold">tRPC + Next.js + Hono</h1>

        <div className="flex flex-col gap-4">
          <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Hello Query</h2>
            {helloQuery.isLoading && <p>Loading...</p>}
            {helloQuery.error && <p>Error: {helloQuery.error.message}</p>}
            {helloQuery.data && (
              <p className="text-green-600 font-medium">
                {helloQuery.data.greeting}
              </p>
            )}
          </div>

          <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Users Query</h2>
            {usersQuery.isLoading && <p>Loading...</p>}
            {usersQuery.error && <p>Error: {usersQuery.error.message}</p>}
            {usersQuery.data && (
              <ul className="list-disc list-inside">
                {usersQuery.data.map((user) => (
                  <li key={user.id}>
                    {user.name} (ID: {user.id})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
