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
        const result =products.map((product: { stock: any[]; }) => ({
            ...product,
            stock: product.stock.map((s: { totalUnits: number; reservedUnits: number; }) => ({
                ...s,
                availableUnits: s.totalUnits - s.reservedUnits
            }))
        }))
        return NextResponse.json(result)
    }catch (error){
        return NextResponse.json({
            error: "Something went wrong",
            success: false
        },{status: 500});
    }
}