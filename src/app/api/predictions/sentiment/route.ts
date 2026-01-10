import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { NewsItem, SentimentAnalysis } from '@/lib/predictionTypes';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Mock news data - in production, fetch from news APIs
function generateMockNews(): NewsItem[] {
    const now = Date.now();

    return [
        {
            id: 'news-1',
            title: 'Federal Reserve hints at potential rate cut in Q1 2026',
            summary: 'Fed Chair suggests economic conditions may warrant monetary policy adjustment, markets react positively.',
            source: 'Reuters',
            url: 'https://reuters.com/fed-rate-cut',
            publishedAt: new Date(now - 3600000 * 2),
            sentiment: 'bullish',
            sentimentScore: 0.7,
            relatedMarkets: ['fed-cut', 'recession-2026'],
            keywords: ['fed', 'interest rates', 'monetary policy'],
        },
        {
            id: 'news-2',
            title: 'Bitcoin ETF inflows reach record $2.1B in single day',
            summary: 'Institutional demand for Bitcoin continues to surge as major funds increase allocations.',
            source: 'Bloomberg',
            url: 'https://bloomberg.com/btc-etf',
            publishedAt: new Date(now - 3600000 * 5),
            sentiment: 'bullish',
            sentimentScore: 0.85,
            relatedMarkets: ['btc-100k', 'eth-flip'],
            keywords: ['bitcoin', 'etf', 'institutional'],
        },
        {
            id: 'news-3',
            title: 'OpenAI announces GPT-5 with reasoning capabilities',
            summary: 'New model shows significant improvements in complex reasoning, sparking AGI timeline debates.',
            source: 'TechCrunch',
            url: 'https://techcrunch.com/gpt5',
            publishedAt: new Date(now - 3600000 * 8),
            sentiment: 'bullish',
            sentimentScore: 0.6,
            relatedMarkets: ['ai-agi', 'openai-ipo'],
            keywords: ['ai', 'openai', 'gpt', 'agi'],
        },
        {
            id: 'news-4',
            title: 'Trump announces 2028 campaign with strong polling numbers',
            summary: 'Former president launches 2028 bid with 45% support in early polls.',
            source: 'Politico',
            url: 'https://politico.com/trump-2028',
            publishedAt: new Date(now - 3600000 * 12),
            sentiment: 'neutral',
            sentimentScore: 0.1,
            relatedMarkets: ['trump-2028'],
            keywords: ['trump', 'election', '2028', 'politics'],
        },
        {
            id: 'news-5',
            title: 'Ethereum network congestion causes high gas fees',
            summary: 'Network faces scaling challenges as DeFi activity surges.',
            source: 'CoinDesk',
            url: 'https://coindesk.com/eth-gas',
            publishedAt: new Date(now - 3600000 * 18),
            sentiment: 'bearish',
            sentimentScore: -0.4,
            relatedMarkets: ['eth-flip'],
            keywords: ['ethereum', 'gas', 'scaling'],
        },
        {
            id: 'news-6',
            title: 'Economic indicators suggest recession risk rising',
            summary: 'Yield curve inversion and manufacturing data point to potential downturn.',
            source: 'WSJ',
            url: 'https://wsj.com/recession-risk',
            publishedAt: new Date(now - 3600000 * 24),
            sentiment: 'bearish',
            sentimentScore: -0.6,
            relatedMarkets: ['recession-2026', 'fed-cut'],
            keywords: ['recession', 'economy', 'yield curve'],
        },
    ];
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get('market');
    const limit = parseInt(searchParams.get('limit') || '10');

    try {
        let news = generateMockNews();

        // Filter by market if specified
        if (marketId) {
            news = news.filter(n => n.relatedMarkets.includes(marketId));
        }

        // Limit results
        news = news.slice(0, limit);

        // Calculate overall sentiment
        const avgSentiment = news.reduce((sum, n) => sum + n.sentimentScore, 0) / news.length;
        const overallSentiment = avgSentiment > 0.2 ? 'bullish' : avgSentiment < -0.2 ? 'bearish' : 'neutral';

        return NextResponse.json({
            success: true,
            count: news.length,
            news,
            sentiment: {
                score: avgSentiment,
                label: overallSentiment,
                bullishCount: news.filter(n => n.sentiment === 'bullish').length,
                bearishCount: news.filter(n => n.sentiment === 'bearish').length,
                neutralCount: news.filter(n => n.sentiment === 'neutral').length,
            }
        });

    } catch (error) {
        console.error('News sentiment error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch news', details: String(error) },
            { status: 500 }
        );
    }
}

// POST for AI sentiment analysis on custom text
export async function POST(request: NextRequest) {
    try {
        const { text, marketTitle } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'Text required' }, { status: 400 });
        }

        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `You are a financial sentiment analyzer. Analyze text and determine if it's bullish, bearish, or neutral for prediction markets.

Respond in JSON format:
{
    "sentiment": "bullish" | "bearish" | "neutral",
    "score": -1 to 1 (negative = bearish, positive = bullish),
    "confidence": 0-1,
    "reasoning": "brief explanation"
}`
                },
                {
                    role: 'user',
                    content: `Analyze the sentiment of this text${marketTitle ? ` for the market "${marketTitle}"` : ''}:\n\n${text}`
                }
            ],
            temperature: 0.3,
            max_tokens: 500,
        });

        const content = response.choices[0]?.message?.content || '';

        // Parse JSON response
        let analysis;
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found');
            }
        } catch {
            analysis = {
                sentiment: 'neutral',
                score: 0,
                confidence: 0.5,
                reasoning: content
            };
        }

        return NextResponse.json({
            success: true,
            analysis,
        });

    } catch (error) {
        console.error('Sentiment analysis error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze sentiment', details: String(error) },
            { status: 500 }
        );
    }
}
