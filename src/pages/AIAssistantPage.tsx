import { AppLayout } from '@/components/layout/AppLayout';
import { AIFarmAssistant } from '@/components/ai/AIFarmAssistant';

export default function AIAssistantPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Farm Assistant</h1>
          <p className="text-muted-foreground">
            Get instant answers about livestock health, breeding, and farm management.
          </p>
        </div>
        
        <div className="max-w-3xl">
          <AIFarmAssistant />
        </div>
      </div>
    </AppLayout>
  );
}
