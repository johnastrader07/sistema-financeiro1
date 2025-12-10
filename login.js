// ==== Função de alerta simples ====
function alertMsg(t){
  const m = document.getElementById("msg");
  if(!m) return;
  m.textContent = t;
}

// ==== Cadastro ====
function registrar(){
  const user = document.getElementById("reg_user").value.trim();
  const pass = document.getElementById("reg_pass").value.trim();
  const pass2 = document.getElementById("reg_pass2").value.trim();

  if(!user || !pass) return alertMsg("Preencha todos os campos!");
  if(pass !== pass2) return alertMsg("As senhas não coincidem!");

  let contas = JSON.parse(localStorage.getItem("contas") || "[]");

  if(contas.find(c => c.user === user)){
    return alertMsg("Esse usuário já existe!");
  }

  contas.push({user, pass});
  localStorage.setItem("contas", JSON.stringify(contas));

  alertMsg("Conta criada!");
  setTimeout(()=>window.location.href="login.html", 900);
}

// ==== Login ====
function logar(){
  const user = document.getElementById("login_user").value.trim();
  const pass = document.getElementById("login_pass").value.trim();

  let contas = JSON.parse(localStorage.getItem("contas") || "[]");

  const ok = contas.find(c => c.user === user && c.pass === pass);

  if(!ok) return alertMsg("Usuário ou senha incorretos!");

  localStorage.setItem("logado", "true");
  localStorage.setItem("user_atual", user);

  window.location.href = "index.html";
}

// ==== Proteção das páginas principais ====
(function(){
  const pag = location.pathname;

  if(!pag.includes("login.html") && !pag.includes("register.html")){
    if(localStorage.getItem("logado") !== "true"){
      window.location.href = "login.html";
    }
  }
})();

document.addEventListener("keydown", (e) => {
  if(e.key === "Enter"){
    logar();
  }
});