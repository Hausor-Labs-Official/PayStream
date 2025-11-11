import { NextRequest, NextResponse } from 'next/server';
import { searchEmployees } from '@/services/vector-search';
import { checkQdrantHealth } from '@/lib/qdrant';

export const dynamic = 'force-dynamic';

/**
 * GET /api/employees/search?q=blockchain+developer&limit=10
 * Semantic search for employees using natural language
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');
    const scoreThreshold = parseFloat(searchParams.get('threshold') || '0.5');

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query parameter "q" is required',
        },
        { status: 400 }
      );
    }

    // Check if Qdrant is available
    const isHealthy = await checkQdrantHealth();
    if (!isHealthy) {
      return NextResponse.json(
        {
          success: false,
          error: 'Vector search is currently unavailable',
        },
        { status: 503 }
      );
    }

    // Perform semantic search
    const results = await searchEmployees(query, {
      limit,
      scoreThreshold,
    });

    return NextResponse.json({
      success: true,
      query,
      results: results.map((r) => ({
        employee: {
          id: r.payload.employeeId,
          name: r.payload.name,
          email: r.payload.email,
          role: r.payload.role,
          department: r.payload.department,
          skills: r.payload.skills,
          walletAddress: r.payload.walletAddress,
        },
        score: r.score,
        relevance: r.score > 0.7 ? 'high' : r.score > 0.5 ? 'medium' : 'low',
      })),
      total: results.length,
      metadata: {
        scoreThreshold,
        maxResults: limit,
      },
    });
  } catch (error) {
    console.error('Employee search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search employees',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/employees/search
 * Advanced semantic search with filters
 *
 * Body: {
 *   query: string,
 *   limit?: number,
 *   scoreThreshold?: number,
 *   filters?: { department?: string, role?: string }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, limit = 10, scoreThreshold = 0.5, filters } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Query is required and must be a string',
        },
        { status: 400 }
      );
    }

    // Check if Qdrant is available
    const isHealthy = await checkQdrantHealth();
    if (!isHealthy) {
      return NextResponse.json(
        {
          success: false,
          error: 'Vector search is currently unavailable',
        },
        { status: 503 }
      );
    }

    // Perform semantic search
    const results = await searchEmployees(query, {
      limit,
      scoreThreshold,
      filter: filters,
    });

    // Filter results by additional criteria if provided
    let filteredResults = results;
    if (filters) {
      filteredResults = results.filter((r) => {
        if (filters.department && r.payload.department !== filters.department) {
          return false;
        }
        if (filters.role && r.payload.role !== filters.role) {
          return false;
        }
        return true;
      });
    }

    return NextResponse.json({
      success: true,
      query,
      results: filteredResults.map((r) => ({
        employee: {
          id: r.payload.employeeId,
          name: r.payload.name,
          email: r.payload.email,
          role: r.payload.role,
          department: r.payload.department,
          skills: r.payload.skills,
          walletAddress: r.payload.walletAddress,
        },
        score: r.score,
        relevance: r.score > 0.7 ? 'high' : r.score > 0.5 ? 'medium' : 'low',
      })),
      total: filteredResults.length,
      metadata: {
        scoreThreshold,
        maxResults: limit,
        filters: filters || {},
      },
    });
  } catch (error) {
    console.error('Employee search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search employees',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
