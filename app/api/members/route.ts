// app/api/members/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all members
export async function GET(request: Request) {
  try {
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
    const body = await request.json()
    
    // First, check if agency exists or create it
    let agency = await prisma.agency.findFirst({
      where: { name: body.agencyName }
    })
    
    if (!agency) {
      // Generate a unique member number
      const memberNumber = `AG${Date.now().toString().slice(-8)}`
      
      agency = await prisma.agency.create({
        data: {
          memberNumber,
          name: body.agencyName,
          email: body.email,
          phone: body.phone || '',
          membershipType: body.membershipType || 'A1_AGENCY',
          membershipLevel: body.membershipLevel || 1,
          status: 'ACTIVE'
        }
      })
    }
    
    // Create the user
    const member = await prisma.user.create({
      data: {
        name: `${body.firstName} ${body.lastName}`,
        email: body.email,
        role: body.role || 'STANDARD',
        agencyId: agency.id
      },
      include: {
        agency: true
      }
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