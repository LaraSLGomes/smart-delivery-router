class Vertice {
    constructor(id, lat, lon) {
        this.id = id;
        this.lat = parseFloat(lat);
        this.lon = parseFloat(lon);
        this.nome = `Cruzamento ${id}`;
    }
}

class Aresta {
    #origem;
    #destino;
    #peso;

    constructor(origem, destino, peso) {
        this.#origem = origem;
        this.#destino = destino;
        this.#peso = Math.round(peso);
    }

    get origem() { return this.#origem; }
    get destino() { return this.#destino; }
    get peso() { return this.#peso; }
}

export class Grafo {
    constructor() {
        this.vertices = new Map();
        this.listaAdjacencia = new Map();
    }
    
    adicionarVertice(id, lat, lon) {
        if (!this.vertices.has(id)) {
            this.vertices.set(id, new Vertice(id, lat, lon));
            this.listaAdjacencia.set(id, []);
        }
    }

    calcularHaversine(lat1, lon1, lat2, lon2) {
        const R = 6371e3; 
        const phi1 = (lat1 * Math.PI) / 180;
        const phi2 = (lat2 * Math.PI) / 180;
        const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
        const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    }

    adicionarAresta(origemId, destinoId) {
        if (!this.vertices.has(origemId) || !this.vertices.has(destinoId)) return;
        const vOrigem = this.vertices.get(origemId);
        const vDestino = this.vertices.get(destinoId);
        const pesoMetros = this.calcularHaversine(vOrigem.lat, vOrigem.lon, vDestino.lat, vDestino.lon);
        this.listaAdjacencia.get(origemId).push(new Aresta(origemId, destinoId, pesoMetros));
    }

    calcularDijkstra(origem, destino) {
        const distancias = {};
        const antecessores = {};
        const naoVisitados = new Set();

        for (let vertexId of this.listaAdjacencia.keys()) {
            distancias[vertexId] = Infinity;
            antecessores[vertexId] = null;
            naoVisitados.add(vertexId);
        }
        distancias[origem] = 0;

        while (naoVisitados.size > 0) {
            let u = null;
            for (let v of naoVisitados) {
                if (u === null || distancias[v] < distancias[u]) u = v;
            }

            if (distancias[u] === Infinity || u === destino) break;
            naoVisitados.delete(u);

            const vizinhos = this.listaAdjacencia.get(u) || [];
            for (let aresta of vizinhos) {
                const v = aresta.destino;
                if (naoVisitados.has(v)) {
                    const alt = distancias[u] + aresta.peso;
                    if (alt < distancias[v]) {
                        distancias[v] = alt;
                        antecessores[v] = u;
                    }
                }
            }
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

    executarBFS(origem, limiteCruzamentos = 3) {
        const visitados = new Set();
        const fila = [[origem, 0]]; 
        const alcance = [];

        visitados.add(origem);

        while (fila.length > 0) {
            const [atual, nivel] = fila.shift();
            
            if (atual !== origem) { // Correção do erro de sintaxe aqui
                alcance.push({ vertice: atual, cruzamentosDistancia: nivel });
            }

            if (nivel < limiteCruzamentos) {
                const vizinhos = this.listaAdjacencia.get(atual) || [];
                for (let aresta of vizinhos) {
                    if (!visitados.has(aresta.destino)) {
                        visitados.add(aresta.destino);
                        fila.push([aresta.destino, nivel + 1]);
                    }
                }
            }
        }
        return alcance;
    }

    analisarGraus() {
        const relatorio = [];
        for (let [id, arestas] of this.listaAdjacencia.entries()) {
            const grauSaida = arestas.length;
            let grauEntrada = 0;
            for (let [_, todasArestas] of this.listaAdjacencia.entries()) {
                if (todasArestas.some(a => a.destino === id)) grauEntrada++;
            }
            relatorio.push({ Cruzamento_ID: id, Vias_Entrada: grauEntrada, Vias_Saida: grauSaida, Conexoes_Totais: grauEntrada + grauSaida });
        }
        return relatorio.sort((a, b) => b.Conexoes_Totais - a.Conexoes_Totais).slice(0, 5);
    }

    detectarCiclos() {
        const visitados = new Set();
        const pilhaRecursao = new Set();

        const dfs = (v) => {
            visitados.add(v);
            pilhaRecursao.add(v);
            const vizinhos = this.listaAdjacencia.get(v) || [];
            for (let aresta of vizinhos) {
                if (!visitados.has(aresta.destino)) {
                    if (dfs(aresta.destino)) return true;
                } else if (pilhaRecursao.has(aresta.destino)) {
                    return true; 
                }
            }
            pilhaRecursao.delete(v);
            return false;
        };

        for (let vertex of this.listaAdjacencia.keys()) {
            if (!visitados.has(vertex)) {
                if (dfs(vertex)) return true;
            }
        }
        return false;
    }

    verificarConectividade() {
        if (this.listaAdjacencia.size === 0) return "Grafo Vazio";
        const primeiroNode = this.listaAdjacencia.keys().next().value;
        const totalAlcancados = this.executarBFS(primeiroNode, Infinity).length + 1;
        return totalAlcancados === this.listaAdjacencia.size 
            ? "Forte Conectividade Detectada"
            : "Conectividade Parcial (Mão única isola vias)";
    }
}