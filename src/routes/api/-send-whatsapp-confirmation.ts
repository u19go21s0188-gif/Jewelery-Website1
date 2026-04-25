// WhatsApp Business API configuration
// You'll need to set these environment variables
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const WHATSAPP_BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

interface SendWhatsAppRequest {
  customerPhone: string;
  customerName: string;
  productName: string;
  productPrice: number;
}

function jsonResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: Request) {
  try {
    const body: SendWhatsAppRequest = await req.json();
    const { customerPhone, customerName, productName, productPrice } = body;

    // Validate required fields
    if (!customerPhone || !customerName || !productName) {
      return jsonResponse(
        { error: 'Missing required fields' },
        400
      );
    }

    // If we have WhatsApp Business API credentials, use them
    if (WHATSAPP_API_TOKEN && WHATSAPP_PHONE_ID) {
      return await sendViaWhatsAppBusinessAPI(
        customerPhone,
        customerName,
        productName,
        productPrice
      );
    }

    // Fallback: Return the message that should be sent
    // (Admin will need to send it manually via WhatsApp Web)
    const message = formatConfirmationMessage(customerName, productName, productPrice);
    
    return jsonResponse({
      success: true,
      message: 'WhatsApp API not configured. Message formatted for manual sending.',
      data: {
        phone: customerPhone,
        message: message,
        whatsappLink: `https://wa.me/${customerPhone.replace(/\s|\+|-/g, '')}?text=${encodeURIComponent(message)}`
      }
    });

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return jsonResponse(
      { error: 'Failed to send WhatsApp message', details: String(error) },
      500
    );
  }
}

async function sendViaWhatsAppBusinessAPI(
  customerPhone: string,
  customerName: string,
  productName: string,
  productPrice: number
) {
  try {
    const cleanPhone = customerPhone.replace(/\s|\+|-/g, '');
    const message = formatConfirmationMessage(customerName, productName, productPrice);

    const response = await fetch(
      `https://graph.instagram.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: {
            preview_url: true,
            body: message,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('WhatsApp API error:', errorData);
      throw new Error(`WhatsApp API error: ${response.status}`);
    }

    const data = await response.json();
    return jsonResponse({
      success: true,
      message: 'WhatsApp message sent successfully',
      messageId: data.messages?.[0]?.id,
    });

  } catch (error) {
    console.error('Error sending via WhatsApp Business API:', error);
    throw error;
  }
}

function formatConfirmationMessage(
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
