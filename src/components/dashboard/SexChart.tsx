import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

interface SexChartProps {
  data: { sex: string; count: number }[];
}

export function SexChart({ data }: SexChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sex Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[250px] items-center justify-center">
          <p className="text-muted-foreground">No livestock data available</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    name: item.sex.charAt(0).toUpperCase() + item.sex.slice(1),
    value: item.count,
    fill: item.sex === 'male' ? 'hsl(var(--chart-4))' : 'hsl(var(--chart-2))',
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sex Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={80} />
              <Tooltip 
                contentStyle={{ 
                  background: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
