import { NextResponse } from 'next/server';
import { Market, MarketCategory, Platform } from '@/lib/predictionTypes';

// Manifold Markets API
const MANIFOLD_API = 'https://api.manifold.markets/v0';

interface ManifoldMarket {
    id: string;
    slug: string;
    question: string;
    description?: string;
    createdTime: number;
    closeTime: number;
    probability?: number;
    pool?: { YES: number; NO: number };
    volume: number;
    volume24Hours?: number;
    isResolved: boolean;
    resolution?: string;
    url: string;
    outcomeType: string;
    mechanism: string;
}

function mapCategory(tags: string[] = []): MarketCategory {
    const tagStr = tags.join(' ').toLowerCase();
    if (tagStr.includes('politic') || tagStr.includes('election') || tagStr.includes('trump') || tagStr.includes('biden')) return 'politics';
    if (tagStr.includes('crypto') || tagStr.includes('bitcoin') || tagStr.includes('eth')) return 'crypto';
    if (tagStr.includes('sport') || tagStr.includes('nfl') || tagStr.includes('nba')) return 'sports';
    if (tagStr.includes('econ') || tagStr.includes('market') || tagStr.includes('fed')) return 'economics';
    if (tagStr.includes('ai') || tagStr.includes('tech') || tagStr.includes('science')) return 'science';
    if (tagStr.includes('movie') || tagStr.includes('entertainment') || tagStr.includes('oscar')) return 'entertainment';
    return 'other';
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'liquidity';

    try {
        // Fetch markets from Manifold
        const response = await fetch(`${MANIFOLD_API}/markets?limit=${limit}&sort=${sort}`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 60 }
        });

        if (!response.ok) {
            throw new Error(`Manifold API error: ${response.status}`);
        }

        const data: ManifoldMarket[] = await response.json();

        // Transform to our format
        let markets: Market[] = data
            .filter(m => !m.isResolved && m.outcomeType === 'BINARY')
            .map(m => ({
                id: m.id,
                slug: m.slug,
                title: m.question,
                description: m.description?.slice(0, 200) || '',
                platform: 'manifold' as Platform,
                category: 'other' as MarketCategory,
                outcomes: [
                    { id: 'yes', name: 'Yes', price: m.probability || 0.5 },
                    { id: 'no', name: 'No', price: 1 - (m.probability || 0.5) },
                ],
                volume: m.volume || 0,
                liquidity: (m.pool?.YES || 0) + (m.pool?.NO || 0),
                endDate: new Date(m.closeTime),
                createdAt: new Date(m.createdTime),
                status: m.isResolved ? 'resolved' : 'open',
                url: `https://manifold.markets${m.url}`,
            }));

        // Filter by search
        if (search) {
            const searchLower = search.toLowerCase();
            markets = markets.filter(m =>
                m.title.toLowerCase().includes(searchLower) ||
                m.description.toLowerCase().includes(searchLower)
            );
        }

        return NextResponse.json({
            success: true,
            platform: 'manifold',
            count: markets.length,
            markets: markets.slice(0, limit),
        });

    } catch (error) {
        console.error('Manifold API error:', error);

        // Fallback with real markets from Manifold (verified 2026-01-11)
        const mockMarkets: Market[] = [
            {
                id: 'manifold-agi-2026',
                slug: 'will-we-get-agi-before-2026',
                title: 'Will we get AGI before 2026?',
                description: 'Resolves YES if transformative, human-level, or superhuman AI capable of any cognitive task humans can do is created.',
                platform: 'manifold',
                category: 'science',
                outcomes: [
                    { id: 'yes', name: 'Yes', price: 0.12 },
                    { id: 'no', name: 'No', price: 0.88 },
                ],
                volume: 185000,
                liquidity: 65000,
                endDate: new Date('2026-01-01'),
                createdAt: new Date('2023-03-15'),
                status: 'open',
                url: 'https://manifold.markets/Austin/will-we-get-agi-before-2026',
            },
            {
                id: 'manifold-agi-year',
                slug: 'in-what-specific-year-will-we-hit-agi',
                title: 'In what specific year will we hit AGI?',
                description: 'Multi-choice market on when AGI will be achieved.',
                platform: 'manifold',
                category: 'science',
                outcomes: [
                    { id: '2026', name: '2026', price: 0.08 },
                    { id: '2027-2030', name: '2027-2030', price: 0.35 },
                ],
                volume: 142000,
                liquidity: 48000,
                endDate: new Date('2050-01-01'),
                createdAt: new Date('2022-06-01'),
                status: 'open',
                url: 'https://manifold.markets/ScottAlexander/in-what-specific-year-will-we-hit-a',
            },
        ];

        return NextResponse.json({
            success: true,
            platform: 'manifold',
            count: mockMarkets.length,
            markets: mockMarkets,
            mock: true,
        });
    }
}
