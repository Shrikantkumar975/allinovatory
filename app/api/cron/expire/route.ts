import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (
      process.env.NODE_ENV === "production" &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: "pending",
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    if (expiredReservations.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired reservations found.",
        releasedCount: 0,
      });
    }

    const transactions = [];

    for (let i = 0; i < expiredReservations.length; i++) {
      const resv = expiredReservations[i];

      transactions.push(
        prisma.stock.update({
          where: { id: resv.stockId },
          data: {
            reservedUnits: {
              decrement: resv.quantity,
            },
          },
        })
      );
      transactions.push(
        prisma.reservation.update({
          where: { id: resv.id },
          data: {
            status: "released",
          },
        })
      );
    }
    
    await prisma.$transaction(transactions);
    
    return NextResponse.json({
      success: true,
      message: `Successfully released ${expiredReservations.length} expired reservations.`,
      releasedCount: expiredReservations.length,
    });
  } catch (error: any) {
    console.error("Cron Expire Error:", error);
    
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process expired reservations",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
