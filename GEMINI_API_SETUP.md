# Configuration de l'API Gemini (Optionnel)

## Pourquoi configurer l'API Gemini ?

L'API Gemini permet de générer automatiquement des emails personnalisés et professionnels pour :
- Les licences envoyées aux propriétaires
- Les emails de bienvenue
- Les analyses de ventes avec IA

**Note :** Si vous ne configurez pas la clé API, l'application fonctionnera quand même avec des emails par défaut.

## Comment obtenir une clé API Gemini ?

1. Visitez : https://aistudio.google.com/app/apikey
2. Connectez-vous avec votre compte Google
3. Cliquez sur "Create API Key"
4. Copiez la clé générée

## Configuration

1. Ouvrez le fichier `.env.local` à la racine du projet
2. Remplacez `PLACEHOLDER_API_KEY` par votre vraie clé :

```env
VITE_GEMINI_API_KEY=votre_vraie_clé_ici
```

3. Redémarrez l'application (frontend uniquement, pas besoin de redémarrer le backend)

## Vérification

Après configuration, lorsque vous générez une licence :
- ✅ Vous ne verrez plus l'erreur "API key not valid"
- ✅ Les emails seront générés avec du contenu personnalisé par l'IA
- ✅ Les analyses de ventes utiliseront l'IA Gemini

## Limites gratuites

Google offre un quota gratuit généreux pour l'API Gemini :
- 15 requêtes par minute
- 1500 requêtes par jour
- 1 million de tokens par mois

Largement suffisant pour un usage normal du POS !
