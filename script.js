/* Paulo Móveis — comportamento do site */

/* ============================================================
   CONFIGURAÇÃO — ajuste aqui sem mexer no resto do código
   ------------------------------------------------------------
   ATENÇÃO: os valores abaixo são APENAS EXEMPLOS para o site
   funcionar. Troque pelos preços reais da marcenaria antes de
   publicar.
   ============================================================ */
const CONFIG = {
  // Número do WhatsApp com DDI e DDD, só dígitos (ex.: "5555999999999").
  // Vazio: o botão abre o WhatsApp para a pessoa escolher o contato.
  whatsapp: "",

  // Preço de referência por m² (largura × altura), em reais.
  precoPorM2: {
    "cozinha": 2800,
    "painel": 1800,
    "guarda-roupa": 2200,
    "closet": 2600,
    "escritorio": 2000,
  },

  // Multiplicador por material ou acabamento.
  material: {
    "mdf-liso": 1.0,
    "mdf-amadeirado": 1.15,
    "macica": 1.8,
  },
  materialPadrao: 1.15, // usado quando o material ainda não foi escolhido

  // A faixa mostrada vai de (1 - folga) a (1 + folga) do valor calculado.
  folga: 0.15,
  arredondarPara: 50,

  limites: {
    largura: { min: 0.2, max: 10 },
    altura: { min: 0.2, max: 4 },
  },
};

const NOMES = {
  tipo: {
    "cozinha": "Cozinha",
    "painel": "Painel de TV e sala",
    "guarda-roupa": "Guarda-roupa",
    "closet": "Closet",
    "escritorio": "Escritório",
  },
  material: {
    "mdf-liso": "MDF em cor lisa",
    "mdf-amadeirado": "MDF amadeirado",
    "macica": "Madeira maciça",
  },
};

/* ---------- menu no celular ---------- */

(function menu() {
  const botao = document.querySelector(".nav-toggle");
  const nav = document.getElementById("menu");
  if (!botao || !nav) return;

  const alternar = (abrir) => {
    nav.classList.toggle("is-open", abrir);
    botao.setAttribute("aria-expanded", String(abrir));
    botao.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
  };

  botao.addEventListener("click", () => alternar(!nav.classList.contains("is-open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) alternar(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { alternar(false); botao.focus(); }
  });
})();

/* ---------- calculadora ---------- */

(function calculadora() {
  const form = document.getElementById("calc-form");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const campos = {
    tipo: $("tipo"), material: $("material"),
    largura: $("largura"), altura: $("altura"), obs: $("obs"),
  };
  const valor = $("valor");
  const mensagem = $("valor-msg");
  const botao = $("solicitar");

  const moeda = new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", maximumFractionDigits: 0,
  });
  const metros = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  function lerMetros(texto) {
    const n = parseFloat(String(texto).trim().replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  }

  function erroMedida(nome, texto) {
    if (!texto.trim()) return "";
    const { min, max } = CONFIG.limites[nome];
    const n = lerMetros(texto);
    if (Number.isNaN(n) || n < min || n > max) {
      return `Use um valor entre ${metros.format(min)} e ${metros.format(max)} m, por exemplo 2,00.`;
    }
    return "";
  }

  function mostrarErro(nome, texto) {
    const campo = campos[nome];
    const alvo = $(`${nome}-erro`);
    alvo.textContent = texto;
    if (texto) campo.setAttribute("aria-invalid", "true");
    else campo.removeAttribute("aria-invalid");
  }

  function arredondar(n) {
    const passo = CONFIG.arredondarPara;
    return Math.round(n / passo) * passo;
  }

  function atualizar({ validar = false } = {}) {
    const tipo = campos.tipo.value;
    const material = campos.material.value;
    const larguraTxt = campos.largura.value;
    const alturaTxt = campos.altura.value;

    const erroL = erroMedida("largura", larguraTxt);
    const erroA = erroMedida("altura", alturaTxt);
    mostrarErro("largura", erroL);
    mostrarErro("altura", erroA);
    mostrarErro("tipo", validar && !tipo ? "Escolha o tipo de móvel." : "");

    const largura = lerMetros(larguraTxt);
    const altura = lerMetros(alturaTxt);
    const completo = tipo && !erroL && !erroA && largura > 0 && altura > 0;

    let faixa = "";
    if (completo) {
      const mult = material ? CONFIG.material[material] : CONFIG.materialPadrao;
      const base = largura * altura * CONFIG.precoPorM2[tipo] * mult;
      const baixo = arredondar(base * (1 - CONFIG.folga));
      const alto = arredondar(base * (1 + CONFIG.folga));
      faixa = `${moeda.format(baixo)} a ${moeda.format(alto)}`;
      valor.textContent = faixa;
      mensagem.textContent = material
        ? "Faixa orientativa. O valor final depende da avaliação do projeto."
        : "Escolha o material ou acabamento para refinar a faixa.";
    } else {
      valor.textContent = "R$ ———";
      mensagem.textContent = "";
    }

    atualizarBotao(faixa);
  }

  function atualizarBotao(faixa) {
    const partes = ["Olá, Paulo Móveis! Fiz uma simulação no site e gostaria de pedir um orçamento."];
    if (campos.tipo.value) partes.push(`Móvel: ${NOMES.tipo[campos.tipo.value]}.`);
    if (campos.material.value) partes.push(`Acabamento: ${NOMES.material[campos.material.value]}.`);
    if (campos.largura.value.trim() && campos.altura.value.trim()) {
      partes.push(`Medidas: ${campos.largura.value.trim()} m × ${campos.altura.value.trim()} m.`);
    }
    if (faixa) partes.push(`Estimativa do site: ${faixa}.`);
    if (campos.obs.value.trim()) partes.push(`Observações: ${campos.obs.value.trim()}`);

    const numero = CONFIG.whatsapp.replace(/\D/g, "");
    const texto = encodeURIComponent(partes.join(" "));
    botao.href = `https://wa.me/${numero}?text=${texto}`;
  }

  // Preenche a partir da simulação rápida da home (?tipo=&largura=&altura=)
  const params = new URLSearchParams(window.location.search);
  const tipoInicial = params.get("tipo");
  if (tipoInicial && NOMES.tipo[tipoInicial]) campos.tipo.value = tipoInicial;
  ["largura", "altura"].forEach((nome) => {
    const v = params.get(nome);
    if (v) campos[nome].value = v.slice(0, 8);
  });

  form.addEventListener("input", () => atualizar());
  form.addEventListener("change", () => atualizar());
  campos.tipo.addEventListener("blur", () => atualizar({ validar: true }));
  form.addEventListener("submit", (e) => { e.preventDefault(); atualizar({ validar: true }); });

  atualizar();
})();
