# Smart Delivery Router

Um sistema computacional focado em **Roteirização Inteligente de Delivery** e análise de fluxo logístico urbano, desenvolvido como projeto prático para a disciplina de Resolução de Problemas em Grafos na **Universidade de Fortaleza (UNIFOR)**.

**Autores:**
- Lara Stephanny Lima Gomes (Matrícula: 2410494)
- Matheus Martins da Costa Lima (Matrícula: 2417153)

O projeto utiliza conceitos avançados de estruturas de dados para modelar a malha viária autêntica do bairro Presidente Kennedy (Fortaleza-CE). Consumindo dados reais do OpenStreetMap, o sistema gerencia **mais de 100 cruzamentos (vértices) e vias de conexão (arestas)**, permitindo calcular rotas de entrega otimizadas e identificar gargalos na infraestrutura de tráfego.

---

## Arquitetura do Sistema

O projeto foi desenvolvido adotando uma arquitetura **Cliente-Servidor (Desacoplada)**, dividida em duas camadas principais:

1. **Back-end (Servidor - Node.js):**
   - Responsável pelo *parsing* dinâmico do arquivo XML geográfico (`map.osm`).
   - Contém a modelagem puramente Orientada a Objetos (POO) do Grafo.
   - Centraliza a execução dos algoritmos clássicos de **Dijkstra** e **BFS**.
   - Expõe os resultados analíticos e as rotas calculadas através de uma API REST local em formato JSON.

2. **Front-end (Cliente - Web/JS):**
   - Interface web moderna e responsiva construída com HTML, CSS e JavaScript Vanilla.
   - Consome a API do servidor via requisições assíncronas (`fetch`).
   - Utiliza a biblioteca **Leaflet** para renderizar o grafo de forma totalmente interativa sobre o mapa real, destacando as rotas precisas baseadas em latitude e longitude.

---

## Algoritmos & Análises Implementadas

Para cumprir os requisitos obrigatórios do edital, o sistema conta com:

* **Algoritmo de Dijkstra (Caminho Mínimo):** Recebe o ponto de partida (Hub logístico) e o destino (Cliente), calculando a rota mais rápida. O peso das arestas é a **distância real em metros** calculada pela fórmula de Haversine, respeitando rigorosamente o direcionamento das vias (ruas de mão única e dupla).
* **Busca em Largura (BFS):** Utilizada para delimitar a área de cobertura logística, determinando quais clientes estão a uma distância máxima de *N* cruzamentos a partir de um nó central.

### Análises Topológicas do Grafo:
1. **Cálculo de Grau dos Vértices:** Identifica os cruzamentos com maior número de conexões de entrada e saída (Hubs urbanos e potenciais gargalos).
2. **Existência de Ciclos (DFS):** Avalia a presença de rotas alternativas e quarteirões de retorno para garantir a resiliência do fluxo em caso de bloqueio de vias.
3. **Conectividade:** Analisa se o planejamento de mãos de trânsito não gerou "ilhas isoladas", impossibilitando o acesso de veículos a determinadas áreas.

---

## Tecnologias Utilizadas

- **Back-end:** Node.js, Express, fast-xml-parser
- **Front-end:** HTML5, CSS3, JavaScript
- **Visualização Cartográfica:** Leaflet.js
- **Base de Dados:** OpenStreetMap (.osm) estruturado via Lista de Adjacência

---

## Como Executar o Projeto

### Pré-requisitos
- Node.js (Versão 18 ou superior) instalada na máquina.
- Garantir que o arquivo extraído `map.osm` está localizado na pasta `back-end/` do projeto.

### Passo a Passo

1. **Clonar o Repositório e Instalar Dependências**

git clone https://github.com/LaraSLGomes/smart-delivery-router
cd smart-delivery-router/back-end
npm install


2. **Iniciar o Servidor e Construir o Grafo**

node server.js

O terminal exibirá o relatório de parsing comprovando a extração dos vértices e arestas reais da malha urbana.

3. **Acessar a Interface Gráfica**
Abra o seu navegador e acesse a porta liberada pelo servidor estático:
 http://localhost:3000

---

## 🗺️ Exportação de Dados Geográficos
O backend oferece rotas dedicadas para exportar a malha viária processada, permitindo a sua visualização em ferramentas GIS (Sistemas de Informação Geográfica) externas:
- **JSON Bruto:** http://localhost:3000/api/export?format=json
- **GeoJSON:** http://localhost:3000/api/export?format=geojson