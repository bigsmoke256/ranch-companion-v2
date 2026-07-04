import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { BreedChart } from '@/components/dashboard/BreedChart';
import { SexChart } from '@/components/dashboard/SexChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { AddAnimalDialog } from '@/components/livestock/AddAnimalDialog';
import { useDashboardStats } from '@/hooks/useLivestock';
import { useFarm } from '@/hooks/useFarm';
import { useAuth } from '@/hooks/useAuth';
import { Beef, TrendingUp, Users, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useDashboardStats();
  const { currentFarm, farmCode, isLoading: farmLoading, farms } = useFarm();
  const { isFarmer } = useAuth();

  // Redirect farmers without a farm to setup page
  useEffect(() => {
    if (!farmLoading && isFarmer && farms.length === 0) {
      navigate('/farm-setup');
    }
  }, [farmLoading, isFarmer, farms.length, navigate]);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              {currentFarm ? (
                <>Welcome to <span className="font-medium">{currentFarm.name}</span> ({farmCode})</>
              ) : (
                'Welcome to FarmSync Livestock Suite'
              )}
            </p>
          </div>
          <AddAnimalDialog />
        </div>

        {/* Farm Info Card */}
        {currentFarm && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Farm Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Farm Code:</span>
                  <p className="font-mono font-semibold">{farmCode}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <p className="font-medium">{currentFarm.location || 'Not set'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium">{currentFarm.phone || 'Not set'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{currentFarm.email || 'Not set'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Livestock"
            value={isLoading ? '...' : stats?.totalLivestock ?? 0}
            icon={Beef}
            description="Active animals"
          />
          <StatCard
            title="Breeds"
            value={isLoading ? '...' : stats?.breedBreakdown.length ?? 0}
            icon={TrendingUp}
            description="Different breeds tracked"
          />
          <StatCard
            title="Sex Ratio"
            value={isLoading ? '...' : `${stats?.sexBreakdown.find(s => s.sex === 'male')?.count ?? 0}M / ${stats?.sexBreakdown.find(s => s.sex === 'female')?.count ?? 0}F`}
            icon={Users}
            description="Male to female ratio"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <BreedChart data={stats?.breedBreakdown ?? []} />
          <SexChart data={stats?.sexBreakdown ?? []} />
          <RecentActivity activities={stats?.recentActivity ?? []} />
        </div>
      </div>
    </AppLayout>
  );
}
