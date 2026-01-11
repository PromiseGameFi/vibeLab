import { NextResponse } from 'next/server';
import { Market, MarketCategory, Platform } from '@/lib/predictionTypes';

// Polymarket GraphQL endpoint
const POLYMARKET_API = 'https://gamma-api.polymarket.com';

interface PolymarketEvent {
    slug: string;
    ticker: string;
}

interface PolymarketMarket {
    id: string;
    slug: string;
    question: string;
    description: string;
    outcomes: string[];
    outcomePrices: string[];
    volume: string;
    liquidity: string;
    endDate: string;
    createdAt: string;
    active: boolean;
    closed: boolean;
    category: string;
    image: string;
    events?: PolymarketEvent[];  // Parent event for grouped markets
    groupItemTitle?: string;      // Indicates this is part of a group
}

// Map Polymarket categories to our categories
function mapCategory(category: string): MarketCategory {
    const categoryMap: Record<string, MarketCategory> = {
        'politics': 'politics',
        'sports': 'sports',
        'crypto': 'crypto',
        'pop-culture': 'entertainment',
        'business': 'economics',
        'science': 'science',
    };
    return categoryMap[category?.toLowerCase()] || 'other';
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');

    try {
        // Fetch markets from Polymarket
        let url = `${POLYMARKET_API}/markets?limit=${limit}&active=true&closed=false`;

        if (category && category !== 'all') {
            url += `&tag=${category}`;
        }

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
            next: { revalidate: 60 } // Cache for 60 seconds
        });

        if (!response.ok) {
            throw new Error(`Polymarket API error: ${response.status}`);
        }

        const data: PolymarketMarket[] = await response.json();

        // Transform to our format
        let markets: Market[] = data.map(m => {
            const prices: string[] = typeof m.outcomePrices === 'string'
                ? JSON.parse(m.outcomePrices)
                : m.outcomePrices || [];
            const outcomeNames: string[] = typeof m.outcomes === 'string'
                ? JSON.parse(m.outcomes)
                : m.outcomes || ['Yes', 'No'];

            return {
                id: m.id,
                slug: m.slug,
                title: m.question,
                description: m.description || '',
                platform: 'polymarket' as Platform,
                category: mapCategory(m.category),
                outcomes: outcomeNames.map((name: string, i: number) => ({
                    id: `${m.id}-${i}`,
                    name,
                    price: parseFloat(prices[i] || '0'),
                })),
                volume: parseFloat(m.volume || '0'),
                liquidity: parseFloat(m.liquidity || '0'),
                endDate: new Date(m.endDate),
                createdAt: new Date(m.createdAt),
                status: m.closed ? 'closed' : 'open',
                // Use parent event slug if this is a grouped market
                url: m.events?.[0]?.slug
                    ? `https://polymarket.com/event/${m.events[0].slug}`
                    : `https://polymarket.com/event/${m.slug}`,
                imageUrl: m.image,
            };
        });

        // Filter by search if provided
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
            platform: 'polymarket',
            count: markets.length,
            markets,
        });

    } catch (error) {
        console.error('Polymarket API error:', error);

        // Fallback with REAL markets from Polymarket (verified on 2026-01-11)
        const mockMarkets: Market[] = [
            {
                id: '516938',
                slug: 'will-2025-be-the-hottest-year-on-record',
                title: 'Will 2025 be the hottest year on record?',
                description: 'Market resolves Yes if Global Land-Ocean Temperature Index for 2025 shows an increase greater than any previously recorded year.',
                platform: 'polymarket',
                category: 'science',
                outcomes: [
                    { id: '1', name: 'Yes', price: 0.0025 },
                    { id: '2', name: 'No', price: 0.9975 },
                ],
                volume: 2206201,
                liquidity: 112642,
                endDate: new Date('2025-12-31'),
                createdAt: new Date('2024-12-31'),
                status: 'open',
                url: 'https://polymarket.com/event/will-2025-be-the-hottest-year-on-record',
            },
            {
                id: '517311',
                slug: 'will-trump-deport-250000-500000-people',
                title: 'Will Trump deport 250,000-500,000 people?',
                description: 'Resolves Yes if ICE removes between 250,000 and 500,000 non citizens in 2025 fiscal year.',
                platform: 'polymarket',
                category: 'politics',
                outcomes: [
                    { id: '1', name: 'Yes', price: 0.894 },
                    { id: '2', name: 'No', price: 0.106 },
                ],
                volume: 1041791,
                liquidity: 5847,
                endDate: new Date('2025-12-31'),
                createdAt: new Date('2025-01-05'),
                status: 'open',
                url: 'https://polymarket.com/event/how-many-people-will-trump-deport-in-2025',
            },
            {
                id: '517310',
                slug: 'will-trump-deport-less-than-250000',
                title: 'Will Trump deport less than 250,000?',
                description: 'Resolves Yes if ICE removes less than 250,000 non citizens in 2025 fiscal year.',
                platform: 'polymarket',
                category: 'politics',
                outcomes: [
                    { id: '1', name: 'Yes', price: 0.022 },
                    { id: '2', name: 'No', price: 0.978 },
                ],
                volume: 944410,
                liquidity: 4096,
                endDate: new Date('2025-12-31'),
                createdAt: new Date('2025-01-05'),
                status: 'open',
                url: 'https://polymarket.com/event/how-many-people-will-trump-deport-in-2025',
            },
        ];

        return NextResponse.json({
            success: true,
            platform: 'polymarket',
            count: mockMarkets.length,
            markets: mockMarkets,
            mock: true,
        });
    }
}
