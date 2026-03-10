import { Router, Request, Response } from 'express';
import { Webhook } from 'svix';
import bodyParser from 'body-parser';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Clerk webhook secret from the dashboard
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

// We need the raw body to verify the Svix signature
router.post('/clerk', bodyParser.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    if (!WEBHOOK_SECRET) {
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env');
    }

    // Get the headers
    const svix_id = req.headers['svix-id'] as string;
    const svix_timestamp = req.headers['svix-timestamp'] as string;
    const svix_signature = req.headers['svix-signature'] as string;

    // If there are no Svix headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return res.status(400).json({ error: 'Missing Svix headers' });
    }

    // Get the raw body
    const payload = req.body;
    const body = payload.toString();

    // Create a new Svix instance with your secret
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: any;

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        });
    } catch (err: any) {
        console.error('Error verifying webhook:', err.message);
        return res.status(400).json({ error: 'Invalid signature' });
    }

    const eventType = evt.type;

    // Listen to user.created event to store user in Postgres
    if (eventType === 'user.created') {
        const { id, email_addresses, first_name, last_name, primary_email_address_id } = evt.data;

        // Get the primary email
        let primaryEmail = '';
        if (email_addresses && email_addresses.length > 0) {
            const emailObj = email_addresses.find((e: any) => e.id === primary_email_address_id) || email_addresses[0];
            primaryEmail = emailObj.email_address;
        }

        try {
            const fullName = [first_name, last_name].filter(Boolean).join(' ') || null;
            await db.insert(users).values({
                id,
                email: primaryEmail,
                name: fullName,
                plan: 'free',
            }).onConflictDoNothing();
            console.log(`[Webhook] Inserted new user ${id}`);
        } catch (err) {
            console.error('[Webhook] Drizzle insert error:', err);
            return res.status(500).json({ error: 'DB insertion failed' });
        }
    }

    // Handle user deletion
    if (eventType === 'user.deleted') {
        const { id } = evt.data;
        try {
            await db.delete(users).where(eq(users.id, id));
            console.log(`[Webhook] Deleted user ${id}`);
        } catch (err) {
            console.error('[Webhook] Drizzle delete error:', err);
        }
    }

    return res.status(200).json({ success: true });
});

export { router as webhookRouter };
