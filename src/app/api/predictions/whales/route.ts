import { NextResponse } from 'next/server';
import { WhaleActivity, WhaleWallet } from '@/lib/predictionTypes';

// Mock whale data for demo
// In production, this would fetch from Polymarket's API or a blockchain indexer
function generateMockWhaleActivity(): WhaleActivity[] {
    const markets = [
        { id: 'btc-100k', title: 'Will Bitcoin reach $100k in 2026?' },
        { id: 'trump-2028', title: 'Will Trump win the 2028 Presidential Election?' },
        { id: 'fed-cut', title: 'Will the Fed cut rates in Q1 2026?' },
        { id: 'ai-agi', title: 'Will AGI be achieved by 2030?' },
        { id: 'eth-flip', title: 'Will ETH flip BTC market cap by 2027?' },
    ];

    const wallets = [
        { address: '0x1a2b...3c4d', label: 'polymarket_whale_1' },
        { address: '0x5e6f...7g8h', label: 'theo_trades' },
        { address: '0x9i0j...1k2l', label: undefined },
        { address: '0x3m4n...5o6p', label: 'prediction_king' },
        { address: '0x7q8r...9s0t', label: 'smart_money_42' },
    ];

    const activities: WhaleActivity[] = [];
    const now = Date.now();

    for (let i = 0; i < 20; i++) {
        const market = markets[Math.floor(Math.random() * markets.length)];
        const wallet = wallets[Math.floor(Math.random() * wallets.length)];
        const action = Math.random() > 0.4 ? 'buy' : 'sell';
        const amount = Math.floor(Math.random() * 50000) + 5000; // $5k - $55k
        const price = Math.random() * 0.5 + 0.25; // 25% - 75%

        activities.push({
            id: `whale-${i}`,
            wallet: wallet.address,
            walletLabel: wallet.label,
            action,
            market: market.id,
            marketTitle: market.title,
            outcome: Math.random() > 0.3 ? 'yes' : 'no',
            amount,
            shares: Math.floor(amount / price),
            price,
            timestamp: new Date(now - Math.random() * 86400000 * 2), // Last 2 days
            platform: 'polymarket',
            pnl: action === 'sell' ? Math.floor(Math.random() * 20000) - 5000 : undefined,
        });
    }

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return activities;
}

function generateMockWhaleWallets(): WhaleWallet[] {
    return [
        {
            address: '0x1a2b...3c4d',
            label: 'polymarket_whale_1',
            totalVolume: 2450000,
            winRate: 0.72,
            pnl: 345000,
            activeSince: new Date('2024-03-15'),
            recentTrades: [],
            followersCount: 1250,
        },
        {
            address: '0x5e6f...7g8h',
            label: 'theo_trades',
            totalVolume: 1820000,
            winRate: 0.68,
            pnl: 215000,
            activeSince: new Date('2024-06-01'),
            recentTrades: [],
            followersCount: 890,
        },
        {
            address: '0x7q8r...9s0t',
            label: 'smart_money_42',
            totalVolume: 980000,
            winRate: 0.65,
            pnl: 125000,
            activeSince: new Date('2024-08-20'),
            recentTrades: [],
            followersCount: 420,
        },
        {
            address: '0x3m4n...5o6p',
            label: 'prediction_king',
            totalVolume: 1560000,
            winRate: 0.71,
            pnl: 198000,
            activeSince: new Date('2024-04-10'),
            recentTrades: [],
            followersCount: 750,
        },
        {
            address: '0x9i0j...1k2l',
            label: undefined,
            totalVolume: 890000,
            winRate: 0.58,
            pnl: 45000,
            activeSince: new Date('2024-09-01'),
            recentTrades: [],
            followersCount: 0,
        },
    ];
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'activity';
    const limit = parseInt(searchParams.get('limit') || '20');
    const wallet = searchParams.get('wallet');

    try {
        if (view === 'wallets') {
            const wallets = generateMockWhaleWallets();
            // Sort by PnL
            wallets.sort((a, b) => b.pnl - a.pnl);

            return NextResponse.json({
                success: true,
                count: wallets.length,
                wallets,
            });
        }

        let activities = generateMockWhaleActivity();

        // Filter by wallet if specified
        if (wallet) {
            activities = activities.filter(a => a.wallet.includes(wallet) || a.walletLabel?.includes(wallet));
        }

        // Limit results
        activities = activities.slice(0, limit);

        // Calculate stats
        const totalVolume = activities.reduce((sum, a) => sum + a.amount, 0);
        const buyVolume = activities.filter(a => a.action === 'buy').reduce((sum, a) => sum + a.amount, 0);
        const sellVolume = activities.filter(a => a.action === 'sell').reduce((sum, a) => sum + a.amount, 0);

        return NextResponse.json({
            success: true,
            count: activities.length,
            activities,
            stats: {
                totalVolume,
                buyVolume,
                sellVolume,
                buyRatio: buyVolume / totalVolume,
            }
        });

    } catch (error) {
        console.error('Whale tracking error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch whale activity', details: String(error) },
            { status: 500 }
        );
    }
}
