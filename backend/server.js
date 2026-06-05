import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { XMLParser } from 'fast-xml-parser';
import { Grafo } from './Grafo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;

const grafo = new Grafo();
let nodes = [];
let edges = [];

// Lê o arquivo map.osm OpenStreetMap
function carregarOSM() {
    const caminhoOSM = path.resolve(__dirname, 'map.osm');
    
    if (!fs.existsSync(caminhoOSM)) {
        console.error("ERRO: O arquivo map.osm não está na mesma pasta do server.js!");
        return;
    }

    const xmlData = fs.readFileSync(caminhoOSM, 'utf8');
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
    const parsed = parser.parse(xmlData);

    const osmNodes = parsed.osm.node || [];
    const osmWays = parsed.osm.way || [];

    osmNodes.forEach(n => {
        if (n.id && n.lat && n.lon) {
            nodes.push({ id: n.id, lat: parseFloat(n.lat), lon: parseFloat(n.lon), nome: `Cruzamento ${n.id.slice(-4)}` });
            grafo.adicionarVertice(n.id, parseFloat(n.lat), parseFloat(n.lon));
        }
    });

    osmWays.forEach(w => {
        let ehRua = false;
        let maoUnica = false;
        
        const tags = Array.isArray(w.tag) ? w.tag : [w.tag];
        tags.forEach(t => {
            if (t && t.k === 'highway') ehRua = true;
            if (t && t.k === 'oneway' && t.v === 'yes') maoUnica = true;
        });

        if (ehRua && w.nd && w.nd.length > 1) {
            for (let i = 0; i < w.nd.length - 1; i++) {
                const origem = w.nd[i].ref;
                const destino = w.nd[i+1].ref;
                
                edges.push({ origem, destino });
                grafo.adicionarAresta(origem, destino);

                if (!maoUnica) {
                    edges.push({ origem: destino, destino: origem });
                    grafo.adicionarAresta(destino, origem);
                }
            }
        }
    });
    console.log(`Malha viária carregada: ${nodes.length} vértices e ${edges.length} arestas processadas.`);
}

carregarOSM();

app.use(express.static(path.resolve(__dirname, '../frontend')));

app.get('/api/map', (req, res) => res.json({ nodes, edges }));

app.get('/api/dijkstra', (req, res) => {
    const { origem, destino } = req.query;
    if (!origem || !destino) return res.status(400).json({ error: 'Origem e destino são obrigatórios.' });

    const resultado = grafo.calcularDijkstra(origem, destino);
    const caminhoCoords = resultado.caminho.map(id => nodes.find(n => n.id === id));
    res.json({ origem, destino, caminho: resultado.caminho, caminhoCoords, distanciaTotal: resultado.distanciaTotal });
});

app.get('/api/bfs', (req, res) => {
    const { origem, limite = '3' } = req.query;
    if (!origem) return res.status(400).json({ error: 'Origem obrigatória.' });

    const alcance = grafo.executarBFS(origem, Number(limite)).map(item => ({
        ...item, coords: nodes.find(n => n.id === item.vertice)
    }));
    res.json({ origem, limite, alcance });
});

app.get('/api/analises', (req, res) => {
    res.json({ graus: grafo.analisarGraus(), ciclos: grafo.detectarCiclos(), conectividade: grafo.verificarConectividade() });
});

app.get('/api/export', (req, res) => {
    const format = (req.query.format || 'json').toLowerCase();
    if (format === 'geojson') {
        const nodesFeatures = nodes.map(n => ({
            type: 'Feature', geometry: { type: 'Point', coordinates: [n.lon, n.lat] },
            properties: { id: n.id, nome: n.nome, tipo: 'cruzamento' }
        }));
        const edgesFeatures = edges.map((e, i) => {
            const o = nodes.find(n => n.id === e.origem);
            const d = nodes.find(n => n.id === e.destino);
            return {
                type: 'Feature', geometry: { type: 'LineString', coordinates: [[o.lon, o.lat], [d.lon, d.lat]] },
                properties: { id: `edge-${i}`, origem: e.origem, destino: e.destino, tipo: 'via' }
            };
        });
        return res.json({ type: 'FeatureCollection', features: [...nodesFeatures, ...edgesFeatures] });
    }
    return res.json({ nodes, edges });
});

app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, '../frontend/index.html')));

app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));