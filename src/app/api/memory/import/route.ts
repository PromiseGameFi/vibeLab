import { NextRequest, NextResponse } from 'next/server';

// Extract readable content from HTML
function extractContent(html: string): { title: string; content: string } {
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Imported Page';

    // Remove script and style tags
    let content = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
        .replace(/<header[\s\S]*?<\/header>/gi, '')
        .replace(/<footer[\s\S]*?<\/footer>/gi, '')
        .replace(/<aside[\s\S]*?<\/aside>/gi, '');

    // Try to find main content
    const mainMatch = content.match(/<main[\s\S]*?<\/main>/i) ||
        content.match(/<article[\s\S]*?<\/article>/i) ||
        content.match(/<div[^>]*class="[^"]*content[^"]*"[\s\S]*?<\/div>/i);

    if (mainMatch) {
        content = mainMatch[0];
    }

    // Remove all HTML tags
    content = content
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();

    // Limit content length
    if (content.length > 10000) {
        content = content.slice(0, 10000) + '...';
    }

    return { title, content };
}

interface ImportRequest {
    url: string;
}

export async function POST(request: NextRequest) {
    try {
        const { url }: ImportRequest = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL required' }, { status: 400 });
        }

        // Validate URL
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
        } catch {
            return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
        }

        // Fetch the page
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; VibeLab/1.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch: ${response.status}` },
                { status: 400 }
            );
        }

        const contentType = response.headers.get('content-type') || '';

        // Handle different content types
        let title: string;
        let content: string;

        if (contentType.includes('text/html')) {
            const html = await response.text();
            const extracted = extractContent(html);
            title = extracted.title;
            content = extracted.content;
        } else if (contentType.includes('text/plain') || contentType.includes('text/markdown')) {
            content = await response.text();
            title = parsedUrl.pathname.split('/').pop() || 'Imported Text';
        } else if (contentType.includes('application/json')) {
            const json = await response.json();
            content = JSON.stringify(json, null, 2);
            title = 'Imported JSON';
        } else {
            return NextResponse.json(
                { error: 'Unsupported content type: ' + contentType },
                { status: 400 }
            );
        }

        if (!content || content.length < 10) {
            return NextResponse.json(
                { error: 'No content found on page' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            title,
            content,
            url,
            tokenEstimate: Math.ceil(content.length / 4),
        });

    } catch (error) {
        console.error('Import error:', error);
        return NextResponse.json(
            { error: 'Failed to import URL' },
            { status: 500 }
        );
    }
}
