import { auth, currentUser } from "@clerk/nextjs/server";

export async function getUserId() {
  const { userId } = await auth();
  return userId;
}

export async function getUser() {
  return await currentUser();
}
