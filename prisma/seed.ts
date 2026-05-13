
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

async function main(){
    const iphone=await prisma.product.create({
        data:{
            name: "iPhone 17",
            price: 70000,
            description: "A premium Smartphone"
       }
    })
    const samsung=await prisma.product.create({
        data:{
            name: "Samsung S24",
            price: 65000,
            description: "A unbreakable smartphone"
       }
    })

    const delhi=await prisma.warehouse.create({
        data:{
            name: "North",
            location: "Delhi"
        }
    })
    const mumbai=await prisma.warehouse.create({
        data:{
            name: "South",
            location: "Mumbai"
        }
    })

    const stock1 = await prisma.stock.createMany({
        data:[
            {productId: iphone.id, warehouseId: delhi.id,totalUnits: 5},
            {productId: iphone.id, warehouseId: mumbai.id,totalUnits: 4},
            {productId: samsung.id, warehouseId: delhi.id,totalUnits: 1},
            {productId: samsung.id, warehouseId: mumbai.id,totalUnits: 3},
        ],
    });
}

main().catch((e) => {
    console.log("Seed failed",e);
    process.exit(1);
})
.finally(async () => {
    await prisma.$disconnect();
});