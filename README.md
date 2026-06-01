# Smart Delivery Router

Um sistema computacional focado em **Roteirização Inteligente de Delivery** e análise de fluxo logístico urbano, desenvolvido como projeto prático para a disciplina de Grafos na **Universidade de Fortaleza (UNIFOR)**.

O projeto utiliza conceitos avançados de estruturas de dados para modelar a malha viária de uma região urbana, contendo **mais de 100 cruzamentos (vértices) e 100 vias de conexão (arestas)**, permitindo calcular rotas de entrega otimizadas em tempo real e identificar gargalos na infraestrutura de tráfego.

---

## Arquitetura do Sistema

O projeto foi desenvolvido adotando uma arquitetura **Cliente-Servidor (Desacoplada)**, dividida em duas camadas principais:

1. **Back-end (Servidor - Node.js):** - Responsável pela leitura e processamento da base de dados do mapa.
   - Contém a modelagem puramente Orientada a Objetos (POO) do Grafo.
   - Centraliza a execução dos algoritmos clássicos de **Dijkstra** e **BFS**.
   - Expõe os resultados analíticos e as rotas calculadas através de uma API REST local em formato JSON.

2. **Front-end (Cliente - Web/JS):**
   - Uma interface web moderna e responsiva construída com HTML, CSS e JavaScript.
   - Consome a API do servidor via requisições assíncronas (`fetch`).
   - Utiliza a biblioteca **Vis.js** para renderizar o grafo de forma totalmente interativa e visual, destacando o caminho mínimo calculado na tela.

---

## Algoritmos & Análises Implementadas

Para cumprir os requisitos obrigatórios do projeto, o sistema conta com:

* **Algoritmo de Dijkstra (Caminho Mínimo):** Recebe o ponto de partida (ex: Centro de Distribuição) e o destino (Cliente), calculando a rota mais rápida ponderada pela distância/tempo, respeitando o direcionamento de vias (ruas de mão única).
* **Busca em Largura (BFS):** Utilizada para delimitar raios de proximidade geográfica, determinando quais clientes ou pontos de interesse estão a uma distância máxima de "X cruzamentos" a partir de um nó central.

### Análises Topológicas do Grafo:
1. **Cálculo de Grau dos Vértices:** Identifica os cruzamentos com maior número de conexões de entrada e saída (Hubs urbanos/avenidas principais).
2. **Existência de Ciclos:** Avalia a presença de rotas alternativas e retornos na cidade para garantir a resiliência do fluxo em caso de bloqueio de vias.
3. **Conectividade Parcial / Forte Conectividade:** Analisa se o planejamento de mãos de trânsito não isolou nenhuma região ou quarteirão do restante do mapa.

---

## Tecnologias Utilizadas

- **Back-end:** Node.js (JavaScript)
- **Front-end:** HTML, CSS, JavaScript
- **Visualização:** Vis.js 
- **Modelagem de Dados:** JSON / Lista de Adjacência

---

## Como Executar o Projeto

### Pré-requisitos
Antes de começar, você vai precisar ter instalado em sua máquina:
- [Node.js](https://nodejs.org/en/) (Versão 18 ou superior)

### 1. Clonar o Repositório
```bash
git clone [https://github.com/SEU-USUARIO/smart-delivery-router.git](https://github.com/SEU-USUARIO/smart-delivery-router.git)
cd smart-delivery-router
