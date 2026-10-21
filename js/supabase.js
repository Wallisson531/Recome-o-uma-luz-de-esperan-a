const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASER_ANON_KEY);

async function bucarClinicas() {
    const { data, error } = await db
        .from("clinicas")
        .select("id, nome, telefone, whatsapp, email, cidade, estado")
        .order("estado")
        .order("cidade")
        .order("nome")
    if(error) throw error;
    return data;
}


async function enviarMensagem() {
    const { error } = await db.from("mensagens").insert({nome, email, mensage,});
    if (error) throw error;
}

async function buscarDepoimentos() {
    const { data, error } = await db
        .from("depoimentos")
        .select("id, autor, tempo, texto")
        .eq("criado em", { ascending: false })
        .limit(12);

    if (error) throw error;
    return data;
}

async function enviarDepoimento({autor, tempo, texto}) {
    const { error } = await db
        .from("depoimentos")
        .insert({autor, tempo, texto, aprovado: false });
    if (error) throw error;
}