---
title: "Como redimensionar várias imagens ao mesmo tempo online sem fazer upload"
slug: "redimensionar-varias-imagens-ao-mesmo-tempo"
groupId: "resize-multiple-images-at-once"
date: "2026-10-21"
author: "Equipe ImageResizer"
category: "Guias"
metaTitle: "Como redimensionar várias imagens ao mesmo tempo online (em lote)"
metaDescription: "Aprenda a redimensionar várias imagens de uma vez diretamente no navegador. Aplique dimensões ou porcentagem em lote sem enviar arquivos a servidores."
readingTime: "4"
---

Quando você tem um conjunto de fotos de produtos, várias imagens para uma galeria de site ou múltiplos documentos digitalizados para uma inscrição, alterar o tamanho de cada arquivo um por um toma um tempo desnecessário. Repetir as mesmas ações para cada foto é cansativo. Uma ferramenta de redimensionamento em lote permite selecionar todas as imagens juntas, definir os ajustes uma única vez e aplicá-los a todo o conjunto.

Nosso [Redimensionador de imagens](https://www.freeeimageresizer.com/pt/) gratuito permite redimensionar várias fotos simultaneamente direto no seu navegador web. Você pode processar um lote de imagens no computador ou no celular sem enviar os arquivos para nenhum servidor externo.

## Passo a passo para redimensionar várias imagens em lote

Veja como ajustar as dimensões de várias fotos na mesma sessão:

1. Abra o [Redimensionador de imagens](https://www.freeeimageresizer.com/pt/) e clique no botão "Selecionar imagens", ou arraste vários arquivos diretamente para a área com a legenda "Arraste e solte suas imagens aqui". Na janela de seleção de arquivos do seu sistema, mantenha pressionada a tecla Shift ou Ctrl (Cmd no Mac) para escolher várias imagens ao mesmo tempo.
2. Uma lista com as fotos escolhidas surgirá na área de trabalho. Cada linha apresenta uma miniatura, o nome original do arquivo, o tamanho atual e um status inicial de "Ready".
3. Defina as opções no painel de configurações. Estes ajustes serão aplicados a todas as imagens carregadas na lista. Na primeira coluna ("Redimensionar"), escolha a opção em "Redimensionar por" ("Porcentagem" ou "Dimensões"), defina "Largura", "Altura" ou "Escala", selecione o "Modo de ajuste" e marque ou desmarque "Nunca ampliar". Na segunda coluna ("Saída"), configure "Formato", "Qualidade", "Cor de fundo", "Prefixo do nome do arquivo" ou o campo "Target file size (optional)". Não há opções individuais por arquivo.
4. Clique no botão "Processar imagem". A ferramenta processará os arquivos de forma sequencial, um após o outro. Durante a conversão, o status de cada linha muda de "Ready" para "Processing...", e depois para "Done", exibindo o novo tamanho do arquivo.
5. Quando o status de um arquivo mudar para Done, o ícone de download nessa linha fica ativo. Clique no ícone para salvar esse arquivo e repita o processo para cada imagem. Não existe download em pacote ZIP nem uma opção de baixar tudo com um único clique.

## Como lidar com imagens de formatos diferentes (vertical e horizontal)

Quando você carrega uma mistura de fotos horizontais (paisagem) e verticais (retrato), aplicar valores fixos de largura e altura exige atenção aos modos de enquadramento.

A ferramenta oferece três alternativas em "Modo de ajuste":

* **Ajustar (redimensionar sem cortar)** ajusta a foto para que caiba totalmente dentro do retângulo pretendido sem alterar a proporção original. Se a imagem não preencher todo o retângulo, o espaço restante é preenchido com a "Cor de fundo" selecionada.
* **Cobrir (cortar para preencher)** amplia ou reduz a imagem até preencher por completo o retângulo definido. As áreas que ultrapassarem os limites são recortadas a partir do centro.
* **Esticar (ignorar proporção)** força a foto a atingir exatamente a largura e a altura definidas, sem respeitar a proporção original, o que pode distorcer elementos e rostos.

Se você deseja que cada imagem preserve sua proporção natural sem cortes e sem margens coloridas, há dois caminhos práticos:

* **Informar apenas uma dimensão**: No modo "Dimensões", preencha um valor em "Largura" e deixe "Altura" totalmente em branco (ou preencha "Altura" e deixe "Largura" vazia). A ferramenta calcula a dimensão restante para cada imagem individualmente, com base na proporção original de cada arquivo.
* **Usar o modo de porcentagem**: Mude "Redimensionar por" para "Porcentagem" e regule o cursor de "Escala". Uma escala de 50% ajusta a largura e a altura de cada foto para metade do seu tamanho original, mantendo a proporção correta tanto em imagens horizontais quanto em verticais.

## Definir um tamanho de arquivo alvo para várias fotos

Se a sua tarefa exige que as imagens fiquem abaixo de um peso específico, como em formulários de candidatura ou exames, você pode preencher o campo "Target file size (optional)" e escolher "KB" ou "MB".

Ao definir um tamanho desejado, a ferramenta processa cada imagem individualmente. Faz ajustes graduais de compressão e resolução para aproximar cada arquivo o máximo possível do teto especificado. Se alguma imagem não conseguir atingir o valor desejado, a ferramenta entrega o resultado mais próximo alcançado.

Ao preparar imagens para plataformas governamentais, concursos ou registros acadêmicos, opte pelo formato JPG em "Formato". Vários sistemas institucionais não aceitam arquivos WebP, mesmo sendo muito práticos para a web. Para saber mais sobre como atingir metas concretas de tamanho, consulte nossos guias sobre [como redimensionar uma imagem para 100 KB](https://www.freeeimageresizer.com/pt/blog/como-redimensionar-imagem-para-100-kb) e [como reduzir o tamanho de uma imagem para 50 KB](https://www.freeeimageresizer.com/pt/blog/reduzir-tamanho-imagem-para-50-kb).

Caso escolha PNG como formato de saída, lembre-se de que os navegadores não suportam compressão com perdas para PNG. Por isso, a ferramenta só consegue reduzir o peso de arquivos PNG diminuindo as dimensões em pixels.

## Prefixo e nome dos arquivos salvos

Quando você baixa as imagens processadas, elas são salvas como novos arquivos no seu dispositivo. Os arquivos originais nunca são modificados nem substituídos.

Na segunda coluna ("Saída"), você pode utilizar o campo "Prefixo do nome do arquivo" (que traz o exemplo "ex: redimensionada"). Se digitar um prefixo como `web`, os arquivos serão salvos como `web-nomeoriginal.ext`. Se mantiver o campo vazio, cada arquivo manterá o seu nome original acompanhado da extensão correspondente ao formato escolhido (por exemplo, `foto.jpg` passa a `foto.webp` se escolheu WebP).

## Recomendações úteis para o processamento em lote

Guarde estas orientações práticas ao trabalhar com múltiplos arquivos:

* **Processamento sequencial**: As fotos são processadas uma após a outra para evitar picos de consumo de memória. Um lote com vinte fotos vai demorar mais tempo do que um com duas. Se o seu dispositivo parecer lento, experimente um lote menor.
* **Arquivos com falhas**: Se um arquivo específico estiver corrompido ou não puder ser lido, a linha correspondente exibirá "Error" e a ferramenta continuará o processamento dos demais elementos da lista.
* **Limpar a lista**: O botão "Limpar tudo" esvazia a lista e volta a exibir a área de envio. Não existe uma opção para remover uma única foto da lista; caso tenha adicionado um arquivo por engano, você pode clicar em "Limpar tudo" e recomeçar, ou simplesmente não baixar essa linha ao terminar.
* **Texto do tamanho de arquivo**: A área de envio apresenta o aviso "Tamanho máximo do arquivo: 50 MB."

## Outras ferramentas que aceitam múltiplos arquivos

O processamento com múltiplos arquivos diretamente no navegador está disponível no nosso [Redimensionador de imagens](https://www.freeeimageresizer.com/pt/) e na ferramenta [Imagem para PDF](https://www.freeeimageresizer.com/pt/image-to-pdf), que agrupa várias fotos em um único documento PDF. As demais ferramentas deste site, como Comprimir, Cortar, Converter e Marca d'água, foram criadas para trabalhar com um arquivo de cada vez.

## Suas imagens são processadas no seu navegador

O redimensionamento é feito diretamente no seu navegador com a tecnologia canvas, e nossa ferramenta não envia suas fotos para nenhum servidor. Para saber mais sobre o funcionamento do site, leia nosso [guia de boas-vindas](https://www.freeeimageresizer.com/pt/blog/bem-vindos-ao-freeeimageresizer).
