"use client"

import { useState } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Minus, Plus, Trash2, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { AddCustomerDialog } from "@/components/add-customer-dialog"

interface Product {
  id: string
  name: string
  price: number
  stock_quantity: number
  categories: {
    id: string
    name: string
  } | null
}

interface Customer {
  id: string
  name: string
  phone: string
}

interface CartItem {
  product: Product
  quantity: number
}

interface POSInterfaceProps {
  products: Product[]
  customers: Customer[]
}

export function POSInterface({ products, customers }: POSInterfaceProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.categories?.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id)

    if (existingItem) {
      if (existingItem.quantity < product.stock_quantity) {
        setCart(cart.map((item) => (item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)))
      }
    } else {
      setCart([...cart, { product, quantity: 1 }])
    }
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    const item = cart.find((item) => item.product.id === productId)
    if (!item) return

    if (newQuantity <= 0) {
      removeFromCart(productId)
    } else if (newQuantity <= item.product.stock_quantity) {
      setCart(cart.map((item) => (item.product.id === productId ? { ...item, quantity: newQuantity } : item)))
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId))
  }

  const subtotal = cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0)
  const tax = subtotal * 0.1 // 10% tax
  const total = subtotal + tax

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError("Cart is empty")
      return
    }

    if (paymentMethod === "debt" && !selectedCustomer) {
      setError("Please select a customer for debt payment")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Generate sale number
      const { data: saleNumberData } = await supabase.rpc("generate_sale_number")
      const saleNumber = saleNumberData || `SALE-${Date.now()}`

      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          sale_number: saleNumber,
          customer_id: selectedCustomer || null,
          user_id: user?.id,
          subtotal,
          tax,
          total,
          payment_method: paymentMethod,
          payment_status: paymentMethod === "debt" ? "debt" : "paid",
        })
        .select()
        .single()

      if (saleError) throw saleError

      // Create sale items
      const saleItems = cart.map((item) => ({
        sale_id: sale.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        subtotal: Number(item.product.price) * item.quantity,
      }))

      const { error: itemsError } = await supabase.from("sale_items").insert(saleItems)

      if (itemsError) throw itemsError

      // Update product stock
      for (const item of cart) {
        const { error: stockError } = await supabase
          .from("products")
          .update({
            stock_quantity: item.product.stock_quantity - item.quantity,
          })
          .eq("id", item.product.id)

        if (stockError) throw stockError
      }

      // If payment method is debt, create debt record
      if (paymentMethod === "debt" && selectedCustomer) {
        const { error: debtError } = await supabase.from("debts").insert({
          customer_id: selectedCustomer,
          sale_id: sale.id,
          amount: total,
          remaining_amount: total,
          status: "pending",
        })

        if (debtError) throw debtError
      }

      // Clear cart and reset form
      setCart([])
      setSelectedCustomer("")
      setPaymentMethod("cash")
      setSearchTerm("")

      // Redirect to receipt page
      router.push(`/dashboard/sales/${sale.id}`)
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Products Section */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="border-primary/20 shadow-lg shadow-primary/5">
          <CardHeader className="bg-gradient-to-br from-primary/5 to-accent/5">
            <CardTitle className="text-2xl">Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-11 bg-secondary/50 border-primary/20 focus:border-primary"
                autoComplete="off"
              />
            </div>

            <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-2">
              {filteredProducts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No products found</p>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 border border-primary/10 rounded-xl hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 hover:border-primary/30 cursor-pointer transition-all hover:shadow-md"
                    onClick={() => addToCart(product)}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{product.name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {product.categories && (
                          <Badge variant="secondary" className="bg-accent/20 text-accent-foreground border-accent/30">
                            {product.categories.name}
                          </Badge>
                        )}
                        <Badge
                          variant={product.stock_quantity > 0 ? "default" : "destructive"}
                          className={
                            product.stock_quantity > 0 ? "bg-primary/20 text-primary-foreground border-primary/30" : ""
                          }
                        >
                          Stock: {product.stock_quantity}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      ${Number(product.price).toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart Section */}
      <div className="space-y-4">
        <Card className="border-accent/20 shadow-lg shadow-accent/5">
          <CardHeader className="bg-gradient-to-br from-accent/5 to-primary/5">
            <CardTitle className="text-2xl">Cart</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Cart is empty</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-2 p-3 border border-accent/10 rounded-xl bg-gradient-to-r from-accent/5 to-transparent"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ${Number(item.product.price).toFixed(2)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all bg-transparent"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-10 text-center text-sm font-bold">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all bg-transparent"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock_quantity}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (10%):</span>
                <span className="font-semibold">${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xl font-bold">
                <span>Total:</span>
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 shadow-lg shadow-primary/5">
          <CardHeader className="bg-gradient-to-br from-primary/5 to-accent/5">
            <CardTitle className="text-xl">Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-11 bg-secondary/50 border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="debt">Debt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === "debt" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Customer</Label>
                  <AddCustomerDialog />
                </div>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger className="h-11 bg-secondary/50 border-primary/20">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>}

            <Button
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              onClick={handleCheckout}
              disabled={isProcessing || cart.length === 0}
            >
              {isProcessing ? "Processing..." : "Complete Sale"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
