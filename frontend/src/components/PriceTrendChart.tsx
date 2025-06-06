import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

interface PriceHistory {
  price: number;
  timestamp: string;
}

interface PriceTrendChartProps {
  priceHistory: PriceHistory[];
  currentPrice: number;
}

const PriceTrendChart: React.FC<PriceTrendChartProps> = ({ priceHistory, currentPrice }) => {
  const data = priceHistory.map((point) => ({
    ...point,
    date: format(new Date(point.timestamp), 'MMM dd'),
  }));

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => value}
          />
          <YAxis 
            domain={['auto', 'auto']}
            tickFormatter={(value) => `€${value}`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number) => [`€${value}`, 'Price']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceTrendChart; 