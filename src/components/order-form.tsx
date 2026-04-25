import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { sendOrderWhatsApp } from "@/lib/whatsapp";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

const ADMIN_WHATSAPP_NUMBER = "917899560461"; // Admin WhatsApp number

interface OrderFormProps {
  product: {
    id: string;
    name: string;
    price: number;
  };
  children?: React.ReactNode;
}

export function OrderForm({ product, children }: OrderFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
  });

  const sendAdminNotification = (fullName: string, email: string, phoneNumber: string) => {
    const message = `🎯 NEW ORDER RECEIVED

📦 Product: ${product.name}
💰 Price: ₹${product.price.toFixed(2)}

👤 Customer Details:
- Name: ${fullName}
- Email: ${email}
- Phone: ${phoneNumber}

⏰ Order Time: ${new Date().toLocaleString("en-IN")}

Please contact the customer to confirm the order and arrange payment/delivery.`;

    const cleanPhone = ADMIN_WHATSAPP_NUMBER.replace(/\s|\+|-|\(|\)/g, "");
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes("iphone") || userAgent.includes("ipad") || userAgent.includes("android")) {
      // Mobile: use wa.me format
      window.location.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    } else {
      // Desktop: use web.whatsapp.com
      window.open(`https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Insert order into database
      const { error } = await supabase
        .from("orders")
        .insert({
          product_id: product.id,
          full_name: formData.fullName,
          email: formData.email,
          phone_number: formData.phoneNumber,
        });

      if (error) throw error;

      // Show success toast
      toast.success("Order placed successfully! 🎉");

      // Send WhatsApp message to customer first (before any navigation)
      await sendOrderWhatsApp({
        productName: product.name,
        customerPhone: formData.phoneNumber,
        customerName: formData.fullName,
        customerEmail: formData.email,
      });

      // Send notification to admin (this will navigate)
      setTimeout(() => {
        sendAdminNotification(
          formData.fullName,
          formData.email,
          formData.phoneNumber
        );
      }, 500);

      // Reset form and close dialog
      setFormData({ fullName: "", email: "", phoneNumber: "" });
      setOpen(false);
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="inline-flex items-center justify-center gap-2 rounded-sm bg-gold px-5 py-3 text-xs font-medium uppercase tracking-widest text-charcoal transition-colors hover:bg-gold-soft">
            <MessageCircle className="h-4 w-4" />
            Order Now
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Order {product.name}</DialogTitle>
          <DialogDescription>
            Fill in your details to place an order for ₹{product.price.toFixed(2)}.
            We'll send you a WhatsApp message to confirm your order.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Placing Order..." : "Place Order"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}