// Seleciona elementos
const form = document.getElementById('form-transacao');
const lista = document.querySelector('.lista-transacoes');
const receitasSpan = document.getElementById('total-receitas');
const despesasSpan = document.getElementById('total-despesas');
const saldoSpan = document.getElementById('saldo');

// Guarda transações
let transacoes = [];

// Atualiza interface
function atualizarInterface() {
  lista.innerHTML = '';

  let receitas = 0;
  let despesas = 0;

  transacoes.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.descricao} — R$ ${item.valor}`;

    if (item.valor > 0) {
      receitas += item.valor;
      li.classList.add('receita');
    } else {
      despesas += item.valor;
      li.classList.add('despesa');
    }

    lista.appendChild(li);
  });

  const saldo = receitas + despesas;

  receitasSpan.textContent = `R$ ${receitas}`;
  despesasSpan.textContent = `R$ ${despesas}`;
  saldoSpan.textContent = `R$ ${saldo}`;
}

// Captura evento do formulário
form.addEventListener('submit', e => {
  e.preventDefault();

  const descricao = document.getElementById('descricao').value;
  const valor = Number(document.getElementById('valor').value);

  transacoes.push({ descricao, valor });

  form.reset();

  atualizarInterface();
});

// Inicia interface
atualizarInterface();
