
/**
 * Service d'envoi d'emails pour Gemini POS
 * Supporte plusieurs fournisseurs : Resend, SendGrid, ou SMTP personnalisé
 */

// Configuration depuis les variables d'environnement
const EMAIL_PROVIDER = import.meta.env.VITE_EMAIL_PROVIDER || 'simulation'; // 'resend', 'sendgrid', 'smtp', 'simulation'
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
const SENDGRID_API_KEY = import.meta.env.VITE_SENDGRID_API_KEY;
const FROM_EMAIL = import.meta.env.VITE_FROM_EMAIL || 'noreply@geminipos.com';
const FROM_NAME = import.meta.env.VITE_FROM_NAME || 'Gemini POS';

/**
 * Envoie un email via Resend (via le backend pour éviter CORS)
 * Documentation : https://resend.com/docs/send-with-nodejs
 */
const sendViaResend = async (to: string, subject: string, body: string): Promise<boolean> => {
    try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        const response = await fetch(`${API_URL}/api/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to,
                subject,
                body
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('❌ Erreur Resend:', error);
            return false;
        }

        const data = await response.json();
        console.log('✅ Email envoyé via Resend:', data.emailId || 'simulated');
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi via Resend:', error);
        return false;
    }
};

/**
 * Envoie un email via SendGrid
 * Documentation : https://docs.sendgrid.com/api-reference/mail-send/mail-send
 */
const sendViaSendGrid = async (to: string, subject: string, body: string): Promise<boolean> => {
    try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SENDGRID_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                personalizations: [{
                    to: [{ email: to }]
                }],
                from: {
                    email: FROM_EMAIL,
                    name: FROM_NAME
                },
                subject: subject,
                content: [{
                    type: 'text/html',
                    value: convertMarkdownToHtml(body)
                }]
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('❌ Erreur SendGrid:', error);
            return false;
        }

        console.log('✅ Email envoyé via SendGrid');
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi via SendGrid:', error);
        return false;
    }
};

/**
 * Convertit le contenu Markdown en HTML simple
 */
const convertMarkdownToHtml = (markdown: string): string => {
    // Séparer l'objet du corps
    const parts = markdown.split('---');
    const body = parts.length > 1 ? parts[1].replace('CORPS :', '').trim() : markdown;
    
    // Conversions Markdown basiques
    let html = body
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // Gras
        .replace(/\*(.+?)\*/g, '<em>$1</em>') // Italique
        .replace(/`(.+?)`/g, '<code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>') // Code inline
        .replace(/^# (.+)$/gm, '<h1 style="font-size: 24px; font-weight: bold; margin: 16px 0;">$1</h1>') // H1
        .replace(/^## (.+)$/gm, '<h2 style="font-size: 20px; font-weight: bold; margin: 14px 0;">$1</h2>') // H2
        .replace(/^### (.+)$/gm, '<h3 style="font-size: 18px; font-weight: bold; margin: 12px 0;">$1</h3>') // H3
        .replace(/^\- (.+)$/gm, '<li style="margin: 4px 0;">$1</li>') // Liste
        .replace(/\n\n/g, '</p><p style="margin: 12px 0;">') // Paragraphes
        .replace(/\n/g, '<br>'); // Sauts de ligne

    // Wrapper les listes
    html = html.replace(/(<li.+<\/li>)/s, '<ul style="margin: 12px 0; padding-left: 24px;">$1</ul>');
    
    // Template HTML complet
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Gemini POS</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="margin: 12px 0;">${html}</p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
                <p>© ${new Date().getFullYear()} Gemini POS. Tous droits réservés.</p>
            </div>
        </body>
        </html>
    `;
};

/**
 * Mode simulation (développement)
 */
const sendSimulation = async (to: string, subject: string, body: string): Promise<boolean> => {
    console.log(`%c 📧 SIMULATION D'ENVOI EMAIL `, 'background: #f59e0b; color: white; font-weight: bold;');
    console.log(`À: ${to}`);
    console.log(`Sujet: ${subject}`);
    console.log(`Contenu:\n${body}`);

    return new Promise((resolve) => {
        setTimeout(() => {
            console.log("%c ✅ EMAIL SIMULÉ (non envoyé réellement)", 'color: #f59e0b; font-weight: bold;');
            console.log("%c 💡 Pour envoyer de vrais emails, configurez VITE_EMAIL_PROVIDER dans .env.local", 'color: #6b7280;');
            resolve(true);
        }, 1000);
    });
};

/**
 * Fonction principale d'envoi d'email
 * Choisit automatiquement le bon fournisseur selon la configuration
 */
export const sendRealEmail = async (to: string, subject: string, body: string): Promise<boolean> => {
    // Validation
    if (!to || !subject || !body) {
        console.error('❌ Paramètres d\'email manquants');
        return false;
    }

    // Extraire le sujet du corps si présent
    let finalSubject = subject;
    let finalBody = body;
    
    if (body.includes('OBJET :')) {
        const parts = body.split('---');
        if (parts.length > 0) {
            const subjectLine = parts[0].trim();
            finalSubject = subjectLine.replace('OBJET :', '').trim();
        }
        if (parts.length > 1) {
            finalBody = parts[1].trim();
        }
    }

    console.log(`📧 Envoi d'email via ${EMAIL_PROVIDER}...`);

    // Choisir le fournisseur
    switch (EMAIL_PROVIDER) {
        case 'resend':
            if (!RESEND_API_KEY) {
                console.error('❌ VITE_RESEND_API_KEY non configurée');
                return sendSimulation(to, finalSubject, finalBody);
            }
            return sendViaResend(to, finalSubject, finalBody);

        case 'sendgrid':
            if (!SENDGRID_API_KEY) {
                console.error('❌ VITE_SENDGRID_API_KEY non configurée');
                return sendSimulation(to, finalSubject, finalBody);
            }
            return sendViaSendGrid(to, finalSubject, finalBody);

        case 'simulation':
        default:
            return sendSimulation(to, finalSubject, finalBody);
    }
};
