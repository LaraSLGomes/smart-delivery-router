const selectOrigem = document.getElementById('select-origem');
const selectDestino = document.getElementById('select-destino');
const inputLimite = document.getElementById('input-limite');
const resultado = document.getElementById('resultado');
const statusBanner = document.getElementById('status-banner');
const analisesPanel = document.getElementById('analises-panel');

let map, nodeLayer, edgeLayer, routeLayer, coverageLayer;
let nodes = [], edges = [];

function criarMapa() {
    map = L.map('mapa-container').setView([-3.7335, -38.5685], 15); // Coordenadas focadas no Pres. Kennedy
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    nodeLayer = L.layerGroup().addTo(map);
    edgeLayer = L.layerGroup().addTo(map);
    routeLayer = L.layerGroup().addTo(map);
    coverageLayer = L.layerGroup().addTo(map);
}

function atualizarSeletores() {
    selectOrigem.innerHTML = '<option value="">Origem (ID do Cruzamento)</option>';
    selectDestino.innerHTML = '<option value="">Destino (ID do Cruzamento)</option>';

    nodes.forEach(node => {
        selectOrigem.add(new Option(`${node.id} — ${node.nome}`, node.id));
        selectDestino.add(new Option(`${node.id} — ${node.nome}`, node.id));
    });
}

function desenharGrafo() {
    edgeLayer.clearLayers();
    nodeLayer.clearLayers();

    edges.forEach(edge => {
        const origem = nodes.find(n => n.id === edge.origem);
        const destino = nodes.find(n => n.id === edge.destino);
        if (origem && destino) {
            L.polyline([[origem.lat, origem.lon], [destino.lat, destino.lon]], { color: '#94a3b8', weight: 2, opacity: 0.65 }).addTo(edgeLayer);
        }
    });

    nodes.forEach(node => {
        L.circleMarker([node.lat, node.lon], { radius: 5, fillColor: '#ef4444', color: '#fff', weight: 1, fillOpacity: 0.9 })
            .bindPopup(`<strong>${node.nome}</strong><br>ID: ${node.id}`)
            .addTo(nodeLayer);
    });
}

function showStatusBanner(msg, type = 'info') {
    statusBanner.textContent = msg;
    statusBanner.className = `status-banner ${type}`;
}

async function carregarMapa() {
    try {
        const res = await fetch('/api/map');
        if (!res.ok) throw new Error('API offline');
        const data = await res.json();
        nodes = data.nodes;
        edges = data.edges;
        atualizarSeletores();
        desenharGrafo();
        showStatusBanner(`Mapa carregado: ${nodes.length} nós e ${edges.length} vias.`, 'info');
    } catch (e) {
        showStatusBanner('Erro ao conectar com o servidor Node.js.', 'warning');
    }
}

async function obterAnalises() {
    try {
        const res = await fetch('/api/analises');
        const data = await res.json();
        analisesPanel.style.display = 'block';
        analisesPanel.innerHTML = `
            <h3>Análises Topológicas</h3>
            <p><strong>Conectividade:</strong> ${data.conectividade}</p>
            <p><strong>Ciclos detectados:</strong> ${data.ciclos ? 'Sim' : 'Não'}</p>
            <p><strong>Hubs de Tráfego:</strong></p>
            <ul>${data.graus.map(g => `<li>Nó ${g.Cruzamento_ID}: ${g.Conexoes_Totais} vias</li>`).join('')}</ul>
        `;
    } catch (e) {
        console.error('Erro ao buscar análises');
    }
}

async function calcularRota() {
    routeLayer.clearLayers();
    coverageLayer.clearLayers();
    const origem = selectOrigem.value;
    const destino = selectDestino.value;

    if (!origem || !destino || origem === destino) return alert('Selecione origem e destino válidos.');

    try {
        const res = await fetch(`/api/dijkstra?origem=${origem}&destino=${destino}`);
        const data = await res.json();
        
        if (!data.caminho.length) return alert('Nenhuma rota encontrada (ruas na contramão bloqueiam o acesso).');

        const coords = data.caminhoCoords.map(n => [n.lat, n.lon]);
        L.polyline(coords, { color: '#16a34a', weight: 5, opacity: 0.9 }).addTo(routeLayer);
        
        resultado.style.display = 'block';
        resultado.innerHTML = `<strong>Distância percorrida:</strong> ${Math.round(data.distanciaTotal)} metros.`;
    } catch (e) {
        alert('Erro ao calcular rota.');
    }
}

async function executarBFS() {
    routeLayer.clearLayers();
    coverageLayer.clearLayers();
    const origem = selectOrigem.value;
    const limite = inputLimite.value;

    if (!origem) return alert('Selecione uma origem.');

    try {
        const res = await fetch(`/api/bfs?origem=${origem}&limite=${limite}`);
        const data = await res.json();
        
        data.alcance.forEach(item => {
            L.circleMarker([item.coords.lat, item.coords.lon], { radius: 7, fillColor: '#0284c7', color: '#fff', weight: 2, fillOpacity: 0.9 })
                .bindPopup(`Distância: ${item.cruzamentosDistancia} nós`)
                .addTo(coverageLayer);
        });
        
        resultado.style.display = 'block';
        resultado.innerHTML = `<strong>Cobertura:</strong> ${data.alcance.length} cruzamentos alcançados no raio.`;
    } catch (e) {
        alert('Erro ao mapear BFS.');
    }
}

document.getElementById('btn-calcular').addEventListener('click', calcularRota);
document.getElementById('btn-bfs').addEventListener('click', executarBFS);
document.getElementById('btn-analises').addEventListener('click', obterAnalises);
document.getElementById('btn-limpar').addEventListener('click', () => { routeLayer.clearLayers(); coverageLayer.clearLayers(); resultado.style.display='none'; });

window.addEventListener('load', () => {
    criarMapa();
    carregarMapa();
});