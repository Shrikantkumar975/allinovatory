import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: paramId } = await params;
        const id = parseInt(paramId);

        const reservation = await prisma.reservation.findUnique({
            where: { id },
            include: {
                stock: {
                    include: {
                        product: true,
                        warehouse: true
                    }
                }
            }
        })

        if (!reservation) {
            return NextResponse.json({
                message: "Reservation not found",
                success: false
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: reservation
        })

    } catch {
        return NextResponse.json({
            message: 'Something went wrong',
            success: false
        }, { status: 500 })
    }
}
