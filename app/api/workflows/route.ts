import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// GET /api/workflows?org_id=... - Get workflows for organization
// GET /api/workflows?id=... - Get specific workflow by ID
// POST /api/workflows - Create new workflow
// PUT /api/workflows?id=... - Update workflow
// DELETE /api/workflows?id=... - Delete workflow

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const service = createServiceClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('id');
    const orgId = searchParams.get('org_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = service.from('workflows').select(`
      *,
      organization:organizations(name, owner_id),
      creator:users(name, email)
    `);

    if (workflowId) {
      query = query.eq('id', workflowId);
    }

    if (orgId) {
      query = query.eq('org_id', orgId);
    }

    // Only show workflows from user's organization
    // This assumes we have the user's org_id available
    // For MVP, we'll trust the org_id param, but in production should validate against user's org

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      workflows: data || [],
      count: count || 0
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const service = createServiceClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const body = await request.json();
    const { name, description, org_id, is_template = false, nodes = [], edges = [] } = body;

    if (!name || !org_id) {
      return NextResponse.json(
        { error: 'Missing required fields: name, org_id' },
        { status: 400 }
      );
    }

    // TODO: Add authorization check - verify user belongs to org

    const { data, error } = await service
      .from('workflows')
      .insert({
        name,
        description,
        org_id,
        created_by: user.id,
        is_template,
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
      })
      .select(`
        *,
        organization:organizations(name),
        creator:users(name, email)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ workflow: data }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const service = createServiceClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('id');

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Missing required query param: id' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, is_template, nodes, edges, ...updates } = body;

    // First check if workflow exists and user has access
    const { data: existingWorkflow, error: fetchError } = await service
      .from('workflows')
      .select('*, created_by')
      .eq('id', workflowId)
      .single();

    if (fetchError) throw fetchError;
    if (!existingWorkflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // TODO: Add proper authorization - check if user owns workflow or is in org

    const updateData: any = {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(is_template !== undefined && { is_template }),
      ...(nodes !== undefined && { nodes: JSON.stringify(nodes) }),
      ...(edges !== undefined && { edges: JSON.stringify(edges) }),
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key =>
      updateData[key] === undefined && delete updateData[key]
    );

    const { data, error } = await service
      .from('workflows')
      .update(updateData)
      .eq('id', workflowId)
      .select(`
        *,
        organization:organizations(name),
        creator:users(name, email)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ workflow: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const service = createServiceClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('id');

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Missing required query param: id' },
        { status: 400 }
      );
    }

    // First check if workflow exists and user has access
    const { data: existingWorkflow, error: fetchError } = await service
      .from('workflows')
      .select('created_by, org_id')
      .eq('id', workflowId)
      .single();

    if (fetchError) throw fetchError;
    if (!existingWorkflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // TODO: Add proper authorization check

    const { error } = await service
      .from('workflows')
      .delete()
      .eq('id', workflowId);

    if (error) throw error;

    return NextResponse.json(
      { message: 'Workflow deleted successfully' },
      { status: 200 }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}