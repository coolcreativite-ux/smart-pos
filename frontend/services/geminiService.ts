
import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const getSalesInsights = async (salesData: string): Promise<string> => {
    if (!navigator.onLine) {
        return "Vous êtes actuellement hors ligne. La génération d'insights IA nécessite une connexion internet.";
    }

    if (!ai || !apiKey) {
        return "⚠️ Clé API Gemini non configurée. Veuillez ajouter VITE_GEMINI_API_KEY dans votre fichier .env.local";
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

export const generateWelcomeEmail = async (userData: { firstName: string, lastName: string, username: string, storeName: string, role: string }): Promise<string> => {
    if (!ai || !apiKey) {
        return `OBJET : Bienvenue sur Gemini POS - Vos 14 jours d'essai BUSINESS PRO sont activés !\n---\nCORPS : Bonjour ${userData.firstName} ${userData.lastName},\n\nFélicitations ! Votre compte Gemini POS a été créé avec succès.\n\n**Informations de connexion :**\n- Identifiant : ${userData.username}\n- Enseigne : ${userData.storeName}\n- Rôle : ${userData.role}\n\nVotre essai gratuit de 14 jours sur notre offre BUSINESS PRO est maintenant actif. Profitez de toutes les fonctionnalités avancées !\n\nCordialement,\nL'équipe Gemini POS`;
    }

    try {
        const prompt = `
            Rédige un email de bienvenue professionnel et enthousiaste pour un nouveau client de notre plateforme SaaS "Gemini POS".
            Le client vient de s'inscrire et bénéficie d'un ESSAI GRATUIT de 14 JOURS sur la formule BUSINESS PRO (notre offre la plus complète incluant le multi-boutiques et l'IA).
            
            Informations du client :
            - Nom : ${userData.firstName} ${userData.lastName}
            - Identifiant : ${userData.username}
            - Enseigne : ${userData.storeName}
            - Rôle : ${userData.role}

            Contenu de l'email :
            1. Félicitations pour la création du compte.
            2. Mentionner que l'accès est déjà activé pour 14 jours sur l'offre BUSINESS PRO.
            3. Expliquer qu'ils peuvent configurer leurs produits et magasins dès maintenant.
            4. Rappeler que l'IA Gemini est à leur disposition pour les analyses.

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
        return `OBJET : Bienvenue sur Gemini POS - Vos 14 jours d'essai BUSINESS PRO sont activés !\n---\nCORPS : Bonjour ${userData.firstName} ${userData.lastName},\n\nVotre compte a été créé avec succès. Profitez de votre essai gratuit sur notre offre Business Pro.`;
    }
};

export const generateLicenseEmail = async (data: { ownerName: string, licenseKey: string, expiryDate: string, duration: string }): Promise<string> => {
    if (!ai || !apiKey) {
        return `OBJET : Votre Clé de Licence Gemini POS\n---\nCORPS : Bonjour ${data.ownerName},\n\nVotre licence Gemini POS a été générée avec succès !\n\n**Détails de votre licence :**\n- Clé de licence : \`${data.licenseKey}\`\n- Durée : ${data.duration}\n- Date d'expiration : ${data.expiryDate}\n\n**Comment activer votre licence :**\n1. Connectez-vous à votre compte Gemini POS\n2. Accédez aux paramètres\n3. Entrez votre clé de licence\n\nMerci de votre confiance !\n\nCordialement,\nL'équipe Gemini POS`;
    }

    try {
        const prompt = `
            Rédige un email professionnel pour envoyer une nouvelle clé de licence logicielle à un client.
            Logiciel : Gemini POS
            
            Informations :
            - Client : ${data.ownerName}
            - Clé : ${data.licenseKey}
            - Expiration : ${data.expiryDate}
            - Durée : ${data.duration}

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

        return response.text || "OBJET : Votre licence Gemini POS\n---\nCORPS : Votre clé est prête.";
    } catch (error) {
        console.error("License email generation failed:", error);
        return `OBJET : Votre Clé de Licence Gemini POS\n---\nCORPS : Bonjour ${data.ownerName},\n\nVotre clé de licence : \`${data.licenseKey}\`\n\nExpiration : ${data.expiryDate}`;
    }
};
