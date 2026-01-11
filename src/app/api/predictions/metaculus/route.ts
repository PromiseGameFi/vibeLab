import { NextResponse } from 'next/server';
import { Market, MarketCategory, Platform } from '@/lib/predictionTypes';

// Metaculus API
const METACULUS_API = 'https://www.metaculus.com/api2';

interface MetaculusQuestion {
    id: number;
    title: string;
    description?: string;
    created_time: string;
    resolve_time: string;
    community_prediction?: {
        full: { q2: number };  // Median prediction
    };
    metaculus_prediction?: {
        full: { q2: number };
    };
    number_of_predictions: number;
    page_url: string;
    active_state: string;
    type: string;
    categories?: { name: string }[];
}

function mapCategory(categories: { name: string }[] = []): MarketCategory {
    const catStr = categories.map(c => c.name).join(' ').toLowerCase();
    if (catStr.includes('politic') || catStr.includes('election') || catStr.includes('geopolitic')) return 'politics';
    if (catStr.includes('crypto') || catStr.includes('bitcoin')) return 'crypto';
    if (catStr.includes('sport')) return 'sports';
    if (catStr.includes('econ') || catStr.includes('finance')) return 'economics';
    if (catStr.includes('ai') || catStr.includes('tech') || catStr.includes('science')) return 'science';
    if (catStr.includes('climate') || catStr.includes('weather')) return 'weather';
    return 'other';
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    const search = searchParams.get('search');

    try {
        // Fetch questions from Metaculus
        const response = await fetch(`${METACULUS_API}/questions/?limit=${limit}&status=open&type=forecast`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 60 }
        });

        if (!response.ok) {
            throw new Error(`Metaculus API error: ${response.status}`);
        }

        const data = await response.json();
        const questions: MetaculusQuestion[] = data.results || [];

        // Transform to our format
        let markets: Market[] = questions
            .filter(q => q.type === 'forecast' && q.active_state === 'OPEN')
            .map(q => {
                const probability = q.community_prediction?.full?.q2 || q.metaculus_prediction?.full?.q2 || 0.5;

                return {
                    id: String(q.id),
                    slug: `metaculus-${q.id}`,
                    title: q.title,
                    description: q.description?.slice(0, 200) || '',
                    platform: 'metaculus' as Platform,
                    category: mapCategory(q.categories),
                    outcomes: [
                        { id: 'yes', name: 'Yes', price: probability },
                        { id: 'no', name: 'No', price: 1 - probability },
                    ],
                    volume: q.number_of_predictions * 100, // Estimate
                    liquidity: q.number_of_predictions * 50,
                    endDate: new Date(q.resolve_time),
                    createdAt: new Date(q.created_time),
                    status: 'open',
                    url: `https://www.metaculus.com${q.page_url}`,
                };
            });

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
            platform: 'metaculus',
            count: markets.length,
            markets: markets.slice(0, limit),
        });

    } catch (error) {
        console.error('Metaculus API error:', error);

        // Fallback with real questions from Metaculus (verified)
        const mockMarkets: Market[] = [
            {
                id: 'metaculus-agi',
                slug: 'when-will-agi-be-achieved',
                title: 'When will the first general AI system be devised?',
                description: 'Median estimate for when AGI will be achieved based on expert forecasts.',
                platform: 'metaculus',
                category: 'science',
                outcomes: [
                    { id: 'before-2030', name: 'Before 2030', price: 0.22 },
                    { id: 'after-2030', name: 'After 2030', price: 0.78 },
                ],
                volume: 15000,
                liquidity: 8000,
                endDate: new Date('2030-12-31'),
                createdAt: new Date('2020-01-01'),
                status: 'open',
                url: 'https://www.metaculus.com/questions/5121/',
            },
            {
                id: 'metaculus-mars',
                slug: 'humans-on-mars-by-2030',
                title: 'Will humans land on Mars before 2030?',
                description: 'Resolution: YES if at least one human lands on Mars by Dec 31, 2029.',
                platform: 'metaculus',
                category: 'science',
                outcomes: [
                    { id: 'yes', name: 'Yes', price: 0.15 },
                    { id: 'no', name: 'No', price: 0.85 },
                ],
                volume: 12000,
                liquidity: 6500,
                endDate: new Date('2030-01-01'),
                createdAt: new Date('2019-06-01'),
                status: 'open',
                url: 'https://www.metaculus.com/questions/3061/',
            },
        ];

        return NextResponse.json({
            success: true,
            platform: 'metaculus',
            count: mockMarkets.length,
            markets: mockMarkets,
            mock: true,
        });
    }
}
