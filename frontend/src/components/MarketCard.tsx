import { format } from 'date-fns';
import './MarketCard.css';

interface MarketCardProps {
  market: {
    id: string;
    title: string;
    description: string;
    status: string;
    outcomes: Array<{
      id: string;
      title: string;
      probability: number;
    }>;
    liquidity: number;
    endDate?: string;
  };
  onClick: () => void;
}

export function MarketCard({ market, onClick }: MarketCardProps) {
  const topOutcome = market.outcomes?.reduce((prev, current) =>
    prev.probability > current.probability ? prev : current
  );

  return (
    <div className="market-card" onClick={onClick}>
      <div className="market-card-header">
        <h3 className="market-card-title">{market.title}</h3>
        <span className={`market-status market-status-${market.status}`}>
          {market.status === 'open' ? 'Открыт' : market.status === 'resolved' ? 'Разрешен' : 'Закрыт'}
        </span>
      </div>
      <p className="market-card-description">{market.description}</p>
      {topOutcome && (
        <div className="market-card-outcome">
          <span className="outcome-title">{topOutcome.title}</span>
          <span className="outcome-probability">
            {(topOutcome.probability * 100).toFixed(1)}%
          </span>
        </div>
      )}
      <div className="market-card-footer">
        <span className="market-liquidity">💰 {market.liquidity} TON</span>
        {market.endDate && (
          <span className="market-end-date">
            До {format(new Date(market.endDate), 'd MMM')}
          </span>
        )}
      </div>
    </div>
  );
}

