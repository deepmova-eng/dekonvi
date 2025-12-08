import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface EmailPayload {
    type: 'new_ticket' | 'admin_reply'
    ticketId: string
    messageId?: string
}

serve(async (req) => {
    try {
        // Parse request
        const payload: EmailPayload = await req.json()

        // Create Supabase client
        const supabase = createClient(
            SUPABASE_URL!,
            SUPABASE_SERVICE_ROLE_KEY!
        )

        if (payload.type === 'new_ticket') {
            // Nouveau ticket → Email aux admins
            await sendNewTicketEmailToAdmins(supabase, payload.ticketId)
        } else if (payload.type === 'admin_reply') {
            // Réponse admin → Email au user
            await sendAdminReplyEmailToUser(supabase, payload.ticketId, payload.messageId!)
        }

        return new Response(
            JSON.stringify({ success: true }),
            { headers: { 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error('Error sending email:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }
})

async function sendNewTicketEmailToAdmins(supabase: any, ticketId: string) {
    // Fetch ticket details
    const { data: ticket } = await supabase
        .from('tickets')
        .select(`
      *,
      user:profiles!user_id (name, email),
      messages:ticket_messages (message)
    `)
        .eq('id', ticketId)
        .single()

    if (!ticket) throw new Error('Ticket not found')

    // Fetch admin emails
    const { data: admins } = await supabase
        .from('profiles')
        .select('email, name')
        .eq('role', 'admin')

    if (!admins || admins.length === 0) {
        console.log('No admins found')
        return
    }

    const subjectLabels: Record<string, string> = {
        validation_issue: '🔒 Problème de validation',
        technical_bug: '🐞 Bug technique',
        billing: '💳 Problème de paiement',
        other: '🔍 Autre question'
    }

    const firstMessage = ticket.messages[0]?.message || 'Pas de message'
    const ticketNumber = ticket.id.slice(0, 6).toUpperCase()

    // Send email to each admin
    for (const admin of admins) {
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'Dekonvi Support <support@dekonvi.com>',
                to: admin.email,
                subject: `[Nouveau Ticket #${ticketNumber}] ${subjectLabels[ticket.subject]}`,
                html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; }
                .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
                .ticket-info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
                .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 24px;">Nouveau Ticket Support</h1>
                  <p style="margin: 10px 0 0 0; opacity: 0.9;">Ticket #${ticketNumber}</p>
                </div>
                <div class="content">
                  <p>Bonjour ${admin.name},</p>
                  <p>Un nouvel utilisateur a besoin de votre aide :</p>
                  
                  <div class="ticket-info">
                    <p><strong>De :</strong> ${ticket.user.name} (${ticket.user.email})</p>
                    <p><strong>Sujet :</strong> ${subjectLabels[ticket.subject]}</p>
                    <p><strong>Message :</strong></p>
                    <p style="white-space: pre-wrap; background: white; padding: 10px; border-left: 3px solid #3B82F6;">${firstMessage}</p>
                  </div>

                  <a href="https://dekonvi.com/admin" class="button">
                    Répondre au ticket
                  </a>

                  <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                    Ce ticket a été créé automatiquement. Connectez-vous à l'admin panel pour y répondre.
                  </p>
                </div>
                <div class="footer">
                  <p>Dekonvi - Marketplace de confiance</p>
                  <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                </div>
              </div>
            </body>
          </html>
        `
            })
        })
    }

    console.log(`New ticket email sent to ${admins.length} admins`)
}

async function sendAdminReplyEmailToUser(supabase: any, ticketId: string, messageId: string) {
    // Fetch ticket + message details
    const { data: ticket } = await supabase
        .from('tickets')
        .select(`
      *,
      user:profiles!user_id (name, email)
    `)
        .eq('id', ticketId)
        .single()

    if (!ticket) throw new Error('Ticket not found')

    const { data: message } = await supabase
        .from('ticket_messages')
        .select(`
      *,
      sender:profiles!sender_id (name, role)
    `)
        .eq('id', messageId)
        .single()

    if (!message) throw new Error('Message not found')

    // Only send if message is from admin
    if (message.sender.role !== 'admin') {
        console.log('Message not from admin, skipping email')
        return
    }

    const subjectLabels: Record<string, string> = {
        validation_issue: '🔒 Problème de validation',
        technical_bug: '🐞 Bug technique',
        billing: '💳 Problème de paiement',
        other: '🔍 Autre question'
    }

    const ticketNumber = ticket.id.slice(0, 6).toUpperCase()

    // Send email to user
    await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
            from: 'Dekonvi Support <support@dekonvi.com>',
            to: ticket.user.email,
            reply_to: 'support@dekonvi.com',
            subject: `[Ticket #${ticketNumber}] Notre équipe vous a répondu`,
            html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10B981 0%, #3B82F6 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; }
              .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
              .message-box { background: #EFF6FF; padding: 20px; border-radius: 8px; border-left: 4px solid #3B82F6; margin: 20px 0; }
              .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">✅ Réponse à votre ticket</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Ticket #${ticketNumber}</p>
              </div>
              <div class="content">
                <p>Bonjour ${ticket.user.name},</p>
                <p>Notre équipe Dekonvi a répondu à votre demande concernant : <strong>${subjectLabels[ticket.subject]}</strong></p>
                
                <div class="message-box">
                  <p style="margin: 0 0 10px 0; color: #3B82F6; font-weight: 600;">Réponse de ${message.sender.name} :</p>
                  <p style="margin: 0; white-space: pre-wrap;">${message.message}</p>
                </div>

                <p>Si vous avez d'autres questions, vous pouvez continuer la conversation en vous connectant à votre espace.</p>

                <a href="https://dekonvi.com/pending-validation" class="button">
                  Voir la conversation
                </a>

                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
                  💡 <strong>Astuce :</strong> Vous pouvez consulter tous vos tickets et l'historique des conversations sur votre page de profil.
                </p>
              </div>
              <div class="footer">
                <p>Dekonvi - Marketplace de confiance</p>
                <p>Besoin d'aide ? Répondez à cet email ou créez un nouveau ticket.</p>
              </div>
            </div>
          </body>
        </html>
      `
        })
    })

    console.log(`Admin reply email sent to ${ticket.user.email}`)
}
