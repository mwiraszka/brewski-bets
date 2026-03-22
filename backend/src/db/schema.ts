import { integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const betStatusEnum = pgEnum('bet_status', ['pending', 'active', 'complete']);
export const betOutcomeEnum = pgEnum('bet_outcome', [
  'user1_win',
  'user2_win',
  'draw',
  'open',
  'void',
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').notNull().unique(),
  email: text('email').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  avatarOriginalUrl: text('avatar_original_url'),
  createdDate: timestamp('created_date', { withTimezone: true }).notNull().defaultNow(),
  lastModifiedDate: timestamp('last_modified_date', { withTimezone: true }).notNull().defaultNow(),
});

export const bets = pgTable('bets', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  user1Id: uuid('user1_id')
    .notNull()
    .references(() => users.id),
  user2Id: uuid('user2_id')
    .notNull()
    .references(() => users.id),
  user1WagerBeers: integer('user1_wager_beers').notNull(),
  user1WagerType: text('user1_wager_type').notNull(),
  user2WagerBeers: integer('user2_wager_beers').notNull(),
  user2WagerType: text('user2_wager_type').notNull(),
  status: betStatusEnum('status').notNull().default('pending'),
  outcome: betOutcomeEnum('outcome').notNull().default('open'),
  createdDate: timestamp('created_date', { withTimezone: true }).notNull().defaultNow(),
  lastModifiedDate: timestamp('last_modified_date', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  lastModifiedBy: uuid('last_modified_by')
    .notNull()
    .references(() => users.id),
});
