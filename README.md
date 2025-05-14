# Ma Météo Locale

Une application web simple pour consulter la météo locale en temps réel, basée sur la localisation de l'utilisateur.

## Fonctionnalités

- Détection automatique de la localisation de l'utilisateur
- Recherche manuelle de ville si la géolocalisation n'est pas disponible
- Affichage des conditions météorologiques actuelles
- Prévisions horaires pour le reste de la journée
- Prévisions détaillées pour les 4 prochains jours
- Informations sur la température, les précipitations et la couverture nuageuse
- Compatibilité mobile optimisée
- Interface utilisateur responsive et intuitive

## Technologies utilisées

- HTML5, CSS3, JavaScript (ES6+)
- API Open-Meteo pour les données météorologiques
- API de géolocalisation du navigateur
- API Geocode.maps.co pour la conversion des coordonnées en noms de lieux
- API Nominatim d'OpenStreetMap pour la recherche de villes

## Utilisation

1. Clonez ce dépôt ou téléchargez les fichiers
2. Ouvrez simplement le fichier `index.html` dans votre navigateur

À l'ouverture de l'application, vous devrez autoriser l'accès à votre position géographique. Une fois accordé, l'application affichera automatiquement les conditions météorologiques actuelles et les prévisions horaires pour le reste de la journée.

Si vous préférez ne pas utiliser la géolocalisation ou si elle n'est pas disponible, vous pouvez utiliser la fonction de recherche par nom de ville.

Vous pouvez rafraîchir les données à tout moment en cliquant sur le bouton de rafraîchissement.

## Compatibilité mobile

L'application est conçue pour fonctionner sur tous les appareils, y compris les smartphones et tablettes. Des fonctionnalités spécifiques ont été implémentées pour améliorer l'expérience sur mobile :

- Interface adaptative
- Gestion améliorée des erreurs de géolocalisation
- Option de recherche par ville en fallback
- Temps d'attente optimisé pour les connexions mobiles

## Crédits

- Données météorologiques fournies par [Open-Meteo](https://open-meteo.com/)
- Icônes météorologiques créées spécifiquement pour ce projet

## Licence

MIT 