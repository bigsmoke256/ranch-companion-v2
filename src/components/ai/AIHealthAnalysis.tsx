import { useState } from 'react';
import { useAIChat } from '@/hooks/useAIChat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Activity, Brain, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface HealthRecord {
  id: string;
  record_type: string;
  description: string;
  record_date: string;
  performed_by?: string;
}

interface AnimalInfo {
  animal_id: string;
  breed: string;
  age: number;
  sex: string;
  status: string;
}

interface AIHealthAnalysisProps {
  healthRecords: HealthRecord[];
  animalInfo: AnimalInfo;
}

export function AIHealthAnalysis({ healthRecords, animalInfo }: AIHealthAnalysisProps) {
  const { messages, isLoading, sendMessage, clearMessages } = useAIChat();
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const runAnalysis = async () => {
    clearMessages();
    setHasAnalyzed(true);
    await sendMessage('Analyze health records', {
      type: 'health-analysis',
      healthRecords,
      animalInfo,
    });
  };

  const analysis = messages.find(m => m.role === 'assistant')?.content;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Health Analysis</CardTitle>
              <CardDescription>
                AI-powered insights from health records
              </CardDescription>
            </div>
          </div>
          <Button 
            onClick={runAnalysis} 
            disabled={isLoading}
            variant={hasAnalyzed ? 'outline' : 'default'}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : hasAnalyzed ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-analyze
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 mr-2" />
                Analyze Records
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {!hasAnalyzed ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-medium mb-2">Ready to Analyze</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Click "Analyze Records" to get AI-powered insights about this animal's health history.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="secondary">
                {healthRecords.length} health record{healthRecords.length !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="outline">{animalInfo.breed}</Badge>
              <Badge variant="outline">{animalInfo.age} months old</Badge>
            </div>
          </div>
        ) : isLoading && !analysis ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">
              Analyzing {healthRecords.length} health records...
            </p>
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>AI analysis is advisory only. Consult a veterinarian for diagnosis.</span>
            </div>
            <ScrollArea className="h-[400px] rounded-lg border p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {analysis}
              </div>
            </ScrollArea>
            <div className="text-xs text-muted-foreground text-right">
              Last analyzed: {format(new Date(), 'PPp')}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
