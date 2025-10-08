import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import {
  getAlertById,
  updateAlert,
  deleteAlert,
} from '../../../../server/storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const alertId = parseInt(id)
    if (isNaN(alertId)) {
      return NextResponse.json(
        { error: 'Invalid alert ID' },
        { status: 400 }
      )
    }

    const alert = await getAlertById(alertId, parseInt(session.user.id))

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    return NextResponse.json(alert)
  } catch (error) {
    console.error('Error fetching alert:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alert' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const alertId = parseInt(id)
    if (isNaN(alertId)) {
      return NextResponse.json(
        { error: 'Invalid alert ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { type, model, threshold, window, cadence, active } = body

    // Validate type if provided
    if (type) {
      const validTypes = ['latency', 'tps_drop', 'cost_mtok', 'error', 'digest']
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: 'Invalid alert type' },
          { status: 400 }
        )
      }
    }

    // Validate cadence if provided
    if (cadence) {
      const validCadences = ['5m', '15m', '1h', '4h', '12h', '24h']
      if (!validCadences.includes(cadence)) {
        return NextResponse.json(
          { error: 'Invalid cadence' },
          { status: 400 }
        )
      }
    }

    // Validate window if provided
    if (window && !['7d', '24h'].includes(window)) {
      return NextResponse.json(
        { error: 'Invalid window' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (type !== undefined) updateData.type = type
    if (model !== undefined) updateData.model = model || null
    if (threshold !== undefined) updateData.threshold = threshold || null
    if (window !== undefined) updateData.window = window || null
    if (cadence !== undefined) updateData.cadence = cadence
    if (active !== undefined) updateData.active = active

    const alert = await updateAlert(
      alertId,
      parseInt(session.user.id),
      updateData
    )

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    return NextResponse.json(alert)
  } catch (error) {
    console.error('Error updating alert:', error)
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const alertId = parseInt(id)
    if (isNaN(alertId)) {
      return NextResponse.json(
        { error: 'Invalid alert ID' },
        { status: 400 }
      )
    }

    const alert = await deleteAlert(alertId, parseInt(session.user.id))

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting alert:', error)
    return NextResponse.json(
      { error: 'Failed to delete alert' },
      { status: 500 }
    )
  }
}
