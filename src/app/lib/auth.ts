import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { db } from '@/db';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
	throw new Error('Google authentication credentials are missing');
}

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg',
	}),

	socialProviders: {
		google: {
			clientId: googleClientId,
			clientSecret: googleClientSecret,
		},
	},
});
