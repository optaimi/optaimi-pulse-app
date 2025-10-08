import { NextRequest, NextResponse } from 'next/server'
import { createAlert, getAlertsByUserId, getUserFromRequest } from '../../../server/storage'

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const alerts = await getAlertsByUserId(user.id)
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
  const user = await getUserFromRequest()
  
  if (!user) {
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
      userId: user.id,
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
