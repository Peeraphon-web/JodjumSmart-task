import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@12.18.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(), 
})

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text() 

  try {
    // 1. ตรวจสอบความถูกต้องของ Webhook Signature
    const event = await stripe.webhooks.constructEventAsync(
      body, 
      signature!, 
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
      undefined, 
      Stripe.createSubtleCryptoProvider() 
    )

    console.log(`✅ Verified event: ${event.type}`)

    // 2. จัดการเมื่อการจ่ายเงินสำเร็จ
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.metadata?.user_id
      const customerId = session.customer // นี่คือรหัส cus_xxx ที่เราต้องการ!

      if (!userId) throw new Error("No user_id found in metadata")

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('ADMIN_KEY')! 
      )

      // 3. อัปเดตฐานข้อมูล: เปลี่ยนเป็นพรีเมียม และเก็บ Stripe Customer ID
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          is_premium: true,
          stripe_customer_id: customerId // เก็บค่าไว้เพื่อให้ปุ่ม Manage Subscription ทำงานได้
        })
        .eq('id', userId)

      if (error) throw error
      console.log(`👑 User ${userId} is now PREMIUM (Customer: ${customerId})`)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    console.error(`❌ Webhook Error: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})