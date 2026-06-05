const selectOrigem = document.getElementById('select-origem');
const selectDestino = document.getElementById('select-destino');
const inputLimite = document.getElementById('input-limite');
const btnCalcular = document.getElementById('btn-calcular');
const btnBFS = document.getElementById('btn-bfs');
const btnAnalises = document.getElementById('btn-analises');
const btnExport = document.getElementById('btn-export');
const btnLimpar = document.getElementById('btn-limpar');
const resultado = document.getElementById('resultado');
const statusBanner = document.getElementById('status-banner');
const analisesPanel = document.getElementById('analises-panel');

let map;
let nodeLayer;
let edgeLayer;
let routeLayer;
let coverageLayer;
let nodes = [];
let edges = [];
let servidorOnline = false;

const offlineData = {
    nodes: [
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
    ],
    edges: [
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
    ]
};

function criarMapa() {
    map = L.map('mapa-container').setView([-3.7185, -38.5295], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    nodeLayer = L.layerGroup().addTo(map);
    edgeLayer = L.layerGroup().addTo(map);
    routeLayer = L.layerGroup().addTo(map);
    coverageLayer = L.layerGroup().addTo(map);
}

function atualizarSeletores() {
    selectOrigem.innerHTML = '<option value="">Selecione um ponto de origem</option>';
    selectDestino.innerHTML = '<option value="">Selecione um destino</option>';

    nodes.forEach((node) => {
        const optionOrigem = document.createElement('option');
        optionOrigem.value = node.id;
        optionOrigem.textContent = `${node.id} — ${node.nome}`;
        selectOrigem.appendChild(optionOrigem);

        const optionDestino = document.createElement('option');
        optionDestino.value = node.id;
        optionDestino.textContent = `${node.id} — ${node.nome}`;
        selectDestino.appendChild(optionDestino);
    });
}

function desenharGrafo() {
    edgeLayer.clearLayers();
    nodeLayer.clearLayers();

    edges.forEach((edge) => {
        const origem = nodes.find((node) => node.id === edge.origem);
        const destino = nodes.find((node) => node.id === edge.destino);

        if (!origem || !destino) return;

        L.polyline([
            [origem.lat, origem.lon],
            [destino.lat, destino.lon]
        ], {
            color: '#94a3b8',
            weight: 2,
            opacity: 0.65
        }).addTo(edgeLayer);
    });

    nodes.forEach((node) => {
        L.circleMarker([node.lat, node.lon], {
            radius: 6,
            fillColor: '#ef4444',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        })
            .bindPopup(`<strong>${node.nome}</strong><br>ID: ${node.id}`)
            .addTo(nodeLayer);
    });
}

function showStatusBanner(message, type = 'info') {
    statusBanner.textContent = message;
    statusBanner.className = `status-banner ${type}`;
}

function hideStatusBanner() {
    statusBanner.className = 'status-banner hidden';
    statusBanner.textContent = '';
}

function mostrarResultado(html) {
    resultado.innerHTML = html;
    resultado.style.display = 'block';
}

function mostrarAnalises(html) {
    analisesPanel.innerHTML = html;
    analisesPanel.style.display = 'block';
}

function limparSobreposicoes() {
    routeLayer.clearLayers();
    coverageLayer.clearLayers();
}

function limparMapa() {
    limparSobreposicoes();
    resultado.style.display = 'none';
    hideStatusBanner();
}

function calcularHaversine(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(deltaPhi / 2) ** 2 +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function construirAdjacencia() {
    const adj = new Map();
    nodes.forEach((node) => adj.set(node.id, []));

    edges.forEach((edge) => {
        const origem = nodes.find((node) => node.id === edge.origem);
        const destino = nodes.find((node) => node.id === edge.destino);
        if (!origem || !destino) return;

        adj.get(edge.origem).push({
            destino: edge.destino,
            peso: calcularHaversine(origem.lat, origem.lon, destino.lat, destino.lon)
        });
    });

    return adj;
}

function calcularDijkstraLocal(origem, destino) {
    const adj = construirAdjacencia();
    const distancias = {};
    const antecessores = {};
    const naoVisitados = new Set();

    nodes.forEach((node) => {
        distancias[node.id] = Infinity;
        antecessores[node.id] = null;
        naoVisitados.add(node.id);
    });

    distancias[origem] = 0;

    while (naoVisitados.size > 0) {
        let u = null;
        naoVisitados.forEach((id) => {
            if (u === null || distancias[id] < distancias[u]) {
                u = id;
            }
        });

        if (u === null || distancias[u] === Infinity || u === destino) break;
        naoVisitados.delete(u);

        adj.get(u).forEach((aresta) => {
            if (!naoVisitados.has(aresta.destino)) return;
            const alt = distancias[u] + aresta.peso;
            if (alt < distancias[aresta.destino]) {
                distancias[aresta.destino] = alt;
                antecessores[aresta.destino] = u;
            }
        });
    }

    const caminho = [];
    let atual = destino;
    while (atual !== null) {
        caminho.unshift(atual);
        atual = antecessores[atual];
    }

    return {
        caminho: caminho[0] === origem ? caminho : [],
        distanciaTotal: distancias[destino] === Infinity ? -1 : distancias[destino]
    };
}

function executarBFSLocal(origem, limiteCruzamentos = 3) {
    const adj = construirAdjacencia();
    const visitados = new Set([origem]);
    const fila = [[origem, 0]];
    const alcance = [];

    while (fila.length > 0) {
        const [atual, nivel] = fila.shift();
        if (atual !== origem) {
            alcance.push({ vertice: atual, cruzamentosDistancia: nivel });
        }

        if (nivel < limiteCruzamentos) {
            adj.get(atual).forEach((aresta) => {
                if (!visitados.has(aresta.destino)) {
                    visitados.add(aresta.destino);
                    fila.push([aresta.destino, nivel + 1]);
                }
            });
        }
    }

    return alcance;
}

function analisarGrausLocal() {
    const relatorio = nodes.map((node) => {
        const grauSaida = edges.filter((edge) => edge.origem === node.id).length;
        const grauEntrada = edges.filter((edge) => edge.destino === node.id).length;
        return {
            Cruzamento_ID: node.id,
            Vias_Entrada: grauEntrada,
            Vias_Saida: grauSaida,
            Conexoes_Totais: grauEntrada + grauSaida
        };
    });

    return relatorio.sort((a, b) => b.Conexoes_Totais - a.Conexoes_Totais).slice(0, 5);
}

function detectarCiclosLocal() {
    const adj = construirAdjacencia();
    const visitados = new Set();
    const pilhaRecursao = new Set();

    const dfs = (nodeId) => {
        visitados.add(nodeId);
        pilhaRecursao.add(nodeId);

        for (const aresta of adj.get(nodeId)) {
            if (!visitados.has(aresta.destino)) {
                if (dfs(aresta.destino)) return true;
            } else if (pilhaRecursao.has(aresta.destino)) {
                return true;
            }
        }

        pilhaRecursao.delete(nodeId);
        return false;
    };

    return nodes.some((node) => {
        if (!visitados.has(node.id)) return dfs(node.id);
        return false;
    });
}

function verificarConectividadeLocal() {
    const primeiroNode = nodes[0]?.id;
    if (!primeiroNode) return 'Grafo vazio';

    const alcançados = executarBFSLocal(primeiroNode, Number.MAX_SAFE_INTEGER).length + 1;
    return alcançados === nodes.length
        ? `Forte Conectividade Detectada (${alcançados}/${nodes.length} cruzamentos integrados)`
        : `Conectividade Parcial (${alcançados}/${nodes.length} alcançáveis a partir do Hub principal)`;
}

async function carregarMapa() {
    try {
        const response = await fetch('api/map');
        if (!response.ok) throw new Error('API não disponível');
        const data = await response.json();
        nodes = data.nodes;
        edges = data.edges;
        servidorOnline = true;
        hideStatusBanner();
    } catch (error) {
        nodes = offlineData.nodes;
        edges = offlineData.edges;
        servidorOnline = false;
        showStatusBanner('Servidor backend indisponível. Usando dados estáticos locais para continuar o desenvolvimento.', 'warning');
    }

    atualizarSeletores();
    desenharGrafo();
}

async function obterAnalises() {
    if (servidorOnline) {
        try {
            const response = await fetch('api/analises');
            if (!response.ok) throw new Error('Falha na API de análises');
            const data = await response.json();
            mostrarAnalises(formatarAnalises(data.graus, data.ciclos, data.conectividade));
            return;
        } catch (error) {
            servidorOnline = false;
            showStatusBanner('Erro na API de análises. Alternando para modo offline.', 'warning');
        }
    }

    const graus = analisarGrausLocal();
    const ciclos = detectarCiclosLocal();
    const conectividade = verificarConectividadeLocal();
    mostrarAnalises(formatarAnalises(graus, ciclos, conectividade));
}

function formatarAnalises(graus, ciclos, conectividade) {
    return `
        <h3>Análises do Grafo</h3>
        <p><strong>Conectividade:</strong> ${conectividade}</p>
        <p><strong>Existem ciclos na malha viária?</strong> ${ciclos ? 'Sim' : 'Não'}</p>
        <p><strong>Top 5 cruzamentos mais conectados:</strong></p>
        <ul>${graus
            .map((item) => `<li>${item.Cruzamento_ID}: ${item.Conexoes_Totais} conexões (entrada ${item.Vias_Entrada}, saída ${item.Vias_Saida})</li>`)
            .join('')}</ul>
    `;
}

async function calcularRota() {
    limparSobreposicoes();

    const origem = selectOrigem.value;
    const destino = selectDestino.value;

    if (!origem || !destino) {
        mostrarResultado('<strong>Erro:</strong> selecione origem e destino.');
        return;
    }

    if (origem === destino) {
        mostrarResultado('<strong>Erro:</strong> origem e destino não podem ser iguais.');
        return;
    }

    if (servidorOnline) {
        try {
            const response = await fetch(`api/dijkstra?origem=${encodeURIComponent(origem)}&destino=${encodeURIComponent(destino)}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Falha no cálculo da rota');
            renderizarRota(data.caminhoCoords, data.caminho, data.distanciaTotal);
            return;
        } catch (error) {
            servidorOnline = false;
            showStatusBanner('Falha na API de rota. Alternando para modo offline.', 'warning');
        }
    }

    const resultadoLocal = calcularDijkstraLocal(origem, destino);
    if (!resultadoLocal.caminho.length) {
        mostrarResultado('<strong>Erro:</strong> não foi possível encontrar rota entre os cruzamentos selecionados.');
        return;
    }

    const caminhoCoords = resultadoLocal.caminho.map((id) => nodes.find((node) => node.id === id));
    renderizarRota(caminhoCoords, resultadoLocal.caminho, resultadoLocal.distanciaTotal);
}

function renderizarRota(caminhoCoords, caminho, distanciaTotal) {
    const coordenadas = caminhoCoords.map((node) => [node.lat, node.lon]);
    L.polyline(coordenadas, { color: '#16a34a', weight: 5, opacity: 0.85 }).addTo(routeLayer);

    caminhoCoords.forEach((node, index) => {
        L.circleMarker([node.lat, node.lon], {
            radius: 8,
            fillColor: '#0ea5e9',
            color: '#ffffff',
            weight: 2,
            fillOpacity: 1
        })
            .bindPopup(`<strong>${node.nome}</strong><br>Etapa ${index + 1}`)
            .addTo(routeLayer);
    });

    mostrarResultado(`
        <h3>Melhor Rota Encontrada</h3>
        <p><strong>Origem:</strong> ${caminho[0]}</p>
        <p><strong>Destino:</strong> ${caminho[caminho.length - 1]}</p>
        <p><strong>Distância total estimada:</strong> ${Math.round(distanciaTotal)} metros</p>
        <p><strong>Caminho:</strong> ${caminho.join(' → ')}</p>
    `);
}

async function exportarDados() {
    if (!servidorOnline) {
        showStatusBanner('Não é possível exportar agora. O servidor backend não está disponível.', 'warning');
        return;
    }

    try {
        const response = await fetch('api/export?format=geojson');
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Falha ao exportar dados');
        }

        const geojson = await response.json();
        const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'smart-delivery-router.geojson';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        showStatusBanner('Exportação de GeoJSON concluída. Verifique a pasta de downloads.', 'info');
    } catch (error) {
        showStatusBanner(error.message, 'warning');
    }
}

async function executarBFS() {
    limparSobreposicoes();

    const origem = selectOrigem.value;
    const limite = Number(inputLimite.value) || 3;

    if (!origem) {
        mostrarResultado('<strong>Erro:</strong> selecione um ponto de origem.');
        return;
    }

    let alcance = [];
    if (servidorOnline) {
        try {
            const response = await fetch(`api/bfs?origem=${encodeURIComponent(origem)}&limite=${limite}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Falha na API BFS');
            alcance = data.alcance;
        } catch (error) {
            servidorOnline = false;
            showStatusBanner('Falha na API de cobertura. Alternando para modo offline.', 'warning');
        }
    }

    if (!servidorOnline) {
        alcance = executarBFSLocal(origem, limite).map((item) => ({
            ...item,
            coords: nodes.find((node) => node.id === item.vertice)
        }));
    }

    if (!alcance.length) {
        mostrarResultado('<strong>Informação:</strong> nenhum cruzamento adicional foi encontrado dentro do limite especificado.');
        return;
    }

    alcance.forEach((item) => {
        const marker = L.circleMarker([item.coords.lat, item.coords.lon], {
            radius: 8,
            fillColor: '#0284c7',
            color: '#ffffff',
            weight: 2,
            fillOpacity: 0.9
        }).bindPopup(`<strong>${item.coords.nome}</strong><br>Distância em nós: ${item.cruzamentosDistancia}`);

        coverageLayer.addLayer(marker);
    });

    mostrarResultado(`
        <h3>Mapeamento de Cobertura (BFS)</h3>
        <p><strong>Origem:</strong> ${origem}</p>
        <p><strong>Limite:</strong> ${limite} cruzamentos</p>
        <p><strong>Cruzamentos dentro do raio:</strong> ${alcance.length}</p>
        <ul>${alcance.map((item) => `<li>${item.vertice} — ${item.coords.nome} (${item.cruzamentosDistancia} cruzamentos)</li>`).join('')}</ul>
    `);
}

btnCalcular.addEventListener('click', calcularRota);
btnBFS.addEventListener('click', executarBFS);
btnAnalises.addEventListener('click', obterAnalises);
btnExport.addEventListener('click', exportarDados);
btnLimpar.addEventListener('click', limparMapa);

window.addEventListener('load', async () => {
    criarMapa();
    await carregarMapa();
    await obterAnalises();
});
