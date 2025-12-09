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

    // HTML Email Template - Premium Dekonvi Design
    const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre compte Dekonvi est validé !</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); overflow: hidden;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #2DD181 0%, #27ae60 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: 2px;">DEKONVI</h1>
              <p style="margin: 8px 0 0; color: #ffffff; font-size: 14px; opacity: 0.95;">Votre marketplace de confiance au Togo</p>
            </td>
          </tr>

          <!-- Celebration Banner -->
          <tr>
            <td style="padding: 30px 30px 0; text-align: center;">
              <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 24px; border-radius: 50px; font-size: 14px; font-weight: 600; margin-bottom: 20px;">
                🎉 Compte validé !
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 10px 30px 40px;">
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: bold; text-align: center;">Bienvenue sur Dekonvi !</h2>
              
              <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">Bonjour ${userName || ''} !</p>
              
              <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Bonne nouvelle ! 🎊 Votre compte <strong style="color: #2DD181;">Dekonvi</strong> a été validé par notre équipe.
              </p>
              
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Vous pouvez maintenant <strong>vous connecter</strong> et profiter de toutes les fonctionnalités de notre marketplace :
              </p>

              <!-- Features List -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
                <ul style="margin: 0; padding: 0 0 0 20px; color: #4b5563; font-size: 15px; line-height: 1.8;">
                  <li>Publier vos annonces gratuitement</li>
                  <li>Acheter en toute sécurité</li>
                  <li>Contacter les vendeurs directement</li>
                  <li>Gérer vos favoris et messages</li>
                  <li>Bénéficier de la protection acheteur</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0 30px;">
                    <a href="${siteUrl}/login" 
                       style="display: inline-block; background: linear-gradient(135deg, #2DD181 0%, #27ae60 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(45, 209, 129, 0.3);">
                      Se connecter maintenant
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Quick Tips -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 10px;">
                <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 18px; font-weight: 600;">
                  🚀 Vos premiers pas sur Dekonvi
                </h3>
                <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                  <strong style="color: #1f2937;">1. Complétez votre profil</strong><br>
                  Ajoutez une photo et des informations pour inspirer confiance.
                </p>
                <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                  <strong style="color: #1f2937;">2. Publiez votre première annonce</strong><br>
                  C'est gratuit et en quelques clics seulement !
                </p>
                <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                  <strong style="color: #1f2937;">3. Explorez les catégories</strong><br>
                  Découvrez des milliers d'annonces dans toutes les catégories.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px;">
                <strong style="color: #1f2937;">Dekonvi</strong> - Votre marketplace de confiance au Togo
              </p>
              <p style="margin: 0 0 12px; color: #6b7280; font-size: 13px;">
                Achetez et vendez en toute sécurité
              </p>
              <p style="margin: 0 0 16px;">
                <a href="https://dekonvi.com" style="color: #2DD181; text-decoration: none; font-weight: 500; font-size: 14px;">
                  dekonvi.com
                </a>
              </p>
              
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Besoin d'aide ? Contactez notre support : <a href="mailto:support@dekonvi.com" style="color: #2DD181; text-decoration: none;">support@dekonvi.com</a>
              </p>
            </td>
          </tr>

        </table>

        <!-- Legal Footer -->
        <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
          <tr>
            <td style="padding: 0 30px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                Vous recevez cet email car votre compte Dekonvi a été validé.<br>
                © 2024 Dekonvi. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
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
