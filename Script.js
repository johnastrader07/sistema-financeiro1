if (localStorage.getItem("logado") !== "true") {
  window.location.href = "login.html";
}

// ---------------------- VARIÁVEIS GERAIS ----------------------
let editID = null;
let movimentacoes = JSON.parse(localStorage.getItem('movimentacoes') || '[]');

// ---------------------- UTILITÁRIOS ----------------------
function normalizaTipo(raw) {
  if (!raw) return "";
  let t = String(raw).trim().toLowerCase();
  t = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  t = t.replace(/[-_]/g, " ");
  t = t.replace(/\s+/g, " ");
  return t;
}
function padronizarTipo(raw) {
  const t = normalizaTipo(raw);
  if (t.includes("receita")) return "receita";
  if (t.includes("guardad")) return "guardado";
  if (t.includes("pagamento") && t.includes("divida")) return "pagamento divida";
  if (t.includes("divida")) return "divida";
  if (t.includes("despesa")) return "despesa";
  return "despesa"; // fallback seguro
}
function formatCurrencyAbs(value) {
  // formata valor absoluto (sem sinal) em pt-BR com 2 casas
  const abs = Math.abs(Number(value) || 0);
  return abs.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatCurrencyWithSign(value, showMinusForPositiveDebt = false) {
  // Se value < 0 => "- R$ x", se >=0 => "R$ x"
  const v = Number(value) || 0;
  if (v < 0) return `- R$ ${formatCurrencyAbs(v)}`;
  if (showMinusForPositiveDebt && v > 0) return `- R$ ${formatCurrencyAbs(v)}`; // for debts shown as negative
  return `R$ ${formatCurrencyAbs(v)}`;
}
function setElementNumber(el, value, forceShowMinusForDebt = false) {
  // atualiza texto e cor (vermelho se negativo)
  if (!el) return;
  const v = Number(value) || 0;
  // texto
  const text = formatCurrencyWithSign(v, forceShowMinusForDebt);
  el.innerText = text;
  // cor
  if (v < 0 || (forceShowMinusForDebt && v > 0)) {
    el.style.color = "#c62828"; // vermelho
  } else {
    el.style.color = ""; // padrão
  }
}

// ---------------------- POPULAR SELECT DE ANOS ----------------------
(function carregarAnos() {
  const sel = document.getElementById("filtroAno");
  if (!sel) return;
  const anoAtual = new Date().getFullYear();
  sel.innerHTML = "";

  const opPadrao = document.createElement("option");
  opPadrao.value = "";
  opPadrao.textContent = "Ano Atual";
  sel.appendChild(opPadrao);

  for (let a = anoAtual - 3; a <= anoAtual + 1; a++) {
    const op = document.createElement("option");
    op.value = String(a);
    op.textContent = a;
    sel.appendChild(op);
  }
})();

// ---------------------- ALERTA ----------------------
function showAlert(msg, type) {
  const a = document.getElementById("alert");
  if (!a) return;
  a.className = "alert " + type;
  a.innerText = msg;
  a.style.display = "block";
  setTimeout(() => a.style.display = "none", 2600);
}

// ---------------------- SALVAR MOVIMENTAÇÃO ----------------------
function salvar() {
  const data = document.getElementById("inputData").value;
  const descricao = document.getElementById("descricao").value.trim();
  const tipoRaw = document.getElementById("tipo").value;
  const tipo = padronizarTipo(tipoRaw);
  const valorInput = document.getElementById("valor").value;
  const valor = Number(valorInput) || 0;

  if (!data || !descricao || !valor) {
    showAlert("Preencha tudo corretamente!", "error");
    return;
  }

  if (editID !== null) {
    const idx = movimentacoes.findIndex(m => m.id === editID);
    if (idx !== -1) {
      movimentacoes[idx] = { id: editID, data, descricao, tipo, valor };
      showAlert("Alterado com sucesso!", "success");
    }
    editID = null;
  } else {
    const id = Date.now().toString();
    movimentacoes.push({ id, data, descricao, tipo, valor });
    showAlert("Salvo com sucesso!", "success");
  }

  localStorage.setItem('movimentacoes', JSON.stringify(movimentacoes));
  limparCampos();
  atualizarTudo();
}

// ---------------------- LIMPAR CAMPOS ----------------------
function limparCampos() {
  const desc = document.getElementById("descricao");
  const val = document.getElementById("valor");
  const date = document.getElementById("inputData");
  if (desc) desc.value = "";
  if (val) val.value = "";
  if (date) date.value = "";
}

// ---------------------- EDITAR ----------------------
function editar(id) {
  const item = movimentacoes.find(m => m.id === id);
  if (!item) { showAlert("Registro não encontrado.", "error"); return; }

  editID = id;
  document.getElementById("inputData").value = item.data;
  document.getElementById("descricao").value = item.descricao;
  document.getElementById("tipo").value = item.tipo;
  document.getElementById("valor").value = item.valor;
  showAlert("Editando registro...", "success");
}

// ---------------------- EXCLUIR ----------------------
function excluir(id) {
  if (!confirm("Excluir este item?")) return;
  movimentacoes = movimentacoes.filter(m => m.id !== id);
  localStorage.setItem('movimentacoes', JSON.stringify(movimentacoes));
  showAlert("Excluído!", "success");
  atualizarTudo();
}

// ---------------------- EXPORTAR ----------------------
function exportarJSON() {
  if (movimentacoes.length === 0) {
    showAlert("Nenhum dado para exportar!", "error");
    return;
  }

  const blob = new Blob([JSON.stringify(movimentacoes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "movimentacoes.json";
  a.click();
  URL.revokeObjectURL(url);

  showAlert("Arquivo JSON gerado com sucesso!", "success");
}

// ---------------------- CABEÇALHO ----------------------
function atualizarCabecalho(mode) {
  const theadRow = document.querySelector("table thead tr");
  if (!theadRow) return;

  if (mode === "mensal") {
    theadRow.innerHTML = `
      <th>Data</th>
      <th>Descrição</th>
      <th>Tipo</th>
      <th>Valor</th>
      <th>Ações</th>
    `;
  } else if (mode === "total_ano") {
    theadRow.innerHTML = `
      <th>Mês</th>
      <th>Receita</th>
      <th>Despesas</th>
      <th>Saldo</th>
      <th>Guardado</th>
      <th>Dívidas</th>
    `;
  } else if (mode === "total_anos") {
    theadRow.innerHTML = `
      <th>Ano</th>
      <th>Receita</th>
      <th>Despesas</th>
      <th>Saldo</th>
      <th>Guardado</th>
      <th>Dívidas</th>
    `;
  }
}

// ---------------------- CÁLCULO DE TOTAIS ----------------------
function calcularTotais(lista) {
  let receita = 0, despesa = 0, guardado = 0;
  let dividaTotal = 0;      // total de dívidas lançadas (positivo)
  let pagamentoDivida = 0;  // total pago em dívidas (positivo)

  lista.forEach(m => {
    const tipo = padronizarTipo(m.tipo);
    const val = Number(m.valor) || 0;

    if (tipo === "receita") receita += val;
    else if (tipo === "despesa") despesa += val;
    else if (tipo === "guardado") guardado += val;
    else if (tipo === "divida") dividaTotal += val;
    else if (tipo === "pagamento divida") pagamentoDivida += val;
  });

  // Dívida líquida (o que ainda deve) = dívidas lançadas - pagamentos
  const dividas = Math.max(0, dividaTotal - pagamentoDivida);

  // Saldo real da conta (inclui pagamentos de dívida, mas NÃO inclui guardado nem dívidas não pagas)
  // pagamento de dívida é saída do caixa -> subtrai do saldo
  const saldo = receita - despesa;

  return {
    receita,
    despesa,
    guardado,
    dividas,
    saldo
  };
}

// ---------------------- ATUALIZAR TUDO ----------------------
function atualizarTudo() {
  const filtroMesEl = document.getElementById("filtroMes");
  const filtroAnoEl = document.getElementById("filtroAno");
  if (!filtroMesEl || !filtroAnoEl) return;

  const mesSel = filtroMesEl.value;
  const anoSel = filtroAnoEl.value;
  const hoje = new Date();

  const mes = mesSel && mesSel !== "total_ano" ? mesSel : String(hoje.getMonth() + 1).padStart(2, "0");
  const ano = anoSel || String(hoje.getFullYear());

  const tbody = document.getElementById("lista");
  if (!tbody) return;
  tbody.innerHTML = "";

  // MODO: TOTAL DOS ANOS (linhas por ano)
  if (mesSel === "total_anos") {
    atualizarCabecalho("total_anos");

    const anos = [...new Set(movimentacoes.map(m => new Date(m.data).getFullYear()))].sort();
    let agregados = { receita: 0, despesa: 0, guardado: 0, dividas: 0 };

    anos.forEach(anoX => {
      const listaAno = movimentacoes.filter(m => new Date(m.data).getFullYear() === anoX);
      const t = calcularTotais(listaAno);

      agregados.receita += t.receita;
      agregados.despesa += t.despesa;
      agregados.guardado += t.guardado;
      agregados.dividas += t.dividas;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td><b>${anoX}</b></td>
        <td>R$ ${t.receita.toFixed(2)}</td>
        <td>R$ ${t.despesa.toFixed(2)}</td>
        <td>R$ ${t.saldo.toFixed(2)}</td>
        <td>R$ ${t.guardado.toFixed(2)}</td>
        <td>${formatCurrencyWithSign(t.dividas, true)}</td>
      `;
      tbody.appendChild(row);
    });

    const totalsAg = {
      receita: agregados.receita,
      despesa: agregados.despesa,
      guardado: agregados.guardado,
      dividas: agregados.dividas,
      saldo: agregados.receita - agregados.despesa - agregados.dividas
    };
    atualizarDashboard(totalsAg);
    return;
  }

  // MODO: TOTAL DO ANO (linhas por mês do ano selecionado)
  if (mesSel === "total_ano") {
    atualizarCabecalho("total_ano");

    const meses = ["01","02","03","04","05","06","07","08","09","10","11","12"];

    meses.forEach(m => {
      const listaMes = movimentacoes.filter(item => {
        const d = new Date(item.data);
        return String(d.getMonth() + 1).padStart(2, "0") === m && d.getFullYear() == ano;
      });

      const t = calcularTotais(listaMes);

      const row = document.createElement("tr");
      row.innerHTML = `
        <td><b>${mesParaNome(m)}</b></td>
        <td>R$ ${t.receita.toFixed(2)}</td>
        <td>R$ ${t.despesa.toFixed(2)}</td>
        <td>R$ ${t.saldo.toFixed(2)}</td>
        <td>R$ ${t.guardado.toFixed(2)}</td>
        <td>${formatCurrencyWithSign(t.dividas, true)}</td>
      `;
      tbody.appendChild(row);
    });

    const listaAno = movimentacoes.filter(m => new Date(m.data).getFullYear() == ano);
    atualizarDashboard(calcularTotais(listaAno));
    return;
  }

  // MODO: MENSAL (lista de movimentos)
  atualizarCabecalho("mensal");

  const filtrados = movimentacoes.filter(m => {
    const d = new Date(m.data);
    return String(d.getMonth() + 1).padStart(2, "0") === mes && d.getFullYear() == ano;
  });

  if (filtrados.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#999">Nenhuma movimentação</td></tr>`;
  } else {
    filtrados.forEach(l => {
      const tipo = padronizarTipo(l.tipo);
      // valor de exibição:
      // - se for "divida" mostramos como negativo (tracinhos) mas mantemos o valor armazenado positivo
      // - pagamento divida é uma saída (gasta) que reduz o saldo e reduz a dívida
      let displayValue = "";
      const v = Number(l.valor) || 0;
      if (tipo === "divida") displayValue = `- R$ ${formatCurrencyAbs(v)}`; // dívida mostrada como negativo
      else if (tipo === "pagamento divida") displayValue = `- R$ ${formatCurrencyAbs(v)}`; // pagamento é saída
      else if (tipo === "despesa") displayValue = `- R$ ${formatCurrencyAbs(v)}`;
      else displayValue = `R$ ${formatCurrencyAbs(v)}`; // receita / guardado mostrados positivos

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${l.data}</td>
        <td>${l.descricao}</td>
        <td>${tipo}</td>
        <td>${displayValue}</td>
        <td>
          <button class="btn-acao edit" onclick="editar('${l.id}')">Editar</button>
          <button class="btn-acao delete" onclick="excluir('${l.id}')">Excluir</button>
        </td>`;
      tbody.appendChild(row);
    });
  }

  const totals = calcularTotais(filtrados);
  atualizarDashboard(totals);
}

// ---------------------- ATUALIZAR DASHBOARD ----------------------
function atualizarDashboard(t) {
  // t.receita, t.despesa, t.guardado, t.dividas (positivas), t.saldo
  setElementNumber(document.getElementById("db_receita"), t.receita);
  setElementNumber(document.getElementById("db_despesa"), -Math.abs(t.despesa)); // mostrar como negativo no painel
  // saldo: pode ser negativo se despesas + pagamentos > receitas
  setElementNumber(document.getElementById("db_saldo"), t.saldo);
  setElementNumber(document.getElementById("db_guardado"), t.guardado); // opcional mostrar guardado como negativo/retirado? mantive negativo por clareza
  // Exibimos dívidas como negativo (mostrando o que falta pagar)
  setElementNumber(document.getElementById("db_dividas"), -Math.abs(t.dividas), true);
}

// ---------------------- AUXILIAR ----------------------
function mesParaNome(mes) {
  const nomes = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  return nomes[parseInt(mes, 10) - 1] || mes;
}

// ---------------------- RELÓGIO ----------------------
function atualizarRelogio() {
  const agora = new Date();
  const h = String(agora.getHours()).padStart(2,'0');
  const m = String(agora.getMinutes()).padStart(2,'0');
  const s = String(agora.getSeconds()).padStart(2,'0');
  const d = String(agora.getDate()).padStart(2,'0');
  const me = String(agora.getMonth()+1).padStart(2,'0');
  const a = agora.getFullYear();
  const el = document.getElementById('relogio');
  if (el) el.innerText = `${d}/${me}/${a} ${h}:${m}:${s}`;
}
setInterval(atualizarRelogio, 1000);
atualizarRelogio();

// ---------------------- EVENTOS ----------------------
window.onload = () => { atualizarTudo(); };
document.querySelector(".botao-salvar")?.addEventListener("click", salvar);
document.querySelector(".botao-exportar")?.addEventListener("click", exportarJSON);

// ---------------------- LOGIN / SAIR / TROCAR CONTA ----------------------
function logout() {
  localStorage.setItem("logado", "false");
  window.location.href = "login.html";
}

function trocarConta() {
  // Não desloga automaticamente — apenas volta para tela de login
  window.location.href = "login.html";
}