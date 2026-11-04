/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, expect, test, vi } from "vitest";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
const modules = import.meta.glob("../../convex/**/*.ts");
const paginationOpts = { numItems: 10, cursor: null };
const data = {
  routeId: "modern-jeepney-jeepney-outbound",
  category: "queue",
  area: "Batac",
  description: "Queue beside the candidate stop.",
};
afterEach(() => vi.unstubAllEnvs());
test("moderation fails closed and cannot be claimed through a student profile", async () => {
  vi.stubEnv("MODERATOR_SUBJECTS", "moderator");
  const t = convexTest(schema, modules),
    student = t.withIdentity({
      subject: "student",
      email: "moderator@example.com",
    });
  expect(await t.query(api.moderation.access)).toBe(false);
  expect(await student.query(api.moderation.access)).toBe(false);
  await expect(
    t.query(api.moderation.queue, { paginationOpts, reviewed: false }),
  ).rejects.toThrow("Sign in");
  await expect(
    student.query(api.moderation.queue, { paginationOpts, reviewed: false }),
  ).rejects.toThrow("Moderator access");
  const id = await student.mutation(api.community.publish, data);
  await student.mutation(api.community.flag, { id, reason: "Test reason" });
  const flagId = await t.run(
    async (ctx) => (await ctx.db.query("flags").first())!._id,
  );
  await expect(
    student.mutation(api.moderation.review, {
      flagId,
      action: "hide",
      reason: "Unauthorized decision",
    }),
  ).rejects.toThrow("Moderator access");
  await expect(
    student.query(api.moderation.history, { reportId: id }),
  ).rejects.toThrow("Moderator access");
  vi.stubEnv("MODERATOR_SUBJECTS", "");
  expect(
    await t.withIdentity({ subject: "moderator" }).query(api.moderation.access),
  ).toBe(false);
});
test("hide/reinstate is audited, redacts public and inbox reads, and suppresses pending delivery", async () => {
  vi.stubEnv("MODERATOR_SUBJECTS", "moderator");
  const t = convexTest(schema, modules),
    author = t.withIdentity({ subject: "author" }),
    reader = t.withIdentity({ subject: "reader" }),
    mod = t.withIdentity({ subject: "moderator" });
  const id = await author.mutation(api.community.publish, data);
  await reader.mutation(api.community.flag, {
    id,
    reason: "Incorrect queue report",
  });
  await t.run((ctx) =>
    ctx.db.insert("notifications", {
      userId: "reader",
      kind: "community",
      title: "Original",
      body: data.description,
      href: `/community?report=${id}`,
      reportId: id,
      read: false,
      createdAt: Date.now(),
    }),
  );
  const flag = (
    await mod.query(api.moderation.queue, { paginationOpts, reviewed: false })
  ).page[0];
  expect(flag).not.toHaveProperty("userId");
  await expect(
    mod.mutation(api.moderation.review, {
      flagId: flag.id,
      action: "hide",
      reason: "short",
    }),
  ).rejects.toThrow("Review reason");
  await mod.mutation(api.moderation.review, {
    flagId: flag.id,
    action: "hide",
    reason: "Hide pending source verification.",
  });
  expect(await t.query(api.community.byId, { id })).toBe(null);
  expect(await t.query(api.community.list)).toHaveLength(0);
  expect(
    (await t.query(api.community.feed, { paginationOpts })).page,
  ).toHaveLength(0);
  const inbox = await reader.query(api.notifications.list);
  expect(inbox[0].title).toBe("Report unavailable");
  expect(inbox[0].body).not.toContain(data.description);
  expect(
    await t.query(internal.notifications.deliveryAllowed, {
      userId: "reader",
      reportId: id,
    }),
  ).toBe(false);
  await expect(reader.mutation(api.community.confirm, { id })).rejects.toThrow(
    "no longer active",
  );
  await expect(
    author.mutation(api.community.publish, { ...data, id }),
  ).rejects.toThrow("no longer active");
  await expect(
    mod.mutation(api.moderation.review, {
      flagId: flag.id,
      action: "hide",
      reason: "Same decision accidentally retried.",
    }),
  ).rejects.toThrow("already applied");
  const originalExpiry = await t.run(
    async (ctx) => (await ctx.db.get(id))!.expiresAt,
  );
  await mod.mutation(api.moderation.review, {
    flagId: flag.id,
    action: "reinstate",
    reason: "Source reviewed; restore the observation.",
  });
  expect((await t.query(api.community.byId, { id }))?.description).toBe(
    data.description,
  );
  expect(await t.run(async (ctx) => (await ctx.db.get(id))!.expiresAt)).toBe(
    originalExpiry,
  );
  expect(await reader.query(api.notifications.list)).toHaveLength(1);
  const history = await mod.query(api.moderation.history, { reportId: id });
  expect(history).toHaveLength(2);
  expect(history.every((event) => !("actor" in event))).toBe(true);
  await mod.mutation(api.moderation.review, {
    flagId: flag.id,
    action: "resolve",
    reason: "The queue has cleared after review.",
  });
  expect((await t.query(api.community.byId, { id }))?.resolved).toBe(true);
  expect(
    (await mod.query(api.moderation.queue, { paginationOpts, reviewed: false }))
      .page,
  ).toHaveLength(0);
  expect(
    (await mod.query(api.moderation.queue, { paginationOpts, reviewed: true }))
      .page,
  ).toHaveLength(1);
  await author.mutation(api.accountDeletion.removeMyData, {});
  expect(
    await mod.query(api.moderation.history, { reportId: id }),
  ).toHaveLength(0);
});

test("dismissing a flag leaves other flags open; account deletion anonymizes the reviewer", async () => {
  vi.stubEnv("MODERATOR_SUBJECTS", "moderator");
  const t = convexTest(schema, modules),
    author = t.withIdentity({ subject: "author" }),
    first = t.withIdentity({ subject: "first" }),
    second = t.withIdentity({ subject: "second" }),
    mod = t.withIdentity({ subject: "moderator" });
  const id = await author.mutation(api.community.publish, data);
  await first.mutation(api.community.flag, {
    id,
    reason: "First review request",
  });
  await second.mutation(api.community.flag, {
    id,
    reason: "Second review request",
  });
  const flags = (
    await mod.query(api.moderation.queue, { paginationOpts, reviewed: false })
  ).page;
  await mod.mutation(api.moderation.review, {
    flagId: flags[0].id,
    action: "dismiss",
    reason: "No violation found in this particular flag.",
  });
  expect(
    (await mod.query(api.moderation.queue, { paginationOpts, reviewed: false }))
      .page,
  ).toHaveLength(1);
  expect((await t.query(api.community.byId, { id }))?.resolved).toBe(false);
  await mod.mutation(api.accountDeletion.removeMyData, {});
  const events = await t.run((ctx) =>
    ctx.db.query("moderationAudit").collect(),
  );
  expect(events).toHaveLength(1);
  expect(events[0].actor).toBeUndefined();
  expect(events[0].reason).toContain("No violation");
  expect(await t.query(api.community.byId, { id })).not.toBe(null);
});
