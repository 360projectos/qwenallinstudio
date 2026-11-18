import { pgTable, text, integer, bigint, boolean } from 'drizzle-orm/pg-core';
export const users = pgTable('users', {
  uid: text('uid').primaryKey(),
  email: text('email').notNull(),
  role: text('role').notNull().default('user'),
  plan: text('plan').notNull().default('free'),
  level: text('level').notNull().default('recreational'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
export const invites = pgTable('invites', { code: text('code').primaryKey(), email: text('email').notNull(), plan: text('plan').notNull(), used: boolean('used').notNull().default(false) });
export const announcements = pgTable('announcements', { id: text('id').primaryKey(), title: text('title').notNull(), body: text('body').notNull(), createdAt: bigint('created_at', { mode: 'number' }).notNull() });
export const tickets = pgTable('tickets', { id: text('id').primaryKey(), uid: text('uid').notNull(), subject: text('subject').notNull(), message: text('message').notNull(), status: text('status').notNull().default('open'), createdAt: bigint('created_at', { mode: 'number' }).notNull() });
export const billing = pgTable('billing', { id: text('id').primaryKey(), uid: text('uid').notNull(), amount: integer('amount').notNull(), concept: text('concept').notNull(), createdAt: bigint('created_at', { mode: 'number' }).notNull() });
