"use client";

import { trpc } from "@/lib/trpc-react";
import { useState } from "react";

export default function Home() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Queries
  const helloQuery = trpc.hello.useQuery({ name: "tRPC" });
  const usersQuery = trpc.getUsers.useQuery();
  const devicesQuery = trpc.getDevices.useQuery();
  const userByIdQuery = trpc.getUserById.useQuery(
    { id: selectedUserId! },
    { enabled: selectedUserId !== null }
  );

  // Mutations
  const createUserMutation = trpc.createUser.useMutation({
    onSuccess: () => {
      usersQuery.refetch();
    }
  });

  const updateDeviceStatusMutation = trpc.updateDeviceStatus.useMutation({
    onSuccess: () => {
      devicesQuery.refetch();
    }
  });

  const handleCreateUser = () => {
    createUserMutation.mutate({
      name: "Charlie",
      email: "charlie@example.com"
    });
  };

  const handleToggleDevice = (deviceId: number, currentStatus: string) => {
    updateDeviceStatusMutation.mutate({
      id: deviceId,
      status: currentStatus === "on" ? "off" : "on"
    });
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold">tRPC Endpoints Demo</h1>

        {/* Hello Query */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">GET /hello</h2>
          {helloQuery.isLoading && <p>Loading...</p>}
          {helloQuery.error && <p className="text-red-600">Error</p>}
          {helloQuery.data && (
            <p className="text-green-600 font-medium">{helloQuery.data.greeting}</p>
          )}
        </div>

        {/* Get Users */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">GET /users</h2>
          {usersQuery.isLoading && <p>Loading...</p>}
          {usersQuery.error && <p className="text-red-600">Error</p>}
          {usersQuery.data && (
            <div className="space-y-2">
              {usersQuery.data.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className="block w-full text-left p-3 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer"
                >
                  {user.name} ({user.email})
                </button>
              ))}
            </div>
          )}
          <button
            onClick={handleCreateUser}
            disabled={createUserMutation.isPending}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {createUserMutation.isPending ? "Creating..." : "Create New User"}
          </button>
        </div>

        {/* Get User By ID */}
        {selectedUserId && (
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">GET /users/:id</h2>
            {userByIdQuery.isLoading && <p>Loading...</p>}
            {userByIdQuery.error && <p className="text-red-600">Error</p>}
            {userByIdQuery.data && (
              <div className="space-y-2">
                <p>
                  <strong>ID:</strong> {userByIdQuery.data.id}
                </p>
                <p>
                  <strong>Name:</strong> {userByIdQuery.data.name}
                </p>
                <p>
                  <strong>Email:</strong> {userByIdQuery.data.email}
                </p>
              </div>
            )}
            <button
              onClick={() => setSelectedUserId(null)}
              className="mt-4 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Close
            </button>
          </div>
        )}

        {/* Get Devices */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">GET /devices</h2>
          {devicesQuery.isLoading && <p>Loading...</p>}
          {devicesQuery.error && <p className="text-red-600">Error</p>}
          {devicesQuery.data && (
            <div className="space-y-2">
              {devicesQuery.data.map((device) => (
                <div
                  key={device.id}
                  className="p-4 bg-gray-100 rounded flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">{device.name}</p>
                    <p className="text-sm text-gray-600">{device.location}</p>
                  </div>
                  <button
                    onClick={() => handleToggleDevice(device.id, device.status)}
                    disabled={updateDeviceStatusMutation.isPending}
                    className={`px-4 py-2 rounded text-white ${
                      device.status === "on"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-600 hover:bg-gray-700"
                    } disabled:opacity-50`}
                  >
                    {updateDeviceStatusMutation.isPending
                      ? "Updating..."
                      : device.status.toUpperCase()}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
