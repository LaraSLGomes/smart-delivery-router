import { Grafo } from './Grafo.js';

describe('Suite de Testes - Algoritmos do Grafo (Logística Urbana)', () => {
    let grafo;

    // O beforeEach executa antes de CADA teste, garantindo um grafo "limpo"
    beforeEach(() => {
        grafo = new Grafo();

        // ARRANGE (Preparação): Criando um cenário de teste controlado
        // Coordenadas geográficas forjadas para testar o Haversine
        
        // Ponto Central (Origem)
        grafo.adicionarVertice('A', 0.00, 0.00); 
        
        // ROTA 1: Reta e Curta
        grafo.adicionarVertice('B', 0.01, 0.00); 
        grafo.adicionarVertice('C', 0.02, 0.00); // Destino Final
        
        // ROTA 2: Um grande desvio longo (mais distante)
        grafo.adicionarVertice('D', 0.00, 0.05); 
        grafo.adicionarVertice('E', 0.02, 0.05); 

        // ROTA 3: Isolada
        grafo.adicionarVertice('F', 0.10, 0.10); 

        // Conectando a Rota 1 (A -> B -> C)
        grafo.adicionarAresta('A', 'B');
        grafo.adicionarAresta('B', 'C');

        // Conectando a Rota 2 (A -> D -> E -> C)
        grafo.adicionarAresta('A', 'D');
        grafo.adicionarAresta('D', 'E');
        grafo.adicionarAresta('E', 'C');
        
        // Rua na contramão (C -> A)
        grafo.adicionarAresta('C', 'A');
    });

    describe('Testes do Algoritmo de Dijkstra', () => {
        
        test('Deve retornar a rota mais curta (A -> B -> C) em vez do desvio longo', () => {
            // ACT (Ação)
            const resultado = grafo.calcularDijkstra('A', 'C');
            
            // ASSERT (Validação)
            // Espera-se que ele não faça a rota A -> D -> E -> C
            expect(resultado.caminho).toEqual(['A', 'B', 'C']);
            expect(resultado.distanciaTotal).toBeGreaterThan(0);
        });

        test('Deve retornar um array vazio se o destino for inacessível (ex: Contramão ou Isolado)', () => {
            // Tentar ir de F para A (Não existem ruas saindo de F)
            const resultado = grafo.calcularDijkstra('F', 'A');
            
            expect(resultado.caminho).toEqual([]);
            expect(resultado.distanciaTotal).toBe(-1);
        });

        test('Deve respeitar ruas de mão única e dar a volta no quarteirão (Ciclo) em vez de usar contramão', () => {
            // ACT: Tentar ir de D para B. 
            // O caminho direto D -> A -> B é contramão (A -> D é mão única).
            // O sistema deve encontrar o retorno longo: D -> E -> C -> A -> B.
            const resultado = grafo.calcularDijkstra('D', 'B');
            
            // ASSERT: Valida se ele fez o contorno correto respeitando as mãos
            expect(resultado.caminho).toEqual(['D', 'E', 'C', 'A', 'B']);
            expect(resultado.distanciaTotal).toBeGreaterThan(0);
        });
    });

    describe('Testes da Busca em Largura (BFS)', () => {
        
        test('Deve mapear apenas os vizinhos imediatos se o limite (raio) for 1', () => {
            // ACT: Raio de apenas 1 cruzamento a partir de A
            const alcance = grafo.executarBFS('A', 1);
            
            const idsAlcancados = alcance.map(item => item.vertice);
            
            // ASSERT
            expect(idsAlcancados).toContain('B');
            expect(idsAlcancados).toContain('D');
            
            // Não pode alcançar o nível 2 (C e E)
            expect(idsAlcancados).not.toContain('C'); 
            expect(idsAlcancados).not.toContain('E'); 
            
            // Valida se guardou a distância corretamente
            const nohB = alcance.find(i => i.vertice === 'B');
            expect(nohB.cruzamentosDistancia).toBe(1);
        });
        
        test('Deve alcançar níveis mais profundos se o limite for aumentado para 2', () => {
            // ACT: Raio de 2 cruzamentos
            const alcance = grafo.executarBFS('A', 2);
            const idsAlcancados = alcance.map(item => item.vertice);
            
            // ASSERT
            expect(idsAlcancados).toContain('B');
            expect(idsAlcancados).toContain('D');
            expect(idsAlcancados).toContain('C'); // Agora deve alcançar o nível 2
            expect(idsAlcancados).toContain('E'); // Agora deve alcançar o nível 2
        });
    });
});