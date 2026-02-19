/**
 * Notification System — Alert when exploits are confirmed
 * Supports Telegram and Discord.
 */

import axios from 'axios';
import chalk from 'chalk';
import { AgentMemory } from './memory';

export interface NotificationConfig {
    telegram?: {
        botToken: string;
        chatId: string;
    };
    discord?: {
        webhookUrl: string;
    };
    minSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    enabled: boolean;
}

export interface ExploitAlert {
    chain: string;
    contractAddress: string;
    contractName?: string;
    balance: string;
    exploitTitle: string;
    severity: string;
    category: string;
    score: number;
    attempts: number;
    profitPotential: string;
    exploitCode?: string;
}

// ─── Notifier Class ─────────────────────────────────────────────────

export class Notifier {
    private config: NotificationConfig;
    private memory: AgentMemory;

    constructor(memory: AgentMemory) {
        this.memory = memory;
        this.config = {
            telegram: process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID
                ? {
                    botToken: process.env.TELEGRAM_BOT_TOKEN,
                    chatId: process.env.TELEGRAM_CHAT_ID,
                }
                : undefined,
            discord: process.env.DISCORD_WEBHOOK_URL
                ? { webhookUrl: process.env.DISCORD_WEBHOOK_URL }
                : undefined,
            minSeverity: (process.env.NOTIFY_MIN_SEVERITY as any) || 'HIGH',
            enabled: process.env.NOTIFICATIONS !== 'false',
        };
    }

    /**
     * Send an exploit confirmation alert.
     */
    async alertExploit(alert: ExploitAlert): Promise<void> {
        if (!this.config.enabled) return;

        // Check severity threshold
        const sevOrder = { CRITICAL: 3, HIGH: 2, MEDIUM: 1 };
        const alertSev = sevOrder[alert.severity as keyof typeof sevOrder] || 0;
        const minSev = sevOrder[this.config.minSeverity] || 0;
        if (alertSev < minSev) return;

        const promises: Promise<void>[] = [];

        if (this.config.telegram) {
            promises.push(this.sendTelegram(alert));
        }
        if (this.config.discord) {
            promises.push(this.sendDiscord(alert));
        }

        await Promise.allSettled(promises);
    }

    /**
     * Send a status update (agent started, stopped, error, etc.)
     */
    async alertStatus(message: string): Promise<void> {
        if (!this.config.enabled) return;

        if (this.config.telegram) {
            await this.sendTelegramRaw(`🤖 VibeAudit Agent\n${message}`).catch(() => { });
        }
        if (this.config.discord) {
            await this.sendDiscordRaw(message, '🤖 VibeAudit Agent Status').catch(() => { });
        }
    }

    // ─── Telegram ───────────────────────────────────────────────

    private async sendTelegram(alert: ExploitAlert): Promise<void> {
        if (!this.config.telegram) return;

        const msg = [
            `💀 *EXPLOIT CONFIRMED*`,
            ``,
            `*Chain:* ${alert.chain}`,
            `*Contract:* \`${alert.contractAddress}\``,
            alert.contractName ? `*Name:* ${alert.contractName}` : null,
            `*Balance:* ${alert.balance} ETH`,
            ``,
            `⚔️ *${alert.exploitTitle}*`,
            `*Severity:* ${alert.severity}`,
            `*Category:* ${alert.category}`,
            `*Score:* ${alert.score}/100`,
            `*Attempts:* ${alert.attempts}`,
            `*Profit:* ${alert.profitPotential}`,
        ].filter(Boolean).join('\n');

        await this.sendTelegramRaw(msg);
    }

    private async sendTelegramRaw(text: string): Promise<void> {
        if (!this.config.telegram) return;

        try {
            await axios.post(
                `https://api.telegram.org/bot${this.config.telegram.botToken}/sendMessage`,
                {
                    chat_id: this.config.telegram.chatId,
                    text,
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true,
                },
                { timeout: 5000 },
            );
        } catch (error) {
            this.memory.log('error', 'Telegram notification failed', {
                error: (error as Error).message,
            });
        }
    }

    // ─── Discord ────────────────────────────────────────────────

    private async sendDiscord(alert: ExploitAlert): Promise<void> {
        if (!this.config.discord) return;

        const embed = {
            title: `💀 EXPLOIT CONFIRMED: ${alert.exploitTitle}`,
            color: alert.severity === 'CRITICAL' ? 0xFF0000 : 0xFF6600,
            fields: [
                { name: 'Chain', value: alert.chain, inline: true },
                { name: 'Severity', value: alert.severity, inline: true },
                { name: 'Score', value: `${alert.score}/100`, inline: true },
                { name: 'Contract', value: `\`${alert.contractAddress}\``, inline: false },
                { name: 'Balance', value: `${alert.balance} ETH`, inline: true },
                { name: 'Category', value: alert.category, inline: true },
                { name: 'Attempts', value: `${alert.attempts}`, inline: true },
                { name: 'Profit Potential', value: alert.profitPotential, inline: false },
            ],
            timestamp: new Date().toISOString(),
            footer: { text: 'VibeAudit Autonomous Agent' },
        };

        if (alert.exploitCode && alert.exploitCode.length < 1900) {
            embed.fields.push({
                name: 'Exploit Code',
                value: `\`\`\`solidity\n${alert.exploitCode.substring(0, 1800)}\n\`\`\``,
                inline: false,
            });
        }

        try {
            await axios.post(
                this.config.discord.webhookUrl,
                { embeds: [embed] },
                { timeout: 5000 },
            );
        } catch (error) {
            this.memory.log('error', 'Discord notification failed', {
                error: (error as Error).message,
            });
        }
    }

    private async sendDiscordRaw(content: string, title: string): Promise<void> {
        if (!this.config.discord) return;

        try {
            await axios.post(
                this.config.discord.webhookUrl,
                {
                    embeds: [{
                        title,
                        description: content,
                        color: 0x5865F2,
                        timestamp: new Date().toISOString(),
                    }],
                },
                { timeout: 5000 },
            );
        } catch {
            // Silent fail for status updates
        }
    }

    /**
     * Check if any notification channels are configured.
     */
    isConfigured(): boolean {
        return !!(this.config.telegram || this.config.discord);
    }

    getStatus(): { telegram: boolean; discord: boolean; enabled: boolean } {
        return {
            telegram: !!this.config.telegram,
            discord: !!this.config.discord,
            enabled: this.config.enabled,
        };
    }
}
