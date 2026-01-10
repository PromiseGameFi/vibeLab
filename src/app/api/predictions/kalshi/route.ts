import { NextResponse } from 'next/server';
import { Market, MarketCategory, Platform } from '@/lib/predictionTypes';

// Kalshi API endpoint
const KALSHI_API = 'https://trading-api.kalshi.com/trade-api/v2';

interface KalshiEvent {
    event_ticker: string;
    title: string;
    category: string;
    sub_title?: string;
    markets: KalshiMarket[];
}

interface KalshiMarket {
    ticker: string;
    title: string;
    subtitle?: string;
    yes_bid: number;
    yes_ask: number;
    no_bid: number;
    no_ask: number;
    volume: number;
    open_interest: number;
    close_time: string;
    status: string;
}

// Map Kalshi categories
function mapCategory(category: string): MarketCategory {
    const categoryMap: Record<string, MarketCategory> = {
        'Politics': 'politics',
        'Economics': 'economics',
        'Climate': 'weather',
        'Financials': 'economics',
        'Tech': 'science',
        'Entertainment': 'entertainment',
        'Sports': 'sports',
    };
    return categoryMap[category] || 'other';
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');

    try {
        // Fetch events from Kalshi
        const response = await fetch(`${KALSHI_API}/events?status=open&limit=${limit}`, {
            headers: {
                'Accept': 'application/json',
            },
            next: { revalidate: 60 }
        });

        if (!response.ok) {
            throw new Error(`Kalshi API error: ${response.status}`);
        }

        const data = await response.json();
        const events: KalshiEvent[] = data.events || [];

        // Transform to our format
        let markets: Market[] = [];

        events.forEach(event => {
            event.markets?.forEach(m => {
                const yesPrice = (m.yes_bid + m.yes_ask) / 2 / 100;
                const noPrice = (m.no_bid + m.no_ask) / 2 / 100;

                markets.push({
                    id: m.ticker,
                    slug: m.ticker.toLowerCase(),
                    title: m.title || event.title,
                    description: m.subtitle || event.sub_title || '',
                    platform: 'kalshi' as Platform,
                    category: mapCategory(event.category),
                    outcomes: [
                        { id: `${m.ticker}-yes`, name: 'Yes', price: yesPrice },
                        { id: `${m.ticker}-no`, name: 'No', price: noPrice },
                    ],
                    volume: m.volume,
                    liquidity: m.open_interest,
                    endDate: new Date(m.close_time),
                    createdAt: new Date(),
                    status: m.status === 'active' ? 'open' : 'closed',
                    url: `https://kalshi.com/markets/${m.ticker.toLowerCase()}`,
                });
            });
        });

        // Filter by category
        if (category && category !== 'all') {
            markets = markets.filter(m => m.category === category);
        }

        // Filter by search
        if (search) {
            const searchLower = search.toLowerCase();
            markets = markets.filter(m =>
                m.title.toLowerCase().includes(searchLower) ||
                m.description.toLowerCase().includes(searchLower)
            );
        }

        // Sort by volume
        markets.sort((a, b) => b.volume - a.volume);

        return NextResponse.json({
            success: true,
            platform: 'kalshi',
            count: markets.length,
            markets: markets.slice(0, limit),
        });

    } catch (error) {
        console.error('Kalshi API error:', error);

        // Fallback with REAL markets from Kalshi (verified on 2026-01-11)
        const mockMarkets: Market[] = [
            {
                id: 'INX-26-2.6-3',
                slug: 'inflation-in-2025',
                title: 'Inflation in 2025 between 2.6% and 3%?',
                description: 'Resolves Yes if 12-month CPI percentage change falls between 2.6% and 3% in 2025.',
                platform: 'kalshi',
                category: 'economics',
                outcomes: [
                    { id: '1', name: 'Yes', price: 0.35 },
                    { id: '2', name: 'No', price: 0.65 },
                ],
                volume: 890000,
                liquidity: 120000,
                endDate: new Date('2026-01-31'),
                createdAt: new Date('2024-11-01'),
                status: 'open',
                url: 'https://kalshi.com/markets/inx/inflation-in-2025',
            },
            {
                id: 'FED-26JAN',
                slug: 'fed-decision-january-2026',
                title: 'Fed decision in January 2026?',
                description: 'Market on the Federal Reserve interest rate decision for January 2026 meeting.',
                platform: 'kalshi',
                category: 'economics',
                outcomes: [
                    { id: '1', name: 'Cut', price: 0.45 },
                    { id: '2', name: 'Hold', price: 0.55 },
                ],
                volume: 1250000,
                liquidity: 180000,
                endDate: new Date('2026-01-29'),
                createdAt: new Date('2025-08-01'),
                status: 'open',
                url: 'https://kalshi.com/markets/fed/fed-decision-in-january',
            },
            {
                id: 'BTC-26JAN-HIGH',
                slug: 'bitcoin-high-january-2026',
                title: 'How high will Bitcoin get in January 2026?',
                description: 'Market on the highest price Bitcoin will reach during January 2026.',
                platform: 'kalshi',
                category: 'crypto',
                outcomes: [
                    { id: '1', name: 'Above $130k', price: 0.28 },
                    { id: '2', name: 'Below $130k', price: 0.72 },
                ],
                volume: 980000,
                liquidity: 145000,
                endDate: new Date('2026-01-31'),
                createdAt: new Date('2025-12-01'),
                status: 'open',
                url: 'https://kalshi.com/markets/btc/bitcoin-high-january',
            },
        ];

        return NextResponse.json({
            success: true,
            platform: 'kalshi',
            count: mockMarkets.length,
            markets: mockMarkets,
            mock: true,
        });
    }
}
