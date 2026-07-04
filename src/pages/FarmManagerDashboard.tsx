import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { AddAnimalDialog } from '@/components/livestock/AddAnimalDialog';
import { useDashboardStats, useActivityLog } from '@/hooks/useLivestock';
import { Beef, AlertCircle, ClipboardList, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FarmManagerDashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: myActivity } = useActivityLog(5);

  const today = new Date().toDateString();
  const animalsAddedToday = stats?.recentActivity.filter(
    a => a.activity_type === 'livestock_added' && new Date(a.created_at).toDateString() === today
  ).length ?? 0;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
            <p className="text-muted-foreground">FarmSync Farm Manager Portal</p>
          </div>
          <AddAnimalDialog />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Animals Under Management"
            value={isLoading ? '...' : stats?.totalLivestock ?? 0}
            icon={Beef}
            description="Active animals"
          />
          <StatCard
            title="Added Today"
            value={animalsAddedToday}
            icon={TrendingUp}
            description="New animals"
          />
          <StatCard
            title="Pending Alerts"
            value={0}
            icon={AlertCircle}
            description="Vaccination/follow-ups due"
          />
          <StatCard
            title="Recent Updates"
            value={myActivity?.length ?? 0}
            icon={ClipboardList}
            description="Your recent actions"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                As a farm manager, you can:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Add and edit animal details</li>
                <li>Record animal movements</li>
                <li>Update animal status</li>
                <li>View health records (read-only)</li>
              </ul>
            </CardContent>
          </Card>

          <RecentActivity activities={stats?.recentActivity ?? []} />
        </div>
      </div>
    </AppLayout>
  );
}
