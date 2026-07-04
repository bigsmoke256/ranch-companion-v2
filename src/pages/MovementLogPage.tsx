import { useState } from 'react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MovementRecord, Livestock } from '@/types/database';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Route, Plus, Search, ArrowRight, Calendar, MapPin, Truck, Filter
} from 'lucide-react';

function useMovementRecords() {
  return useQuery({
    queryKey: ['movement-records'],
    queryFn: async () => {
      const { data: records, error: recordsError } = await supabase
        .from('movement_records')
        .select('*')
        .order('movement_date', { ascending: false });

      if (recordsError) throw recordsError;

      const { data: animals, error: animalsError } = await supabase
        .from('livestock')
        .select('*');

      if (animalsError) throw animalsError;

      const animalsMap = new Map(animals.map(a => [a.id, a]));
      
      return (records as MovementRecord[]).map(record => ({
        ...record,
        animal: animalsMap.get(record.livestock_id) as Livestock | undefined,
      }));
    },
  });
}

function useAnimals() {
  return useQuery({
    queryKey: ['animals-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('livestock')
        .select('*')
        .eq('status', 'active')
        .order('animal_id');

      if (error) throw error;
      return data as Livestock[];
    },
  });
}

function useAddMovement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (movement: {
      livestock_id: string;
      from_location: string;
      to_location: string;
      movement_date: string;
      reason?: string;
      transported_by?: string;
    }) => {
      const { data, error } = await supabase
        .from('movement_records')
        .insert({
          ...movement,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movement-records'] });
      toast.success('Movement recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record movement');
    },
  });
}

function AddMovementDialog() {
  const [open, setOpen] = useState(false);
  const [animalId, setAnimalId] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [movementDate, setMovementDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [transportedBy, setTransportedBy] = useState('');
  
  const { data: animals } = useAnimals();
  const addMovement = useAddMovement();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!animalId || !fromLocation || !toLocation) {
      toast.error('Please fill all required fields');
      return;
    }
    
    await addMovement.mutateAsync({
      livestock_id: animalId,
      from_location: fromLocation,
      to_location: toLocation,
      movement_date: movementDate,
      reason: reason || undefined,
      transported_by: transportedBy || undefined,
    });
    
    setOpen(false);
    setAnimalId('');
    setFromLocation('');
    setToLocation('');
    setReason('');
    setTransportedBy('');
    setMovementDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Record Movement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Animal Movement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="animal">Animal *</Label>
            <Select value={animalId} onValueChange={setAnimalId}>
              <SelectTrigger>
                <SelectValue placeholder="Select animal" />
              </SelectTrigger>
              <SelectContent>
                {animals?.map((animal) => (
                  <SelectItem key={animal.id} value={animal.id}>
                    {animal.animal_id} - {animal.breed}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="movement-date">Movement Date *</Label>
            <Input
              id="movement-date"
              type="date"
              value={movementDate}
              onChange={(e) => setMovementDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="from-location">From Location *</Label>
            <Input
              id="from-location"
              value={fromLocation}
              onChange={(e) => setFromLocation(e.target.value)}
              placeholder="e.g., Pasture A, Barn 1"
            />
          </div>
          <div>
            <Label htmlFor="to-location">To Location *</Label>
            <Input
              id="to-location"
              value={toLocation}
              onChange={(e) => setToLocation(e.target.value)}
              placeholder="e.g., Pasture B, Market"
            />
          </div>
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional: reason for movement"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="transported-by">Transported By</Label>
            <Input
              id="transported-by"
              value={transportedBy}
              onChange={(e) => setTransportedBy(e.target.value)}
              placeholder="Name of transporter"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addMovement.isPending}>
              {addMovement.isPending ? 'Saving...' : 'Record Movement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function MovementLogPage() {
  const { data: movements, isLoading } = useMovementRecords();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMovements = movements?.filter(movement =>
    movement.animal?.animal_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movement.from_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movement.to_location.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Movement Log</h1>
            <p className="text-muted-foreground">Track and record animal movements</p>
          </div>
          <AddMovementDialog />
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by animal ID or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Movements List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Movement Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredMovements && filteredMovements.length > 0 ? (
              <div className="space-y-4">
                {filteredMovements.map((movement) => (
                  <div key={movement.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Truck className="h-5 w-5 text-blue-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{movement.animal?.animal_id || 'Unknown'}</span>
                        <Badge variant="outline">
                          {movement.animal?.breed}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{movement.from_location}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{movement.to_location}</span>
                      </div>
                      
                      {movement.reason && (
                        <p className="text-sm text-muted-foreground mb-1">
                          <span className="font-medium">Reason:</span> {movement.reason}
                        </p>
                      )}
                      
                      {movement.transported_by && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Transported by:</span> {movement.transported_by}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(movement.movement_date), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Route className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No movement records found</h3>
                <p className="text-muted-foreground">
                  Record animal movements using the button above
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
