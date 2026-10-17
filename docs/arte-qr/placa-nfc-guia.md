# Placa de mesa NFC — guia de gravação e montagem

## Endereço de cada chip

| Unidade | Gravar no chip (tipo URL) |
| --- | --- |
| Vert Franca | `https://institutovert.app/avaliar?u=franca&origem=nfc` |
| Vert Ribeirão Preto | `https://institutovert.app/avaliar?u=ribeirao-preto&origem=nfc` |

O `origem=nfc` faz os cliques aparecerem como "nfc" nos relatórios, separados do QR code (`origem=qr`).

## O que comprar

- **Adesivo NFC redondo de 25 a 30 mm, chip NTAG213, NTAG215 ou NTAG216** (qualquer um guarda o endereço acima). Um por placa.
- **Não cole sobre metal** (suporte ou base metálica): o sinal não passa. Se for inevitável, compre o adesivo "anti-metal" (com camada de ferrite).

## Como gravar (celular, ~2 minutos por chip)

1. Instale o app gratuito **NFC Tools** (Android ou iPhone).
2. Abra *Gravar* → *Adicionar um registro* → **URL/URI** → cole o endereço da unidade, com `https://` → *OK*.
3. Aproxime o celular do adesivo e toque em *Gravar*. Espere a confirmação.
4. **Teste:** feche o app e aproxime o celular do adesivo. Deve abrir a página "Como foi o seu atendimento?" da unidade certa.
5. Depois de testar, vá em *Outras ações* → **Bloquear tag** (somente leitura), para ninguém sobrescrever. **Isso é irreversível**, então só bloqueie depois de testar.

## Montagem

- Imprima a placa em A5, em papel couchê ou fotográfico, e coloque no suporte de acrílico A5.
- Cole o adesivo NFC **atrás do ícone de ondas**, no verso do papel, **com o centro a 74.0 mm da borda esquerda e 98.0 mm do topo** da folha (o círculo escuro tem 54 mm de diâmetro; o adesivo de 25–30 mm cabe inteiro).
- O NFC lê através de papel e acrílico, mas não através de metal. Teste de novo com a placa montada.

## Como o cliente usa

- **Android:** NFC ligado (quase sempre já vem ligado), tela desbloqueada, encostar o celular no ícone.
- **iPhone XS ou mais novo:** lê sozinho com a tela desbloqueada, sem abrir app. iPhones mais antigos (7, 8 e X) não leem sozinhos; para eles, e para celulares sem NFC, o QR code da placa cobre o caso.
