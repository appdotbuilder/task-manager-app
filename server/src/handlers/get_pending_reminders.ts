
import { db } from '../db';
import { remindersTable } from '../db/schema';
import { type Reminder } from '../schema';
import { and, lte, eq } from 'drizzle-orm';

export async function getPendingReminders(): Promise<Reminder[]> {
  try {
    const now = new Date();
    
    const results = await db.select()
      .from(remindersTable)
      .where(
        and(
          lte(remindersTable.reminder_time, now), // Due time has passed
          eq(remindersTable.is_sent, false) // Not yet sent
        )
      )
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch pending reminders:', error);
    throw error;
  }
}
