import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'

    // Parse request body
    const { userId, userName, userEmail } = await req.json()

    if (!userEmail) {
      throw new Error('Email is required')
    }

    // HTML Email Template
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;background:#F9FAFB;">
  <div style="max-width:600px;margin:40px auto;background:white;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
    
    <!-- Header Vert Dekonvi -->
    <div style="background:linear-gradient(135deg, #10B981, #059669);padding:32px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:28px;font-weight:700;">
        ✅ Compte Validé !
      </h1>
    </div>
    
    <!-- Contenu -->
    <div style="padding:32px;">
      <h2 style="color:#111827;margin:0 0 16px 0;font-size:22px;">
        Félicitations ${userName || 'Utilisateur'} !
      </h2>
      
      <p style="color:#6B7280;line-height:1.6;margin:0 0 24px 0;">
        Votre compte <strong>Dekonvi</strong> a été validé par notre équipe. 
        Vous pouvez maintenant accéder à toutes les fonctionnalités :
      </p>
      
      <ul style="color:#6B7280;line-height:1.8;margin:0 0 32px 0;">
        <li>Publier des annonces illimitées</li>
        <li>Échanger avec les acheteurs/vendeurs</li>
        <li>Gérer vos favoris</li>
        <li>Booster vos annonces en Premium</li>
      </ul>
      
      <!-- Bouton CTA -->
      <div style="text-align:center;">
        <a href="${siteUrl}/login" 
           style="background:#10B981;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:600;font-size:16px;box-shadow:0 4px 12px rgba(16,185,129,0.3);">
          Se connecter maintenant →
        </a>
      </div>
      
      <p style="color:#9CA3AF;font-size:14px;margin:32px 0 0 0;text-align:center;">
        Ce lien est valable indéfiniment.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background:#F9FAFB;padding:24px;text-align:center;border-top:1px solid #E5E7EB;">
      <p style="color:#6B7280;font-size:14px;margin:0 0 8px 0;">
        Besoin d'aide ? <a href="mailto:support@dekonvi.com" style="color:#10B981;text-decoration:none;">Contactez-nous</a>
      </p>
      <p style="color:#9CA3AF;font-size:12px;margin:0;">
        © 2024 Dekonvi. Tous droits réservés.
      </p>
    </div>
    
  </div>
</body>
</html>
    `

    // Send email via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Dekonvi <hello@dekonvi.com>',
        to: [userEmail],
        subject: 'Bienvenue sur Dekonvi - Votre compte est validé !',
        html: emailHtml,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend API Error:', resendData)
      throw new Error(resendData.message || 'Failed to send email via Resend')
    }

    console.log('Email sent successfully via Resend to:', userEmail, 'ID:', resendData.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully via Resend',
        emailId: resendData.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in send-validation-email function:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
