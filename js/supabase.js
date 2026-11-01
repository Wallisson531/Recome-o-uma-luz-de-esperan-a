const SUPABASE_URL = "https://ccwficykozlvazbatqqs.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_WGBA2RLh8fZ4rIbfOP3HAg_AFmnmpNP";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function buscarClinicas() {
  const { data, error } = await db
    .from("clinicas")
    .select("id, nome, telefone, whatsapp, email, cidade, estado")
    .order("estado")
    .order("cidade")
    .order("nome");

  if (error) throw error;
  return data;
}

async function enviarMensagem({ nome, email, mensagem }) {
  const { error } = await db.from("mensagens").insert({ nome, email, mensagem });
  if (error) throw error;
}

async function buscarDepoimentos() {
  const { data, error } = await db
    .from("depoimentos")
    .select("id, autor, tempo, texto")
    .eq("aprovado", true)
    .order("criado_em", { ascending: false })
    .limit(12);

  if (error) throw error;
  return data;
}

async function enviarDepoimento({ autor, tempo, texto }) {
  const { error } = await db
    .from("depoimentos")
    .insert({ autor, tempo, texto, aprovado: false });
  if (error) throw error;
}