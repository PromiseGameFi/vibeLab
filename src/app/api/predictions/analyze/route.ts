import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { AIAnalysis } from '@/lib/predictionTypes';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const { marketId, title, description, currentPrice, endDate } = await request.json();

        if (!title) {
            return NextResponse.json({ error: 'Market title required' }, { status: 400 });
        }

        // Build research prompt
        const systemPrompt = `You are an expert prediction market analyst and forecaster. Your job is to analyze prediction market questions and provide probability estimates based on:
1. Historical precedent and base rates
2. Current news and events
3. Expert consensus
4. Logical reasoning

You must be calibrated - when you say something is 70% likely, it should happen 70% of the time.

Respond in JSON format only:
{
    "probability": 0.XX,  // 0-1
    "confidence": "low" | "medium" | "high",
    "reasoning": "Brief explanation of your analysis",
    "bullCase": "Arguments for YES",
    "bearCase": "Arguments for NO",
    "keyFactors": ["factor1", "factor2", "factor3"]
}`;

        const userPrompt = `Analyze this prediction market:

QUESTION: ${title}
${description ? `DESCRIPTION: ${description}` : ''}
CURRENT MARKET PRICE: ${(currentPrice * 100).toFixed(1)}% YES
${endDate ? `RESOLUTION DATE: ${new Date(endDate).toLocaleDateString()}` : ''}

Provide your independent probability estimate and analysis.`;

        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 1000,
        });

        const content = response.choices[0]?.message?.content || '';

        // Parse JSON response
        let analysis;
        try {
            // Extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found');
            }
        } catch {
            // Fallback parsing
            analysis = {
                probability: currentPrice,
                confidence: 'low',
                reasoning: content,
                bullCase: 'Unable to parse',
                bearCase: 'Unable to parse',
                keyFactors: []
            };
        }

        const aiProbability = Math.max(0, Math.min(1, analysis.probability || currentPrice));
        const edge = aiProbability - currentPrice;

        const result: AIAnalysis = {
            marketId,
            title,
            aiProbability,
            marketProbability: currentPrice,
            edge,
            confidence: analysis.confidence || 'medium',
            reasoning: `${analysis.reasoning || ''}\n\n**Bull Case:** ${analysis.bullCase || 'N/A'}\n\n**Bear Case:** ${analysis.bearCase || 'N/A'}`,
            sources: analysis.keyFactors || [],
            timestamp: new Date(),
        };

        return NextResponse.json({
            success: true,
            analysis: result,
            recommendation: edge > 0.1 ? 'BUY YES' : edge < -0.1 ? 'BUY NO' : 'HOLD',
        });

    } catch (error) {
        console.error('AI Analysis error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze market', details: String(error) },
            { status: 500 }
        );
    }
}
