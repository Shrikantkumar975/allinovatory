import {NextResponse} from 'next/server'
import {prisma} from '@/lib/prisma'

export async function GET(){
    try{
        const warehouses = await prisma.warehouse.findMany()
        return NextResponse.json({
           data: warehouses,
            success: true
        }, {status: 200})
    }catch(error){
        return NextResponse.json({
            error: "Something went wrong",
            success: false
        },{status: 500})    
    }
}