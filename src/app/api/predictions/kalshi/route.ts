import { NextResponse } from 'next/server';
import { Market, MarketCategory, Platform } from '@/lib/predictionTypes';

// Kalshi API endpoint (new API as of 2026)
const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2';

// Map Kalshi categories to our categories
function mapCategory(category: string): MarketCategory {
    const categoryMap: Record<string, MarketCategory> = {
        'Politics': 'politics',
        'Economics': 'economics',
        'Climate and Weather': 'weather',
        'Climate': 'weather',
        'Financials': 'economics',
        'Tech': 'science',
        'Technology': 'science',
        'Entertainment': 'entertainment',
        'Sports': 'sports',
        'World': 'politics',
    };
    return categoryMap[category] || 'other';
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');

    try {
        // Fetch events from Kalshi with nested markets
        const response = await fetch(
            `${KALSHI_API}/events?status=open&limit=${limit}&with_nested_markets=true`,
            {
                headers: {
                    'Accept': 'application/json',
                },
                next: { revalidate: 60 } // Cache for 60 seconds
            }
        );

        if (!response.ok) {
            throw new Error(`Kalshi API error: ${response.status}`);
        }

        const data = await response.json();
        const events = data.events || [];

        // Transform to our format
        let markets: Market[] = [];

        for (const event of events) {
            const eventMarkets = event.markets || [];

            for (const m of eventMarkets) {
                // Prices are in cents (0-100), convert to 0-1
                const yesPrice = (m.yes_bid || m.last_price || 50) / 100;
                const noPrice = (m.no_bid || (100 - (m.last_price || 50))) / 100;

                // Build URL using series_ticker for cleaner URLs
                const urlSlug = event.series_ticker?.toLowerCase() || m.ticker.toLowerCase();

                markets.push({
                    id: m.ticker,
                    slug: m.ticker.toLowerCase(),
                    title: m.title || event.title,
                    description: m.subtitle || event.sub_title || m.rules_primary?.slice(0, 200) || '',
                    platform: 'kalshi' as Platform,
                    category: mapCategory(event.category),
                    outcomes: [
                        { id: `${m.ticker}-yes`, name: 'Yes', price: yesPrice },
                        { id: `${m.ticker}-no`, name: 'No', price: noPrice },
                    ],
                    volume: m.volume || 0,
                    liquidity: m.open_interest || 0,
                    endDate: new Date(m.close_time),
                    createdAt: new Date(m.open_time || m.created_time || Date.now()),
                    status: m.status === 'active' ? 'open' : 'closed',
                    url: `https://kalshi.com/markets/${urlSlug}`,
                });
            }
        }

        // Filter by category if specified
        if (category && category !== 'all') {
            markets = markets.filter(m => m.category === category);
        }

        // Filter by search if provided
        if (search) {
            const searchLower = search.toLowerCase();
            markets = markets.filter(m =>
                m.title.toLowerCase().includes(searchLower) ||
                m.description.toLowerCase().includes(searchLower)
            );
        }

        // Sort by volume (highest first)
        markets.sort((a, b) => b.volume - a.volume);

        return NextResponse.json({
            success: true,
            platform: 'kalshi',
            count: markets.length,
            markets: markets.slice(0, limit),
        });

    } catch (error) {
        console.error('Kalshi API error:', error);

        // Fallback with verified markets from Kalshi
        const mockMarkets: Market[] = [
            {
                id: 'KXELONMARS-99',
                slug: 'kxelonmars-99',
                title: 'Will Elon Musk visit Mars before Aug 1, 2099?',
                description: 'If Elon Musk visits Mars before the earlier of his death or Aug 1, 2099, then the market resolves to Yes.',
                platform: 'kalshi',
                category: 'science',
                outcomes: [
                    { id: '1', name: 'Yes', price: 0.06 },
                    { id: '2', name: 'No', price: 0.94 },
                ],
                volume: 34991,
                liquidity: 13671,
                endDate: new Date('2099-08-01'),
                createdAt: new Date('2025-08-28'),
                status: 'open',
                url: 'https://kalshi.com/markets/kxelonmars',
            },
            {
                id: 'KXWARMING-50',
                slug: 'kxwarming-50',
                title: 'Will the world pass 2 degrees Celsius over pre-industrial levels before 2050?',
                description: 'Market on global warming temperature thresholds.',
                platform: 'kalshi',
                category: 'weather',
                outcomes: [
                    { id: '1', name: 'Yes', price: 0.77 },
                    { id: '2', name: 'No', price: 0.23 },
                ],
                volume: 5315,
                liquidity: 3886,
                endDate: new Date('2050-01-01'),
                createdAt: new Date('2025-06-05'),
                status: 'open',
                url: 'https://kalshi.com/markets/kxwarming',
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
