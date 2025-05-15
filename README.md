# Ma Météo Locale

Une application web simple pour consulter la météo locale en temps réel, basée sur la localisation de l'utilisateur.

## Fonctionnalités

- Détection automatique de la localisation de l'utilisateur
- Recherche manuelle de ville si la géolocalisation n'est pas disponible
- Sauvegarde automatique de la dernière ville consultée
- Option pour changer facilement de ville
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
- LocalStorage pour sauvegarder les préférences utilisateur

## Utilisation

1. Clonez ce dépôt ou téléchargez les fichiers
2. Ouvrez simplement le fichier `index.html` dans votre navigateur

À l'ouverture de l'application, elle vérifie d'abord si vous avez une ville sauvegardée lors d'une précédente visite. Si c'est le cas, elle affiche directement la météo pour cette ville. Sinon, elle vous demande l'autorisation d'accéder à votre position géographique.

Une fois l'autorisation accordée, l'application affiche automatiquement les conditions météorologiques actuelles et les prévisions horaires pour le reste de la journée à votre position.

### Changer de ville

Vous pouvez à tout moment :
- Cliquer sur l'icône de localisation à côté du nom de la ville pour changer de ville
- Utiliser le formulaire pour rechercher une nouvelle ville
- Revenir à votre position actuelle en cliquant sur "Utiliser ma position actuelle"

Votre dernière sélection est automatiquement sauvegardée pour votre prochaine visite.

### Rafraîchir les données

Vous pouvez rafraîchir les données à tout moment en cliquant sur le bouton de rafraîchissement.

## Compatibilité mobile

L'application est conçue pour fonctionner sur tous les appareils, y compris les smartphones et tablettes. Des fonctionnalités spécifiques ont été implémentées pour améliorer l'expérience sur mobile :

- Interface adaptative
- Gestion améliorée des erreurs de géolocalisation
- Option de recherche par ville en fallback
- Temps d'attente optimisé pour les connexions mobiles
- Sauvegarde de la ville pour un chargement rapide lors des visites ultérieures

## Crédits

- Données météorologiques fournies par [Open-Meteo](https://open-meteo.com/)
- Icônes météorologiques créées spécifiquement pour ce projet

## Licence

MIT 