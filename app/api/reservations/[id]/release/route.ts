import {NextResponse} from "next/server"
import {prisma} from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: paramId } = await params;
        const id = parseInt(paramId);

        const reservation = await prisma.reservation.findUnique({
            where:{
                id
            }
        })

        if(!reservation){
            return NextResponse.json({
                message: "Reservation not found",
                success: false
            },{status: 404})
        }

        if(reservation.status !== "pending"){

            return NextResponse.json({
                message : "Already done",
                success: false
            },{status: 400})
        }

        if(reservation.expiresAt < new Date()){
            return NextResponse.json({
                message : "Expired",
                success: false
            },{status: 410})
        }

        await prisma.stock.update({
            where: { id : reservation.stockId},
            data:{
                reservedUnits: {decrement: reservation.quantity}
            }
        })

        await prisma.reservation.update({
            where: {id},
            data:{
                status:"released"
            }
        })

        return NextResponse.json({
            message: "Reservation released",
            success: true
        }, {status: 200})
    }catch(e){
        return NextResponse.json({
            message: "Something went wrong",
            success: false
        },{status: 500})
    }
} 