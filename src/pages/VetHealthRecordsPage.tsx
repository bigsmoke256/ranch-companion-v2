import { useState } from 'react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Livestock, HealthRecord } from '@/types/database';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import QRCode from '@/components/shared/QRCode';
import { 
  Stethoscope, Plus, Search, Syringe, Heart, Activity, 
  Calendar, FileText, AlertCircle, CheckCircle, Clock
} from 'lucide-react';

const recordTypeConfig: Record<string, { icon: typeof Syringe; color: string; label: string }> = {
  vaccination: { icon: Syringe, color: 'bg-green-100 text-green-700 border-green-200', label: 'Vaccination' },
  diagnosis: { icon: Activity, color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Diagnosis' },
  treatment: { icon: Heart, color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Treatment' },
  follow_up: { icon: Calendar, color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Follow-up' },
  checkup: { icon: Stethoscope, color: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Check-up' },
  illness: { icon: AlertCircle, color: 'bg-red-100 text-red-700 border-red-200', label: 'Illness' },
};

function useAnimalsWithHealth() {
  return useQuery({
    queryKey: ['animals-with-health'],
    queryFn: async () => {
      const { data: animals, error } = await supabase
        .from('livestock')
        .select('*')
        .order('animal_id', { ascending: true });

      if (error) throw error;
      return animals as Livestock[];
    },
  });
}

function useHealthRecordsByAnimal(animalId: string | null) {
  return useQuery({
    queryKey: ['health-records', animalId],
    queryFn: async () => {
      if (!animalId) return [];
      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('livestock_id', animalId)
        .order('record_date', { ascending: false });

      if (error) throw error;
      return data as HealthRecord[];
    },
    enabled: !!animalId,
  });
}

function useAddHealthRecord() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (record: {
      livestock_id: string;
      record_type: string;
      description: string;
      record_date: string;
    }) => {
      const { data, error } = await supabase
        .from('health_records')
        .insert({
          ...record,
          created_by: user?.id,
          performed_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-records'] });
      queryClient.invalidateQueries({ queryKey: ['vet-health-records'] });
      queryClient.invalidateQueries({ queryKey: ['vet-stats'] });
      toast.success('Health record added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add health record');
    },
  });
}

interface AnimalIdentificationCardProps {
  animal: Livestock;
}

function AnimalIdentificationCard({ animal }: AnimalIdentificationCardProps) {
  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* QR Code */}
          <div className="flex flex-col items-center">
            <QRCode value={animal.animal_id} size={120} />
            <p className="text-xs text-muted-foreground mt-2">Scan to verify</p>
          </div>

          {/* Animal Details */}
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Animal Code</p>
              <p className="text-2xl font-bold tracking-wide text-primary">{animal.animal_id}</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Breed</p>
                <p className="font-medium">{animal.breed}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Age</p>
                <p className="font-medium">{animal.age} {animal.age === 1 ? 'year' : 'years'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sex</p>
                <p className="font-medium capitalize">{animal.sex}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant="outline" className={
                  animal.status === 'active' ? 'bg-green-100 text-green-700' :
                  animal.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }>
                  {animal.status}
                </Badge>
              </div>
            </div>

            {animal.notes && (
              <div>
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm">{animal.notes}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AddRecordDialogProps {
  animalId: string;
  animalCode: string;
}

function AddRecordDialog({ animalId, animalCode }: AddRecordDialogProps) {
  const [open, setOpen] = useState(false);
  const [recordType, setRecordType] = useState('');
  const [description, setDescription] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  
  const addRecord = useAddHealthRecord();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordType || !description) {
      toast.error('Please fill all required fields');
      return;
    }
    
    await addRecord.mutateAsync({
      livestock_id: animalId,
      record_type: recordType,
      description,
      record_date: recordDate,
    });
    
    setOpen(false);
    setRecordType('');
    setDescription('');
    setRecordDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Health Record
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Health Record for {animalCode}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="record-type">Record Type *</Label>
            <Select value={recordType} onValueChange={setRecordType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vaccination">Vaccination</SelectItem>
                <SelectItem value="diagnosis">Diagnosis</SelectItem>
                <SelectItem value="treatment">Treatment</SelectItem>
                <SelectItem value="follow_up">Follow-up</SelectItem>
                <SelectItem value="checkup">Check-up</SelectItem>
                <SelectItem value="illness">Illness</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="record-date">Date *</Label>
            <Input
              id="record-date"
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter details of vaccination, diagnosis, treatment, or follow-up..."
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addRecord.isPending}>
              {addRecord.isPending ? 'Saving...' : 'Save Record'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function VetHealthRecordsPage() {
  const { data: animals, isLoading } = useAnimalsWithHealth();
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: healthRecords } = useHealthRecordsByAnimal(selectedAnimalId);
  const selectedAnimal = animals?.find(a => a.id === selectedAnimalId);

  const filteredAnimals = animals?.filter(animal =>
    animal.animal_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    animal.breed.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Health Records</h1>
          <p className="text-muted-foreground">Add vaccinations, diagnoses, treatments, and follow-ups</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Animal List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by animal code or breed..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
              {filteredAnimals?.map((animal) => (
                <Card 
                  key={animal.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedAnimalId === animal.id ? 'border-primary ring-2 ring-primary/20' : ''
                  }`}
                  onClick={() => setSelectedAnimalId(animal.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{animal.animal_id}</p>
                        <p className="text-sm text-muted-foreground">{animal.breed}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">{animal.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredAnimals?.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No animals found</p>
              )}
            </div>
          </div>

          {/* Animal Details & Health Records */}
          <div className="lg:col-span-2 space-y-6">
            {selectedAnimal ? (
              <>
                {/* Animal Identification */}
                <AnimalIdentificationCard animal={selectedAnimal} />

                {/* Health Records Section */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Health History</h2>
                  <AddRecordDialog animalId={selectedAnimal.id} animalCode={selectedAnimal.animal_id} />
                </div>

                {/* Records List */}
                {healthRecords && healthRecords.length > 0 ? (
                  <div className="space-y-3">
                    {healthRecords.map((record) => {
                      const config = recordTypeConfig[record.record_type] || recordTypeConfig.checkup;
                      const Icon = config.icon;
                      return (
                        <Card key={record.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className={`p-2 rounded-lg ${config.color}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className={config.color}>
                                    {config.label}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {format(new Date(record.record_date), 'MMM d, yyyy')}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm">{record.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No health records yet</h3>
                      <p className="text-muted-foreground text-center">
                        Add the first health record for this animal
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="border-dashed h-full min-h-[400px]">
                <CardContent className="flex flex-col items-center justify-center h-full py-12">
                  <Stethoscope className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Select an Animal</h3>
                  <p className="text-muted-foreground text-center max-w-sm">
                    Choose an animal from the list to view their identification and health records
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
