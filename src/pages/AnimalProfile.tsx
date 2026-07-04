import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLivestockById, useHealthRecords } from '@/hooks/useLivestock';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HealthRecordsTab } from '@/components/livestock/HealthRecordsTab';
import { BreedingRecordsTab } from '@/components/livestock/BreedingRecordsTab';
import { MovementRecordsTab } from '@/components/livestock/MovementRecordsTab';
import { AIHealthAnalysis } from '@/components/ai/AIHealthAnalysis';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  active: 'status-active', sold: 'status-sold', deceased: 'status-deceased', transferred: 'status-transferred',
};

export default function AnimalProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: animal, isLoading } = useLivestockById(id!);
  const { data: healthRecords = [] } = useHealthRecords(id!);

  if (isLoading) {
    return <AppLayout><div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div></AppLayout>;
  }

  if (!animal) {
    return <AppLayout><div className="text-center py-12"><p>Animal not found</p><Button asChild className="mt-4"><Link to="/livestock">Back to Livestock</Link></Button></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" asChild className="mb-2"><Link to="/livestock"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link></Button>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{animal.animal_id}</CardTitle>
                <p className="text-muted-foreground">{animal.breed} • {animal.age} years old • {animal.sex}</p>
              </div>
              <Badge variant="outline" className={cn("capitalize text-sm", statusStyles[animal.status])}>{animal.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Added {format(new Date(animal.created_at), 'MMMM d, yyyy')}</p>
            {animal.notes && <p className="mt-2">{animal.notes}</p>}
          </CardContent>
        </Card>

        <Tabs defaultValue="health">
          <TabsList>
            <TabsTrigger value="health">Health Records</TabsTrigger>
            <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
            <TabsTrigger value="breeding">Breeding</TabsTrigger>
            <TabsTrigger value="movement">Movement</TabsTrigger>
          </TabsList>
          <TabsContent value="health" className="mt-4"><HealthRecordsTab livestockId={animal.id} /></TabsContent>
          <TabsContent value="ai-analysis" className="mt-4">
            <AIHealthAnalysis 
              healthRecords={healthRecords} 
              animalInfo={{
                animal_id: animal.animal_id,
                breed: animal.breed,
                age: animal.age,
                sex: animal.sex,
                status: animal.status,
              }} 
            />
          </TabsContent>
          <TabsContent value="breeding" className="mt-4"><BreedingRecordsTab livestockId={animal.id} /></TabsContent>
          <TabsContent value="movement" className="mt-4"><MovementRecordsTab livestockId={animal.id} /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
