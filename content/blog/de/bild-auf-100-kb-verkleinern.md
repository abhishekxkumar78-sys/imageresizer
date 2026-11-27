---
title: "Bild auf 100 KB verkleinern online ohne Upload"
slug: "bild-auf-100-kb-verkleinern"
groupId: "how-to-resize-image-to-100-kb"
date: "2026-10-15"
author: "ImageResizer Team"
category: "Anleitungen"
metaTitle: "Bild auf 100 KB verkleinern online (ohne Server-Upload)"
metaDescription: "So verkleinern Sie Bilder direkt im Browser auf 100 KB. Schritt-für-Schritt-Anleitung für JPG ohne Upload auf fremde Server."
readingTime: "4"
---

Um ein Bild auf 100 KB zu verkleinern, öffnen Sie das Werkzeug für [Bildgröße ändern](https://www.freeeimageresizer.com/de/), wählen Sie unter Ausgabe JPG als Format, geben Sie 100 in das Feld Target file size (optional) ein, wählen Sie KB und klicken Sie auf Bild verarbeiten. Das Werkzeug senkt die Qualität und bei Bedarf die Pixelmaße, bis die Datei nahe bei 100 KB liegt. Unser Werkzeug lädt Ihre Bilder nicht auf einen Server hoch.

Viele behördliche Online-Portale, Bewerbungssysteme und Prüfungsämter fordern Passbilder oder Dokumentenscans mit einer festen Obergrenze, meist genau 100 KB. Liegt die Datei über dieser Grenze, bricht der Upload mit einer Fehlermeldung ab. Heutige Smartphone-Kameras erzeugen Fotos mit Dateigrößen von mehreren Megabyte. Um solche Dateien formgerecht einzureichen, müssen sie verkleinert werden.

## Warum Online-Formulare eine 100-KB-Grenze vorgeben

Websites mit Formularen setzen üblicherweise Begrenzungen für die Dateigröße, um den Speicherbedarf ihrer Datenbanken und die Ladezeiten der Seiten überschaubar zu halten. Sehr wahrscheinlich möchten die Betreiber sicherstellen, dass Anträge zügig geprüft werden können, ohne die Server unnötig zu belasten. Da diese Systeme ausschließlich das Endgewicht in Bytes prüfen, besteht Ihr Ziel schlicht darin, unter 100 KB zu bleiben und Gesichter, Unterschriften sowie Textzeilen gut lesbar zu halten.

## Schritte, um ein Bild auf 100 KB zu bringen

So verkleinern Sie Ihre Datei mit unserem kostenlosen Werkzeug für Bildgröße ändern:

1. Öffnen Sie das Werkzeug für Bildgröße ändern und klicken Sie auf Bilder auswählen oder ziehen Sie Ihr Bild in das vorgesehene Feld.
2. Stellen Sie unter Ausgabe das Format auf JPG. Viele Portale verlangen JPG; folgen Sie daher den Vorgaben Ihres Portals, da ältere Upload-Systeme WebP ablehnen können. Zum vorherigen Umwandeln hilft unser [Bildkonverter](https://www.freeeimageresizer.com/de/convert).
3. Scrollen Sie zu den Exporteinstellungen und tragen Sie im Feld Target file size (optional) den Wert 100 ein. Das Auswahlfeld daneben bleibt auf KB gestellt.
4. Klicken Sie auf die Schaltfläche Bild verarbeiten. Das Werkzeug ermittelt die nötigen Anpassungen, um die gewünschte Zielgröße zu erreichen.
5. Kontrollieren Sie die berechnete Dateigröße neben der Vorschau und klicken Sie auf die Schaltfläche Herunterladen, um das Bild auf Ihrem Gerät zu speichern.


## Was wir gemessen haben

In einem Praxistest auf dieser Website haben wir ein 4000×3000-Pixel-JPG-Foto mit 1.453.802 Bytes bei JPG-Ausgabe und Target file size (optional) in KB geprüft. Das Werkzeug rechnet 1 KB mit 1.024 Bytes (genauso wie die Windows-Dateieigenschaften), sodass 200 KB genau 204.800 Bytes und 100 KB genau 102.400 Bytes entsprechen:

- Zielwert 20 KB: 19.152 Bytes (18,7 KB), das Bild wurde zudem auf 1216×912 Pixel verkleinert
- Zielwert 50 KB: 52.862 Bytes (51,6 KB), das Bild wurde zudem auf 2662×1996 Pixel verkleinert
- Zielwert 100 KB: 100.609 Bytes (98,3 KB)
- Zielwert 200 KB: 204.074 Bytes (199,3 KB)

Bei 20 KB und 50 KB reichte das Absenken der JPG-Qualität allein nicht aus, um ein 4000×3000-Foto so weit zu schrumpfen, weshalb das Werkzeug die Maße zusätzlich auf 1216×912 und 2662×1996 Pixel verringerte.

In allen unseren Tests mit JPG- und WebP-Fotos lag das Ergebnis zwischen 12% unter und 6,8% über dem Zielwert. Hat Ihr Formular ein hartes Limit, geben Sie also einen etwas niedrigeren Wert ein und prüfen Sie das Endgewicht in den Dateieigenschaften.

Beim gleichen Foto mit PNG-Ausgabe und Ziel 100 KB endete die Datei bei 194.225 Bytes (189,7 KB) und 392×294 Pixeln, weil PNG die Qualität nicht senken kann und nur die Pixelgröße ändert, sodass JPG für kleine Formular-Uploads besser passt.
## Achten Sie auf Mindestgrößen

Einige Antragsformulare geben nicht nur einen Maximalwert, sondern eine vollständige Spanne vor, beispielsweise zwischen 20 KB und 100 KB. Fällt ein Bild zu klein aus, könnte das Zielsystem den Upload verweigern. Überprüfen Sie nach der Bearbeitung die exakte Kilobyte-Zahl neben der Vorschau, um sicherzugehen, dass Ihre Datei innerhalb des verlangten Rahmens liegt. Bereits kleine Bilder lassen sich nicht vergrößern, um ein höheres Ziel zu erreichen. Falls Ihr Portal strenger 50 KB verlangt, lesen Sie unsere Anleitung [Bildgröße auf 50 KB reduzieren](https://www.freeeimageresizer.com/de/blog/bildgroesse-auf-50-kb-reduzieren).

## Wie die Zielgrößen-Funktion im Code arbeitet

Wenn Sie 100 eingeben und KB als Einheit belassen, errechnet das Programm einen Zielwert von exakt 102.400 Bytes. Was danach passiert, hängt vom gewählten Format ab.

Bei verlustbehafteten Formaten wie JPG und WebP führt der Algorithmus mehrere Testläufe durch und passt die Qualitätsstufe schrittweise an, um die Zielgröße möglichst genau zu treffen. Reicht das Absenken der Qualität allein nicht aus, skaliert das Werkzeug zusätzlich die Pixelabmessungen der Arbeitsfläche herunter, bis die Dateigröße nahe bei 100 KB liegt. Auf der englischen Version unseres [Bildkomprimierers](https://www.freeeimageresizer.com/compress) können Sie auch eine PDF-Datei mit demselben Feld für die Zielgröße komprimieren; PDF-Dateien funktionieren derzeit nur auf dieser englischen Seite und werden Seite für Seite in Bilder umgewandelt, weshalb sie sich am besten für eingescannte oder bildlastige Dokumente eignet.

Beim Format PNG verhält sich das System anders. Webbrowser bieten für PNG keine einstellbare Qualitätsstufe, da PNG ein verlustfreies Format ist. Wenn Sie PNG mit einem Ziel von 100 KB wählen, kann das Programm die Farbkompression nicht regeln; es kann die Dateigröße nur verringern, indem es Breite und Höhe in Pixeln reduziert. Aus diesem Grund liefert JPG bei einer Zielgröße von 100 KB für ein Passfoto oder Dokument eine spürbar bessere Schärfe.

Enthält ein Foto sehr feine Texturen, trifft das Ergebnis eventuell nicht aufs Komma genau 100,0 KB. In solchen Fällen wählt das Programm automatisch jene Variante aus, deren Byte-Zahl am dichtesten an der Vorgabe liegt, und stellt den Download ohne Fehlermeldung bereit.

## Was tun, wenn das Bild unscharf wirkt

Ein hochauflösendes Foto auf 100 KB herunterzurechnen bedeutet, dass Bildinformationen verworfen werden müssen. Sehr feine Strukturen verlieren dabei an Schärfe. Sollte das Endresultat zu weich wirken, helfen zwei einfache Anpassungen:

Schneiden Sie unnötige Ränder vorab ab. Wenn Sie ein Passbild oder einen Beleg vorbereiten, nutzen Sie zunächst unser Werkzeug für [Bild zuschneiden](https://www.freeeimageresizer.com/de/crop), speichern Sie die zugeschnittene Datei und öffnen Sie sie im Bildverkleinerer. Durch das Entfernen überflüssiger Hintergrundflächen müssen weniger Pixel komprimiert werden, wodurch der Hauptbereich des Fotos mehr Schärfe behält.

Passen Sie die Pixelmaße manuell an. Wenn Sie die ursprüngliche Breite von mehreren tausend Pixeln beibehalten, muss der Kompressor sehr stark eingreifen. Reduzieren Sie die Breite vorab beispielsweise auf 1000 Pixel, kann das Bild mit einer höheren Qualitätseinstellung gespeichert werden.

## Lokale Verarbeitung im Browser

Ihre Dateien werden im lokalen Arbeitsspeicher Ihres Browsers über die standardmäßige Canvas-Technologie verarbeitet. Es werden keine Bilder an externe Datenbanken übermittelt oder auf fremden Servern gespeichert. Wenn Sie mehr über alle Werkzeuge auf dieser Website erfahren möchten, werfen Sie einen Blick in unseren [Einführungsartikel](https://www.freeeimageresizer.com/de/blog/willkommen-bei-freeeimageresizer).

## Häufig gestellte Fragen

### Wie verkleinere ich ein Bild auf 100 KB?

Öffnen Sie das Werkzeug Bildgröße ändern im Browser und laden Sie das Foto über Bilder auswählen. Stellen Sie unter Ausgabe das Format auf JPG. Tippen Sie 100 in Target file size (optional), lassen Sie das Auswahlfeld auf KB und klicken Sie auf Bild verarbeiten. Prüfen Sie den Wert neben der Vorschau und klicken Sie auf Herunterladen.

### Warum liegt meine Datei etwas über oder unter 100 KB?

Die Zielgröße ist ein Näherungswert, da der Encoder Qualitätsstufen und Pixelschritte testet statt Bytes beliebig abzuschneiden. In unseren JPG- und WebP-Tests reichten die Resultate von 12% unter bis 6,8% über dem Ziel, und 1 KB entspricht 1.024 Bytes wie in den Windows-Dateieigenschaften.

### Welches Format sollte ich für ein Formular wählen?

Wählen Sie meist JPG. Viele Portale verlangen JPG; folgen Sie daher den Vorgaben Ihres Portals, da ältere Upload-Systeme WebP ablehnen können. PNG kann im Browser keine Kompressionsqualität senken und verkleinert Dateien nur über die Pixelmaße, während JPG Gesichter nahe 100 KB klarer hält.

### Wird mein Foto auf einen Server hochgeladen?

Nein, unser Werkzeug lädt Ihre Bilder nicht auf einen Server hoch, denn jede Anpassung und Komprimierung läuft direkt in Ihrem Webbrowser ab.
