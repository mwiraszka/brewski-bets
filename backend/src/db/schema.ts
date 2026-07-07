import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

export const friendshipStatusEnum = pgEnum('friendship_status', ['pending', 'accepted']);

export const betStatusEnum = pgEnum('bet_status', ['inactive', 'active', 'settled']);
export const betOutcomeEnum = pgEnum('bet_outcome', ['open', 'resolved', 'void']);
export const betActionEnum = pgEnum('bet_action', ['user1', 'user2']);

export interface BetResult {
  name: string;
  brewskiCount: number;
  assignedTo: 'user1' | 'user2' | null;
  // Marks the whole-bet VOID pseudo-outcome, distinct from `voided` below which
  // flags a real outcome the players have individually nullified.
  isSpecial?: 'void';
  // A live outcome the players have voided so it can no longer resolve or pay
  // out. It keeps its name and stake but is excluded from the win/loss stakes.
  voided?: boolean;
}

// One-step snapshot of a bet's terms and lifecycle state captured just before a
// `submit` overwrites them, so a `reject` can restore the prior agreed version.
export interface BetSnapshot {
  title: string;
  description: string | null;
  iconSlug: string | null;
  iconColor: string | null;
  resolutionDate: string | null;
  results: BetResult[];
  status: 'inactive' | 'active' | 'settled';
  outcome: 'open' | 'resolved' | 'void';
  pendingAction: 'user1' | 'user2' | null;
  settlementProposed: boolean;
  selectedResultIndex: number | null;
}

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').notNull().unique(),
  email: text('email').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  clerkImageUrl: text('clerk_image_url'),
  // Cropped, display-ready avatar stored in the app's own R2 bucket. This is
  // the canonical source for showing a user's avatar anywhere in the app;
  // Clerk's image_url is volatile and only kept for change detection.
  avatarUrl: text('avatar_url'),
  avatarOriginalUrl: text('avatar_original_url'),
  avatarManagedByApp: boolean('avatar_managed_by_app').notNull().default(false),
  avatarCropState: jsonb('avatar_crop_state').$type<{
    zoom: number;
    offsetX: number;
    offsetY: number;
  }>(),
  createdDate: timestamp('created_date', { withTimezone: true }).notNull().defaultNow(),
  lastModifiedDate: timestamp('last_modified_date', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const friendships = pgTable(
  'friendships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    requesterId: uuid('requester_id')
      .notNull()
      .references(() => users.id),
    addresseeId: uuid('addressee_id')
      .notNull()
      .references(() => users.id),
    status: friendshipStatusEnum('status').notNull().default('pending'),
    createdDate: timestamp('created_date', { withTimezone: true }).notNull().defaultNow(),
    lastModifiedDate: timestamp('last_modified_date', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  t => [unique().on(t.requesterId, t.addresseeId)],
);

export const bets = pgTable('bets', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  iconSlug: text('icon_slug'),
  iconColor: text('icon_color'),
  user1Id: uuid('user1_id')
    .notNull()
    .references(() => users.id),
  user2Id: uuid('user2_id')
    .notNull()
    .references(() => users.id),
  resolutionDate: timestamp('resolution_date', { withTimezone: true }),
  results: jsonb('results').notNull().$type<BetResult[]>(),
  selectedResultIndex: integer('selected_result_index'),
  status: betStatusEnum('status').notNull().default('inactive'),
  outcome: betOutcomeEnum('outcome').notNull().default('open'),
  pendingAction: betActionEnum('pending_action'),
  settlementProposed: boolean('settlement_proposed').notNull().default(false),
  previousState: jsonb('previous_state').$type<BetSnapshot>(),
  createdDate: timestamp('created_date', { withTimezone: true }).notNull().defaultNow(),
  lastModifiedDate: timestamp('last_modified_date', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  lastModifiedBy: uuid('last_modified_by')
    .notNull()
    .references(() => users.id),
});
