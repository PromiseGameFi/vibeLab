import { NextResponse } from 'next/server';
import { Market, MarketCategory, Platform } from '@/lib/predictionTypes';

// Polymarket GraphQL endpoint
const POLYMARKET_API = 'https://gamma-api.polymarket.com';

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
                url: `https://polymarket.com/event/${m.slug}`,
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

        // Return mock data for development
        const mockMarkets: Market[] = [
            {
                id: 'mock-1',
                slug: 'trump-wins-2028',
                title: 'Will Trump win the 2028 Presidential Election?',
                description: 'Market resolves YES if Donald Trump wins the 2028 US Presidential Election.',
                platform: 'polymarket',
                category: 'politics',
                outcomes: [
                    { id: '1', name: 'Yes', price: 0.32 },
                    { id: '2', name: 'No', price: 0.68 },
                ],
                volume: 5420000,
                liquidity: 890000,
                endDate: new Date('2028-11-05'),
                createdAt: new Date(),
                status: 'open',
                url: 'https://polymarket.com/event/trump-2028',
            },
            {
                id: 'mock-2',
                slug: 'btc-100k-2026',
                title: 'Will Bitcoin reach $100k in 2026?',
                description: 'Market resolves YES if Bitcoin price exceeds $100,000 at any point in 2026.',
                platform: 'polymarket',
                category: 'crypto',
                outcomes: [
                    { id: '1', name: 'Yes', price: 0.75 },
                    { id: '2', name: 'No', price: 0.25 },
                ],
                volume: 3210000,
                liquidity: 450000,
                endDate: new Date('2026-12-31'),
                createdAt: new Date(),
                status: 'open',
                url: 'https://polymarket.com/event/btc-100k',
            },
            {
                id: 'mock-3',
                slug: 'fed-rate-cut-q1',
                title: 'Will the Fed cut rates in Q1 2026?',
                description: 'Market resolves YES if the Federal Reserve announces a rate cut before April 1, 2026.',
                platform: 'polymarket',
                category: 'economics',
                outcomes: [
                    { id: '1', name: 'Yes', price: 0.45 },
                    { id: '2', name: 'No', price: 0.55 },
                ],
                volume: 1890000,
                liquidity: 320000,
                endDate: new Date('2026-04-01'),
                createdAt: new Date(),
                status: 'open',
                url: 'https://polymarket.com/event/fed-rate-cut',
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
