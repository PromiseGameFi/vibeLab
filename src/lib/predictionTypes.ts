// Prediction Market Types for VibeLab

export interface Market {
    id: string;
    slug: string;
    title: string;
    description: string;
    platform: Platform;
    category: MarketCategory;
    outcomes: Outcome[];
    volume: number;
    liquidity: number;
    endDate: Date;
    createdAt: Date;
    status: MarketStatus;
    url: string;
    imageUrl?: string;
}

export interface Outcome {
    id: string;
    name: string;
    price: number;  // 0-1, represents probability
    volume?: number;
}

export type Platform =
    | 'polymarket'
    | 'kalshi'
    | 'manifold'
    | 'predictit'
    | 'metaculus';

export type MarketCategory =
    | 'politics'
    | 'sports'
    | 'crypto'
    | 'economics'
    | 'entertainment'
    | 'science'
    | 'weather'
    | 'other';

export type MarketStatus =
    | 'open'
    | 'closed'
    | 'resolved';

export interface ArbitrageOpportunity {
    marketId: string;
    title: string;
    platform: Platform;
    yesPrice: number;
    noPrice: number;
    profitMargin: number;  // Positive = arbitrage exists
    url: string;
}

export interface CrossPlatformArbitrage {
    title: string;
    markets: {
        platform: Platform;
        marketId: string;
        outcome: string;
        price: number;
        url: string;
    }[];
    profitMargin: number;
}

export interface AIAnalysis {
    marketId: string;
    title: string;
    aiProbability: number;  // 0-1
    marketProbability: number;  // Current market price
    edge: number;  // aiProb - marketProb
    confidence: 'low' | 'medium' | 'high';
    reasoning: string;
    sources: string[];
    timestamp: Date;
}

export interface WalletActivity {
    wallet: string;
    action: 'buy' | 'sell';
    market: string;
    outcome: string;
    amount: number;
    price: number;
    timestamp: Date;
    platform: Platform;
}

export interface PortfolioPosition {
    marketId: string;
    title: string;
    platform: Platform;
    outcome: string;
    shares: number;
    avgPrice: number;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
}

// Platform configs
export const PLATFORM_CONFIG: Record<Platform, { name: string; color: string; icon: string; url: string }> = {
    polymarket: {
        name: 'Polymarket',
        color: 'text-purple-400',
        icon: '🔮',
        url: 'https://polymarket.com'
    },
    kalshi: {
        name: 'Kalshi',
        color: 'text-blue-400',
        icon: '📊',
        url: 'https://kalshi.com'
    },
    manifold: {
        name: 'Manifold',
        color: 'text-green-400',
        icon: '🎯',
        url: 'https://manifold.markets'
    },
    predictit: {
        name: 'PredictIt',
        color: 'text-red-400',
        icon: '🗳️',
        url: 'https://predictit.org'
    },
    metaculus: {
        name: 'Metaculus',
        color: 'text-cyan-400',
        icon: '🔬',
        url: 'https://metaculus.com'
    }
};

export const CATEGORY_CONFIG: Record<MarketCategory, { name: string; icon: string }> = {
    politics: { name: 'Politics', icon: '🏛️' },
    sports: { name: 'Sports', icon: '⚽' },
    crypto: { name: 'Crypto', icon: '₿' },
    economics: { name: 'Economics', icon: '📈' },
    entertainment: { name: 'Entertainment', icon: '🎬' },
    science: { name: 'Science', icon: '🔬' },
    weather: { name: 'Weather', icon: '🌤️' },
    other: { name: 'Other', icon: '📦' }
};

// Smart Money Tracking
export interface WhaleActivity {
    id: string;
    wallet: string;
    walletLabel?: string;  // Known trader name if available
    action: 'buy' | 'sell';
    market: string;
    marketTitle: string;
    outcome: 'yes' | 'no';
    amount: number;  // In USD
    shares: number;
    price: number;
    timestamp: Date;
    platform: Platform;
    pnl?: number;  // If position closed
}

export interface WhaleWallet {
    address: string;
    label?: string;
    totalVolume: number;
    winRate: number;
    pnl: number;
    activeSince: Date;
    recentTrades: WhaleActivity[];
    followersCount?: number;
}

// News Sentiment
export interface NewsItem {
    id: string;
    title: string;
    summary: string;
    source: string;
    url: string;
    publishedAt: Date;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    sentimentScore: number;  // -1 to 1
    relatedMarkets: string[];  // Market IDs
    keywords: string[];
}

export interface SentimentAnalysis {
    marketId: string;
    overallSentiment: 'bullish' | 'bearish' | 'neutral';
    sentimentScore: number;  // -1 to 1
    newsCount: number;
    twitterMentions: number;
    trendDirection: 'up' | 'down' | 'stable';
    lastUpdated: Date;
}

// Market Alerts
export interface MarketAlert {
    id: string;
    marketId: string;
    marketTitle: string;
    platform: Platform;
    type: AlertType;
    condition: AlertCondition;
    targetValue: number;
    currentValue: number;
    isTriggered: boolean;
    createdAt: Date;
    triggeredAt?: Date;
    notified: boolean;
}

export type AlertType =
    | 'price_above'
    | 'price_below'
    | 'volume_spike'
    | 'whale_buy'
    | 'whale_sell'
    | 'resolution';

export interface AlertCondition {
    field: 'yesPrice' | 'noPrice' | 'volume' | 'whaleActivity';
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    value: number;
}

export const ALERT_TYPE_CONFIG: Record<AlertType, { name: string; icon: string; description: string }> = {
    price_above: { name: 'Price Above', icon: '📈', description: 'Notify when YES price exceeds target' },
    price_below: { name: 'Price Below', icon: '📉', description: 'Notify when YES price drops below target' },
    volume_spike: { name: 'Volume Spike', icon: '🔥', description: 'Notify on unusual trading volume' },
    whale_buy: { name: 'Whale Buy', icon: '🐋', description: 'Notify when big money buys' },
    whale_sell: { name: 'Whale Sell', icon: '🔴', description: 'Notify when big money sells' },
    resolution: { name: 'Resolution', icon: '⏰', description: 'Notify when market resolves' }
};
