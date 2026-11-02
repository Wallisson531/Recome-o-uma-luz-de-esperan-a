/* ==========================================================
   RECOMEÇO — lógica do site
   Seções: 1) utilitários  2) acessibilidade  3) menu e modais
   4) clínicas  5) autoavaliação  6) depoimentos  7) contato
   8) início
   ========================================================== */

/* 1) UTILITÁRIOS */
const $ = (seletor) => document.querySelector(seletor);
const $$ = (seletor) => document.querySelectorAll(seletor);

// Protege contra HTML malicioso vindo do banco ou de formulários.
// Use SEMPRE em textos de usuário que forem para dentro de innerHTML.
function escapar(texto = "") {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function somenteNumeros(texto = "") {
  return String(texto).replace(/\D/g, "");
}

function mostrarStatus(elemento, mensagem, tipo = "") {
  elemento.textContent = mensagem;
  elemento.className = "status" + (tipo ? ` status--${tipo}` : "");
}

/* 2) ACESSIBILIDADE (fonte e alto contraste, salvos no navegador) */
let tamanhoFonte = Number(localStorage.getItem("tamanhoFonte")) || 100;

function aplicarFonte(novoTamanho) {
  tamanhoFonte = Math.max(85, Math.min(130, novoTamanho));
  document.documentElement.style.fontSize = tamanhoFonte + "%";
  localStorage.setItem("tamanhoFonte", tamanhoFonte);
}

function aplicarContraste(ativo) {
  const html = document.documentElement;
  if (ativo) html.setAttribute("data-contraste", "alto");
  else html.removeAttribute("data-contraste");
  $("#alto-contraste").setAttribute("aria-pressed", ativo);
  localStorage.setItem("altoContraste", ativo);
}

function iniciarAcessibilidade() {
  aplicarFonte(tamanhoFonte);
  aplicarContraste(localStorage.getItem("altoContraste") === "true");

  $("#fonte-menor").addEventListener("click", () => aplicarFonte(tamanhoFonte - 5));
  $("#fonte-normal").addEventListener("click", () => aplicarFonte(100));
  $("#fonte-maior").addEventListener("click", () => aplicarFonte(tamanhoFonte + 5));
  $("#alto-contraste").addEventListener("click", () => {
    aplicarContraste($("#alto-contraste").getAttribute("aria-pressed") !== "true");
  });
}

/* 3) MENU E MODAIS */
function iniciarMenu() {
  const botao = $("#menu-botao");
  const menu = $("#menu");

  botao.addEventListener("click", () => {
    const aberto = menu.classList.toggle("aberto");
    botao.setAttribute("aria-expanded", aberto);
  });

  // Fecha o menu ao clicar em um link (no celular)
  menu.addEventListener("click", (evento) => {
    if (evento.target.tagName === "A") {
      menu.classList.remove("aberto");
      botao.setAttribute("aria-expanded", "false");
    }
  });
}

function iniciarModais() {
  // <button data-abrir="id-do-modal"> abre o <dialog> com esse id
  $$("[data-abrir]").forEach((botao) => {
    botao.addEventListener("click", () => $("#" + botao.dataset.abrir).showModal());
  });

  // <button data-fechar> fecha o modal onde está
  $$("[data-fechar]").forEach((botao) => {
    botao.addEventListener("click", () => botao.closest("dialog").close());
  });

  // Clicar fora da caixa (no fundo escuro) também fecha
  $$("dialog").forEach((modal) => {
    modal.addEventListener("click", (evento) => {
      if (evento.target === modal) modal.close();
    });
  });
}

/* 4) CLÍNICAS (dados vindos do Supabase) */
let clinicas = [];

function linkWhatsapp(numero) {
  const digitos = somenteNumeros(numero);
  if (!digitos) return "";
  const comPais = digitos.startsWith("55") ? digitos : "55" + digitos;
  return `https://wa.me/${comPais}`;
}

function criarCartaoClinica(c) {
  const contatos = [];
  if (c.telefone) contatos.push(`<a href="tel:${somenteNumeros(c.telefone)}">Ligar</a>`);
  if (c.whatsapp) contatos.push(`<a href="${linkWhatsapp(c.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>`);
  if (c.email) contatos.push(`<a href="mailto:${escapar(c.email)}">E-mail</a>`);

  return `
    <article class="cartao">
      <h3>${escapar(c.nome)}</h3>
      <p class="clinica__local">${escapar(c.cidade)} / ${escapar(c.estado)}</p>
      ${c.telefone ? `<p>${escapar(c.telefone)}</p>` : ""}
      <div class="clinica__contatos">${contatos.join("")}</div>
    </article>`;
}

function preencherSelect(select, valores, textoPadrao) {
  const unicos = [...new Set(valores.filter(Boolean))].sort();
  select.innerHTML =
    `<option value="">${textoPadrao}</option>` +
    unicos.map((v) => `<option value="${escapar(v)}">${escapar(v)}</option>`).join("");
}

function atualizarCidades() {
  const estado = $("#filtro-estado").value;
  const daqui = clinicas.filter((c) => !estado || c.estado === estado);
  preencherSelect($("#filtro-cidade"), daqui.map((c) => c.cidade), "Todas");
}

function filtrarClinicas() {
  const estado = $("#filtro-estado").value;
  const cidade = $("#filtro-cidade").value;
  const busca = $("#filtro-busca").value.trim().toLowerCase();

  const resultado = clinicas.filter((c) =>
    (!estado || c.estado === estado) &&
    (!cidade || c.cidade === cidade) &&
    (!busca || c.nome.toLowerCase().includes(busca))
  );

  $("#clinicas-lista").innerHTML = resultado.map(criarCartaoClinica).join("");
  mostrarStatus(
    $("#clinicas-status"),
    resultado.length ? `${resultado.length} local(is) encontrado(s).` : "Nenhum local encontrado. Tente mudar os filtros."
  );
}

async function carregarClinicas() {
  mostrarStatus($("#clinicas-status"), "Carregando locais de apoio...");
  try {
    clinicas = await buscarClinicas();
    preencherSelect($("#filtro-estado"), clinicas.map((c) => c.estado), "Todos");
    atualizarCidades();
    filtrarClinicas();
  } catch (erro) {
    console.error("Erro ao buscar clínicas:", erro);
    mostrarStatus($("#clinicas-status"), "Não foi possível carregar os locais agora. Tente novamente em instantes.", "erro");
  }
}

function iniciarClinicas() {
  $("#filtro-estado").addEventListener("change", () => { atualizarCidades(); filtrarClinicas(); });
  $("#filtro-cidade").addEventListener("change", filtrarClinicas);
  $("#filtro-busca").addEventListener("input", filtrarClinicas);
  carregarClinicas();
}

/* 5) AUTOAVALIAÇÃO (dados das perguntas separados da lógica) */
const perguntas = [
  {
    texto: "O uso de álcool ou outras substâncias tem ocupado mais tempo ou pensamentos do que você gostaria?",
    opcoes: [["Raramente ou nunca.", 0], ["Às vezes me pego pensando nisso durante o dia.", 1], ["Frequentemente, e isso afeta minha rotina.", 2]],
  },
  {
    texto: "Você já tentou diminuir ou parar por conta própria, sem o resultado desejado?",
    opcoes: [["Não, quando decido parar eu consigo.", 0], ["Tentei algumas vezes, mas depois volto.", 1], ["Tentei várias vezes e sinto que perdi o controle.", 2]],
  },
  {
    texto: "Pessoas próximas já demonstraram preocupação com seus hábitos?",
    opcoes: [["Ninguém nunca comentou.", 0], ["Alguém já fez um comentário discreto.", 1], ["É um assunto recorrente de conflito na família.", 2]],
  },
  {
    texto: "Você sente culpa, mal-estar ou ansiedade no dia seguinte ao uso?",
    opcoes: [["Não costumo sentir isso.", 0], ["Às vezes sinto um arrependimento passageiro.", 1], ["Sim, sinto forte remorso e ansiedade.", 2]],
  },
];

const resultados = [
  { ate: 2, titulo: "Sinais de risco baixo", texto: "Pelas suas respostas, você parece ter bom controle no momento. Continue atento ao seu bem-estar.",
    passos: ["Mantenha hábitos e hobbies saudáveis.", "Converse com alguém de confiança se algo mudar."] },
  { ate: 5, titulo: "Sinais de alerta", texto: "Há sinais de desconforto ou de perda parcial de controle. É um bom momento para conversar com um profissional.",
    passos: ["Procure um CAPS AD ou agende uma consulta com um psicólogo.", "Participe de um grupo de mútua ajuda para trocar experiências."] },
  { ate: 8, titulo: "Recomendamos buscar apoio agora", texto: "O consumo parece estar afetando bastante a sua rotina e o seu bem-estar. Pedir ajuda é um ato de coragem.",
    passos: ["Procure o CAPS AD mais próximo para acolhimento gratuito.", "Participe de grupos como AA ou NA.", "Converse com uma pessoa de confiança sobre o seu desejo de mudar."] },
];

let etapaAtual = 0;
let respostas = [];

function mostrarPergunta() {
  const pergunta = perguntas[etapaAtual];
  const porcentagem = ((etapaAtual + 1) / perguntas.length) * 100;

  $("#quiz-etapa").textContent = `Pergunta ${etapaAtual + 1} de ${perguntas.length}`;
  $("#quiz-barra").style.width = porcentagem + "%";
  $("#quiz-anterior").hidden = etapaAtual === 0;
  $("#quiz-proximo").textContent = etapaAtual === perguntas.length - 1 ? "Ver resultado" : "Próxima";

  $("#quiz-corpo").innerHTML = `
    <fieldset>
      <legend>${escapar(pergunta.texto)}</legend>
      ${pergunta.opcoes.map(([texto, pontos]) => `
        <label class="quiz__opcao">
          <input type="radio" name="resposta" value="${pontos}" ${respostas[etapaAtual] === pontos ? "checked" : ""}>
          ${escapar(texto)}
        </label>`).join("")}
    </fieldset>`;
}

function mostrarResultado() {
  const pontos = respostas.reduce((soma, valor) => soma + valor, 0);
  const r = resultados.find((item) => pontos <= item.ate);

  $("#quiz-etapa").textContent = "Concluído";
  $("#quiz-barra").style.width = "100%";
  $("#quiz-anterior").hidden = true;
  $("#quiz-proximo").hidden = true;
  $("#quiz-corpo").innerHTML = `
    <div class="quiz__resultado">
      <h3>${r.titulo}</h3>
      <p>${r.texto}</p>
      <p><strong>Próximos passos:</strong></p>
      <ul>${r.passos.map((p) => `<li>${p}</li>`).join("")}</ul>
      <button class="botao botao--secundario" id="quiz-refazer">Refazer</button>
    </div>`;
  $("#quiz-refazer").addEventListener("click", reiniciarQuiz);
}

function reiniciarQuiz() {
  etapaAtual = 0;
  respostas = [];
  $("#quiz-proximo").hidden = false;
  mostrarPergunta();
}

function iniciarQuiz() {
  $("#quiz-proximo").addEventListener("click", () => {
    const marcada = $('input[name="resposta"]:checked');
    if (!marcada) {
      mostrarStatus($("#quiz-etapa"), "Escolha uma opção para continuar.", "erro");
      return;
    }
    respostas[etapaAtual] = Number(marcada.value);

    if (etapaAtual === perguntas.length - 1) mostrarResultado();
    else { etapaAtual++; mostrarPergunta(); }
  });

  $("#quiz-anterior").addEventListener("click", () => { etapaAtual--; mostrarPergunta(); });
  mostrarPergunta();
}

/* 6) DEPOIMENTOS (Supabase) */
// Aparecem só enquanto o banco não tiver depoimentos aprovados.
const depoimentosExemplo = [
  { autor: "Exemplo ilustrativo", tempo: "Depoimento fictício", texto: "Aqui aparecerão os relatos aprovados da comunidade." },
];

function mostrarDepoimentos(lista) {
  $("#historias-lista").innerHTML = lista.map((d) => `
    <article class="cartao depoimento">
      <blockquote>“${escapar(d.texto)}”</blockquote>
      <div>
        <p class="depoimento__autor">${escapar(d.autor)}</p>
        <span class="depoimento__tempo">${escapar(d.tempo || "Membro da comunidade")}</span>
      </div>
    </article>`).join("");
}

async function carregarDepoimentos() {
  try {
    const lista = await buscarDepoimentos();
    mostrarDepoimentos(lista.length ? lista : depoimentosExemplo);
  } catch (erro) {
    console.error("Erro ao buscar depoimentos:", erro);
    mostrarDepoimentos(depoimentosExemplo);
  }
}

function iniciarFormularioHistoria() {
  $("#form-historia").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const formulario = evento.target;
    const botao = formulario.querySelector('[type="submit"]');
    const status = $("#historia-status");
    const dados = Object.fromEntries(new FormData(formulario));

    botao.disabled = true;
    mostrarStatus(status, "Enviando...");
    try {
      await enviarDepoimento(dados);
      formulario.reset();
      mostrarStatus(status, "Obrigado! Seu relato foi enviado para revisão.", "ok");
    } catch (erro) {
      console.error("Erro ao enviar depoimento:", erro);
      mostrarStatus(status, "Não foi possível enviar agora. Tente novamente.", "erro");
    } finally {
      botao.disabled = false;
    }
  });
}

/* 7) CONTATO (Supabase) */
function iniciarFormularioContato() {
  $("#form-contato").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const formulario = evento.target;
    const botao = formulario.querySelector('[type="submit"]');
    const status = $("#contato-status");
    const dados = Object.fromEntries(new FormData(formulario));

    botao.disabled = true;
    mostrarStatus(status, "Enviando...");
    try {
      await enviarMensagem(dados);
      formulario.reset();
      mostrarStatus(status, "Mensagem enviada. Responderemos com discrição.", "ok");
    } catch (erro) {
      console.error("Erro ao enviar mensagem:", erro);
      mostrarStatus(status, "Não foi possível enviar agora. Tente novamente.", "erro");
    } finally {
      botao.disabled = false;
    }
  });
}

/* 8) INÍCIO — roda quando a página termina de carregar */
document.addEventListener("DOMContentLoaded", () => {
  iniciarAcessibilidade();
  iniciarMenu();
  iniciarModais();
  iniciarClinicas();
  iniciarQuiz();
  carregarDepoimentos();
  iniciarFormularioHistoria();
  iniciarFormularioContato();
});