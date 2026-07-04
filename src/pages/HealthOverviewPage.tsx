import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HealthRecord, Livestock } from '@/types/database';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { 
  Stethoscope, Search, Syringe, Heart, Activity, 
  Calendar, AlertCircle, Eye, Filter
} from 'lucide-react';

const recordTypeConfig: Record<string, { icon: typeof Syringe; color: string; label: string }> = {
  vaccination: { icon: Syringe, color: 'bg-green-100 text-green-700 border-green-200', label: 'Vaccination' },
  diagnosis: { icon: Activity, color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Diagnosis' },
  treatment: { icon: Heart, color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Treatment' },
  follow_up: { icon: Calendar, color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Follow-up' },
  checkup: { icon: Stethoscope, color: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Check-up' },
  illness: { icon: AlertCircle, color: 'bg-red-100 text-red-700 border-red-200', label: 'Illness' },
};

function useHealthRecordsWithAnimals() {
  return useQuery({
    queryKey: ['health-records-with-animals'],
    queryFn: async () => {
      const { data: records, error: recordsError } = await supabase
        .from('health_records')
        .select('*')
        .order('record_date', { ascending: false });

      if (recordsError) throw recordsError;

      const { data: animals, error: animalsError } = await supabase
        .from('livestock')
        .select('*');

      if (animalsError) throw animalsError;

      const animalsMap = new Map(animals.map(a => [a.id, a]));
      
      return (records as HealthRecord[]).map(record => ({
        ...record,
        animal: animalsMap.get(record.livestock_id) as Livestock | undefined,
      }));
    },
  });
}

export default function HealthOverviewPage() {
  const { data: records, isLoading } = useHealthRecordsWithAnimals();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredRecords = records?.filter(record => {
    const matchesSearch = 
      record.animal?.animal_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || record.record_type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Group records by treatment status
  const underTreatment = filteredRecords?.filter(r => r.record_type === 'treatment') || [];
  const pendingFollowUps = filteredRecords?.filter(r => r.record_type === 'follow_up') || [];
  const recentVaccinations = filteredRecords?.filter(r => r.record_type === 'vaccination') || [];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Eye className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Health Overview</h1>
            <p className="text-muted-foreground">Read-only view of veterinary health records</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Heart className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{underTreatment.length}</p>
                  <p className="text-sm text-muted-foreground">Under Treatment</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Calendar className="h-5 w-5 text-purple-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingFollowUps.length}</p>
                  <p className="text-sm text-muted-foreground">Follow-ups</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <Syringe className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{recentVaccinations.length}</p>
                  <p className="text-sm text-muted-foreground">Vaccinations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Stethoscope className="h-5 w-5 text-gray-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{records?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Records</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by animal ID or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="vaccination">Vaccination</SelectItem>
              <SelectItem value="diagnosis">Diagnosis</SelectItem>
              <SelectItem value="treatment">Treatment</SelectItem>
              <SelectItem value="follow_up">Follow-up</SelectItem>
              <SelectItem value="checkup">Check-up</SelectItem>
              <SelectItem value="illness">Illness</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Records List */}
        <Card>
          <CardHeader>
            <CardTitle>Health Records</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRecords && filteredRecords.length > 0 ? (
              <div className="space-y-3">
                {filteredRecords.map((record) => {
                  const config = recordTypeConfig[record.record_type] || recordTypeConfig.checkup;
                  const Icon = config.icon;
                  return (
                    <div key={record.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{record.animal?.animal_id || 'Unknown'}</span>
                          <Badge variant="outline" className={config.color}>
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {record.animal?.breed} • {record.animal?.age} years • {record.animal?.sex}
                        </p>
                        <p className="text-sm">{record.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">
                          {format(new Date(record.record_date), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(record.record_date), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Stethoscope className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No health records found</h3>
                <p className="text-muted-foreground">
                  Health records added by veterinarians will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
