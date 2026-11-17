import 'server-only';

import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { lt, sql } from 'drizzle-orm';
import { db } from '@/db';
import { aiUsage } from '@/db/schema';

const COOKIE = 'mood-pixels-guest';
const DAY = 24 * 60 * 60 * 1000;

function sign(value: string) {
	const secret = process.env.BETTER_AUTH_SECRET;
	if (!secret) throw new Error('BETTER_AUTH_SECRET is missing');
	return createHmac('sha256', secret).update(value).digest('hex');
}

async function guestIdentity() {
	const token = (await cookies()).get(COOKIE)?.value;
	if (token) {
		const [id, expiry, signature] = token.split('.');
		if (
			/^[a-f0-9-]{36}$/.test(id ?? '') &&
			Number(expiry) > Date.now() &&
			/^[a-f0-9]{64}$/.test(signature ?? '')
		) {
			const expected = sign(`${id}.${expiry}`);
			if (
				timingSafeEqual(
					Buffer.from(signature, 'hex'),
					Buffer.from(expected, 'hex')
				)
			)
				return { id, token };
		}
	}
	const id = randomUUID();
	const payload = `${id}.${Date.now() + DAY}`;
	return { id, token: `${payload}.${sign(payload)}` };
}

class LimitReached extends Error {
	constructor(
		public retryAfter: number,
		public scope: 'guest' | 'shared' | 'user'
	) {
		super('AI allowance reached');
	}
}

// Atomic reservations in PostgreSQL also work across app restarts and instances.
export async function reserveAiAllowance(userId?: string) {
	const guest = userId ? null : await guestIdentity();
	const now = Date.now();
	const hourEnd = (Math.floor(now / 3_600_000) + 1) * 3_600_000;
	const dayEnd = (Math.floor(now / DAY) + 1) * DAY;
	const budgets = userId
		? [
				{
					key: `user:${userId}:${hourEnd}`,
					limit: 30,
					end: hourEnd,
					scope: 'user' as const,
				},
			]
		: [
				{
					key: `guest-global:${hourEnd}`,
					limit: 20,
					end: hourEnd,
					scope: 'shared' as const,
				},
				{
					key: `guest:${guest!.id}:${dayEnd}`,
					limit: 3,
					end: dayEnd,
					scope: 'guest' as const,
				},
			];

	function attachCookie(response: NextResponse) {
		response.headers.set('Cache-Control', 'no-store');
		if (guest)
			response.cookies.set(COOKIE, guest.token, {
				httpOnly: true,
				sameSite: 'lax',
				secure: process.env.NODE_ENV === 'production',
				path: '/',
				maxAge: 86400,
			});
		return response;
	}

	try {
		await db.transaction(async (tx) => {
			await tx.delete(aiUsage).where(lt(aiUsage.expiresAt, new Date(now)));
			for (const budget of budgets) {
				const rows = await tx
					.insert(aiUsage)
					.values({
						key: budget.key,
						attempts: 1,
						expiresAt: new Date(budget.end),
					})
					.onConflictDoUpdate({
						target: aiUsage.key,
						set: { attempts: sql`${aiUsage.attempts} + 1` },
						setWhere: sql`${aiUsage.attempts} < ${budget.limit}`,
					})
					.returning({ key: aiUsage.key });
				if (!rows.length)
					throw new LimitReached(
						Math.ceil((budget.end - now) / 1000),
						budget.scope
					);
			}
		});
		return { response: null, attachCookie };
	} catch (error) {
		if (!(error instanceof LimitReached)) throw error;
		const message =
			error.scope === 'guest'
				? "You've used this browser's guest tries for today. Sign in to keep exploring, or choose a mood yourself."
				: error.scope === 'shared'
					? 'Guest AI is taking a little break. Sign in or try again later. You can still choose a mood yourself.'
					: "You've reached your AI limit for this hour. Try again later or choose a mood yourself.";
		return {
			response: attachCookie(
				NextResponse.json(
					{ error: message },
					{
						status: 429,
						headers: { 'Retry-After': String(error.retryAfter) },
					}
				)
			),
			attachCookie,
		};
	}
}
