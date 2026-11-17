import { energyByMood } from '@/app/lib/mood-defaults';
import { z } from 'zod';
import { choice, noul, TypeSafeClient } from '@typesafe-ai/sdk';
import { NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { reserveAiAllowance } from '@/app/lib/ai-allowance';

const suggestionSchema = z.strictObject({
	message: z.string().trim().min(1).max(2000),
});

export async function POST(request: Request) {
	const origin = request.headers.get('origin');
	if (
		origin &&
		origin !== new URL(process.env.BETTER_AUTH_URL ?? request.url).origin
	) {
		return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
	}

	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const result = suggestionSchema.safeParse(body);
	if (!result.success) {
		return NextResponse.json(
			{ error: 'Please enter a message between 1 and 2000 characters.' },
			{ status: 400 }
		);
	}

	let attachCookie = (response: NextResponse) => response;
	try {
		if (!process.env.TYPESAFE_API_KEY) {
			return NextResponse.json(
				{
					error:
						'AI suggestions are unavailable. You can choose a mood yourself.',
				},
				{ status: 503 }
			);
		}
		const session = await auth.api.getSession({ headers: request.headers });
		const allowance = await reserveAiAllowance(session?.user.id);
		attachCookie = allowance.attachCookie;
		if (allowance.response) return allowance.response;

		const client = new TypeSafeClient();
		const decision = await client.systemOne({
			state: result.data,
			questions: {
				requestType: choice(
					'What is the primary mood or emotional vibe expressed in `message`?',
					{
						Sparkly:
							'The user is feeling joyful, highly productive, energetic, or had an unusually great day.',
						Cozy: 'The user is feeling relaxed, content, peaceful, or enjoyed quiet, low-energy activities.',
						Tired:
							'The user is physically or mentally exhausted, lacking energy, burnt out, or desperately needs rest.',
						Sad: 'The user is feeling down, melancholic, emotionally drained, or experiencing a sense of sorrow.',
						Frustrated:
							'The user is annoyed, overly stressed, dealing with major inconveniences, or losing their patience.',
					}
				),
				nudge: noul(
					'Does `message` express a need for self-care, de-compression, or rest?'
				),
			},
		});

		const vibeResult: string = decision.answers.requestType.choice;
		const energyScore = energyByMood[vibeResult] ?? 5;
		const needsRest: number = decision.answers.nudge.noul;

		let nudgeText = 'Keep riding that positive wave!';

		if (vibeResult === 'Frustrated') {
			nudgeText = 'Take a deep breath and give yourself a break.';
		} else if (vibeResult === 'Cozy') {
			nudgeText = 'Keep enjoying those peaceful moments.';
		} else if (
			vibeResult === 'Tired' ||
			vibeResult === 'Sad' ||
			needsRest > 0.5
		) {
			nudgeText = 'Prioritize rest tonight!';
		}

		return attachCookie(
			NextResponse.json({
				vibe: vibeResult,
				energy: energyScore,
				nudge: nudgeText,
			})
		);
	} catch (error) {
		console.error('Failed to analyze vibe', error);
		return attachCookie(
			NextResponse.json({ error: 'Failed to analyze vibe' }, { status: 500 })
		);
	}
}
