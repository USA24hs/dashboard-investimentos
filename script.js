// --- Sr. Anderson, EDITE APENAS ESTA PARTE COM SEUS ATIVOS ---
const minhaCarteira = [
    { ticker: 'ITSA4', quantidade: 100, precoMedio: 9.50, tipo: 'acao' },
    { ticker: 'MXRF11', quantidade: 50, precoMedio: 10.20, tipo: 'fii' },
    { ticker: 'PETR4', quantidade: 30, precoMedio: 25.00, tipo: 'acao' },
    { ticker: 'HGLG11', quantidade: 20, precoMedio: 160.00, tipo: 'fii' }
];
// ---------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    carregarDadosCarteira();
});

async function carregarDadosCarteira() {
    const tickers = minhaCarteira.map(ativo => ativo.ticker).join(',');
    // Fonte da API: Brapi (https://brapi.dev/) - Atualizado em 25/10/2023
    const url = `https://brapi.dev/api/quote/${tickers}?range=1d&interval=1d`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        let patrimonioTotal = 0;
        let totalInvestido = 0;
        let totalAcoes = 0;
        let totalFIIs = 0;
        
        const tabelaBody = document.querySelector('#ativos-table tbody');
        tabelaBody.innerHTML = ''; // Limpa a tabela antes de preencher

        minhaCarteira.forEach(ativo => {
            const dadosAtivo = data.results.find(result => result.symbol === ativo.ticker);
            if (dadosAtivo) {
                const cotacaoAtual = dadosAtivo.regularMarketPrice;
                const patrimonioAtivo = ativo.quantidade * cotacaoAtual;
                const valorInvestidoAtivo = ativo.quantidade * ativo.precoMedio;
                const variacao = ((cotacaoAtual / ativo.precoMedio) - 1) * 100;

                patrimonioTotal += patrimonioAtivo;
                totalInvestido += valorInvestidoAtivo;

                if (ativo.tipo === 'acao') {
                    totalAcoes += patrimonioAtivo;
                } else if (ativo.tipo === 'fii') {
                    totalFIIs += patrimonioAtivo;
                }

                // Preenche a tabela
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${ativo.ticker}</td>
                    <td>${ativo.quantidade}</td>
                    <td>${ativo.precoMedio.toFixed(2)}</td>
                    <td>${cotacaoAtual.toFixed(2)}</td>
                    <td>${patrimonioAtivo.toFixed(2)}</td>
                    <td style="color: ${variacao >= 0 ? 'green' : 'red'};">${variacao.toFixed(2)}%</td>
                `;
                tabelaBody.appendChild(tr);
            }
        });

        // Atualiza o resumo
        const lucroPrejuizo = patrimonioTotal - totalInvestido;
        document.getElementById('total-investido').textContent = `R$ ${totalInvestido.toFixed(2)}`;
        document.getElementById('patrimonio-atual').textContent = `R$ ${patrimonioTotal.toFixed(2)}`;
        const lucroEl = document.getElementById('lucro-prejuizo');
        lucroEl.textContent = `R$ ${lucroPrejuizo.toFixed(2)}`;
        lucroEl.className = lucroPrejuizo >= 0 ? 'positivo' : 'negativo';

        // Cria o gráfico de pizza
        criarGraficoDistribuicao(totalAcoes, totalFIIs);
        carregarAgendaProventos(tickers);

    } catch (error) {
        console.error('Falha ao buscar dados da API:', error);
        alert('Não foi possível carregar os dados dos ativos. Verifique o console para mais detalhes.');
    }
}

function criarGraficoDistribuicao(valorAcoes, valorFIIs) {
    const ctx = document.getElementById('distribuicaoChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Ações', 'Fundos Imobiliários'],
            datasets: [{
                data: [valorAcoes, valorFIIs],
                backgroundColor: ['#36a2eb', '#ff6384'],
            }]
        }
    });
}

async function carregarAgendaProventos(tickers) {
    const url = `https://brapi.dev/api/quote/${tickers}?dividends=true`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        const agendaUl = document.getElementById('agenda-proventos');
        agendaUl.innerHTML = '<li>Carregando proventos...</li>';
        
        let proventosHtml = '';
        data.results.forEach(result => {
            if (result.dividendsData && result.dividendsData.cashDividends) {
                result.dividendsData.cashDividends.slice(0, 3).forEach(div => { // Pega os 3 últimos dividendos
                    proventosHtml += `<li><strong>${result.symbol}:</strong> R$ ${div.rate.toFixed(4)} por cota | Data Com: ${new Date(div.paymentDate).toLocaleDateString()}</li>`;
                });
            }
        });
        agendaUl.innerHTML = proventosHtml || '<li>Nenhum provento recente encontrado para estes ativos.</li>';

    } catch (error) {
        console.error('Falha ao buscar dividendos:', error);
    }
}