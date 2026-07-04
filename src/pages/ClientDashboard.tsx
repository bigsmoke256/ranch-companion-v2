import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useClientStats, useSaleReadyAnimals } from '@/hooks/useClientData';
import { ShoppingBag, Heart, Eye, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ClientDashboard() {
  const { data: stats, isLoading: statsLoading } = useClientStats();
  const { data: saleReadyAnimals, isLoading: animalsLoading } = useSaleReadyAnimals(6);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome to FarmSync</h1>
          <p className="text-muted-foreground">Browse available animals and express interest</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Animals Available"
            value={statsLoading ? '...' : stats?.availableAnimals ?? 0}
            icon={ShoppingBag}
            description="For sale"
          />
          <StatCard
            title="My Interests"
            value={statsLoading ? '...' : stats?.myInterests ?? 0}
            icon={Heart}
            description="Animals you're interested in"
          />
          <StatCard
            title="Recently Added"
            value={statsLoading ? '...' : stats?.recentlyAdded ?? 0}
            icon={TrendingUp}
            description="Last 7 days"
          />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Sale-Ready Animals</CardTitle>
            <Link to="/browse">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" /> View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {animalsLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : saleReadyAnimals?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No animals currently available for sale</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {saleReadyAnimals?.map((animal) => (
                  <div key={animal.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{animal.animal_id}</span>
                      <Badge variant="secondary">{animal.breed}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Age: {animal.age} years</p>
                      <p className="capitalize">Sex: {animal.sex}</p>
                    </div>
                    <Link to={`/browse/${animal.id}`}>
                      <Button variant="outline" size="sm" className="w-full mt-3">
                        View Details
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
