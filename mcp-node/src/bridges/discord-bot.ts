/**
 * Discord Bot Bridge — slash commands for SkillChain operations.
 * ================================================================
 * Provides Discord slash commands for skill/chain execution,
 * search, and gamification. Uses the shared service layer.
 *
 * Start: node dist/bridges/discord-bot.js
 * Requires: DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID env vars.
 */
import { SkillChainService, type ServiceConfig } from "../service.js";

// ---------------------------------------------------------------------------
// Types (minimal Discord.js compatible interfaces)
// We define these so the module compiles even without discord.js installed.
// At runtime, discord.js is dynamically imported.
// ---------------------------------------------------------------------------

interface DiscordBotConfig {
  token: string;
  clientId: string;
  serviceConfig: ServiceConfig;
}

interface SlashCommandResult {
  content: string;
  ephemeral?: boolean;
}

// ---------------------------------------------------------------------------
// Bot
// ---------------------------------------------------------------------------

export class DiscordBot {
  private service: SkillChainService;
  private config: DiscordBotConfig;
  private client: unknown = null;

  constructor(config: DiscordBotConfig) {
    this.config = config;
    this.service = new SkillChainService(config.serviceConfig);
  }

  /**
   * Start the Discord bot. Dynamically imports discord.js.
   */
  async start(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let discord: any;
    try {
      // Dynamic import — discord.js is an optional dependency
      const moduleName = "discord.js";
      discord = await import(/* webpackIgnore: true */ moduleName);
    } catch {
      throw new Error(
        "discord.js is not installed. Run: npm install discord.js\n" +
        "Then set DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID environment variables."
      );
    }

    const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = discord;

    // Register slash commands
    const commands = [
      new SlashCommandBuilder()
        .setName("skills")
        .setDescription("List available SkillChain skills")
        .addStringOption((opt: any) =>
          opt.setName("domain").setDescription("Filter by domain").setRequired(false)
        ),
      new SlashCommandBuilder()
        .setName("chains")
        .setDescription("Search for skill chains")
        .addStringOption((opt: any) =>
          opt.setName("query").setDescription("What you need help with").setRequired(true)
        ),
      new SlashCommandBuilder()
        .setName("compose")
        .setDescription("Dynamically compose a skill chain")
        .addStringOption((opt: any) =>
          opt.setName("query").setDescription("What you want to accomplish").setRequired(true)
        ),
      new SlashCommandBuilder()
        .setName("whatnow")
        .setDescription("Ask Velma what you should do right now"),
      new SlashCommandBuilder()
        .setName("trainer")
        .setDescription("Show your trainer card"),
    ].map((cmd: any) => cmd.toJSON());

    const rest = new REST({ version: "10" }).setToken(this.config.token);
    await rest.put(
      Routes.applicationCommands(this.config.clientId),
      { body: commands },
    );

    // Create client
    const client = new Client({
      intents: [GatewayIntentBits.Guilds],
    });

    client.on("interactionCreate", async (interaction: unknown) => {
      const i = interaction as {
        isChatInputCommand: () => boolean;
        commandName: string;
        options: { getString: (name: string) => string | null };
        reply: (opts: { content: string; ephemeral?: boolean }) => Promise<void>;
        deferReply: () => Promise<void>;
        editReply: (opts: { content: string }) => Promise<void>;
      };

      if (!i.isChatInputCommand()) return;

      try {
        const result = await this.handleCommand(i.commandName, {
          domain: i.options.getString("domain"),
          query: i.options.getString("query"),
        });

        await i.reply({
          content: result.content.slice(0, 2000), // Discord 2000 char limit
          ephemeral: result.ephemeral,
        });
      } catch (err) {
        await i.reply({
          content: `Error: ${(err as Error).message}`,
          ephemeral: true,
        });
      }
    });

    client.on("ready", () => {
      console.log("SkillChain Discord bot is online!");
    });

    await client.login(this.config.token);
    this.client = client;
  }

  /**
   * Handle a slash command. Also usable directly for testing.
   */
  async handleCommand(
    command: string,
    options: Record<string, string | null>,
  ): Promise<SlashCommandResult> {
    switch (command) {
      case "skills": {
        const skills = this.service.listSkills();
        const domain = options.domain?.toLowerCase();
        const filtered = domain
          ? skills.filter(s => s.domain.toLowerCase().includes(domain))
          : skills.slice(0, 20);

        const lines = filtered.map(s =>
          `**${s.name}** (${s.domain}) — ${s.description.slice(0, 60)}${s.description.length > 60 ? "..." : ""}`
        );
        return {
          content: `**Skills** (${filtered.length}/${skills.length}):\n${lines.join("\n") || "No skills found."}`,
        };
      }

      case "chains": {
        const query = options.query ?? "";
        if (!query) return { content: "Please provide a search query.", ephemeral: true };

        const matches = this.service.searchChains(query, 5);
        if (matches.length === 0) return { content: `No chains found for "${query}".` };

        const lines = matches.map((m, i) =>
          `${i + 1}. **${m.chain_name}** (${m.category}) — ${m.description.slice(0, 80)}\n   Skills: ${m.skills.join(", ")} | Score: ${m.score}`
        );
        return { content: `**Chain matches for** "${query}":\n\n${lines.join("\n\n")}` };
      }

      case "compose": {
        const query = options.query ?? "";
        if (!query) return { content: "Please describe what you want to accomplish.", ephemeral: true };

        const result = this.service.composeChain(query);
        if (result.steps.length === 0) {
          return { content: `Couldn't compose a chain for "${query}". Try searching with /chains instead.` };
        }

        const steps = result.steps.map((s, i) =>
          `${i + 1}. **${s.skill_name}** — ${s.selection_reason}`
        ).join("\n");

        return {
          content:
            `**Composed Chain:** ${result.chain_name} (${result.type})\n` +
            `Confidence: ${Math.round(result.confidence * 100)}%\n\n` +
            `${steps}\n\n` +
            `_Coverage: ${Math.round(result.coverage_score * 100)}% | Coherence: ${Math.round(result.coherence_score * 100)}% | Trust: ${Math.round(result.trust_score * 100)}%_`,
        };
      }

      case "whatnow": {
        const recs = this.service.whatNow() as Array<{ chain_name: string; nudge: string; priority: number }>;
        if (recs.length === 0) return { content: "No recommendations right now. You're all caught up!" };

        const lines = recs.slice(0, 3).map(r =>
          `**${r.chain_name}** — ${r.nudge}`
        );
        return { content: `**Velma says:**\n\n${lines.join("\n\n")}` };
      }

      case "trainer": {
        const card = this.service.getTrainerCard() as Record<string, unknown>;
        return {
          content:
            `**Trainer Card**\n` +
            `Level ${card.level} ${card.title} | ${card.xp} XP\n` +
            `Streak: ${card.streak_current} days (best: ${card.streak_best})\n` +
            `Skills: ${card.skills_discovered} | Chains: ${card.chains_completed}\n` +
            `Achievements: ${card.achievements_unlocked}/${card.total_achievements}\n` +
            `Progress to next: ${card.progress_pct}%`,
        };
      }

      default:
        return { content: `Unknown command: ${command}`, ephemeral: true };
    }
  }
}

// ---------------------------------------------------------------------------
// CLI entry point (when run directly)
// ---------------------------------------------------------------------------

const isMainModule = process.argv[1]?.includes("discord-bot");
if (isMainModule) {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!token || !clientId) {
    console.error("Set DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID environment variables.");
    process.exit(1);
  }

  // Find marketplace
  const homePath = process.env.HOME ?? process.env.USERPROFILE ?? "";
  const marketplaceDirs = [
    `${homePath}/.skillchain/marketplace`,
    new URL("../../../marketplace", import.meta.url).pathname,
  ];
  const marketplaceDir = marketplaceDirs.find(d => {
    try { return require("fs").existsSync(d); } catch { return false; }
  }) ?? marketplaceDirs[0];

  const bot = new DiscordBot({
    token,
    clientId,
    serviceConfig: { marketplaceDir },
  });

  bot.start().catch(err => {
    console.error("Failed to start Discord bot:", err);
    process.exit(1);
  });
}
