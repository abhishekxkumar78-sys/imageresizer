---
title: "Comment redimensionner une image à 100 Ko en ligne sans l'envoyer sur un serveur"
slug: "comment-redimensionner-une-image-a-100-ko"
groupId: "how-to-resize-image-to-100-kb"
date: "2026-10-15"
author: "Équipe ImageResizer"
category: "Guides"
metaTitle: "Comment redimensionner une image à 100 Ko en ligne (sans upload)"
metaDescription: "Apprenez à réduire la taille d'une photo à 100 Ko directement dans votre navigateur. Guide pratique avec JPG sans téléversement vers des serveurs externes."
readingTime: "4"
---

Pour redimensionner une image à 100 Ko, ouvrez l'outil [Redimensionner une image](https://www.freeeimageresizer.com/fr/), choisissez JPG comme Format dans Sortie, saisissez 100 dans la case Target file size (optional), sélectionnez KB puis cliquez sur Traiter l'image. L'outil abaisse la qualité et, si besoin, la définition en pixels jusqu'à ce que le fichier soit proche de 100 Ko. Notre outil n'envoie pas vos photos sur un serveur.

De nombreux formulaires administratifs, concours ou sites d'inscription exigent de joindre une photo dont le poids ne dépasse pas une limite stricte, le plus souvent 100 Ko. Si votre fichier dépasse ce seuil, le système refuse le document. Les appareils photo des téléphones portables produisent couramment des images pesant plusieurs mégaoctets. Réduire ces fichiers à une fraction de leur poids d'origine est une démarche simple lorsque l'on applique les bonnes étapes.

## Pourquoi les formulaires imposent une limite de 100 Ko

Les portails administratifs fixent généralement des limites de taille pour maintenir sous contrôle l'espace de stockage de leurs bases de données et la rapidité d'affichage de leurs pages. Les administrateurs cherchent très probablement à permettre un examen fluide des dossiers sans consommer trop de ressources serveur. Puisque ces outils contrôlent uniquement le volume final du fichier en octets, votre objectif premier est simplement d'atteindre 100 Ko tout en conservant des visages, signatures et textes bien nets.

## Les étapes pour ajuster une image à 100 Ko

Voici comment parvenir au poids souhaité avec notre outil pour Redimensionner une image:

1. Rendez-vous sur l'outil Redimensionner une image et cliquez sur Sélectionner des images, ou glissez votre fichier dans la zone prévue.
2. Dans Sortie, sélectionnez JPG pour Format. Beaucoup de portails demandent du JPG, alors suivez les instructions de votre portail, car les systèmes d'envoi plus anciens peuvent refuser le WebP. Pour convertir en amont, utilisez notre outil [Convertir une image](https://www.freeeimageresizer.com/fr/convert).
3. Dans la section des réglages d'exportation, repérez le champ Target file size (optional). Saisissez 100 et conservez l'unité réglée sur KB.
4. Cliquez sur le bouton Traiter l'image. Le programme calculera les réglages nécessaires pour atteindre la cible demandée.
5. Vérifiez la taille obtenue à côté de l'aperçu, puis cliquez sur le bouton Télécharger pour enregistrer l'image sur votre appareil.


## Ce que nous avons mesuré

Lors d'un test réel sur ce site, nous avons traité une photo JPG de 4000×3000 pixels de 1 453 802 octets avec sortie JPG et Target file size (optional) réglé sur KB. L'outil compte 1 Ko pour 1 024 octets (comme les propriétés de fichier Windows), donc 200 Ko équivalent à 204 800 octets et 100 Ko à 102 400 octets:

- Cible de 20 Ko : 19 152 octets (18,7 Ko), avec l'image également réduite à 1216×912 pixels
- Cible de 50 Ko : 52 862 octets (51,6 Ko), avec l'image également réduite à 2662×1996 pixels
- Cible de 100 Ko : 100 609 octets (98,3 Ko)
- Cible de 200 Ko : 204 074 octets (199,3 Ko)

À 20 Ko et 50 Ko, baisser uniquement la qualité JPG ne suffisait pas pour compresser autant une photo de 4000×3000, si bien que l'outil a réduit les dimensions à 1216×912 et 2662×1996 pixels.

Sur l'ensemble de nos tests avec des photos JPG et WebP, le résultat allait de 12% en dessous à 6,8% au-dessus de la cible, donc si votre formulaire fixe un maximum strict, saisissez un chiffre légèrement inférieur à la limite et vérifiez la taille finale dans les propriétés du fichier.

Avec la même photo testée en sortie PNG et une cible de 100 Ko, le résultat a fini à 194 225 octets (189,7 Ko) avec l'image réduite à 392×294 pixels, car PNG ne peut pas baisser la qualité et ne change que la taille en pixels, donc choisissez JPG pour des envois compacts.
## Vérifiez les exigences de taille minimale

Certains formulaires n'imposent pas seulement un plafond, mais une fourchette complète, par exemple entre 20 Ko et 100 Ko. Si une photo est trop légère, la plateforme d'accueil risque de la refuser. Après le traitement, contrôlez le poids final affiché à côté de l'aperçu afin de vérifier qu'il se situe bien dans l'intervalle requis pour votre dossier. Une image déjà légère ne peut pas être agrandie pour atteindre un objectif supérieur. Si votre dossier exige un plafond plus serré de 50 Ko, consultez notre guide pour [réduire la taille d'une image à 50 Ko](https://www.freeeimageresizer.com/fr/blog/reduire-la-taille-d-une-image-a-50-ko).

## Le fonctionnement de l'ajustement automatique dans le code

Quand vous indiquez 100 avec l'unité KB, le script convertit cette valeur en une cible exacte de 102 400 octets. La suite du traitement dépend du format retenu.

Avec les formats avec perte comme JPG et WebP, l'algorithme teste plusieurs niveaux de compression successifs afin de se rapprocher du poids visé. Si le fichier demeure trop lourd même à basse qualité, l'outil réduit progressivement les dimensions en pixels du canevas pour se rapprocher de 100 Ko. Sur la version en anglais de notre [Compresseur d'images](https://www.freeeimageresizer.com/compress), vous pouvez aussi compresser un fichier PDF avec ce même champ de taille cible; les fichiers PDF fonctionnent actuellement uniquement sur cette page en anglais et sont convertis page par page en images, ce qui convient surtout aux documents numérisés ou contenant beaucoup d'images.

Le format PNG réagit différemment, car les navigateurs web ne proposent pas de curseur de compression pour le PNG. Le PNG est un format sans perte. Si vous appliquez une cible de 100 Ko sur un fichier PNG, le script ne peut pas jouer sur les couleurs; sa seule solution est de réduire la largeur et la hauteur en pixels. C'est pourquoi le format JPG offre un résultat visuel bien plus net quand vous devez respecter un seuil de 100 Ko pour une photo d'identité.

Si une photographie possède une texture particulièrement complexe, le résultat peut ne pas tomber exactement sur 100,0 Ko. Dans ce cas, l'algorithme sélectionne la version dont l'écart mathématique avec la cible est le plus faible et vous permet de la télécharger normalement.

## Que faire si l'image paraît trop floue

Compresser un cliché haute résolution pour atteindre 100 Ko oblige à supprimer des informations graphiques. Les détails très fins perdent inévitablement en précision. Si le résultat vous paraît trop doux, essayez deux solutions simples:

Recadrez les bordures superflues avant de redimensionner. Si vous préparez une photo d'identité ou un justificatif, utilisez d'abord notre outil pour [Recadrer une image](https://www.freeeimageresizer.com/fr/crop), enregistrez le fichier recadré et ouvrez-le dans le Redimensionneur. En supprimant l'arrière-plan inutile, vous diminuez le nombre total de pixels à traiter, ce qui permet à la zone essentielle de conserver plus de piqué dans les 100 Ko alloués.

Réduisez manuellement la définition en pixels. Si vous conservez une largeur originale de plusieurs milliers de pixels, la compression devra être très prononcée. En abaissant d'abord la largeur à une valeur raisonnable, par exemple 1000 pixels, l'image pourra être enregistrée avec un réglage de qualité supérieur.

## Traitement local dans le navigateur

Vos fichiers sont traités dans la mémoire vive locale grâce à la technologie standard de canevas du navigateur. Aucune image n'est envoyée vers des bases de données externes ni conservée sur des machines distantes. Pour découvrir l'ensemble des utilitaires disponibles sur notre site, vous pouvez consulter notre [guide de bienvenue](https://www.freeeimageresizer.com/fr/blog/bienvenue-sur-freeeimageresizer).

## Foire aux questions

### Comment redimensionner une image à 100 Ko ?

Ouvrez l'outil Redimensionner une image dans votre navigateur et chargez votre photo avec Sélectionner des images. Dans Sortie, réglez Format sur JPG. Tapez 100 dans Target file size (optional), gardez le menu sur KB et cliquez sur Traiter l'image. Contrôlez le poids près de l'aperçu, puis cliquez sur Télécharger.

### Pourquoi mon fichier pèse-t-il un peu plus ou un peu moins de 100 Ko ?

La taille cible est approximative car l'encodeur teste plusieurs paliers de qualité et d'échelle plutôt que de tronquer des octets au hasard. Lors de nos tests en JPG et WebP, les résultats allaient de 12% en dessous à 6,8% au-dessus de la cible, et 1 Ko égale 1 024 octets comme sous Windows.

### Quel format choisir pour un formulaire en ligne ?

Choisissez JPG dans la plupart des cas. Beaucoup de portails demandent du JPG, alors suivez les instructions de votre portail, car les systèmes d'envoi plus anciens peuvent refuser le WebP. Le format PNG ne permet pas de baisser la qualité de compression dans le navigateur et ne réduit le poids qu'en rétrécissant les pixels, alors que le JPG garde les visages nets près de 100 Ko.

### Ma photo est-elle envoyée sur un serveur ?

Non, notre outil n'envoie pas vos photos sur un serveur, car tout le redimensionnement et la compression se déroulent localement dans votre navigateur web.
