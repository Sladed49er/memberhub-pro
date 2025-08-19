// app/api/members/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// GET all members
export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    
    const members = await prisma.user.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        agency: true
      }
    })
    
    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

// POST new member
export async function POST(request: Request) {
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

    // Create the user
    const member = await prisma.user.create({
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email,
        phone,
        membershipType: membershipType || 'A1_AGENCY',
        status: status || 'ACTIVE',
        role: 'AGENCY_USER', // Default role
        agencyId,
      },
      include: {
        agency: true
      }
    })

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'MEMBER_CREATED',
        description: `Created member: ${firstName} ${lastName}`,
        userId: userId,
      },
    })
    
    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error creating member:', error)
    return NextResponse.json(
      { error: 'Failed to create member' },
      { status: 500 }
    )
  }
}