import { auth, clerkClient } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/lib/backend";
export async function DELETE(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  const { userId, getToken } = await auth();
  if (!userId)
    return Response.json({ error: "Sign in to continue." }, { status: 401 });
  const token = await getToken({ template: "convex" });
  if (!token)
    return Response.json(
      { error: "Your session expired. Sign in again." },
      { status: 401 },
    );
  try {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    convex.setAuth(token);
    await convex.mutation(api.accountDeletion.removeMyData, {});
    const clerk = await clerkClient();
    await clerk.users.deleteUser(userId);
    return Response.json({ deleted: true });
  } catch {
    return Response.json(
      {
        error:
          "Account deletion could not finish. Some app data may already have been removed. Please retry.",
      },
      { status: 500 },
    );
  }
}
