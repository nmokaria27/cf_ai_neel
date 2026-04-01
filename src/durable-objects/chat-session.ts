import { DurableObject } from "cloudflare:workers";
import type { Env } from "../env";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
}

export class ChatSession extends DurableObject<Env> {
  private initialized = false;

  private ensureTable(): void {
    if (!this.initialized) {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS messages (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          role       TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
          content    TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
      this.initialized = true;
    }
  }

  async addMessage(role: "user" | "assistant" | "system", content: string): Promise<Message> {
    this.ensureTable();
    this.ctx.storage.sql.exec(
      "INSERT INTO messages (role, content) VALUES (?, ?)",
      role,
      content
    );
    return { role, content };
  }

  async getHistory(limit: number = 50): Promise<Message[]> {
    this.ensureTable();
    const rows = this.ctx.storage.sql
      .exec(
        "SELECT role, content, created_at FROM messages ORDER BY id DESC LIMIT ?",
        limit
      )
      .toArray() as unknown as Message[];
    return rows.reverse();
  }

  async getMessageCount(): Promise<number> {
    this.ensureTable();
    const row = this.ctx.storage.sql
      .exec("SELECT COUNT(*) as count FROM messages")
      .one() as { count: number };
    return row.count;
  }

  async clearHistory(): Promise<void> {
    this.ensureTable();
    this.ctx.storage.sql.exec("DELETE FROM messages");
  }
}
