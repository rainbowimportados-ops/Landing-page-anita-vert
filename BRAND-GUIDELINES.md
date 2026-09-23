# Instituto Vert — critérios de aplicação e auditoria

Data: 23/09/2026. Escopo: cartão /, landing /agendar, componentes de cabeçalho/hero/rodapé, modal de contato, metadados, ícones e controles de marca dos painéis /admin e /config. Base analisada: PR #24 e código de main. Não é uma auditoria de todos os fluxos funcionais ou dos conteúdos de campanhas enviados ao CMS.

## Fontes oficiais

Os quatro JPEGs recebidos são idênticos byte a byte aos arquivos históricos em assets. A pasta public/assets/brand-official contém cópias integrais, sem processamento. manifest.json registra SHA-256.

| Original | Aplicação |
|---|---|
| circular-light.jpeg | Circular clara sobre marrom; selo em área reservada; marca d'água |
| circular-dark.jpeg | Circular escura sobre fundo claro; modal e identificação em superfícies claras |
| stacked-light.jpeg | Assinatura em duas linhas; destaque com largura moderada |
| horizontal-light.jpeg | Assinatura de uma linha; cabeçalho e rodapé |

Não existe uma versão escrita escura entre os quatro arquivos. Em superfície clara, usar placa marrom para a escrita clara ou a circular escura. Nunca inverter cores para obter uma quinta versão.

## Regras de layout

- Arquivos intocados, escala uniforme. Enquadrar apenas margens excedentes do fundo original, preservando integralmente letras/círculo e respiro.
- Horizontal: caixa de 216–250 px no cabeçalho; desenho visível de aproximadamente 168–195 px. Rodapé: 240 px. Alinhamento à esquerda na landing para navegação previsível; centralizado no cartão de contato.
- Empilhada: caixa de 250–310 px, cerca de 128–159 px de altura. Não somar uma segunda assinatura escrita imediatamente ao lado.
- Circular: caixa de 136–180 px para selo; original escuro em modal claro. Ícones de navegador são uma exceção natural de tamanho, sem simplificar/redesenhar a marca.
- Respiro mínimo ao redor do desenho: 16 px no mobile / 24 px desktop, ajustável para não colidir com botões ou menus.
- Logo principal em opacidade integral; marca d'água decorativa entre 18% e 24%, sem atravessar texto, foto do rosto, CTA ou endereço.
- Não usar filtros, máscaras, cor herdada, sombras ou distorções nas imagens de marca.
- Não usar logo minúscula como rótulo do Instagram: ícone da plataforma + nome/perfil, em texto de interface normal.
- Nenhum logo é recriado com texto HTML. Menções editoriais ao nome da clínica continuam sendo texto normal.
- Texto de interface: meta de contraste 4,5:1 (texto normal), botões com área mínima interna de projeto de 44 px. São critérios de projeto, não certificação de acessibilidade.

## Achados e correções

1. Cartão: usava wordmarks derivados/recoloridos, selo transparente derivado, textura quase invisível e logo pequena em botão social. Corrigido para originais, selo com base própria, marca d'água em espaço reservado e rótulo de contato legível.
2. Landing: MarcaVert usava mask-image + currentColor, mudando a cor da marca ao rolar. Removido: componente agora renderiza JPEG original. Horizontal no cabeçalho, empilhada no hero, horizontal no rodapé.
3. Modais e painéis: escrita escura derivada e editores que permitiam trocar a marca ou descreviam fallback desenhado em código. Modal usa circular escura; uploads de logo removidos; foto continua editável.
4. Ícones/metadados: referenciavam derivados. Passam a apontar ao original circular. A imagem JPEG permanece intacta; conferir suporte específico de instalação PWA nos dispositivos antes de prometer resultado idêntico em todos os sistemas.
5. Legado: derivados antigos podem continuar no histórico/pasta, mas não estão referenciados nas superfícies públicas corrigidas. Não foram apagados destrutivamente.

## Pesquisa que orientou os critérios

- Nielsen Norman Group, Centered Logos Hurt Website Navigation: https://www.nngroup.com/articles/centered-logos/ — sustenta posição previsível no cabeçalho da landing, não impõe regra ao cartão de contato.
- W3C WAI, Designing for Web Accessibility: https://www.w3.org/WAI/tips/designing/ — contraste de texto e controles.
- W3C, Understanding Contrast Minimum: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum — logos têm exceção técnica; a decisão de projeto ainda é dar boa visibilidade.

## Validação

Executar npm run verify:brand e npm run build. Conferir visualmente cartão, landing, rodapés e modal; usar modelos em /revisao-marcas.html para comparar composições responsivas sem recriar arquivos de marca.
