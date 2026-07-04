import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityLog } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { 
  Beef, 
  Heart, 
  GitBranch, 
  Truck, 
  Activity 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const activityIcons: Record<string, typeof Activity> = {
  livestock_added: Beef,
  status_changed: Activity,
  health_record: Heart,
  breeding_record: GitBranch,
  movement_record: Truck,
};

const activityColors: Record<string, string> = {
  livestock_added: 'bg-primary/10 text-primary',
  status_changed: 'bg-warning/10 text-warning',
  health_record: 'bg-success/10 text-success',
  breeding_record: 'bg-info/10 text-info',
  movement_record: 'bg-accent/10 text-accent-foreground',
};

interface RecentActivityProps {
  activities: ActivityLog[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.activity_type] || Activity;
              const colorClass = activityColors[activity.activity_type] || 'bg-muted text-muted-foreground';
              
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    colorClass
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
