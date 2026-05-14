import {NextResponse} from 'next/server'
import {prisma} from '@/lib/prisma'

export async function POST(request: Request){
    try {
        const body = await request.json();
        const {productId,warehouseId, quantity} = body;

        const updated = await prisma.$executeRaw `
        UPDATE "Stock"
        SET "reservedUnits" = "reservedUnits" + ${quantity}
        WHERE "productId" = ${productId}
        AND "warehouseId" = ${warehouseId}
        AND ("totalUnits" - "reservedUnits") >= ${quantity}`

        if(updated === 0) return NextResponse.json({
            error:"Stock not available",
            success:false
        }, {status:409})

        const stock = await prisma.stock.findFirst({
            where: {productId, warehouseId }
        })

        const reservation = await prisma.reservation.create({
            data:{
                stockId: stock.id,
                quantity:quantity,
                expiresAt:new Date(Date.now() + 10*60*1000)     
            }
        })

        return NextResponse.json({
            success: true,
            data: reservation,
            id:reservation.id
        }, {status: 201})
    } catch (error) {
        return NextResponse.json({
            error: "Something Went Wrong",
            success: false
        }, {status: 500})
    }
}