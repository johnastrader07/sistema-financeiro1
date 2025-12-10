/* =========================================================
   ALERTA
========================================================= */
function showAlert(msg, type = "error") {
  const a = document.getElementById("alert");
  if (!a) return;

  a.className = "alert " + type;
  a.innerText = msg;
  a.style.display = "block";

  setTimeout(() => a.style.display = "none", 2500);
}

/* =========================================================
   CADASTRO
========================================================= */
function registrar() {
  const user = document.getElementById("reg_user").value.trim();
  const pass = document.getElementById("reg_pass").value.trim();
  const pass2 = document.getElementById("reg_pass2").value.trim();

  if (!user || !pass) {
    return showAlert("Preencha todos os campos!");
  }
  if (pass !== pass2) {
    return showAlert("As senhas não coincidem!");
  }

  const contas = JSON.parse(localStorage.getItem("contas") || "[]");

  if (contas.find(c => c.user === user)) {
    return showAlert("Este usuário já existe!");
  }

  contas.push({ user, pass });
  localStorage.setItem("contas", JSON.stringify(contas));

  showAlert("Conta criada com sucesso!", "success");

  setTimeout(() => {
    window.location.href = "login.html";
  }, 1000);
}

/* =========================================================
   LOGIN
========================================================= */
function logar() {
  const user = document.getElementById("login_user").value.trim();
  const pass = document.getElementById("login_pass").value.trim();

  const contas = JSON.parse(localStorage.getItem("contas") || "[]");

  const existe = contas.find(c => c.user === user && c.pass === pass);

  if (!existe) {
    return showAlert("Usuário ou senha incorretos!");
  }

  localStorage.setItem("logado", "true");
  localStorage.setItem("user_atual", user);

  showAlert("Entrando...", "success");

  setTimeout(() => {
    window.location.href = "index.html";
  }, 800);
}

/* =========================================================
   PROTEÇÃO DAS PÁGINAS
========================================================= */
(function verificarLogin() {
  const pagina = location.pathname;

  const eLogin = pagina.includes("login.html");
  const eRegister = pagina.includes("register.html");

  const logado = localStorage.getItem("logado") === "true";

  if (!logado && !eLogin && !eRegister) {
    window.location.href = "login.html";
  }
})();
