import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const members = await prisma.user.findMany({
      include: {
        agency: true
      },
      take: 10
    })
    return NextResponse.json(members)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const member = await prisma.user.create({
      data: body
    })
    return NextResponse.json(member)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
  }
}
