const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = 3000;

// =========================
// Configurações
// =========================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos do frontend
app.use(express.static(path.join(__dirname, "public")));

// =========================
// Banco de dados
// =========================

const db = new Database("./database/musica.db");

// Criar tabela caso ela ainda não exista
db.prepare(`
    CREATE TABLE IF NOT EXISTS suggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        music TEXT NOT NULL,
        username TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

// Adiciona a coluna status caso ela ainda não exista
const columns = db.prepare(`
    PRAGMA table_info(suggestions)
`).all();

const hasStatusColumn = columns.some(column => column.name === "status");

if (!hasStatusColumn) {
    db.prepare(`
        ALTER TABLE suggestions
        ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'
    `).run();

    console.log("Coluna status adicionada à tabela suggestions.");
}

// =========================
// Rotas
// =========================

// Receber uma sugestão
app.post("/api/suggestions", (req, res) => {

    const { music, username } = req.body;

    // Validação
    if (!music || !username) {
        return res.status(400).json({
            success: false,
            message: "Música e nome são obrigatórios."
        });
    }

    try {

        const statement = db.prepare(`
            INSERT INTO suggestions (music, username, status)
            VALUES (?, ?, 'pending')
`       );

        const result = statement.run(
            music.trim(),
            username.trim()
        );

        res.status(201).json({
            success: true,
            message: "Sugestão enviada com sucesso!",
            id: result.lastInsertRowid
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Erro ao salvar a sugestão."
        });
    }
});

// Buscar todas as sugestões
app.get("/api/suggestions", (req, res) => {

    try {

        const suggestions = db.prepare(`
            SELECT id, music, username, status, created_at
            FROM suggestions
            ORDER BY created_at DESC
        `).all();

        res.json({
            success: true,
            suggestions: suggestions
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Erro ao buscar sugestões."
        });
    }
});

// =========================
// Iniciar servidor
// =========================

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// Alterar status de uma sugestão
app.patch("/api/suggestions/:id", (req, res) => {

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
        "pending",
        "accepted",
        "rejected"
    ];

    if (!validStatuses.includes(status)) {

        return res.status(400).json({
            success: false,
            message: "Status inválido."
        });
    }

    try {

        const statement = db.prepare(`
            UPDATE suggestions
            SET status = ?
            WHERE id = ?
        `);

        const result = statement.run(status, id);

        if (result.changes === 0) {

            return res.status(404).json({
                success: false,
                message: "Sugestão não encontrada."
            });
        }

        res.json({
            success: true,
            message: "Status atualizado com sucesso."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Erro ao atualizar sugestão."
        });
    }
});