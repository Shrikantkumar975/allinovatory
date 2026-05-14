'use client'
import { useState, useEffect } from 'react'
import {useRouter} from 'next/navigation'


interface Product{
    id: number
    name: string
    price: number
    description: string
    stock: Stock[]
}

interface Stock{
    id: number
    productId: number
    warehouseId: number
    totalUnits: number
    reservedUnits: number
    availableUnits: number
    warehouse:{
        name: string
        location: string
    }
}

export default function ProductsPage(){
const router = useRouter();
const [product,setProduct] = useState<Product[]>([])
const [loading,setLoading] = useState(true)
const [error,setError] = useState('')

useEffect(()=>{
 async function fetchProtucts(){
    try{
        setLoading(true)
        const res = await fetch('/api/products')
        const data = await res.json()
        setProduct(data)

    }
    catch(err){
        setError("Failed to fetch products")
    }
    finally{
        setLoading(false)
    }
 }
 fetchProtucts()
},[])

const handleReserve = async (productId: number, warehouseId: number) => {
  try {
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, warehouseId, quantity: 1 })
    })

    const data = await res.json()

    if(res.status === 409) {
      setError('Sorry, not enough stock available!')
      return
    }

    router.push(`/reservations/${data.id}`)

  } catch {
    setError('Something went wrong')
  }
}

if(loading) return <div className="p-8">Loading...</div>

return (
  <div className="max-w-4xl mx-auto p-6 sm:p-12 font-sans bg-gray-50">
    <h1 className="text-2xl font-semibold tracking-tight mb-10 text-gray-900">Products</h1>

    {error && (
      <div className="text-red-500 text-sm mb-8">
        {error}
      </div>
    )}

    <div className="space-y-12">
      {product.map(p => (
        <div key={p.id}>
          <div className="flex justify-between items-baseline mb-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900 tracking-tight">{p.name}</h2>
              <p className="text-gray-500 text-sm mt-1">{p.description}</p>
            </div>
            <span className="text-sm font-medium text-gray-900">
              ₹{p.price.toLocaleString()}
            </span>
          </div>

          <div className="space-y-3 mt-6">
            {p.stock.map(s => (
              <div key={s.id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900">{s.warehouse.name}</span>
                  <span className="text-gray-400">{s.warehouse.location}</span>
                  <span className="text-gray-200">|</span>
                  <span className={s.availableUnits === 0 ? 'text-red-500 font-medium' : 'text-gray-600'}>
                    {s.availableUnits} available
                  </span>
                </div>

                <button
                  onClick={() => handleReserve(p.id, s.warehouseId)}
                  disabled={s.availableUnits === 0}
                  className={`text-xs font-medium px-4 py-2 rounded-full transition-colors ${
                    s.availableUnits === 0 
                      ? 'bg-red-50 text-red-500 cursor-not-allowed' 
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  {s.availableUnits === 0 ? 'Out of Stock' : 'Reserve'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)
}