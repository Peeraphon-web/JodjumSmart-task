import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@12.18.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // 1. จัดการ Pre-flight request (สำคัญมากสำหรับ CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY')

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const { customer_id, user_id, email } = await req.json()
    const origin = req.headers.get('origin') || 'http://localhost:5173'

    let session;

    if (customer_id) {
      // --- กรณีที่ 1: เปิด Billing Portal (สำหรับคนที่เป็น Premium แล้ว) ---
      session = await stripe.billingPortal.sessions.create({
        customer: customer_id,
        return_url: `${origin}/`,
      })
    } else {
      // --- กรณีที่ 2: สร้าง Checkout Session (สำหรับคนที่จะ Upgrade) ---
      session = await stripe.checkout.sessions.create({
        customer_email: email,
        line_items: [
          {
            price: 'price_1SnaRxIAPypNqzfhr6rtv9e8', // นำ Price ID จาก Stripe Dashboard มาใส่ที่นี่
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/`,
        metadata: {
          user_id: user_id,
        },
      })
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // 2. แม้แต่ตอน Error ก็ต้องส่ง corsHeaders กลับไปด้วย ไม่งั้นหน้าบ้านจะเห็นเป็น CORS Error
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})