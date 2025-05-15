# Ma Météo Locale

## Pourquoi cette appli ?

J'ai développé cette application pour avoir une app de météo **ultra simple et ultra rapide** (sans pub ou autre chose qui ralentit l'affichage). Car le matin je veux pouvoir en 1 clic savoir s'il va pleuvoir ou pas et les températures pour habiller mes filles avant l'école !

J'ai développé cette application avec de l'IA et tout ne s'est pas passé comme prévu 🤣, découvrez l'histoire dans [ce thread X](https://x.com/JeremyMouzin/status/1922972436665876982).

## Auteur

Jérémy Mouzin — Développeur web fullstack et entrepreneur
- [Mon site personnel](https://www.jeremymouzin.com)
- [Ma formation JavaScript](https://www.javascriptdezero.com)

## Design & UX

J'ai développé cette application avec l'objectif de fournir la meilleure expérience utilisateur possible :

- Détection automatique de la localisation de l'utilisateur via la fonction de géolocalisation
- Recherche manuelle de la ville si la géolocalisation n'est pas disponible
- Sauvegarde automatique de la dernière ville utilisée pour ne pas avoir à la taper / sélectionner la prochaine fois
- Option pour changer facilement de ville si besoin
- Prévisions des températures min/max du jour + s'il va pleuvoir ou pas
- Prévisions horaires pour le reste de la journée
- Prévisions détaillées pour les 4 prochains jours
- Interface responsive accessible depuis les mobiles
- Interface utilisateur intuitive

## Technologies utilisées

- HTML5, CSS3, JavaScript (ES6+)
- API [OpenMeteo](https://open-meteo.com/) pour les données météorologiques
- API de géolocalisation du navigateur
- API [Geocode.maps.co](https://geocode.maps.co/) pour la conversion des coordonnées GPS en noms de lieux
- API Nominatim d'OpenStreetMap pour la recherche de villes
- LocalStorage pour sauvegarder les préférences utilisateur

## Licence

MIT 