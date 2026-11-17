import {
	pgTable,
	integer,
	date,
	pgEnum,
	smallint,
	check,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth-schema';

export const moodEnum = pgEnum('mood', [
	'Sparkly',
	'Cozy',
	'Tired',
	'Sad',
	'Frustrated',
]);

export const moodEntries = pgTable(
	'mood_entries',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		entryDate: date('entry_date', { mode: 'string' }).notNull(),
		mood: moodEnum('mood').notNull(),
		energy: smallint('energy').notNull(),
		nudge: text('nudge'),

		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		check('energy_range', sql`${table.energy} BETWEEN 1 AND 5`),
		unique('mood_entries_user_date_unique').on(table.userId, table.entryDate),
	]
);

export * from './auth-schema';

export const aiUsage = pgTable('ai_usage', {
	key: text('key').primaryKey(),
	attempts: integer('attempts').notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});
