"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign } from "lucide-react"
import { format } from "date-fns"
import { PayDebtDialog } from "@/components/pay-debt-dialog"

interface Debt {
  id: string
  amount: number
  paid_amount: number
  remaining_amount: number
  status: string
  due_date: string | null
  created_at: string
  customers: {
    id: string
    name: string
    phone: string
  }
  sales: {
    id: string
    sale_number: string
  } | null
}

interface DebtsTableProps {
  debts: Debt[]
}

export function DebtsTable({ debts }: DebtsTableProps) {
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Sale Number</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Paid Amount</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {debts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No debts found.
                </TableCell>
              </TableRow>
            ) : (
              debts.map((debt) => (
                <TableRow key={debt.id}>
                  <TableCell className="font-medium">{debt.customers.name}</TableCell>
                  <TableCell>{debt.customers.phone}</TableCell>
                  <TableCell>{debt.sales?.sale_number || "-"}</TableCell>
                  <TableCell>${Number(debt.amount).toFixed(2)}</TableCell>
                  <TableCell>${Number(debt.paid_amount).toFixed(2)}</TableCell>
                  <TableCell className="font-bold">${Number(debt.remaining_amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        debt.status === "paid" ? "default" : debt.status === "partial" ? "secondary" : "destructive"
                      }
                    >
                      {debt.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(debt.created_at), "MMM dd, yyyy")}</TableCell>
                  <TableCell className="text-right">
                    {debt.status !== "paid" && (
                      <Button variant="outline" size="sm" onClick={() => setSelectedDebt(debt)}>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Pay
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedDebt && <PayDebtDialog debt={selectedDebt} onClose={() => setSelectedDebt(null)} />}
    </>
  )
}
