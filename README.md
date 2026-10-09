# Flight Simulator — 14-bis

Simulador de voo 3D feito com [Three.js](https://threejs.org/) como trabalho de Computação Gráfica. O jogador pilota o 14-bis, de Santos Dumont, sobre uma cidade e precisa passar pelos anéis de checkpoint na ordem, completando o percurso no menor tempo possível.

## Funcionalidades

- Modelo do 14-bis e cenário urbano em OBJ/MTL, com skybox e sombras dinâmicas
- Pista em curva Catmull-Rom com 14 checkpoints, que devem ser cruzados em ordem; o próximo anel fica em destaque
- Modelo de voo em que o avião vira inclinando as asas: quanto mais devagar, mais fechada a curva
- Prédios da cidade com colisão; ao bater, o avião reaparece no último anel cruzado
- Cronômetro, velocidade, acelerador e contador de checkpoints no HUD
- Câmera de perseguição, câmera de cockpit e modo de inspeção do avião (com trackball)
- Música e efeitos sonoros, com o som do motor acompanhando o acelerador

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
| `Q` / `A` | Abrir / fechar o acelerador |
| `↓` / `↑` | Levantar / baixar o nariz (manche: puxar sobe) |
| `←` / `→` | Inclinar as asas e virar à esquerda / direita |
| `C` | Alternar câmera de cockpit |
| `Espaço` | Alternar modo de inspeção do avião |
| `Enter` | Mostrar / ocultar a pista |
| `R` | Reiniciar a corrida |
| `H` | Mostrar / ocultar a ajuda |

O cronômetro começa ao cruzar o primeiro anel e para no último.

### Decolagem e voo

- O avião começa parado no solo. Abra o acelerador com `Q`, taxie até **24 km/h** e puxe o manche (`↓`) para decolar.
- No solo o avião vira como um carro, sem inclinar as asas; com o acelerador fechado ele freia até parar.
- No ar, `←` / `→` inclinam as asas e a inclinação faz a curva. Em velocidades baixas (30–40 km/h) as curvas são bem fechadas, o ideal para passar pelos anéis; em alta velocidade é preciso reduzir antes das curvas.
- A subida depende do nariz e da velocidade. Abaixo de 24 km/h não há sustentação: o nariz cai e o avião perde altitude.
- Bater em um prédio, ou tocar o chão rápido demais, é um acidente: depois de 1,5 s o avião reaparece no último anel cruzado, apontando para a pista. O cronômetro continua correndo.
- Perto do chão, a inclinação e o mergulho são limitados para que asas e nariz não toquem o solo.
- A física roda em passos fixos, então o comportamento é o mesmo com qualquer taxa de quadros.

## Estrutura

```
flightSim.html    página de entrada (import map do Three.js)
flightSim.js      cena, câmeras, HUD, corrida e integração com a física
flight.js         modelo de voo (sem dependência do Three.js)
terrain.js        mapa de alturas da cidade, usado nas colisões
track.js          pista e checkpoints
lib/              utilitários (renderer, HUD, teclado)
test/             testes do modelo de voo e do terreno
assets/           modelos, texturas, skybox e sons
```

## Testes

O modelo de voo e o mapa de alturas têm testes automatizados, executados com o Node.js (18 ou superior):

```bash
npm test
```

## Autores

- Yagho Mattos
- Vitor Rossini Gonzalez
- Arthur Mazzi
