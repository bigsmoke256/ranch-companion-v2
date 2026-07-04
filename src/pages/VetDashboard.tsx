import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useHealthRecordsForVet, useVetStats } from '@/hooks/useVetData';
import { Stethoscope, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function VetDashboard() {
  const { data: stats, isLoading: statsLoading } = useVetStats();
  const { data: recentRecords, isLoading: recordsLoading } = useHealthRecordsForVet(10);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vet Dashboard</h1>
          <p className="text-muted-foreground">FarmSync Veterinary Portal</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Animals Under Treatment"
            value={statsLoading ? '...' : stats?.underTreatment ?? 0}
            icon={Stethoscope}
            description="Active cases"
          />
          <StatCard
            title="Follow-ups Due"
            value={statsLoading ? '...' : stats?.followUpsDue ?? 0}
            icon={Calendar}
            description="This week"
          />
          <StatCard
            title="Recent Treatments"
            value={statsLoading ? '...' : stats?.recentTreatments ?? 0}
            icon={CheckCircle}
            description="Last 7 days"
          />
          <StatCard
            title="Pending Reviews"
            value={statsLoading ? '...' : stats?.pendingReviews ?? 0}
            icon={AlertCircle}
            description="Awaiting action"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Health Records</CardTitle>
            </CardHeader>
            <CardContent>
              {recordsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : recentRecords?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No recent records</p>
              ) : (
                <div className="space-y-3">
                  {recentRecords?.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{record.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(record.record_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">{record.record_type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Follow-up Reminders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                No follow-ups scheduled
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
