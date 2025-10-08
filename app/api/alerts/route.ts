import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { createAlert, getAlertsByUserId } from '../../../server/storage'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const alerts = await getAlertsByUserId(parseInt(session.user.id))
    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type, model, threshold, window, cadence, active } = body

    // Validate required fields
    if (!type || !cadence) {
      return NextResponse.json(
        { error: 'Type and cadence are required' },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = ['latency', 'tps_drop', 'cost_mtok', 'error', 'digest']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid alert type' },
        { status: 400 }
      )
    }

    // Validate cadence
    const validCadences = ['5m', '15m', '1h', '4h', '12h', '24h']
    if (!validCadences.includes(cadence)) {
      return NextResponse.json(
        { error: 'Invalid cadence' },
        { status: 400 }
      )
    }

    // Validate window if provided
    if (window && !['7d', '24h'].includes(window)) {
      return NextResponse.json(
        { error: 'Invalid window' },
        { status: 400 }
      )
    }

    const alert = await createAlert({
      userId: parseInt(session.user.id),
      type,
      model: model || undefined,
      threshold: threshold || undefined,
      window: window || undefined,
      cadence,
      active: active ?? true,
    })

    return NextResponse.json(alert, { status: 201 })
  } catch (error) {
    console.error('Error creating alert:', error)
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    )
  }
}
