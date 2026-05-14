"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect, use } from "react"

interface Res {
  id: number
  quantity: number
  status: string
  expiresAt: string
  stock: {
    product: {
      name: string
      price: number
    }
    warehouse: {
      name: string
      location: string
    }
  }
}
export default function ReservationPage({params}: {params: Promise<{ id: string }>}) {
  const { id } = use(params)

  const router = useRouter()

  const [resv, setResv] = useState<Res | null>(null)
  const [load, setLoad] = useState(true)
  const [err, setErr] = useState("")
  const [sec, setSec] = useState(0)

  useEffect(() => {
    async function getResv() {
      setLoad(true)

      try {
        const r = await fetch(`/api/reservations/${id}`)
        const d = await r.json()

        if (d.success) {
          setResv(d.data)
        } else {
          setErr(d.message || "Failed to fetch reservation")
        }
      } catch {
        setErr("Network error")
      } finally {
        setLoad(false)
      }
    }

    getResv()
  }, [id])

  useEffect(() => {
    if (!resv || resv.status !== "pending") return

    const t = setInterval(() => {
      const now = Date.now()
      const end = new Date(resv.expiresAt).getTime()

      const left = Math.floor((end - now) / 1000)

      if (left <= 0) {
        setSec(0)
        clearInterval(t)
      } else {
        setSec(left)
      }
    }, 1000)

    const left = Math.floor(
      (new Date(resv.expiresAt).getTime() - Date.now()) / 1000
    )
    setSec(Math.max(0, left))
    return () => clearInterval(t)
  }, [resv])

  const updateResv = async () => {
    const r = await fetch(`/api/reservations/${id}`)
    const d = await r.json()

    if (d.success) {
      setResv(d.data)
    }
  }

  const confirm = async () => {
    try {
      const r = await fetch(`/api/reservations/${id}/confirm`, {
        method: "POST",
      })

      const d = await r.json()

      if (d.success || r.status === 200) {
        updateResv()
      } else {
        setErr(d.message)
      }
    } catch {
      setErr("Failed to confirm reservation")
    }
  }

  const cancel = async () => {
    try {
      const r = await fetch(`/api/reservations/${id}/release`, {
        method: "POST",
      })

      const d = await r.json()

      if (d.success || r.status === 200) {
        updateResv()
      } else {
        setErr(d.message)
      }
    } catch {
      setErr("Failed to release reservation")
    }
  }
  if (load) {
    return <div className="p-8 font-sans">Loading...</div>
  }
  if (err) {
    return (
      <div className="max-w-2xl mx-auto p-8 font-sans">
        <div className="bg-red-50 text-red-500 p-4 rounded-md">
          {err}
        </div>
      </div>
    )
  }

  if (!resv) {
    return <div className="p-8 font-sans">Reservation not found.</div>
  }
  const pend = resv.status === "pending"
  return (
    <div className="max-w-2xl mx-auto p-6 sm:p-12 font-sans">
      <button
        onClick={() => router.push("/products")}
        className="mb-8 flex items-center text-sm font-medium text-gray-500 hover:text-black transition-colors"
      >
        &larr; Back to Products
      </button>

      <div className="border border-gray-200 rounded-2xl p-6 sm:p-8 bg-white shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl text-gray-900 font-medium tracking-tight">
              Order #{resv.id}
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Status:
              <span
                className={`ml-2 font-medium capitalize ${
                  resv.status === "confirmed"
                    ? "text-green-600"
                    : resv.status === "released"
                    ? "text-red-500"
                    : "text-orange-500"
                }`}
              >
                {resv.status}
              </span>
            </p>
          </div>

          {pend && sec > 0 && (
            <div className="text-right">
              <span className="text-sm text-gray-500 block mb-1">
                Time remaining
              </span>

              <span className="text-2xl font-mono text-orange-500 font-medium tracking-tight">
                {Math.floor(sec / 60)}:
                {(sec % 60).toString().padStart(2, "0")}
              </span>
            </div>
          )}
          {pend && sec === 0 && (
            <div className="text-right">
              <span className="text-sm text-red-500 font-medium bg-red-50 px-3 py-1 rounded-full">
                Expired
              </span>
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl p-5 mb-8 border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-gray-900">
              {resv.stock.product.name}
            </span>

            <span className="font-medium text-gray-900">
              ₹{resv.stock.product.price.toLocaleString()}
            </span>
          </div>

          <div className="text-sm text-gray-500">
            <p className="mb-1">
              Quantity:{" "}
              <span className="text-gray-900 font-medium">
                {resv.quantity}
              </span>
            </p>

            <p>
              Pickup from:{" "}
              <span className="text-gray-900">
                {resv.stock.warehouse.name}
              </span>{" "}
              ({resv.stock.warehouse.location})
            </p>
          </div>
        </div>

        {pend && sec > 0 && (
          <div className="flex gap-4">
            <button
              onClick={confirm}
              className="flex-1 bg-black text-white px-4 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Checkout
            </button>

            <button
              onClick={cancel}
              className="flex-1 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {resv.status === "confirmed" && (
          <div className="bg-green-50 border border-green-100 text-green-700 p-4 rounded-xl text-sm text-center font-medium">
            This reservation has been successfully confirmed.
          </div>
        )}

        {resv.status === "released" && (
          <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl text-sm text-center font-medium">
            This reservation has been released/cancelled.
          </div>
        )}
      </div>
    </div>
  )
}