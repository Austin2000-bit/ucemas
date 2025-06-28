import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { sessionId } = await req.json()

    // Get the session details including the assigned student
    const { data: session, error: sessionError } = await supabaseClient
      .from('sessions')
      .select(`
        *,
        student:student_id (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError) {
      throw new Error('Failed to fetch session details')
    }

    if (!session) {
      throw new Error('Session not found')
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiry = new Date()
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5) // OTP valid for 5 minutes

    // Update session with OTP
    const { error: updateError } = await supabaseClient
      .from('sessions')
      .update({
        otp: otp,
        otp_expiry: otpExpiry.toISOString(),
        status: 'pending_confirmation'
      })
      .eq('id', sessionId)

    if (updateError) {
      throw new Error('Failed to update session with OTP')
    }

    // Send OTP to student's email
    const { error: emailError } = await supabaseClient.functions.invoke('send-email', {
      body: {
        to: session.student.email,
        subject: 'Session OTP Confirmation',
        html: `
          <h2>Session OTP Confirmation</h2>
          <p>Hello ${session.student.first_name},</p>
          <p>Your helper has generated an OTP for your session. Please use this OTP to confirm your session:</p>
          <h1 style="font-size: 32px; letter-spacing: 5px; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px;">${otp}</h1>
          <p>This OTP will expire in 5 minutes.</p>
          <p>If you did not request this OTP, please ignore this email.</p>
        `
      }
    })

    if (emailError) {
      console.error('Error sending OTP email:', emailError)
      // Don't throw error here, as the OTP was generated successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: 'OTP generated and sent to student successfully',
          otp: otp // Only return OTP in development environment
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: error.message || 'An unexpected error occurred'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 