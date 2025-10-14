"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"

interface Debt {
  id: string
  amount: number
  paid_amount: number
  remaining_amount: number
  customers: {
    name: string
    phone: string
  }
}

interface PayDebtDialogProps {
  debt: Debt
  onClose: () => void
}

export function PayDebtDialog({ debt, onClose }: PayDebtDialogProps) {
  const [paymentAmount, setPaymentAmount] = useState(debt.remaining_amount.toString())
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const amount = Number.parseFloat(paymentAmount)

      if (amount <= 0 || amount > Number(debt.remaining_amount)) {
        throw new Error("Invalid payment amount")
      }

      // Create payment record
      const { error: paymentError } = await supabase.from("debt_payments").insert({
        debt_id: debt.id,
        amount,
        payment_method: paymentMethod,
        notes: notes || null,
      })

      if (paymentError) throw paymentError

      // Update debt
      const newPaidAmount = Number(debt.paid_amount) + amount
      const newRemainingAmount = Number(debt.amount) - newPaidAmount
      const newStatus = newRemainingAmount <= 0 ? "paid" : "partial"

      const { error: debtError } = await supabase
        .from("debts")
        .update({
          paid_amount: newPaidAmount,
          remaining_amount: newRemainingAmount,
          status: newStatus,
        })
        .eq("id", debt.id)

      if (debtError) throw debtError

      onClose()
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Customer: {debt.customers.name} ({debt.customers.phone})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Debt Information</Label>
              <div className="text-sm space-y-1">
                <p>
                  Total Amount: <span className="font-bold">${Number(debt.amount).toFixed(2)}</span>
                </p>
                <p>
                  Paid Amount: <span className="font-bold">${Number(debt.paid_amount).toFixed(2)}</span>
                </p>
                <p>
                  Remaining:{" "}
                  <span className="font-bold text-destructive">${Number(debt.remaining_amount).toFixed(2)}</span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-amount">Payment Amount *</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                max={debt.remaining_amount}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
