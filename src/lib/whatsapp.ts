import { supabase } from "@/integrations/supabase/client";

export const WHATSAPP_NUMBER = "917899560461"; // country code + number, no + or spaces

// Detect if device is mobile
function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// Open WhatsApp with proper mobile/desktop support
function openWhatsAppLink(phoneNumber: string, message: string): void {
  const cleanPhone = phoneNumber.replace(/\s|\+|-/g, "");
  
  let url: string;
  
  if (isMobile()) {
    // Mobile: use WhatsApp app or web
    url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  } else {
    // Desktop: use WhatsApp Web
    url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  }
  
  // Use location.href instead of window.open for better mobile compatibility
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes("iphone") || userAgent.includes("ipad")) {
    // iOS: use different approach
    window.location.href = url;
  } else if (userAgent.includes("android")) {
    // Android: use wa.me format
    window.location.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  } else {
    // Desktop: use window.open
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export async function logAndOpenWhatsApp(product: { id: string; name: string }) {
  const message = `Hello! I am interested in ordering the ${product.name} (ID: ${product.id}). Could you please provide more details?`;

  // Fire-and-forget log so the redirect isn't blocked.
  const { data: { user } } = await supabase.auth.getUser();
  supabase
    .from("orders_log")
    .insert({
      product_id: product.id,
      product_name: product.name,
      user_id: user?.id ?? null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    })
    .then(({ error }) => {
      if (error) console.error("Failed to log inquiry", error);
    });

  openWhatsAppLink(WHATSAPP_NUMBER, message);
}

export async function sendOrderWhatsApp({
  productName,
  customerPhone,
  customerName,
  customerEmail,
}: {
  productName: string;
  customerPhone: string;
  customerName: string;
  customerEmail: string;
}) {
  // Format phone number: add country code if not present
  let formattedPhone = customerPhone.replace(/\s|\+|-|\(|\)/g, "");
  
  // Add country code if phone number doesn't start with it
  if (!formattedPhone.startsWith("91") && formattedPhone.length === 10) {
    formattedPhone = "91" + formattedPhone;
  }
  
  const message = `Hello ${customerName}! Thank you for your interest in ${productName}. We have received your order details:
- Name: ${customerName}
- Email: ${customerEmail}
- Phone: ${customerPhone}

Our team will contact you shortly to confirm your order and arrange payment/delivery details.`;

  openWhatsAppLink(formattedPhone, message);
}

export function formatOrderConfirmationMessage(
  customerName: string,
  productName: string,
  productPrice: number
): string {
  return `Hello ${customerName}! 🎉

Your order has been confirmed and is now being processed.

📦 Order Details:
- Product: ${productName}
- Amount: ₹${productPrice.toFixed(2)}
- Status: Confirmed ✓

Our team will contact you shortly with delivery details and payment confirmation.

Thank you for your purchase! 💎`;
}

export async function sendOrderConfirmationWhatsApp({
  productName,
  customerPhone,
  customerName,
  productPrice,
}: {
  productName: string;
  customerPhone: string;
  customerName: string;
  productPrice: number;
}) {
  const message = formatOrderConfirmationMessage(customerName, productName, productPrice);
  openWhatsAppLink(customerPhone, message);
}

