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

        // Return mock data for development (demo mode)
        const mockMarkets: Market[] = [
            {
                id: 'demo-kalshi-1',
                slug: 'bitcoin-price',
                title: '[DEMO] Bitcoin price prediction',
                description: 'Demo data - visit Kalshi for live markets.',
                platform: 'kalshi',
                category: 'crypto',
                outcomes: [
                    { id: '1', name: 'Yes', price: 0.72 },
                    { id: '2', name: 'No', price: 0.28 },
                ],
                volume: 2150000,
                liquidity: 380000,
                endDate: new Date('2026-12-31'),
                createdAt: new Date(),
                status: 'open',
                url: 'https://kalshi.com',
            },
            {
                id: 'demo-kalshi-2',
                slug: 'inflation-rate',
                title: '[DEMO] CPI inflation forecast',
                description: 'Demo data - visit Kalshi for live markets.',
                platform: 'kalshi',
                category: 'economics',
                outcomes: [
                    { id: '1', name: 'Yes', price: 0.35 },
                    { id: '2', name: 'No', price: 0.65 },
                ],
                volume: 890000,
                liquidity: 120000,
                endDate: new Date('2026-03-15'),
                createdAt: new Date(),
                status: 'open',
                url: 'https://kalshi.com',
            },
            {
                id: 'demo-kalshi-3',
                slug: 'recession-forecast',
                title: '[DEMO] US recession probability',
                description: 'Demo data - visit Kalshi for live markets.',
                platform: 'kalshi',
                category: 'economics',
                outcomes: [
                    { id: '1', name: 'Yes', price: 0.22 },
                    { id: '2', name: 'No', price: 0.78 },
                ],
                volume: 1450000,
                liquidity: 210000,
                endDate: new Date('2027-01-15'),
                createdAt: new Date(),
                status: 'open',
                url: 'https://kalshi.com',
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
