import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({
  component: () => <OrdersPage />,
});

interface Order {
  id: string;
  product_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  created_at: string;
  is_processed: boolean;
  product_name?: string;
  product_price?: number;
}

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageOrderId, setMessageOrderId] = useState<string | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState<string>("no");

  useEffect(() => {
    fetchOrders();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel("public:orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // First fetch all orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Then fetch product details for these orders
      const productIds = ordersData.map(o => o.product_id).filter(Boolean);
      let productsMap: Record<string, any> = {};

      if (productIds.length > 0) {
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("id, name, price")
          .in("id", productIds);

        if (!productsError && productsData) {
          productsMap = productsData.reduce((acc: Record<string, any>, p: any) => {
            acc[p.id] = p;
            return acc;
          }, {});
        }
      }

      const formattedOrders = ordersData.map((order: any) => ({
        ...order,
        product_name: productsMap[order.product_id]?.name || "Unknown Product",
        product_price: productsMap[order.product_id]?.price || 0,
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      alert("Failed to fetch orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const markAsProcessed = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ is_processed: true })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Order marked as processed! ✓");
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to process order. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const generateSmsMessage = (order: Order): string => {
    return `Hello ${order.full_name}! 🎉

Your order has been confirmed and is now being processed.

📦 Product: ${order.product_name}
💰 Amount: ₹${order.product_price?.toFixed(2)}
✓ Status: Confirmed

Our team will contact you shortly with delivery details.

Thank you for your purchase! 💎`;
  };

  const generatePaymentConfirmedMessage = (order: Order): string => {
    return `Hello ${order.full_name}! 🎉

Your order has been confirmed and payment has been verified!

📦 Product: ${order.product_name}
💰 Amount: ₹${order.product_price?.toFixed(2)}
✓ Payment Status: Confirmed ✓
✓ Order Status: Confirmed

We will proceed with your order and contact you shortly with delivery details.

Thank you for your purchase! 💎`;
  };

  const generatePaymentPendingMessage = (order: Order): string => {
    return `Hello ${order.full_name}!

Thank you for your order! We have received your order details.

📦 Product: ${order.product_name}
💰 Amount: ₹${order.product_price?.toFixed(2)}

⏳ Payment Status: Pending

Please complete the payment using the following methods:
• Bank Transfer
• UPI
• Credit/Debit Card

Once payment is confirmed, we will proceed with your order and contact you with delivery details.

Please reply with "Payment Done" once you have transferred the amount.

Thank you! 💎`;
  };

  const copyToClipboard = (text: string, orderId: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Message copied to clipboard!");
  };

  const openMessageDialog = (orderId: string) => {
    setMessageOrderId(orderId);
    setPaymentConfirmed("no");
    setShowMessageDialog(true);
  };

  const sendMessage = async () => {
    if (!messageOrderId) return;
    
    const order = orders.find(o => o.id === messageOrderId);
    if (!order) return;

    // Select message based on payment status
    let message = "";
    if (paymentConfirmed === "yes") {
      message = generatePaymentConfirmedMessage(order);
    } else {
      message = generatePaymentPendingMessage(order);
    }

    // Format phone number: add country code if not present
    let cleanPhone = order.phone_number.replace(/\s|\+|-|\(|\)/g, "");
    
    // Add country code if phone number doesn't start with it
    if (!cleanPhone.startsWith("91") && cleanPhone.length === 10) {
      cleanPhone = "91" + cleanPhone;
    }
    
    // Open WhatsApp with pre-filled message
    const userAgent = navigator.userAgent.toLowerCase();
    let url: string;
    
    if (userAgent.includes("iphone") || userAgent.includes("ipad") || userAgent.includes("android")) {
      // Mobile: use wa.me format
      url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.location.href = url;
    } else {
      // Desktop: use web.whatsapp.com
      url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
    
    // Mark as processed
    try {
      await supabase
        .from("orders")
        .update({ is_processed: true })
        .eq("id", messageOrderId);
      
      toast.success("Order marked as processed! Message opened.");
      setShowMessageDialog(false);
      setMessageOrderId(null);
      setPaymentConfirmed("no");
      fetchOrders();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update order");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl">Orders</h1>
          <p className="mt-1 text-muted-foreground">
            Customer orders from your storefront.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Orders</p>
          <p className="font-serif text-2xl">{orders.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-muted-foreground/20 p-8 text-center">
          <p className="text-muted-foreground">No orders yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SMS</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.full_name}</TableCell>
                  <TableCell>{order.email}</TableCell>
                  <TableCell>{order.phone_number}</TableCell>
                  <TableCell>{order.product_name}</TableCell>
                  <TableCell>₹{order.product_price?.toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(order.created_at)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={order.is_processed ? "default" : "secondary"}
                      className={
                        order.is_processed
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {order.is_processed ? "Processed" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openMessageDialog(order.id)}
                      className="gap-2"
                    >
                      Send Message
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedOrder(order)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>
                Details for order placed on {formatDate(selectedOrder.created_at)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Full Name
                  </p>
                  <p className="mt-1 font-medium">{selectedOrder.full_name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Phone
                  </p>
                  <p className="mt-1 font-medium">{selectedOrder.phone_number}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Email
                  </p>
                  <p className="mt-1 font-medium">{selectedOrder.email}</p>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Product
                </p>
                <p className="mt-2 font-medium">{selectedOrder.product_name}</p>
                <p className="mt-1 text-2xl font-serif text-accent">
                  ₹{selectedOrder.product_price?.toFixed(2)}
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Status
                  </p>
                  <Badge
                    variant={selectedOrder.is_processed ? "default" : "secondary"}
                    className={
                      selectedOrder.is_processed
                        ? "mt-2 bg-green-100 text-green-800"
                        : "mt-2 bg-yellow-100 text-yellow-800"
                    }
                  >
                    {selectedOrder.is_processed ? "Processed" : "Pending"}
                  </Badge>
                </div>
              </div>

              {!selectedOrder.is_processed && (
                <Button
                  onClick={() => markAsProcessed(selectedOrder.id)}
                  className="w-full"
                >
                  Mark as Processed
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Send Message Dialog */}
      {messageOrderId && (
        <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Send Confirmation Message</DialogTitle>
              <DialogDescription>
                Verify payment status and send the appropriate message to customer
              </DialogDescription>
            </DialogHeader>

            {orders.find(o => o.id === messageOrderId) && (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-xs font-medium uppercase text-muted-foreground mb-2">
                    Customer Phone
                  </p>
                  <p className="font-medium">{orders.find(o => o.id === messageOrderId)?.phone_number}</p>
                </div>

                {/* Payment Confirmation */}
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium mb-4">Is Payment Confirmed?</p>
                  <RadioGroup value={paymentConfirmed} onValueChange={setPaymentConfirmed}>
                    <div className="flex items-center space-x-2 mb-3">
                      <RadioGroupItem value="no" id="payment-no" />
                      <Label htmlFor="payment-no" className="font-normal cursor-pointer">
                        No - Payment Pending
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="payment-yes" />
                      <Label htmlFor="payment-yes" className="font-normal cursor-pointer">
                        Yes - Payment Confirmed
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Message Preview */}
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-medium uppercase text-muted-foreground mb-3">
                    Message Preview
                  </p>
                  <div className="whitespace-pre-wrap text-sm text-gray-700 bg-white p-3 rounded border max-h-64 overflow-y-auto">
                    {paymentConfirmed === "yes"
                      ? generatePaymentConfirmedMessage(orders.find(o => o.id === messageOrderId)!)
                      : generatePaymentPendingMessage(orders.find(o => o.id === messageOrderId)!)}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowMessageDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={sendMessage}
                    className="flex-1"
                  >
                    Send via WhatsApp
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

