
import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const getSalesInsights = async (salesData: string): Promise<string> => {
    if (!navigator.onLine) {
        return "Vous êtes actuellement hors ligne. La génération d'insights IA nécessite une connexion internet.";
    }

    if (!ai || !apiKey) {
        return "⚠️ Clé API IA non configurée. Veuillez ajouter VITE_GEMINI_API_KEY dans votre fichier .env.local";
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Analysez ces données de vente POS et produisez un rapport stratégique en français avec Markdown (Résumé, Tendances, Top produits, Recommandations) : ${salesData}`,
            config: { temperature: 0.5 }
        });
        return response.text || "Aucune analyse générée.";
    } catch (error) {
        console.error(error);
        return "Erreur lors de la génération des insights.";
    }
};

export const generateWelcomeEmail = async (userData: { firstName: string, lastName: string, username: string, password?: string, storeName: string, role: string }): Promise<string> => {
    if (!ai || !apiKey) {
        const passwordInfo = userData.password ? `\n- Mot de passe temporaire : ${userData.password}\n⚠️ Veuillez changer ce mot de passe lors de votre première connexion.` : '';
        return `OBJET : Bienvenue sur SmartPOS - Votre compte est prêt !\n---\nCORPS : Bonjour ${userData.firstName} ${userData.lastName},\n\nBienvenue chez Cool Digital Africa ! 🎉\n\nVotre compte SmartPOS a été créé avec succès.\n\n**Informations de connexion :**\n- Identifiant : ${userData.username}${passwordInfo}\n- Enseigne : ${userData.storeName}\n- Rôle : ${userData.role}\n\n**Accédez à votre compte :**\nhttps://smartpos.cooldigital.africa\n\nVotre essai gratuit de 14 jours est maintenant actif. Profitez de toutes les fonctionnalités avancées !\n\nBesoin d'aide ? Contactez-nous à contact@cooldigital.africa\n\nCordialement,\nL'équipe Cool Digital Africa`;
    }

    try {
        const passwordSection = userData.password 
            ? `\n- Mot de passe temporaire : ${userData.password}\n⚠️ IMPORTANT : Changez ce mot de passe lors de votre première connexion pour des raisons de sécurité.`
            : '';
            
        const prompt = `
            Rédige un email de bienvenue professionnel et enthousiaste pour un nouveau client de notre plateforme SaaS "SmartPOS" de Cool Digital Africa.
            Le client vient de s'inscrire et bénéficie d'un ESSAI GRATUIT de 14 JOURS sur la formule BUSINESS PRO (notre offre la plus complète incluant le multi-boutiques et l'IA).
            
            Informations du client :
            - Nom : ${userData.firstName} ${userData.lastName}
            - Identifiant : ${userData.username}${passwordSection}
            - Enseigne : ${userData.storeName}
            - Rôle : ${userData.role}

            Contenu de l'email :
            1. Félicitations pour la création du compte.
            2. Afficher clairement les identifiants de connexion (username${userData.password ? ' et mot de passe temporaire' : ''}).
            ${userData.password ? '3. IMPORTANT : Insister sur le fait de changer le mot de passe temporaire dès la première connexion.' : ''}
            4. Mentionner que l'accès est déjà activé pour 14 jours sur l'offre BUSINESS PRO.
            5. Expliquer qu'ils peuvent configurer leurs produits et magasins dès maintenant.
            6. Rappeler que l'IA Gemini est à leur disposition pour les analyses.
            7. Ajouter le lien : https://smartpos.cooldigital.africa
            8. Contact support : contact@cooldigital.africa

            Ton : Professionnel, chaleureux, africain
            Signature : L'équipe Cool Digital Africa

            IMPORTANT : Respecte strictement ce format :
            OBJET : [Le sujet de l'email]
            ---
            CORPS : 
            [Le contenu de l'email en Markdown]
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { temperature: 0.7 }
        });

        return response.text || "Erreur de génération du message.";
    } catch (error) {
        console.error("Email generation failed:", error);
        const passwordInfo = userData.password ? `\n- Mot de passe temporaire : ${userData.password}\n⚠️ Veuillez changer ce mot de passe lors de votre première connexion.` : '';
        return `OBJET : Bienvenue sur SmartPOS - Votre compte est prêt !\n---\nCORPS : Bonjour ${userData.firstName} ${userData.lastName},\n\nBienvenue chez Cool Digital Africa ! 🎉\n\nVotre compte SmartPOS a été créé avec succès.\n\n**Identifiants de connexion :**\n- Username : ${userData.username}${passwordInfo}\n\n**Accédez à votre compte :**\nhttps://smartpos.cooldigital.africa\n\nProfitez de votre essai gratuit de 14 jours !\n\nCordialement,\nL'équipe Cool Digital Africa`;
    }
};

export const generateLicenseEmail = async (data: { ownerName: string, licenseKey: string, expiryDate: string, duration: string }): Promise<string> => {
    if (!ai || !apiKey) {
        return `OBJET : Votre Clé de Licence SmartPOS\n---\nCORPS : Bonjour ${data.ownerName},\n\nVotre licence SmartPOS a été générée avec succès ! 🎉\n\n**Détails de votre licence :**\n- Clé de licence : \`${data.licenseKey}\`\n- Durée : ${data.duration}\n- Date d'expiration : ${data.expiryDate}\n\n**Comment activer votre licence :**\n1. Connectez-vous à https://smartpos.cooldigital.africa\n2. Accédez aux paramètres\n3. Entrez votre clé de licence\n\nBesoin d'aide ? Contactez-nous à contact@cooldigital.africa\n\nMerci de votre confiance !\n\nCordialement,\nL'équipe Cool Digital Africa`;
    }

    try {
        const prompt = `
            Rédige un email professionnel pour envoyer une nouvelle clé de licence logicielle à un client.
            Logiciel : SmartPOS de Cool Digital Africa
            
            Informations :
            - Client : ${data.ownerName}
            - Clé : ${data.licenseKey}
            - Expiration : ${data.expiryDate}
            - Durée : ${data.duration}

            Contenu :
            1. Félicitations pour l'activation
            2. Afficher clairement la clé de licence
            3. Instructions d'activation
            4. Lien : https://smartpos.cooldigital.africa
            5. Contact : contact@cooldigital.africa

            Ton : Professionnel, chaleureux
            Signature : L'équipe Cool Digital Africa

            IMPORTANT : Respecte strictement ce format :
            OBJET : [Le sujet de l'email]
            ---
            CORPS : 
            [Le contenu de l'email en Markdown]
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { temperature: 0.4 }
        });

        return response.text || "OBJET : Votre licence SmartPOS\n---\nCORPS : Votre clé est prête.";
    } catch (error) {
        console.error("License email generation failed:", error);
        return `OBJET : Votre Clé de Licence SmartPOS\n---\nCORPS : Bonjour ${data.ownerName},\n\nVotre clé de licence : \`${data.licenseKey}\`\n\nExpiration : ${data.expiryDate}\n\nCordialement,\nL'équipe Cool Digital Africa`;
    }
};
