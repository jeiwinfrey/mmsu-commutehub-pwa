import { clerkSetup } from "@clerk/testing/playwright";
export default async function setup() {
  await clerkSetup();
  for (const email of [
    "commutehub-qa+clerk_test@example.com",
    "commutehub-observer+clerk_test@example.com",
    "commutehub-delete-qa+clerk_test@example.com",
  ]) {
    const response = await fetch(
      `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` } },
    );
    const users = await response.json();
    if (!response.ok)
      throw new Error(
        "Could not look up the dedicated Clerk development test account.",
      );
    if (users.length === 0) {
      const create = await fetch("https://api.clerk.com/v1/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_address: [email],
          first_name: "CommuteHub QA",
          skip_password_requirement: true,
        }),
      });
      if (!create.ok)
        throw new Error(
          "Could not create the dedicated Clerk development test account.",
        );
    }
  }
}
