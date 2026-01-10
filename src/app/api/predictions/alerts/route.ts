import { NextRequest, NextResponse } from 'next/server';
import { MarketAlert, AlertType } from '@/lib/predictionTypes';

// In-memory storage for demo (use database in production)
const alerts: Map<string, MarketAlert> = new Map();

// GET - List all alerts
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get('market');
    const triggered = searchParams.get('triggered');

    let alertList = Array.from(alerts.values());

    // Filter by market
    if (marketId) {
        alertList = alertList.filter(a => a.marketId === marketId);
    }

    // Filter by triggered status
    if (triggered === 'true') {
        alertList = alertList.filter(a => a.isTriggered);
    } else if (triggered === 'false') {
        alertList = alertList.filter(a => !a.isTriggered);
    }

    // Sort by creation date (newest first)
    alertList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
        success: true,
        count: alertList.length,
        alerts: alertList,
    });
}

// POST - Create new alert
export async function POST(request: NextRequest) {
    try {
        const { marketId, marketTitle, platform, type, targetValue, currentValue } = await request.json();

        if (!marketId || !type || targetValue === undefined) {
            return NextResponse.json(
                { error: 'marketId, type, and targetValue are required' },
                { status: 400 }
            );
        }

        const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Determine condition based on alert type
        let condition;
        switch (type as AlertType) {
            case 'price_above':
                condition = { field: 'yesPrice', operator: 'gte', value: targetValue };
                break;
            case 'price_below':
                condition = { field: 'yesPrice', operator: 'lte', value: targetValue };
                break;
            case 'volume_spike':
                condition = { field: 'volume', operator: 'gte', value: targetValue };
                break;
            case 'whale_buy':
            case 'whale_sell':
                condition = { field: 'whaleActivity', operator: 'gte', value: targetValue };
                break;
            default:
                condition = { field: 'yesPrice', operator: 'eq', value: targetValue };
        }

        const alert: MarketAlert = {
            id,
            marketId,
            marketTitle: marketTitle || marketId,
            platform: platform || 'polymarket',
            type: type as AlertType,
            condition: condition as MarketAlert['condition'],
            targetValue,
            currentValue: currentValue || 0,
            isTriggered: false,
            createdAt: new Date(),
            notified: false,
        };

        alerts.set(id, alert);

        return NextResponse.json({
            success: true,
            alert,
            message: `Alert created: ${type} at ${(targetValue * 100).toFixed(0)}%`,
        });

    } catch (error) {
        console.error('Create alert error:', error);
        return NextResponse.json(
            { error: 'Failed to create alert', details: String(error) },
            { status: 500 }
        );
    }
}

// DELETE - Remove alert
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
        }

        if (!alerts.has(id)) {
            return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
        }

        alerts.delete(id);

        return NextResponse.json({
            success: true,
            message: 'Alert deleted',
        });

    } catch (error) {
        console.error('Delete alert error:', error);
        return NextResponse.json(
            { error: 'Failed to delete alert', details: String(error) },
            { status: 500 }
        );
    }
}

// PATCH - Check and trigger alerts
export async function PATCH(request: NextRequest) {
    try {
        const { markets } = await request.json();

        if (!markets || !Array.isArray(markets)) {
            return NextResponse.json({ error: 'Markets array required' }, { status: 400 });
        }

        const triggered: MarketAlert[] = [];

        alerts.forEach((alert, id) => {
            if (alert.isTriggered) return;

            const market = markets.find((m: { id: string }) => m.id === alert.marketId);
            if (!market) return;

            const currentPrice = market.outcomes?.[0]?.price || 0;
            alert.currentValue = currentPrice;

            let shouldTrigger = false;

            switch (alert.type) {
                case 'price_above':
                    shouldTrigger = currentPrice >= alert.targetValue;
                    break;
                case 'price_below':
                    shouldTrigger = currentPrice <= alert.targetValue;
                    break;
                case 'volume_spike':
                    shouldTrigger = market.volume >= alert.targetValue;
                    break;
            }

            if (shouldTrigger) {
                alert.isTriggered = true;
                alert.triggeredAt = new Date();
                triggered.push(alert);
            }

            alerts.set(id, alert);
        });

        return NextResponse.json({
            success: true,
            checked: alerts.size,
            triggered: triggered.length,
            triggeredAlerts: triggered,
        });

    } catch (error) {
        console.error('Check alerts error:', error);
        return NextResponse.json(
            { error: 'Failed to check alerts', details: String(error) },
            { status: 500 }
        );
    }
}
