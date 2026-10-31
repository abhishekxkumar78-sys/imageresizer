// Shared Media Internationalization & Limit Constants
// freeeimageresizer.com - Browser-only media tools

const MAX_AUDIO_MB = 50;
const MAX_AUDIO_MIN = 10; // Will be set from empirical measurements
const MAX_VIDEO_MB = 100;
const MAX_VIDEO_MIN = 5;

const MEDIA_I18N = {
  en: {
    dropzoneTitle: 'Drag & Drop your image or audio to convert format',
    selectAudioOrImage: 'Select Image or Audio',
    dropzoneFormats: 'Supported formats: Images (PNG, JPG, WebP, GIF, BMP, AVIF) & Audio (MP3, WAV, OGG, M4A, FLAC). Audio support depends on your browser. If a file does not load, try MP3 or WAV.',
    fileTooLargeAudio: 'File is too large. Maximum audio size is 50MB.',
    audioTooLong: 'Audio is too long. Maximum audio length is {maxMin} minutes.',
    audioDecodeError: 'Could not decode this audio file. The format may not be supported by your browser.',
    audioProcessError: 'An error occurred during audio conversion.',
    unsupportedFileType: 'This file type is not supported here. Please select an image or audio file.',
    webAudioNotSupported: 'Web Audio API is not supported by your browser.',
    webWorkerNotSupported: 'Web Workers are not supported by your browser.',
    decodingAudio: 'Decoding audio...',
    convertingAudio: 'Converting audio...',
    conversionCancelled: 'Conversion cancelled.',
    cancel: 'Cancel',
    originalAudio: 'Original Audio',
    targetFormat: 'Target Format',
    newSize: 'New Size',
    audioBitrate: 'Audio Bitrate',
    bitrateStandard: '128 kbps (Standard)',
    downloadAudio: 'Download Converted Audio',
    targetSizeEst: 'Estimated size: {estSize} (bitrate: {kbps} kbps)',
    targetSizeUnreachable: 'Target size is below minimum audio bitrate. Using 32 kbps as the closest possible result (estimated size: {estSize}).',
    targetSizeAchieved: 'Achieved size: {realSize} ({kbps} kbps)',
    targetSizeExceeded: 'Achieved size: {realSize} ({kbps} kbps). Note: slightly exceeds target due to audio frame structure.',
    wavNoTargetSize: 'Target size cannot be set for WAV because WAV uses uncompressed, fixed-size PCM audio.',
    licenseCreditLame: 'MP3 encoding by <a href="/licenses/lamejs-LICENSE.txt" target="_blank" rel="noopener">lamejs (LGPL-3.0)</a>'
  },
  es: {
    dropzoneTitle: 'Arrastra y suelta tu imagen o audio para convertir el formato',
    selectAudioOrImage: 'Seleccionar imagen o audio',
    dropzoneFormats: 'Formatos compatibles: Imágenes (PNG, JPG, WebP, GIF, BMP, AVIF) y audio (MP3, WAV, OGG, M4A, FLAC). La compatibilidad del audio depende de tu navegador. Si un archivo no se carga, prueba con MP3 o WAV.',
    fileTooLargeAudio: 'El archivo es demasiado grande. El tamaño máximo de audio es de 50MB.',
    audioTooLong: 'El audio es demasiado largo. La duración máxima es de {maxMin} minutos.',
    audioDecodeError: 'No se pudo decodificar este archivo de audio. Es posible que el formato no sea compatible con tu navegador.',
    audioProcessError: 'Ocurrió un error durante la conversión de audio.',
    unsupportedFileType: 'Este tipo de archivo no es compatible aquí. Por favor, selecciona un archivo de imagen o audio.',
    webAudioNotSupported: 'La API Web Audio no es compatible con tu navegador.',
    webWorkerNotSupported: 'Los Web Workers no son compatibles con tu navegador.',
    decodingAudio: 'Decodificando audio...',
    convertingAudio: 'Convirtiendo audio...',
    conversionCancelled: 'Conversión cancelada.',
    cancel: 'Cancelar',
    originalAudio: 'Audio original',
    targetFormat: 'Formato de destino',
    newSize: 'Nuevo tamaño',
    audioBitrate: 'Tasa de bits de audio',
    bitrateStandard: '128 kbps (Estándar)',
    downloadAudio: 'Descargar audio convertido',
    targetSizeEst: 'Tamaño estimado: {estSize} (tasa: {kbps} kbps)',
    targetSizeUnreachable: 'El tamaño objetivo está por debajo de la tasa de bits mínima. Usando 32 kbps como el resultado más cercano posible (tamaño estimado: {estSize}).',
    targetSizeAchieved: 'Tamaño obtenido: {realSize} ({kbps} kbps)',
    targetSizeExceeded: 'Tamaño obtenido: {realSize} ({kbps} kbps). Nota: excede ligeramente el objetivo debido a la estructura de tramas de audio.',
    wavNoTargetSize: 'No se puede establecer un tamaño objetivo para WAV porque WAV utiliza audio PCM sin comprimir de tamaño fijo.',
    licenseCreditLame: 'Codificación MP3 por <a href="/licenses/lamejs-LICENSE.txt" target="_blank" rel="noopener">lamejs (LGPL-3.0)</a>'
  },
  pt: {
    dropzoneTitle: 'Arraste e solte sua imagem ou áudio para converter o formato',
    selectAudioOrImage: 'Selecionar imagem ou áudio',
    dropzoneFormats: 'Formatos suportados: Imagens (PNG, JPG, WebP, GIF, BMP, AVIF) e áudio (MP3, WAV, OGG, M4A, FLAC). O suporte a áudio depende do seu navegador. Se um arquivo não carregar, tente MP3 ou WAV.',
    fileTooLargeAudio: 'O arquivo é muito grande. O tamanho máximo de áudio é de 50MB.',
    audioTooLong: 'O áudio é muito longo. A duração máxima é de {maxMin} minutos.',
    audioDecodeError: 'Não foi possível decodificar este arquivo de áudio. O formato pode não ser suportado pelo seu navegador.',
    audioProcessError: 'Ocorreu um erro durante a conversão do áudio.',
    unsupportedFileType: 'Este tipo de arquivo não é suportado aqui. Selecione um arquivo de imagem ou áudio.',
    webAudioNotSupported: 'A API Web Audio não é suportada pelo seu navegador.',
    webWorkerNotSupported: 'Web Workers não são suportados pelo seu navegador.',
    decodingAudio: 'Decodificando áudio...',
    convertingAudio: 'Convertendo áudio...',
    conversionCancelled: 'Conversão cancelada.',
    cancel: 'Cancelar',
    originalAudio: 'Áudio original',
    targetFormat: 'Formato de destino',
    newSize: 'Novo tamanho',
    audioBitrate: 'Taxa de bits do áudio',
    bitrateStandard: '128 kbps (Padrão)',
    downloadAudio: 'Baixar áudio convertido',
    targetSizeEst: 'Tamanho estimado: {estSize} (taxa: {kbps} kbps)',
    targetSizeUnreachable: 'O tamanho de destino está abaixo da taxa de bits mínima. Usando 32 kbps como o resultado mais próximo possível (tamanho estimado: {estSize}).',
    targetSizeAchieved: 'Tamanho obtido: {realSize} ({kbps} kbps)',
    targetSizeExceeded: 'Tamanho obtido: {realSize} ({kbps} kbps). Nota: excede ligeiramente o destino devido à estrutura de quadros de áudio.',
    wavNoTargetSize: 'Não é possível definir tamanho de destino para WAV porque o formato usa áudio PCM não comprimido de tamanho fixo.',
    licenseCreditLame: 'Codificação MP3 por <a href="/licenses/lamejs-LICENSE.txt" target="_blank" rel="noopener">lamejs (LGPL-3.0)</a>'
  },
  fr: {
    dropzoneTitle: 'Glissez-déposez votre image ou audio pour convertir le format',
    selectAudioOrImage: 'Sélectionner une image ou un audio',
    dropzoneFormats: 'Formats pris en charge : Images (PNG, JPG, WebP, GIF, BMP, AVIF) et audio (MP3, WAV, OGG, M4A, FLAC). La prise en charge de l\'audio dépend de votre navigateur. Si un fichier ne se charge pas, essayez MP3 ou WAV.',
    fileTooLargeAudio: 'Le fichier est trop volumineux. La taille maximale pour l\'audio est de 50 Mo.',
    audioTooLong: 'L\'audio est trop long. La durée maximale est de {maxMin} minutes.',
    audioDecodeError: 'Impossible de décoder ce fichier audio. Le format n\'est peut-être pas pris en charge par votre navigateur.',
    audioProcessError: 'Une erreur est survenue lors de la conversion audio.',
    unsupportedFileType: 'Ce type de fichier n\'est pas pris en charge ici. Veuillez sélectionner un fichier image ou audio.',
    webAudioNotSupported: 'L\'API Web Audio n\'est pas prise en charge par votre navigateur.',
    webWorkerNotSupported: 'Les Web Workers ne sont pas pris en charge par votre navigateur.',
    decodingAudio: 'Décodage de l\'audio en cours...',
    convertingAudio: 'Conversion de l\'audio en cours...',
    conversionCancelled: 'Conversion annulée.',
    cancel: 'Annuler',
    originalAudio: 'Audio d\'origine',
    targetFormat: 'Format cible',
    newSize: 'Nouvelle taille',
    audioBitrate: 'Débit binaire audio',
    bitrateStandard: '128 kbps (Standard)',
    downloadAudio: 'Télécharger l\'audio converti',
    targetSizeEst: 'Taille estimée : {estSize} (débit : {kbps} kbps)',
    targetSizeUnreachable: 'La taille cible est inférieure au débit audio minimal. Utilisation de 32 kbps comme résultat le plus proche possible (taille estimée : {estSize}).',
    targetSizeAchieved: 'Taille obtenue : {realSize} ({kbps} kbps)',
    targetSizeExceeded: 'Taille obtenue : {realSize} ({kbps} kbps). Remarque : dépasse légèrement la cible en raison de la structure des trames audio.',
    wavNoTargetSize: 'Impossible de définir une taille cible pour le format WAV, car le format WAV utilise un audio PCM non compressé à taille fixe.',
    licenseCreditLame: 'Encodage MP3 par <a href="/licenses/lamejs-LICENSE.txt" target="_blank" rel="noopener">lamejs (LGPL-3.0)</a>'
  },
  de: {
    dropzoneTitle: 'Ziehen Sie Ihr Bild oder Audio hierher, um das Format zu konvertieren',
    selectAudioOrImage: 'Bild oder Audiodatei auswählen',
    dropzoneFormats: 'Unterstützte Formate: Bilder (PNG, JPG, WebP, GIF, BMP, AVIF) & Audio (MP3, WAV, OGG, M4A, FLAC). Die Audio-Unterstützung hängt von Ihrem Browser ab. Wenn eine Datei nicht geladen wird, versuchen Sie es mit MP3 oder WAV.',
    fileTooLargeAudio: 'Die Datei ist zu groß. Die maximale Audiogröße beträgt 50MB.',
    audioTooLong: 'Das Audio ist zu lang. Die maximale Audiolänge beträgt {maxMin} Minuten.',
    audioDecodeError: 'Diese Audiodatei konnte nicht dekodiert werden. Das Format wird möglicherweise von Ihrem Browser nicht unterstützt.',
    audioProcessError: 'Beim Konvertieren des Audios ist ein Fehler aufgetreten.',
    unsupportedFileType: 'Dieser Dateityp wird hier nicht unterstützt. Bitte wählen Sie eine Bild- oder Audiodatei.',
    webAudioNotSupported: 'Die Web Audio API wird von Ihrem Browser nicht unterstützt.',
    webWorkerNotSupported: 'Web Worker werden von Ihrem Browser nicht unterstützt.',
    decodingAudio: 'Audio wird dekodiert...',
    convertingAudio: 'Audio wird konvertiert...',
    conversionCancelled: 'Konvertierung abgebrochen.',
    cancel: 'Abbrechen',
    originalAudio: 'Originales Audio',
    targetFormat: 'Zielformat',
    newSize: 'Neue Größe',
    audioBitrate: 'Audio-Bitrate',
    bitrateStandard: '128 kbps (Standard)',
    downloadAudio: 'Konvertiertes Audio herunterladen',
    targetSizeEst: 'Geschätzte Größe: {estSize} (Bitrate: {kbps} kbps)',
    targetSizeUnreachable: 'Die Zielgröße liegt unter der minimalen Audio-Bitrate. 32 kbps wird als das nächstgelegene Ergebnis verwendet (geschätzte Größe: {estSize}).',
    targetSizeAchieved: 'Erzielte Größe: {realSize} ({kbps} kbps)',
    targetSizeExceeded: 'Erzielte Größe: {realSize} ({kbps} kbps). Hinweis: übersteigt das Ziel aufgrund der Audio-Frame-Struktur leicht.',
    wavNoTargetSize: 'Die Zielgröße kann für WAV nicht festgelegt werden, da WAV unkomprimiertes PCM-Audio mit fester Größe verwendet.',
    licenseCreditLame: 'MP3-Kodierung durch <a href="/licenses/lamejs-LICENSE.txt" target="_blank" rel="noopener">lamejs (LGPL-3.0)</a>'
  },
  hi: {
    dropzoneTitle: 'फॉर्मेट बदलने के लिए इमेज या ऑडियो को यहाँ खींचें और छोड़ें',
    selectAudioOrImage: 'फोटो या ऑडियो चुनें',
    dropzoneFormats: 'समर्थित फॉर्मेट: इमेज (PNG, JPG, WebP, GIF, BMP, AVIF) और ऑडियो (MP3, WAV, OGG, M4A, FLAC)। ऑडियो सपोर्ट आपके ब्राउज़र पर निर्भर करता है। अगर कोई फाइल लोड न हो, तो MP3 या WAV आज़माएं।',
    fileTooLargeAudio: 'फाइल बहुत बड़ी है। अधिकतम ऑडियो साइज 50MB है।',
    audioTooLong: 'ऑडियो बहुत लंबा है। अधिकतम ऑडियो अवधि {maxMin} मिनट है।',
    audioDecodeError: 'इस ऑडियो फाइल को डिकोड नहीं किया जा सका। हो सकता है कि आपका ब्राउज़र इस फॉर्मेट का समर्थन न करता हो।',
    audioProcessError: 'ऑडियो कन्वर्शन के दौरान एक त्रुटि हुई।',
    unsupportedFileType: 'यह फ़ाइल प्रकार यहाँ समर्थित नहीं है। कृपया कोई छवि या ऑडियो फ़ाइल चुनें।',
    webAudioNotSupported: 'वेब ऑडियो API आपके ब्राउज़र द्वारा समर्थित नहीं है।',
    webWorkerNotSupported: 'वेब वर्कर्स आपके ब्राउज़र द्वारा समर्थित नहीं हैं।',
    decodingAudio: 'ऑडियो डिकोड हो रहा है...',
    convertingAudio: 'ऑडियो कन्वर्ट हो रहा है...',
    conversionCancelled: 'कन्वर्शन रद्द कर दिया गया।',
    cancel: 'रद्द करें',
    originalAudio: 'मूल ऑडियो',
    targetFormat: 'लक्षित फॉर्मेट',
    newSize: 'नया साइज',
    audioBitrate: 'ऑडियो बिटरेट',
    bitrateStandard: '128 kbps (मानक)',
    downloadAudio: 'कन्वर्ट किया गया ऑडियो डाउनलोड करें',
    targetSizeEst: 'अनुमानित साइज: {estSize} (बिटरेट: {kbps} kbps)',
    targetSizeUnreachable: 'लक्षित साइज न्यूनतम ऑडियो बिटरेट से कम है। 32 kbps का उपयोग निकटतम संभव परिणाम के रूप में किया जा रहा है (अनुमानित साइज: {estSize})।',
    targetSizeAchieved: 'प्राप्त साइज: {realSize} ({kbps} kbps)',
    targetSizeExceeded: 'प्राप्त साइज: {realSize} ({kbps} kbps)। ध्यान दें: ऑडियो फ्रेम संरचना के कारण लक्षित साइज से थोड़ा अधिक है।',
    wavNoTargetSize: 'WAV के लिए लक्षित साइज सेट नहीं किया जा सकता क्योंकि WAV अनकंप्रेस्ड, निश्चित आकार के PCM ऑडियो का उपयोग करता है।',
    licenseCreditLame: '<a href="/licenses/lamejs-LICENSE.txt" target="_blank" rel="noopener">lamejs (LGPL-3.0)</a> द्वारा MP3 एन्कोडिंग'
  },
  id: {
    dropzoneTitle: 'Tarik dan lepas gambar atau audio untuk mengubah format',
    selectAudioOrImage: 'Pilih gambar atau audio',
    dropzoneFormats: 'Format yang didukung: Gambar (PNG, JPG, WebP, GIF, BMP, AVIF) & Audio (MP3, WAV, OGG, M4A, FLAC). Dukungan audio bergantung pada browser Anda. Jika file tidak dapat dimuat, coba MP3 atau WAV.',
    fileTooLargeAudio: 'File terlalu besar. Ukuran maksimum audio adalah 50MB.',
    audioTooLong: 'Audio terlalu panjang. Durasi maksimum audio adalah {maxMin} menit.',
    audioDecodeError: 'Tidak dapat mendekode file audio ini. Format mungkin tidak didukung oleh browser Anda.',
    audioProcessError: 'Terjadi kesalahan saat mengonversi audio.',
    unsupportedFileType: 'Jenis file ini tidak didukung di sini. Silakan pilih file gambar atau audio.',
    webAudioNotSupported: 'Web Audio API tidak didukung oleh browser Anda.',
    webWorkerNotSupported: 'Web Worker tidak didukung oleh browser Anda.',
    decodingAudio: 'Mendekode audio...',
    convertingAudio: 'Mengonversi audio...',
    conversionCancelled: 'Konversi dibatalkan.',
    cancel: 'Batal',
    originalAudio: 'Audio asli',
    targetFormat: 'Format target',
    newSize: 'Ukuran baru',
    audioBitrate: 'Bitrate audio',
    bitrateStandard: '128 kbps (Standar)',
    downloadAudio: 'Unduh audio yang dikonversi',
    targetSizeEst: 'Perkiraan ukuran: {estSize} (bitrate: {kbps} kbps)',
    targetSizeUnreachable: 'Ukuran target berada di bawah bitrate audio minimum. Menggunakan 32 kbps sebagai hasil terdekat yang mungkin (perkiraan ukuran: {estSize}).',
    targetSizeAchieved: 'Ukuran tercapai: {realSize} ({kbps} kbps)',
    targetSizeExceeded: 'Ukuran tercapai: {realSize} ({kbps} kbps). Catatan: sedikit melebihi target karena struktur frame audio.',
    wavNoTargetSize: 'Ukuran file target tidak dapat diatur untuk WAV karena WAV menggunakan audio PCM ukuran tetap tanpa kompresi.',
    licenseCreditLame: 'Pengodean MP3 oleh <a href="/licenses/lamejs-LICENSE.txt" target="_blank" rel="noopener">lamejs (LGPL-3.0)</a>'
  }
};

function getMediaLang() {
  const langAttr = (document.documentElement && document.documentElement.lang) || 'en';
  const prefix = langAttr.toLowerCase().split('-')[0];
  return MEDIA_I18N[prefix] ? prefix : 'en';
}

function tMedia(key, params) {
  const lang = getMediaLang();
  let str = (MEDIA_I18N[lang] && MEDIA_I18N[lang][key]) || (MEDIA_I18N.en && MEDIA_I18N.en[key]) || key;
  if (params && typeof params === 'object') {
    Object.keys(params).forEach(k => {
      str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), params[k]);
    });
  }
  return str;
}

if (typeof window !== 'undefined') {
  window.MAX_AUDIO_MB = MAX_AUDIO_MB;
  window.MAX_AUDIO_MIN = MAX_AUDIO_MIN;
  window.MAX_VIDEO_MB = MAX_VIDEO_MB;
  window.MAX_VIDEO_MIN = MAX_VIDEO_MIN;
  window.MEDIA_I18N = MEDIA_I18N;
  window.getMediaLang = getMediaLang;
  window.tMedia = tMedia;
}
