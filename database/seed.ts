import type Database from "better-sqlite3";

/**
 * Preenche o banco com exemplos em PT-BR na primeira execução (tabela features vazia).
 * Não roda de novo se já houver dados — assim você pode apagar o .sqlite para “resetar” o demo.
 */
export function seedIfEmpty(database: Database.Database): void {
  const row = database.prepare("SELECT COUNT(*) AS n FROM features").get() as { n: number };
  if (row.n > 0) {
    return;
  }

  const insertMember = database.prepare(`
    INSERT INTO team_members (name, created_at) VALUES (?, datetime('now', ?))
  `);
  const insertFeature = database.prepare(`
    INSERT INTO features (title, description, status, created_at)
    VALUES (?, ?, ?, datetime('now', ?))
  `);
  const insertItem = database.prepare(`
    INSERT INTO backlog_items (title, description, status, priority, feature_id, assignee_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const run = database.transaction(() => {
    const ana = Number(insertMember.run("Ana Silva", "-30 days").lastInsertRowid);
    const bruno = Number(insertMember.run("Bruno Costa", "-29 days").lastInsertRowid);
    const carla = Number(insertMember.run("Carla Mendes", "-28 days").lastInsertRowid);

    const f1 = insertFeature.run(
      "Portal do cliente",
      "Área logada para clientes: visão de projetos, tickets e avisos. É o epic principal deste trimestre.",
      "in_progress",
      "-20 days"
    ).lastInsertRowid;

    insertItem.run("Login com e-mail e senha", "Fluxo de login, recuperação de senha e sessão segura.", "done", "high", f1, ana, "-18 days");
    insertItem.run(
      "Dashboard com resumo de status",
      "Cards com últimas atualizações e métricas simples.",
      "doing",
      "high",
      f1,
      bruno,
      "-15 days"
    );
    insertItem.run(
      "Notificações in-app",
      "Bell icon + lista de notificações lidas/não lidas.",
      "todo",
      "medium",
      f1,
      carla,
      "-12 days"
    );
    insertItem.run(
      "Exportar histórico em PDF",
      "Relatório mensal para o cliente baixar.",
      "todo",
      "low",
      f1,
      null,
      "-10 days"
    );

    const f2 = insertFeature.run(
      "Relatórios exportáveis",
      "Permitir que o squad gere relatórios filtrados e exporte para planilha ou PDF.",
      "in_progress",
      "-19 days"
    ).lastInsertRowid;

    insertItem.run("Filtros por squad, épico e período", "Query builder simples na UI.", "done", "medium", f2, ana, "-17 days");
    insertItem.run("Exportação CSV", "Download com encoding UTF-8 e cabeçalhos corretos.", "doing", "high", f2, bruno, "-14 days");
    insertItem.run("Exportação PDF", "Layout básico com logo e tabelas.", "todo", "medium", f2, ana, "-11 days");

    const f3 = insertFeature.run(
      "App mobile (MVP)",
      "Versão mobile para acompanhar backlog e marcar tarefas em campo.",
      "a_iniciar",
      "-16 days"
    ).lastInsertRowid;

    insertItem.run(
      "Lista de itens por feature",
      "Navegação por epic e lista com prioridade.",
      "todo",
      "high",
      f3,
      carla,
      "-14 days"
    );
    insertItem.run(
      "Marcar item como Doing/Done",
      "Atualização de status com confirmação.",
      "todo",
      "medium",
      f3,
      bruno,
      "-13 days"
    );
    insertItem.run(
      "Modo offline (cache local)",
      "Ler backlog sem rede; fila de sync (conceito para o demo).",
      "todo",
      "low",
      f3,
      null,
      "-12 days"
    );

    const f5 = insertFeature.run(
      "Integrações com terceiros",
      "Webhooks e APIs para conectar com Slack, Jira e sistemas legados do cliente.",
      "a_iniciar",
      "-5 days"
    ).lastInsertRowid;

    insertItem.run("Mapeamento das APIs disponíveis", "Levantamento de endpoints e autenticação.", "todo", "medium", f5, ana, "-4 days");
    insertItem.run("Protótipo webhook para Slack", "Enviar notificação de status ao canal do squad.", "todo", "high", f5, null, "-3 days");

    const f4 = insertFeature.run(
      "Melhorias de DX internas",
      "Documentação, scripts e padronização para o time desenvolver mais rápido.",
      "completed",
      "-25 days"
    ).lastInsertRowid;

    insertItem.run(
      "README do repositório com setup local",
      "Passo a passo para novo dev subir o ambiente em menos de 15 minutos.",
      "done",
      "medium",
      f4,
      ana,
      "-24 days"
    );
    insertItem.run(
      "Script npm para lint e testes",
      "Um comando único antes do PR.",
      "done",
      "low",
      f4,
      bruno,
      "-23 days"
    );
    insertItem.run(
      "Guia de convenções de commit",
      "Prefixos feat/fix/docs e exemplos.",
      "done",
      "low",
      f4,
      carla,
      "-22 days"
    );
  });

  run();
}
