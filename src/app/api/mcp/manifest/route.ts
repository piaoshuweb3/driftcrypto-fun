import { NextResponse } from 'next/server';

const MCP_MANIFEST = {
  name: 'driftcrypto MCP Server',
  version: '1.0.0',
  description:
    'AI-powered cryptocurrency news and market data MCP server by driftcrypto',
  tools: [
    {
      name: 'search_news',
      description: 'Search cryptocurrency and AI news',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query for cryptocurrency or AI news',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return (default: 10)',
            default: 10,
          },
          sentiment: {
            type: 'string',
            enum: ['positive', 'negative', 'neutral', 'all'],
            description: 'Filter news by sentiment (default: all)',
            default: 'all',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_coin_price',
      description: 'Get current coin price and market data',
      parameters: {
        type: 'object',
        properties: {
          coinId: {
            type: 'string',
            description:
              'Coin identifier (e.g., "bitcoin", "ethereum") from CoinGecko',
          },
          symbol: {
            type: 'string',
            description: 'Coin symbol (e.g., "btc", "eth")',
          },
          includeHistory: {
            type: 'boolean',
            description: 'Whether to include price history (default: false)',
            default: false,
          },
        },
        required: [],
      },
    },
    {
      name: 'get_fear_greed',
      description: 'Get Fear & Greed Index',
      parameters: {
        type: 'object',
        properties: {
          includeHistory: {
            type: 'boolean',
            description:
              'Whether to include historical index data (default: true)',
            default: true,
          },
        },
        required: [],
      },
    },
    {
      name: 'get_ai_digest',
      description: 'Get AI-generated daily market commentary',
      parameters: {
        type: 'object',
        properties: {
          refresh: {
            type: 'boolean',
            description:
              'Force refresh the digest instead of using cache (default: false)',
            default: false,
          },
        },
        required: [],
      },
    },
  ],
  endpoints: {
    news: '/api/news',
    prices: '/api/prices',
    fearGreed: '/api/fear-greed',
    aiDigest: '/api/ai/digest',
  },
};

export async function GET() {
  try {
    return NextResponse.json(MCP_MANIFEST, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('MCP Manifest endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to generate MCP manifest' },
      { status: 500 }
    );
  }
}
