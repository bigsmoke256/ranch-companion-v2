import { AppLayout } from '@/components/layout/AppLayout';
import { useActivityLog } from '@/hooks/useLivestock';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { Beef, Heart, GitBranch, Truck, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const activityIcons: Record<string, typeof Activity> = { livestock_added: Beef, status_changed: Activity, health_record: Heart, breeding_record: GitBranch, movement_record: Truck };
const activityColors: Record<string, string> = { livestock_added: 'bg-primary/10 text-primary', status_changed: 'bg-warning/10 text-warning', health_record: 'bg-success/10 text-success', breeding_record: 'bg-info/10 text-info', movement_record: 'bg-accent/10 text-accent-foreground' };

export default function Traceability() {
  const { data: activities, isLoading } = useActivityLog(100);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Traceability</h1>
          <p className="text-muted-foreground">Complete activity timeline</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : activities?.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No activity recorded yet</p>
        ) : (
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {activities?.map((activity) => {
                const Icon = activityIcons[activity.activity_type] || Activity;
                const colorClass = activityColors[activity.activity_type] || 'bg-muted text-muted-foreground';
                return (
                  <div key={activity.id} className="relative pl-14">
                    <div className={cn("absolute left-3 flex h-6 w-6 items-center justify-center rounded-full", colorClass)}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{activity.description}</p>
                            <p className="text-sm text-muted-foreground">{format(new Date(activity.created_at), 'MMM d, yyyy • h:mm a')}</p>
                          </div>
                          {activity.livestock_id && (
                            <Link to={`/livestock/${activity.livestock_id}`} className="text-sm text-primary hover:underline">View Animal</Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
