/* =========================================================
   🔒 SISTEMA DE LOGIN - PROTEÇÃO DA PÁGINA
========================================================= */
if (localStorage.getItem("logado") !== "true") {
  window.location.href = "login.html";
}

function logout() {
  localStorage.removeItem("logado");
  window.location.href = "login.html";
  <button onclick="logout()">Sair</button>
}

/* =========================================================
   VARIÁVEIS GERAIS
========================================================= */
let editID = null;
let movimentacoes = JSON.parse(localStorage.getItem('movimentacoes') || '[]');

/* =========================================================
   UTILITÁRIOS
========================================================= */
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
  return "despesa";
}

function formatCurrencyAbs(value) {
  const abs = Math.abs(Number(value) || 0);
  return abs.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCurrencyWithSign(value, showMinusForPositiveDebt = false) {
  const v = Number(value) || 0;
  if (v < 0) return `- R$ ${formatCurrencyAbs(v)}`;
  if (showMinusForPositiveDebt && v > 0) return `- R$ ${formatCurrencyAbs(v)}`;
  return `R$ ${formatCurrencyAbs(v)}`;
}

function setElementNumber(el, value, forceMinus = false) {
  if (!el) return;

  const v = Number(value) || 0;

  el.innerText = formatCurrencyWithSign(v, forceMinus);

  if (v < 0 || forceMinus) {
    el.style.color = "#c62828";
  } else {
    el.style.color = "";
  }
}

/* =========================================================
   POPULAR SELECT DE ANOS
========================================================= */
(function carregarAnos() {
  const sel = document.getElementById("filtroAno");
  if (!sel) return;

  const anoAtual = new Date().getFullYear();
  sel.innerHTML = "";

  const padrao = document.createElement("option");
  padrao.value = "";
  padrao.textContent = "Ano Atual";
  sel.appendChild(padrao);

  for (let a = anoAtual - 3; a <= anoAtual + 1; a++) {
    const op = document.createElement("option");
    op.value = a;
    op.textContent = a;
    sel.appendChild(op);
  }
})();

/* =========================================================
   ALERTA
========================================================= */
function showAlert(msg, type) {
  const a = document.getElementById("alert");
  if (!a) return;

  a.className = "alert " + type;
  a.innerText = msg;
  a.style.display = "block";

  setTimeout(() => (a.style.display = "none"), 2600);
}

/* =========================================================
   SALVAR MOVIMENTAÇÃO
========================================================= */
function salvar() {
  const data = document.getElementById("inputData").value;
  const descricao = document.getElementById("descricao").value.trim();
  const tipo = padronizarTipo(document.getElementById("tipo").value);
  const valor = Number(document.getElementById("valor").value) || 0;

  if (!data || !descricao || !valor) {
    showAlert("Preencha tudo corretamente!", "error");
    return;
  }

  if (editID !== null) {
    const i = movimentacoes.findIndex(m => m.id === editID);
    if (i !== -1) {
      movimentacoes[i] = { id: editID, data, descricao, tipo, valor };
      showAlert("Alterado com sucesso!", "success");
    }
    editID = null;
  } else {
    movimentacoes.push({
      id: Date.now().toString(),
      data, descricao, tipo, valor
    });
    showAlert("Salvo com sucesso!", "success");
  }

  localStorage.setItem("movimentacoes", JSON.stringify(movimentacoes));
  limparCampos();
  atualizarTudo();
}

/* =========================================================
   LIMPAR CAMPOS
========================================================= */
function limparCampos() {
  document.getElementById("inputData").value = "";
  document.getElementById("descricao").value = "";
  document.getElementById("valor").value = "";
}

/* =========================================================
   EDITAR
========================================================= */
function editar(id) {
  const item = movimentacoes.find(m => m.id === id);
  if (!item) return showAlert("Registro não encontrado.", "error");

  editID = id;
  document.getElementById("inputData").value = item.data;
  document.getElementById("descricao").value = item.descricao;
  document.getElementById("tipo").value = item.tipo;
  document.getElementById("valor").value = item.valor;

  showAlert("Editando registro...", "success");
}

/* =========================================================
   EXCLUIR
========================================================= */
function excluir(id) {
  if (!confirm("Excluir este item?")) return;
  movimentacoes = movimentacoes.filter(m => m.id !== id);
  localStorage.setItem("movimentacoes", JSON.stringify(movimentacoes));
  showAlert("Excluído!", "success");
  atualizarTudo();
}

/* =========================================================
   EXPORTAR
========================================================= */
function exportarJSON() {
  if (movimentacoes.length === 0)
    return showAlert("Nenhum dado para exportar!", "error");

  const blob = new Blob(
    [JSON.stringify(movimentacoes, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "movimentacoes.json";
  a.click();
  URL.revokeObjectURL(url);

  showAlert("Arquivo JSON gerado com sucesso!", "success");
}

/* =========================================================
   CABEÇALHO / TABELA
========================================================= */
function atualizarCabecalho(mode) {
  const head = document.querySelector("table thead tr");
  if (!head) return;

  if (mode === "mensal") {
    head.innerHTML = `
      <th>Data</th><th>Descrição</th><th>Tipo</th>
      <th>Valor</th><th>Ações</th>`;
  } else if (mode === "total_ano") {
    head.innerHTML = `
      <th>Mês</th><th>Receita</th><th>Despesas</th>
      <th>Saldo</th><th>Guardado</th><th>Dívidas</th>`;
  } else {
    head.innerHTML = `
      <th>Ano</th><th>Receita</th><th>Despesas</th>
      <th>Saldo</th><th>Guardado</th><th>Dívidas</th>`;
  }
}

/* =========================================================
   CÁLCULO DE TOTAIS
========================================================= */
function calcularTotais(lista) {
  let receita = 0, despesa = 0, guardado = 0;
  let dividaTotal = 0, pagamentoDivida = 0;

  lista.forEach(m => {
    const tipo = padronizarTipo(m.tipo);
    const v = Number(m.valor) || 0;

    if (tipo === "receita") receita += v;
    else if (tipo === "despesa") despesa += v;
    else if (tipo === "guardado") guardado += v;
    else if (tipo === "divida") dividaTotal += v;
    else if (tipo === "pagamento divida") pagamentoDivida += v;
  });

  const dividas = Math.max(0, dividaTotal - pagamentoDivida);
  const saldo = receita - despesa;

  return { receita, despesa, guardado, dividas, saldo };
}

/* =========================================================
   ATUALIZAR TUDO
========================================================= */
function atualizarTudo() {
  const mesSel = document.getElementById("filtroMes").value;
  const anoSel = document.getElementById("filtroAno").value;
  const hoje = new Date();

  const mes = mesSel && mesSel !== "total_ano"
    ? mesSel
    : String(hoje.getMonth() + 1).padStart(2, "0");

  const ano = anoSel || hoje.getFullYear();

  const tbody = document.getElementById("lista");
  tbody.innerHTML = "";

  /* ------------------ TOTAL DOS ANOS ------------------ */
  if (mesSel === "total_anos") {
    atualizarCabecalho("total_anos");

    const anos = [...new Set(movimentacoes.map(m =>
      new Date(m.data).getFullYear()
    ))].sort();

    anos.forEach(anoX => {
      const listaAno = movimentacoes.filter(m =>
        new Date(m.data).getFullYear() === anoX
      );

      const t = calcularTotais(listaAno);

      tbody.innerHTML += `
        <tr>
          <td><b>${anoX}</b></td>
          <td>R$ ${t.receita.toFixed(2)}</td>
          <td>R$ ${t.despesa.toFixed(2)}</td>
          <td>R$ ${t.saldo.toFixed(2)}</td>
          <td>R$ ${t.guardado.toFixed(2)}</td>
          <td>${formatCurrencyWithSign(t.dividas, true)}</td>
        </tr>`;
    });

    return;
  }

  /* ------------------ TOTAL DO ANO ------------------ */
  if (mesSel === "total_ano") {
    atualizarCabecalho("total_ano");

    const meses = ["01","02","03","04","05","06","07","08","09","10","11","12"];

    meses.forEach(m => {
      const listaMes = movimentacoes.filter(item => {
        const d = new Date(item.data);
        return (
          String(d.getMonth() + 1).padStart(2, "0") === m &&
          d.getFullYear() == ano
        );
      });

      const t = calcularTotais(listaMes);

      tbody.innerHTML += `
        <tr>
          <td><b>${mesParaNome(m)}</b></td>
          <td>R$ ${t.receita.toFixed(2)}</td>
          <td>R$ ${t.despesa.toFixed(2)}</td>
          <td>R$ ${t.saldo.toFixed(2)}</td>
          <td>R$ ${t.guardado.toFixed(2)}</td>
          <td>${formatCurrencyWithSign(t.dividas, true)}</td>
        </tr>`;
    });

    return;
  }

  /* ------------------ LISTA MENSAL ------------------ */
  atualizarCabecalho("mensal");

  const filtrados = movimentacoes.filter(m => {
    const d = new Date(m.data);
    return (
      String(d.getMonth() + 1).padStart(2, "0") === mes &&
      d.getFullYear() == ano
    );
  });

  if (filtrados.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="5" style="text-align:center;color:#999;">
      Nenhuma movimentação
      </td></tr>`;
  } else {
    filtrados.forEach(l => {
      let displayValue = "";
      const tipo = padronizarTipo(l.tipo);
      const v = Number(l.valor) || 0;

      if (["divida","pagamento divida","despesa"].includes(tipo)) {
        displayValue = `- R$ ${formatCurrencyAbs(v)}`;
      } else {
        displayValue = `R$ ${formatCurrencyAbs(v)}`;
      }

      tbody.innerHTML += `
        <tr>
          <td>${l.data}</td>
          <td>${l.descricao}</td>
          <td>${tipo}</td>
          <td>${displayValue}</td>
          <td>
            <button class="btn-acao edit" onclick="editar('${l.id}')">Editar</button>
            <button class="btn-acao delete" onclick="excluir('${l.id}')">Excluir</button>
          </td>
        </tr>`;
    });
  }

  atualizarDashboard(calcularTotais(filtrados));
}

/* =========================================================
   DASHBOARD
========================================================= */
function atualizarDashboard(t) {
  setElementNumber(document.getElementById("db_receita"), t.receita);
  setElementNumber(document.getElementById("db_despesa"), -Math.abs(t.despesa));
  setElementNumber(document.getElementById("db_saldo"), t.saldo);
  setElementNumber(document.getElementById("db_guardado"), t.guardado);
  setElementNumber(document.getElementById("db_dividas"), -Math.abs(t.dividas), true);
}

/* =========================================================
   RELÓGIO
========================================================= */
function atualizarRelogio() {
  const agora = new Date();
  const h = String(agora.getHours()).padStart(2, "0");
  const m = String(agora.getMinutes()).padStart(2, "0");
  const s = String(agora.getSeconds()).padStart(2, "0");
  const d = String(agora.getDate()).padStart(2, "0");
  const me = String(agora.getMonth() + 1).padStart(2, "0");
  const a = agora.getFullYear();

  const el = document.getElementById("relogio");
  if (el) el.innerText = `${d}/${me}/${a} ${h}:${m}:${s}`;
}

setInterval(atualizarRelogio, 1000);
atualizarRelogio();

/* =========================================================
   EVENTOS
========================================================= */
window.onload = atualizarTudo;

document.querySelector(".botao-salvar")?.addEventListener("click", salvar);
document.querySelector(".botao-exportar")?.addEventListener("click", exportarJSON);