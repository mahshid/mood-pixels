import 'server-only';

import { NextResponse } from 'next/server';
import { auth } from './auth';

type AuthResult =
	{ ok: true; userId: string } | { ok: false; response: NextResponse };

export async function requireUser(request: Request): Promise<AuthResult> {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return {
				ok: false,
				response: NextResponse.json(
					{ error: 'Please sign in' },
					{ status: 401 }
				),
			};
		}

		return { ok: true, userId: session.user.id };
	} catch (error) {
		console.error('Failed to check session:', error);
		return {
			ok: false,
			response: NextResponse.json(
				{ error: 'Could not check your session' },
				{ status: 500 }
			),
		};
	}
}
