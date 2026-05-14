import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(){
    try{
        const products = await prisma.product.findMany({
            include:{
                stock: {
                    include: {
                        warehouse: true
                    }
                }
            }
        })
        const result =products.map(product => ({
            ...product,
            stock: product.stock.map(s => ({
                ...s,
                availableUnits: s.totalUnits - s.reservedUnits
            }))
        }))
    
        return NextResponse.json({
            data: result,
            success: true
        },{status: 200})
    }catch (error){
        return NextResponse.json({
            error: "Something went wrong",
            sucess: false
        },{status: 500});
    }
}