// convex/documents.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("documents", {
      title: args.title,
      content: args.content,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  handler: async (ctx) => {
    // Return all documents. Using collect() to materialize query results.
    const docs = await ctx.db.query("documents").collect();
    return docs;
  },
});