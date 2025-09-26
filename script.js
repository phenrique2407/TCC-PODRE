class ControleFinanceiro {
    constructor() {
        this.transacoes = this.carregarDados('transacoes') || [];
        this.metas = this.carregarDados('metas') || [];
        this.chart = null;
        this.filtroAtivo = 'todos';
        
        this.inicializar();
    }

    inicializar() {
        this.configurarEventListeners();
        this.atualizarDashboard();
        this.renderizarMetas();
        this.renderizarTransacoes();
        this.criarGrafico();
        this.definirDataAtual();
    }

    // Gerenciamento de dados
    salvarDados(chave, dados) {
        localStorage.setItem(chave, JSON.stringify(dados));
    }

    carregarDados(chave) {
        const dados = localStorage.getItem(chave);
        return dados ? JSON.parse(dados) : null;
    }

    // Event Listeners
    configurarEventListeners() {
        // Formulário de transações
        document.getElementById('formTransacao').addEventListener('submit', (e) => {
            e.preventDefault();
            this.adicionarTransacao();
        });

        // Formulário de metas
        document.getElementById('formMeta').addEventListener('submit', (e) => {
            e.preventDefault();
            this.adicionarMeta();
        });

        // Filtros de transações
        document.getElementById('filtroTodos').addEventListener('click', () => {
            this.aplicarFiltro('todos');
        });
        document.getElementById('filtroReceitas').addEventListener('click', () => {
            this.aplicarFiltro('receita');
        });
        document.getElementById('filtroDespesas').addEventListener('click', () => {
            this.aplicarFiltro('despesa');
        });

        // Listener para mudanças de aba
        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', () => {
                if (tab.id === 'geral-tab') {
                    this.atualizarGrafico();
                }
            });
        });
    }

    definirDataAtual() {
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('dataTransacao').value = hoje;
        document.getElementById('dataMeta').value = hoje;
    }

    // Transações
    adicionarTransacao() {
        const tipo = document.getElementById('tipoTransacao').value;
        const descricao = document.getElementById('descricaoTransacao').value;
        const valor = parseFloat(document.getElementById('valorTransacao').value);
        const data = document.getElementById('dataTransacao').value;
        const categoria = document.getElementById('categoriaTransacao').value;

        if (!tipo || !descricao || !valor || !data) {
            this.mostrarAlerta('Por favor, preencha todos os campos obrigatórios.', 'danger');
            return;
        }

        const transacao = {
            id: Date.now(),
            tipo,
            descricao,
            valor,
            data,
            categoria: categoria || 'outros'
        };

        this.transacoes.push(transacao);
        this.salvarDados('transacoes', this.transacoes);
        
        // Limpar formulário
        document.getElementById('formTransacao').reset();
        this.definirDataAtual();
        
        // Atualizar interface
        this.atualizarDashboard();
        this.renderizarTransacoes();
        this.atualizarGrafico();
        
        this.mostrarAlerta(`${tipo === 'receita' ? 'Receita' : 'Despesa'} adicionada com sucesso!`, 'success');
    }

    editarTransacao(id) {
        const transacao = this.transacoes.find(t => t.id === id);
        if (!transacao) return;

        // Preencher formulário com dados da transação
        document.getElementById('tipoTransacao').value = transacao.tipo;
        document.getElementById('descricaoTransacao').value = transacao.descricao;
        document.getElementById('valorTransacao').value = transacao.valor;
        document.getElementById('dataTransacao').value = transacao.data;
        document.getElementById('categoriaTransacao').value = transacao.categoria;

        // Remover transação original
        this.excluirTransacao(id, false);
        
        // Focar no formulário
        document.getElementById('transacoes-tab').click();
        document.getElementById('descricaoTransacao').focus();
    }

    excluirTransacao(id, confirmar = true) {
        if (confirmar && !confirm('Tem certeza que deseja excluir esta transação?')) {
            return;
        }

        this.transacoes = this.transacoes.filter(t => t.id !== id);
        this.salvarDados('transacoes', this.transacoes);
        
        this.atualizarDashboard();
        this.renderizarTransacoes();
        this.atualizarGrafico();
        
        if (confirmar) {
            this.mostrarAlerta('Transação excluída com sucesso!', 'success');
        }
    }

    // Metas
    adicionarMeta() {
        const nome = document.getElementById('nomeMeta').value;
        const valor = parseFloat(document.getElementById('valorMeta').value);
        const data = document.getElementById('dataMeta').value;
        const categoria = document.getElementById('categoriaMeta').value;

        if (!nome || !valor || !data) {
            this.mostrarAlerta('Por favor, preencha todos os campos obrigatórios.', 'danger');
            return;
        }

        const meta = {
            id: Date.now(),
            nome,
            valor,
            data,
            categoria: categoria || 'outros',
            atual: 0
        };

        this.metas.push(meta);
        this.salvarDados('metas', this.metas);
        
        // Limpar formulário
        document.getElementById('formMeta').reset();
        this.definirDataAtual();
        
        // Atualizar interface
        this.renderizarMetas();
        this.atualizarProgressoMetas();
        
        this.mostrarAlerta('Meta adicionada com sucesso!', 'success');
    }

    editarMeta(id) {
        const meta = this.metas.find(m => m.id === id);
        if (!meta) return;

        // Preencher formulário com dados da meta
        document.getElementById('nomeMeta').value = meta.nome;
        document.getElementById('valorMeta').value = meta.valor;
        document.getElementById('dataMeta').value = meta.data;
        document.getElementById('categoriaMeta').value = meta.categoria;

        // Remover meta original
        this.excluirMeta(id, false);
        
        // Focar no formulário
        document.getElementById('metas-tab').click();
        document.getElementById('nomeMeta').focus();
    }

    excluirMeta(id, confirmar = true) {
        if (confirmar && !confirm('Tem certeza que deseja excluir esta meta?')) {
            return;
        }

        this.metas = this.metas.filter(m => m.id !== id);
        this.salvarDados('metas', this.metas);
        
        this.renderizarMetas();
        this.atualizarProgressoMetas();
        
        if (confirmar) {
            this.mostrarAlerta('Meta excluída com sucesso!', 'success');
        }
    }

    contribuirMeta(id) {
        const valor = prompt('Digite o valor da contribuição:');
        if (!valor || isNaN(valor) || parseFloat(valor) <= 0) {
            this.mostrarAlerta('Valor inválido!', 'danger');
            return;
        }

        const meta = this.metas.find(m => m.id === id);
        if (meta) {
            meta.atual += parseFloat(valor);
            this.salvarDados('metas', this.metas);
            this.renderizarMetas();
            this.atualizarProgressoMetas();
            this.mostrarAlerta('Contribuição adicionada com sucesso!', 'success');
        }
    }

    // Cálculos financeiros
    calcularTotalReceitas() {
        return this.transacoes
            .filter(t => t.tipo === 'receita')
            .reduce((total, t) => total + t.valor, 0);
    }

    calcularTotalDespesas() {
        return this.transacoes
            .filter(t => t.tipo === 'despesa')
            .reduce((total, t) => total + t.valor, 0);
    }

    calcularSaldo() {
        return this.calcularTotalReceitas() - this.calcularTotalDespesas();
    }

    // Formatação
    formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }

    formatarData(data) {
        return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
    }

    obterIconeCategoria(categoria) {
        const icones = {
            alimentacao: 'fas fa-utensils',
            transporte: 'fas fa-car',
            moradia: 'fas fa-home',
            saude: 'fas fa-heartbeat',
            educacao: 'fas fa-graduation-cap',
            lazer: 'fas fa-gamepad',
            salario: 'fas fa-money-bill-wave',
            freelance: 'fas fa-laptop',
            investimento: 'fas fa-chart-line',
            emergencia: 'fas fa-exclamation-triangle',
            viagem: 'fas fa-plane',
            casa: 'fas fa-home',
            outros: 'fas fa-tag'
        };
        return icones[categoria] || 'fas fa-tag';
    }

    // Interface - Dashboard
    atualizarDashboard() {
        const saldo = this.calcularSaldo();
        const receitas = this.calcularTotalReceitas();
        const despesas = this.calcularTotalDespesas();

        document.getElementById('saldoAtual').textContent = this.formatarMoeda(saldo);
        document.getElementById('totalReceitas').textContent = this.formatarMoeda(receitas);
        document.getElementById('totalDespesas').textContent = this.formatarMoeda(despesas);

        this.atualizarUltimasTransacoes();
        this.atualizarProgressoMetas();
    }

    atualizarUltimasTransacoes() {
        const container = document.getElementById('ultimasTransacoes');
        const ultimasTransacoes = this.transacoes
            .sort((a, b) => new Date(b.data) - new Date(a.data))
            .slice(0, 5);

        if (ultimasTransacoes.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhuma transação registrada</p>';
            return;
        }

        container.innerHTML = ultimasTransacoes.map(transacao => `
            <div class="transacao-item transacao-${transacao.tipo} fade-in">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="${this.obterIconeCategoria(transacao.categoria)}"></i>
                        <strong>${transacao.descricao}</strong>
                        <br>
                        <small class="text-muted">${this.formatarData(transacao.data)}</small>
                    </div>
                    <div class="transacao-valor ${transacao.tipo}">
                        ${transacao.tipo === 'receita' ? '+' : '-'} ${this.formatarMoeda(transacao.valor)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    atualizarProgressoMetas() {
        const container = document.getElementById('progressoMetas');
        
        if (this.metas.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhuma meta cadastrada</p>';
            return;
        }

        container.innerHTML = this.metas.slice(0, 3).map(meta => {
            const progresso = Math.min((meta.atual / meta.valor) * 100, 100);
            const diasRestantes = Math.ceil((new Date(meta.data) - new Date()) / (1000 * 60 * 60 * 24));
            
            return `
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <small class="fw-bold">${meta.nome}</small>
                        <small>${progresso.toFixed(0)}%</small>
                    </div>
                    <div class="progress mb-1">
                        <div class="progress-bar ${progresso >= 100 ? 'bg-success' : 'bg-primary'}" 
                             style="width: ${progresso}%"></div>
                    </div>
                    <small class="text-muted">
                        ${this.formatarMoeda(meta.atual)} de ${this.formatarMoeda(meta.valor)}
                        ${diasRestantes > 0 ? `• ${diasRestantes} dias restantes` : '• Prazo vencido'}
                    </small>
                </div>
            `;
        }).join('');
    }

    // Interface - Metas
    renderizarMetas() {
        const container = document.getElementById('listaMetas');
        
        if (this.metas.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhuma meta cadastrada</p>';
            return;
        }

        container.innerHTML = this.metas.map(meta => {
            const progresso = Math.min((meta.atual / meta.valor) * 100, 100);
            const diasRestantes = Math.ceil((new Date(meta.data) - new Date()) / (1000 * 60 * 60 * 24));
            const statusClass = progresso >= 100 ? 'success' : diasRestantes < 0 ? 'danger' : 'primary';
            
            return `
                <div class="meta-item fade-in">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <h6 class="mb-1">
                                <i class="${this.obterIconeCategoria(meta.categoria)}"></i>
                                ${meta.nome}
                            </h6>
                            <small class="text-muted">
                                Prazo: ${this.formatarData(meta.data)}
                                ${diasRestantes > 0 ? `(${diasRestantes} dias restantes)` : '(Vencido)'}
                            </small>
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-outline-primary btn-sm" onclick="app.contribuirMeta(${meta.id})">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="app.editarMeta(${meta.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="app.excluirMeta(${meta.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="meta-progresso">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span class="fw-bold">${this.formatarMoeda(meta.atual)}</span>
                            <span class="text-muted">${this.formatarMoeda(meta.valor)}</span>
                        </div>
                        <div class="progress">
                            <div class="progress-bar bg-${statusClass}" style="width: ${progresso}%"></div>
                        </div>
                        <div class="text-center mt-1">
                            <small class="text-${statusClass} fw-bold">${progresso.toFixed(1)}% concluído</small>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Interface - Transações
    renderizarTransacoes() {
        const container = document.getElementById('listaTransacoes');
        let transacoesFiltradas = this.transacoes;

        // Aplicar filtro
        if (this.filtroAtivo !== 'todos') {
            transacoesFiltradas = this.transacoes.filter(t => t.tipo === this.filtroAtivo);
        }

        // Ordenar por data (mais recente primeiro)
        transacoesFiltradas.sort((a, b) => new Date(b.data) - new Date(a.data));

        if (transacoesFiltradas.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhuma transação encontrada</p>';
            return;
        }

        container.innerHTML = transacoesFiltradas.map(transacao => `
            <div class="transacao-item transacao-${transacao.tipo} fade-in">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-1">
                            <i class="${this.obterIconeCategoria(transacao.categoria)} me-2"></i>
                            <strong>${transacao.descricao}</strong>
                            <span class="badge bg-secondary ms-2">${transacao.categoria}</span>
                        </div>
                        <small class="text-muted">${this.formatarData(transacao.data)}</small>
                    </div>
                    <div class="d-flex align-items-center">
                        <div class="transacao-valor ${transacao.tipo} me-3">
                            ${transacao.tipo === 'receita' ? '+' : '-'} ${this.formatarMoeda(transacao.valor)}
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-outline-secondary btn-action" onclick="app.editarTransacao(${transacao.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-action" onclick="app.excluirTransacao(${transacao.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Filtros
    aplicarFiltro(tipo) {
        this.filtroAtivo = tipo;
        
        // Atualizar botões
        document.querySelectorAll('#filtroTodos, #filtroReceitas, #filtroDespesas').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const botoes = {
            'todos': 'filtroTodos',
            'receita': 'filtroReceitas',
            'despesa': 'filtroDespesas'
        };
        
        document.getElementById(botoes[tipo]).classList.add('active');
        
        this.renderizarTransacoes();
    }


    // Gráfico
    criarGrafico() {
        const ctx = document.getElementById('chartReceitas').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Receitas', 'Despesas'],
                datasets: [{
                    label: 'Valor (R$)',
                    data: [this.calcularTotalReceitas(), this.calcularTotalDespesas()],
                    backgroundColor: [
                        'rgba(25, 135, 84, 0.8)',
                        'rgba(220, 53, 69, 0.8)'
                    ],
                    borderColor: [
                        'rgba(25, 135, 84, 1)',
                        'rgba(220, 53, 69, 1)'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toLocaleString('pt-BR');
                            }
                        }
                    }
                }
            }
        });
    }

    atualizarGrafico() {
        if (this.chart) {
            this.chart.data.datasets[0].data = [
                this.calcularTotalReceitas(),
                this.calcularTotalDespesas()
            ];
            this.chart.update();
        }
    }

    // Alertas
    mostrarAlerta(mensagem, tipo = 'info') {
        // Remover alertas existentes
        const alertasExistentes = document.querySelectorAll('.alert-custom');
        alertasExistentes.forEach(alerta => alerta.remove());

        // Criar novo alerta
        const alerta = document.createElement('div');
        alerta.className = `alert alert-${tipo} alert-dismissible fade show alert-custom`;
        alerta.style.position = 'fixed';
        alerta.style.top = '20px';
        alerta.style.right = '20px';
        alerta.style.zIndex = '9999';
        alerta.style.minWidth = '300px';
        
        alerta.innerHTML = `
            ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alerta);

        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            if (alerta.parentNode) {
                alerta.remove();
            }
        }, 5000);
    }
}

// Inicializar aplicativo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ControleFinanceiro();
});
