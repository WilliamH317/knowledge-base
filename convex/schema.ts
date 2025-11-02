// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Just one table for now - we'll add more later
  documents: defineTable({
    title: v.string(),
    content: v.string(),
    createdAt: v.number(),
  }),
});