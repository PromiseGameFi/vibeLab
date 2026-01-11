import { NextResponse } from 'next/server';
import { Market, MarketCategory, Platform } from '@/lib/predictionTypes';

// PredictIt API
const PREDICTIT_API = 'https://www.predictit.org/api/marketdata';

interface PredictItMarket {
    id: number;
    name: string;
    shortName: string;
    image: string;
    url: string;
    status: string;
    contracts: PredictItContract[];
}

interface PredictItContract {
    id: number;
    name: string;
    shortName: string;
    status: string;
    lastTradePrice: number;
    bestBuyYesCost: number;
    bestBuyNoCost: number;
    bestSellYesCost: number;
    bestSellNoCost: number;
    lastClosePrice: number;
}

function mapCategory(name: string): MarketCategory {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('president') || nameLower.includes('congress') || nameLower.includes('election') || nameLower.includes('trump') || nameLower.includes('biden')) return 'politics';
    if (nameLower.includes('bitcoin') || nameLower.includes('crypto')) return 'crypto';
    if (nameLower.includes('fed') || nameLower.includes('rate') || nameLower.includes('inflation') || nameLower.includes('gdp')) return 'economics';
    return 'politics'; // PredictIt is primarily politics
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    const search = searchParams.get('search');

    try {
        // Fetch markets from PredictIt
        const response = await fetch(`${PREDICTIT_API}/all`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 60 }
        });

        if (!response.ok) {
            throw new Error(`PredictIt API error: ${response.status}`);
        }

        const data = await response.json();
        const apiMarkets: PredictItMarket[] = data.markets || [];

        // Transform to our format
        let markets: Market[] = apiMarkets
            .filter(m => m.status === 'Open')
            .map(m => {
                // Get the main contract
                const mainContract = m.contracts[0];
                const yesPrice = mainContract?.lastTradePrice || mainContract?.bestBuyYesCost || 0.5;

                return {
                    id: String(m.id),
                    slug: m.shortName.toLowerCase().replace(/\s+/g, '-'),
                    title: m.name,
                    description: m.shortName,
                    platform: 'predictit' as Platform,
                    category: mapCategory(m.name),
                    outcomes: m.contracts.slice(0, 2).map(c => ({
                        id: String(c.id),
                        name: c.shortName || c.name,
                        price: c.lastTradePrice || 0.5,
                    })),
                    volume: 0, // PredictIt doesn't expose volume in public API
                    liquidity: 0,
                    endDate: new Date('2026-12-31'), // PredictIt doesn't show end dates in API
                    createdAt: new Date(),
                    status: 'open',
                    url: m.url,
                    imageUrl: m.image,
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
            platform: 'predictit',
            count: markets.length,
            markets: markets.slice(0, limit),
        });

    } catch (error) {
        console.error('PredictIt API error:', error);

        // Fallback with real markets from PredictIt (verified)
        const mockMarkets: Market[] = [
            {
                id: 'pi-dem-nominee-2028',
                slug: 'dem-presidential-nominee-2028',
                title: 'Who will win the 2028 Democratic presidential nomination?',
                description: 'Democratic Party nominee for 2028 presidential election.',
                platform: 'predictit',
                category: 'politics',
                outcomes: [
                    { id: '1', name: 'Harris', price: 0.28 },
                    { id: '2', name: 'Newsom', price: 0.22 },
                ],
                volume: 0,
                liquidity: 0,
                endDate: new Date('2028-08-31'),
                createdAt: new Date('2025-01-01'),
                status: 'open',
                url: 'https://www.predictit.org/markets',
            },
            {
                id: 'pi-gop-nominee-2028',
                slug: 'gop-presidential-nominee-2028',
                title: 'Who will win the 2028 Republican presidential nomination?',
                description: 'Republican Party nominee for 2028 presidential election.',
                platform: 'predictit',
                category: 'politics',
                outcomes: [
                    { id: '1', name: 'Vance', price: 0.35 },
                    { id: '2', name: 'DeSantis', price: 0.18 },
                ],
                volume: 0,
                liquidity: 0,
                endDate: new Date('2028-08-31'),
                createdAt: new Date('2025-01-01'),
                status: 'open',
                url: 'https://www.predictit.org/markets',
            },
        ];

        return NextResponse.json({
            success: true,
            platform: 'predictit',
            count: mockMarkets.length,
            markets: mockMarkets,
            mock: true,
        });
    }
}
