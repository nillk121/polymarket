import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface MarketChartProps {
  market: {
    outcomes: Array<{
      id: string;
      title: string;
      probability: number;
    }>;
  };
}

const COLORS = ['#229ED9', '#4caf50', '#ff9800', '#f44336', '#9c27b0'];

export function MarketChart({ market }: MarketChartProps) {
  const data = market.outcomes?.map((outcome, index) => ({
    name: outcome.title,
    value: outcome.probability * 100,
    color: COLORS[index % COLORS.length],
  })) || [];

  return (
    <div className="market-chart">
      <h3>Распределение вероятностей</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

