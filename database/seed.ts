import type { Database as SqlJsDatabase } from "sql.js";

/**
 * Preenche o banco com exemplos em PT-BR na primeira execução (tabela features vazia).
 * Não roda de novo se já houver dados — assim você pode apagar o .sqlite para "resetar" o demo.
 */
export function seedIfEmpty(database: SqlJsDatabase): void {
  const result = database.exec("SELECT COUNT(*) AS n FROM features");
  const count = result.length > 0 ? (result[0].values[0][0] as number) : 0;
  if (count > 0) {
    return;
  }

  const runInsert = (sql: string, params: unknown[]): number => {
    database.run(sql, params.map((v) => (v === null || v === undefined ? null : v) as string | number | null));
    const row = database.exec("SELECT last_insert_rowid() AS id");
    return row.length > 0 ? (row[0].values[0][0] as number) : 0;
  };

  const insertMemberSql = `INSERT INTO team_members (name, created_at) VALUES (?, datetime('now', ?))`;
  const insertFeatureSql = `INSERT INTO features (title, description, status, created_at) VALUES (?, ?, ?, datetime('now', ?))`;
  const insertItemSql = `INSERT INTO backlog_items (title, description, status, priority, feature_id, assignee_id, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))`;

  try {
    database.run("BEGIN TRANSACTION");

    const ana = runInsert(insertMemberSql, ["Ana Silva", "-30 days"]);
    const bruno = runInsert(insertMemberSql, ["Bruno Costa", "-29 days"]);
    const carla = runInsert(insertMemberSql, ["Carla Mendes", "-28 days"]);

    const f1 = runInsert(insertFeatureSql, [
      "Portal do cliente",
      "Área logada para clientes: visão de projetos, tickets e avisos. É o epic principal deste trimestre.",
      "in_progress",
      "-20 days"
    ]);

    runInsert(insertItemSql, ["Login com e-mail e senha", "Fluxo de login, recuperação de senha e sessão segura.", "done", "high", f1, ana, "-18 days"]);
    runInsert(insertItemSql, [
      "Dashboard com resumo de status",
      "Cards com últimas atualizações e métricas simples.",
      "doing",
      "high",
      f1,
      bruno,
      "-15 days"
    ]);
    runInsert(insertItemSql, [
      "Notificações in-app",
      "Bell icon + lista de notificações lidas/não lidas.",
      "todo",
      "medium",
      f1,
      carla,
      "-12 days"
    ]);
    runInsert(insertItemSql, [
      "Exportar histórico em PDF",
      "Relatório mensal para o cliente baixar.",
      "todo",
      "low",
      f1,
      null,
      "-10 days"
    ]);

    const f2 = runInsert(insertFeatureSql, [
      "Relatórios exportáveis",
      "Permitir que o squad gere relatórios filtrados e exporte para planilha ou PDF.",
      "in_progress",
      "-19 days"
    ]);

    runInsert(insertItemSql, ["Filtros por squad, épico e período", "Query builder simples na UI.", "done", "medium", f2, ana, "-17 days"]);
    runInsert(insertItemSql, ["Exportação CSV", "Download com encoding UTF-8 e cabeçalhos corretos.", "doing", "high", f2, bruno, "-14 days"]);
    runInsert(insertItemSql, ["Exportação PDF", "Layout básico com logo e tabelas.", "todo", "medium", f2, ana, "-11 days"]);

    const f3 = runInsert(insertFeatureSql, [
      "App mobile (MVP)",
      "Versão mobile para acompanhar backlog e marcar tarefas em campo.",
      "a_iniciar",
      "-16 days"
    ]);

    runInsert(insertItemSql, [
      "Lista de itens por feature",
      "Navegação por epic e lista com prioridade.",
      "todo",
      "high",
      f3,
      carla,
      "-14 days"
    ]);
    runInsert(insertItemSql, [
      "Marcar item como Doing/Done",
      "Atualização de status com confirmação.",
      "todo",
      "medium",
      f3,
      bruno,
      "-13 days"
    ]);
    runInsert(insertItemSql, [
      "Modo offline (cache local)",
      "Ler backlog sem rede; fila de sync (conceito para o demo).",
      "todo",
      "low",
      f3,
      null,
      "-12 days"
    ]);

    const f5 = runInsert(insertFeatureSql, [
      "Integrações com terceiros",
      "Webhooks e APIs para conectar com Slack, Jira e sistemas legados do cliente.",
      "a_iniciar",
      "-5 days"
    ]);

    runInsert(insertItemSql, ["Mapeamento das APIs disponíveis", "Levantamento de endpoints e autenticação.", "todo", "medium", f5, ana, "-4 days"]);
    runInsert(insertItemSql, ["Protótipo webhook para Slack", "Enviar notificação de status ao canal do squad.", "todo", "high", f5, null, "-3 days"]);

    const f4 = runInsert(insertFeatureSql, [
      "Melhorias de DX internas",
      "Documentação, scripts e padronização para o time desenvolver mais rápido.",
      "completed",
      "-25 days"
    ]);

    runInsert(insertItemSql, [
      "README do repositório com setup local",
      "Passo a passo para novo dev subir o ambiente em menos de 15 minutos.",
      "done",
      "medium",
      f4,
      ana,
      "-24 days"
    ]);
    runInsert(insertItemSql, [
      "Script npm para lint e testes",
      "Um comando único antes do PR.",
      "done",
      "low",
      f4,
      bruno,
      "-23 days"
    ]);
    runInsert(insertItemSql, [
      "Guia de convenções de commit",
      "Prefixos feat/fix/docs e exemplos.",
      "done",
      "low",
      f4,
      carla,
      "-22 days"
    ]);

    database.run("COMMIT");
  } catch (err) {
    database.run("ROLLBACK");
    throw err;
  }
}
