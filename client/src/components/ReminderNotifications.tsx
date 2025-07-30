
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import type { Reminder } from '../../../server/src/schema';

interface ReminderNotificationsProps {
  userId: number;
}

export function ReminderNotifications({ userId }: ReminderNotificationsProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const loadReminders = useCallback(async () => {
    try {
      const pendingReminders = await trpc.getPendingReminders.query();
      // Filter reminders for current user
      const userReminders = pendingReminders.filter((reminder: Reminder) => 
        reminder.user_id === userId && !reminder.is_sent
      );
      setReminders(userReminders);
    } catch (error) {
      console.error('Failed to load reminders:', error);
      // Since backend is stub, show empty reminders
      setReminders([]);
    }
  }, [userId]);

  useEffect(() => {
    loadReminders();
    
    // Check for reminders every minute
    const interval = setInterval(loadReminders, 60000);
    
    return () => clearInterval(interval);
  }, [loadReminders]);

  // Check for due reminders and show notifications
  useEffect(() => {
    const now = new Date();
    const dueReminders = reminders.filter((reminder: Reminder) => 
      new Date(reminder.reminder_time) <= now
    );
    
    dueReminders.forEach((reminder: Reminder) => {
      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Task Reminder', {
          body: `You have a task reminder!`,
          icon: '/favicon.ico',
          tag: `reminder-${reminder.id}`
        });
      }
    });
  }, [reminders]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const upcomingReminders = reminders.filter((reminder: Reminder) => {
    const reminderTime = new Date(reminder.reminder_time);
    const now = new Date();
    const timeDiff = reminderTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    
    return hoursDiff <= 24 && hoursDiff > 0; // Next 24 hours
  });

  const overdueReminders = reminders.filter((reminder: Reminder) => {
    const reminderTime = new Date(reminder.reminder_time);
    const now = new Date();
    
    return reminderTime <= now;
  });

  const totalNotifications = overdueReminders.length + upcomingReminders.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          🔔
          {totalNotifications > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {totalNotifications > 9 ? '9+' : totalNotifications}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">🔔 Reminders</h3>
            {totalNotifications > 0 && (
              <Badge variant="outline">
                {totalNotifications} pending
              </Badge>
            )}
          </div>
          
          {/* Overdue Reminders */}
          {overdueReminders.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-red-600 flex items-center gap-1">
                🚨 Overdue
              </h4>
              {overdueReminders.map((reminder: Reminder) => (
                <Card key={reminder.id} className="bg-red-50 border-red-200">
                  <CardContent className="p-3">
                    <p className="text-sm font-medium">Task Reminder</p>
                    <p className="text-xs text-gray-600">
                      Due: {new Date(reminder.reminder_time).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Upcoming Reminders */}
          {upcomingReminders.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-600 flex items-center gap-1">
                ⏰ Upcoming
              </h4>
              {upcomingReminders.map((reminder: Reminder) => (
                <Card key={reminder.id} className="bg-blue-50 border-blue-200">
                  <CardContent className="p-3">
                    <p className="text-sm font-medium">Task Reminder</p>
                    <p className="text-xs text-gray-600">
                      Due: {new Date(reminder.reminder_time).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* No Reminders */}
          {totalNotifications === 0 && (
            <div className="text-center py-6 text-gray-500">
              <div className="text-2xl mb-2">🔕</div>
              <p className="text-sm">No pending reminders</p>
              <p className="text-xs text-gray-400">
                Set due dates on tasks to get reminders
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
