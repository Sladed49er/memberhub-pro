// app/api/members/[id]/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// GET single member
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const member = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        agency: true,
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    return NextResponse.json(member)
  } catch (error) {
    console.error('Error fetching member:', error)
    return NextResponse.json(
      { error: 'Failed to fetch member' },
      { status: 500 }
    )
  }
}

// UPDATE member
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      membershipType,
      agencyId,
      status,
    } = body

    // Update member in database
    const updatedMember = await prisma.user.update({
      where: { id: params.id },
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`, // Also update the name field
        email,
        phone,
        membershipType,
        agencyId,
        status,
      },
      include: {
        agency: true,
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'MEMBER_UPDATED',
        description: `Updated member: ${firstName} ${lastName}`,
        userId: userId,
      },
    })

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    )
  }
}

// DELETE member
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get member info before deletion for activity log
    const member = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Delete member
    await prisma.user.delete({
      where: { id: params.id },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'MEMBER_DELETED',
        description: `Deleted member: ${member.firstName || member.name || 'Unknown'}`,
        userId: userId,
      },
    })

    return NextResponse.json({ message: 'Member deleted successfully' })
  } catch (error) {
    console.error('Error deleting member:', error)
    return NextResponse.json(
      { error: 'Failed to delete member' },
      { status: 500 }
    )
  }
}