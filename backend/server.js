import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Grafo } from './Grafo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;

const nodes = [
    { id: '1', lat: -3.7180, lon: -38.5298, nome: 'Cruzamento 1' },
    { id: '2', lat: -3.7188, lon: -38.5274, nome: 'Cruzamento 2' },
    { id: '3', lat: -3.7211, lon: -38.5282, nome: 'Cruzamento 3' },
    { id: '4', lat: -3.7203, lon: -38.5310, nome: 'Cruzamento 4' },
    { id: '5', lat: -3.7172, lon: -38.5263, nome: 'Cruzamento 5' },
    { id: '6', lat: -3.7156, lon: -38.5295, nome: 'Cruzamento 6' },
    { id: '7', lat: -3.7138, lon: -38.5271, nome: 'Cruzamento 7' },
    { id: '8', lat: -3.7126, lon: -38.5299, nome: 'Cruzamento 8' },
    { id: '9', lat: -3.7140, lon: -38.5322, nome: 'Cruzamento 9' },
    { id: '10', lat: -3.7168, lon: -38.5340, nome: 'Cruzamento 10' },
    { id: '11', lat: -3.7185, lon: -38.5331, nome: 'Cruzamento 11' },
    { id: '12', lat: -3.7215, lon: -38.5265, nome: 'Cruzamento 12' }
];

const edges = [
    { origem: '1', destino: '2' },
    { origem: '2', destino: '3' },
    { origem: '3', destino: '4' },
    { origem: '4', destino: '5' },
    { origem: '5', destino: '2' },
    { origem: '2', destino: '6' },
    { origem: '6', destino: '7' },
    { origem: '7', destino: '8' },
    { origem: '8', destino: '5' },
    { origem: '4', destino: '9' },
    { origem: '9', destino: '10' },
    { origem: '10', destino: '11' },
    { origem: '11', destino: '4' },
    { origem: '3', destino: '12' },
    { origem: '12', destino: '7' }
];

const grafo = new Grafo();

nodes.forEach((node) => grafo.adicionarVertice(node.id, node.lat, node.lon));
edges.forEach((edge) => grafo.adicionarAresta(edge.origem, edge.destino));

app.use(express.static(path.resolve(__dirname, '../frontend')));

app.get('/api/map', (req, res) => {
    res.json({ nodes, edges });
});

app.get('/api/dijkstra', (req, res) => {
    const { origem, destino } = req.query;

    if (!origem || !destino) {
        return res.status(400).json({ error: 'Parâmetros origem e destino são obrigatórios.' });
    }

    if (!nodes.some((node) => node.id === origem) || !nodes.some((node) => node.id === destino)) {
        return res.status(404).json({ error: 'Cruzamento de origem ou destino não encontrado.' });
    }

    const resultado = grafo.calcularDijkstra(origem, destino);
    const caminhoCoords = resultado.caminho.map((id) => nodes.find((node) => node.id === id));

    res.json({
        origem,
        destino,
        caminho: resultado.caminho,
        caminhoCoords,
        distanciaTotal: resultado.distanciaTotal
    });
});

app.get('/api/bfs', (req, res) => {
    const { origem, limite = '3' } = req.query;
    const maxCruzamentos = Number(limite) || 3;

    if (!origem) {
        return res.status(400).json({ error: 'Parâmetro origem é obrigatório.' });
    }

    if (!nodes.some((node) => node.id === origem)) {
        return res.status(404).json({ error: 'Cruzamento de origem não encontrado.' });
    }

    const alcance = grafo.executarBFS(origem, maxCruzamentos).map((item) => ({
        ...item,
        coords: nodes.find((node) => node.id === item.vertice)
    }));

    res.json({ origem, limite: maxCruzamentos, alcance });
});

app.get('/api/analises', (req, res) => {
    res.json({
        graus: grafo.analisarGraus(),
        ciclos: grafo.detectarCiclos(),
        conectividade: grafo.verificarConectividade()
    });
});

app.get('/api/export', (req, res) => {
    const format = (req.query.format || 'json').toLowerCase();

    if (format === 'geojson') {
        const nodesFeatures = nodes.map((node) => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [node.lon, node.lat]
            },
            properties: {
                id: node.id,
                nome: node.nome,
                tipo: 'cruzamento'
            }
        }));

        const edgesFeatures = edges.map((edge, index) => {
            const origem = nodes.find((node) => node.id === edge.origem);
            const destino = nodes.find((node) => node.id === edge.destino);
            return {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [origem.lon, origem.lat],
                        [destino.lon, destino.lat]
                    ]
                },
                properties: {
                    id: `edge-${index + 1}`,
                    origem: edge.origem,
                    destino: edge.destino,
                    tipo: 'via'
                }
            };
        });

        return res.json({
            type: 'FeatureCollection',
            features: [...nodesFeatures, ...edgesFeatures]
        });
    }

    if (format === 'json') {
        return res.json({ nodes, edges });
    }

    return res.status(400).json({ error: 'Formato de exportação não suportado. Use json ou geojson.' });
});

app.get('/api/export/geojson', (req, res) => {
    return res.redirect('/api/export?format=geojson');
});

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/index.html'));
});

app.listen(port, () => {
    console.log(`Servidor Smart Delivery Router rodando em http://localhost:${port}`);
});
