# Flight Simulator — 14-bis

Simulador de voo 3D feito com [Three.js](https://threejs.org/) como trabalho de Computação Gráfica. O jogador pilota o 14-bis, de Santos Dumont, sobre uma cidade e precisa passar pelos anéis de checkpoint na ordem, completando o percurso no menor tempo possível.

## Funcionalidades

- Modelo do 14-bis e cenário urbano em OBJ/MTL, com skybox e sombras dinâmicas
- Pista em curva Catmull-Rom com 14 checkpoints, que devem ser cruzados em ordem; o próximo anel fica em destaque
- Cronômetro, velocidade e contador de checkpoints no HUD
- Câmera de perseguição, câmera de cockpit e modo de inspeção do avião (com trackball)
- Música e efeitos sonoros

## Como executar

O projeto é estático e carrega o Three.js por CDN, então basta servir a pasta com qualquer servidor HTTP (abrir o arquivo direto pelo navegador não funciona por causa dos módulos ES):

```bash
python -m http.server 8000
```

Depois, acesse <http://localhost:8000/flightSim.html>, aguarde o carregamento e pressione **Enter** para começar.

> É necessário conexão com a internet para baixar o Three.js (r132) do jsDelivr.

## Controles

| Tecla | Ação |
| --- | --- |
| `Q` / `A` | Acelerar / desacelerar |
| `↑` / `↓` | Descer / subir (manche) |
| `←` / `→` | Virar à esquerda / direita |
| `C` | Alternar câmera de cockpit |
| `Espaço` | Alternar modo de inspeção do avião |
| `Enter` | Mostrar / ocultar a pista |
| `R` | Reiniciar a corrida |
| `H` | Mostrar / ocultar a ajuda |

O cronômetro começa ao cruzar o primeiro anel e para no último.

## Estrutura

```
flightSim.html    página de entrada (import map do Three.js)
flightSim.js      cena, câmeras, controles, HUD e lógica da corrida
track.js          pista e checkpoints
lib/              utilitários (renderer, HUD, teclado)
assets/           modelos, texturas, skybox e sons
```

## Autores

- Yagho Mattos
- Vitor Rossini Gonzalez
- Arthur Mazzi
