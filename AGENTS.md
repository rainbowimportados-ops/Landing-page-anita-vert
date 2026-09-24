# Instituto Vert — identidade imutável

As quatro imagens em public/assets/brand-official são as únicas logos aprovadas pelo proprietário (23/09/2026). Seus hashes SHA-256 constam em manifest.json e são verificados antes de cada build.

- Nunca redesenhar, gerar com IA, substituir por fonte, recolorir, inverter, usar máscara CSS ou deformar logos.
- Nunca editar os arquivos originais. Não criar uma quinta versão.
- Usar MarcaVert no React e official-brand no HTML. brand.css controla apenas aplicação e escala proporcional.
- Os enquadramentos horizontal/empilhado escondem somente margens de fundo do JPEG, sem cortar letras, círculo ou área de respiro.
- Fundo claro: circular escura original. Marca escrita clara em fundo claro: placa marrom; não inventar versão escrita escura.
- Fundo escuro: versão clara original. Não aplicar filtros, sombras ou blend modes na imagem.
- Marca d'água: original circular, apenas opacidade (18–24%), sem rotação, sem corte do desenho e fora da leitura.
- Não permitir upload de logos pelo CMS; fotos e conteúdo continuam editáveis.
- Não publicar em produção sem instrução do proprietário. PR de revisão preserva a produção.

Consultar BRAND-GUIDELINES.md para critérios e histórico da auditoria.
