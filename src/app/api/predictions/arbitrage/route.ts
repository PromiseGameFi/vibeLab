import { NextRequest, NextResponse } from 'next/server';
import { ArbitrageOpportunity, Market } from '@/lib/predictionTypes';

export async function POST(request: NextRequest) {
    try {
        const { markets } = await request.json();

        if (!markets || !Array.isArray(markets)) {
            return NextResponse.json({ error: 'Markets array required' }, { status: 400 });
        }

        const opportunities: ArbitrageOpportunity[] = [];

        // Find single-platform arbitrage (YES + NO < 1)
        markets.forEach((market: Market) => {
            if (market.outcomes.length >= 2) {
                const yesPrice = market.outcomes[0]?.price || 0;
                const noPrice = market.outcomes[1]?.price || 0;

                // Check for arbitrage: if YES + NO < 1, buying both guarantees profit
                const totalCost = yesPrice + noPrice;
                const profitMargin = 1 - totalCost;

                if (profitMargin > 0.01) { // At least 1% profit
                    opportunities.push({
                        marketId: market.id,
                        title: market.title,
                        platform: market.platform,
                        yesPrice,
                        noPrice,
                        profitMargin,
                        url: market.url,
                    });
                }
            }
        });

        // Sort by profit margin
        opportunities.sort((a, b) => b.profitMargin - a.profitMargin);

        return NextResponse.json({
            success: true,
            count: opportunities.length,
            opportunities,
            totalPotentialProfit: opportunities.reduce((sum, o) => sum + o.profitMargin, 0),
        });

    } catch (error) {
        console.error('Arbitrage detection error:', error);
        return NextResponse.json(
            { error: 'Failed to detect arbitrage', details: String(error) },
            { status: 500 }
        );
    }
}

// GET endpoint for demo/testing
export async function GET() {
    // Return some example arbitrage opportunities for demo
    const demoOpportunities: ArbitrageOpportunity[] = [
        {
            marketId: 'demo-1',
            title: 'Will AI pass the Turing test by 2027?',
            platform: 'polymarket',
            yesPrice: 0.42,
            noPrice: 0.55,
            profitMargin: 0.03, // 3% guaranteed profit
            url: 'https://polymarket.com/event/ai-turing',
        },
        {
            marketId: 'demo-2',
            title: 'SpaceX Starship orbital flight in Q1 2026?',
            platform: 'kalshi',
            yesPrice: 0.71,
            noPrice: 0.27,
            profitMargin: 0.02, // 2% guaranteed profit
            url: 'https://kalshi.com/markets/spacex-starship',
        },
    ];

    return NextResponse.json({
        success: true,
        count: demoOpportunities.length,
        opportunities: demoOpportunities,
        demo: true,
    });
}
