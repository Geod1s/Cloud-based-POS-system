"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface Sale {
  id: string
  sale_number: string
  subtotal: number
  tax: number
  discount: number
  total: number
  payment_method: string
  payment_status: string
  created_at: string
  customers: {
    name: string
    phone: string
    email: string | null
    address: string | null
  } | null
  profiles: {
    full_name: string | null
    email: string
  } | null
}

interface SaleItem {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

interface ReceiptProps {
  sale: Sale
  saleItems: SaleItem[]
}

export function Receipt({ sale, saleItems }: ReceiptProps) {
  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <Card className="print-area max-w-2xl mx-auto">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-3xl font-bold">Cloud POS System</h1>
            <p className="text-sm text-muted-foreground">Sales Receipt</p>
          </div>

          <Separator className="my-4" />

          {/* Receipt Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm font-medium">Receipt Number</p>
              <p className="text-sm text-muted-foreground">{sale.sale_number}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Date</p>
              <p className="text-sm text-muted-foreground">{format(new Date(sale.created_at), "PPpp")}</p>
            </div>
            {sale.profiles && (
              <div>
                <p className="text-sm font-medium">Cashier</p>
                <p className="text-sm text-muted-foreground">{sale.profiles.full_name || sale.profiles.email}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">Payment Method</p>
              <p className="text-sm text-muted-foreground capitalize">{sale.payment_method}</p>
            </div>
          </div>

          {/* Customer Info */}
          {sale.customers && (
            <>
              <Separator className="my-4" />
              <div className="mb-6">
                <p className="text-sm font-medium mb-2">Customer Information</p>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Name: {sale.customers.name}</p>
                  <p className="text-sm text-muted-foreground">Phone: {sale.customers.phone}</p>
                  {sale.customers.email && (
                    <p className="text-sm text-muted-foreground">Email: {sale.customers.email}</p>
                  )}
                  {sale.customers.address && (
                    <p className="text-sm text-muted-foreground">Address: {sale.customers.address}</p>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator className="my-4" />

          {/* Items */}
          <div className="mb-6">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium">Item</th>
                  <th className="text-center py-2 text-sm font-medium">Qty</th>
                  <th className="text-right py-2 text-sm font-medium">Price</th>
                  <th className="text-right py-2 text-sm font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {saleItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2 text-sm">{item.product_name}</td>
                    <td className="text-center py-2 text-sm">{item.quantity}</td>
                    <td className="text-right py-2 text-sm">${Number(item.unit_price).toFixed(2)}</td>
                    <td className="text-right py-2 text-sm font-medium">${Number(item.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Separator className="my-4" />

          {/* Totals */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${Number(sale.subtotal).toFixed(2)}</span>
            </div>
            {Number(sale.discount) > 0 && (
              <div className="flex justify-between text-sm">
                <span>Discount:</span>
                <span>-${Number(sale.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Tax:</span>
              <span>${Number(sale.tax).toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${Number(sale.total).toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Status */}
          <div className="flex justify-center mb-6">
            <Badge variant={sale.payment_status === "paid" ? "default" : "destructive"} className="text-sm px-4 py-1">
              {sale.payment_status === "paid" ? "PAID" : sale.payment_status.toUpperCase()}
            </Badge>
          </div>

          <Separator className="my-4" />

          {/* Footer */}
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">Thank you for your business!</p>
            <p className="text-xs text-muted-foreground">Please keep this receipt for your records</p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
