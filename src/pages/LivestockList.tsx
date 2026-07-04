import { AppLayout } from '@/components/layout/AppLayout';
import { LivestockTable } from '@/components/livestock/LivestockTable';
import { AddAnimalDialog } from '@/components/livestock/AddAnimalDialog';
import { useLivestockList } from '@/hooks/useLivestock';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Search } from 'lucide-react';

export default function LivestockList() {
  const { data: livestock, isLoading } = useLivestockList();
  const [search, setSearch] = useState('');

  const filtered = livestock?.filter(animal =>
    animal.animal_id.toLowerCase().includes(search.toLowerCase()) ||
    animal.breed.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Livestock</h1>
            <p className="text-muted-foreground">Manage your herd</p>
          </div>
          <AddAnimalDialog />
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by ID or breed..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <LivestockTable livestock={filtered} isLoading={isLoading} />
      </div>
    </AppLayout>
  );
}
