/**
 * Poison Snake Theme Extension
 *
 * Unified toggle for the poison-snake theme and/or footer.
 *
 * Usage:
 *   /poison-snake           — toggle both theme + footer (default)
 *   /poison-snake theme     — toggle only the theme
 *   /poison-snake footer    — toggle only the footer
 *   /poison-snake all       — toggle both theme + footer
 */

import type { AssistantMessage } from "@earendil-works/pi-ai";
import type { ExtensionAPI, Theme } from "@earendil-works/pi-coding-agent";
import { isBashToolResult } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import * as os from "node:os";
import { execFileSync } from "node:child_process";

// ── Poison-snake palette (hex → ANSI truecolor) ───────────────────────────
function rgb(r: number, g: number, b: number) {
	return `\x1b[38;2;${r};${g};${b}m`;
}
const RST  = "\x1b[0m";
const DIM  = "\x1b[2m";
const BOLD = "\x1b[1m";

const C_AMBER  = rgb(190, 255,  59);   // cwd / directory
const C_ORANGE = rgb( 37, 255,  73);   // git branch
const C_PEACH  = rgb(255, 183, 122);   // active turn
const C_RUST   = rgb(210,  90,  40);   // compaction
const C_RED    = rgb(230,  70,  60);   // error exit code
const C_GOLD   = rgb(255, 215,   0);   // thinking level
const C_TEAL   = rgb( 80, 200, 180);   // token in
const C_MINT   = rgb(100, 220, 140);   // token out
const C_SKY    = rgb(100, 170, 255);   // cache read
const C_VIOLET = rgb(190, 140, 255);   // cache write
const C_LIME   = rgb(170, 230,  80);   // healthy context
const C_CREAM  = rgb(240, 215, 170);   // cost
const C_SAND   = rgb(200, 180, 130);   // model id
const C_COPPER = rgb(185, 110,  40);   // separators / dim text
const C_SMOKE  = rgb(130, 120, 110);   // very dim info

const SEP = `${C_COPPER} › ${RST}`;

// ── Footer helpers ────────────────────────────────────────────────────────
function shortPath(fullPath: string, maxLen = 38): string {
	const home = normalizePath(os.homedir());
	let p = normalizePath(fullPath || process.cwd());
	if (p.toLowerCase().startsWith(home.toLowerCase())) {
		p = "~" + p.slice(home.length);
	}
	if (visibleWidth(p) <= maxLen) return p;
	const parts = p.split("/");
	while (parts.length > 3 && visibleWidth(parts.join("/")) > maxLen) {
		parts.splice(1, 1);
		if (parts.length > 2) parts[1] = "…";
	}
	return parts.join("/");
}

function normalizePath(p: string): string {
	return p.replace(/\\/g, "/");
}

function assistantUsage(entry: unknown): { input: number; output: number; cacheRead: number; cacheWrite: number; cost: number } {
	const message = (entry as { message?: Partial<AssistantMessage> }).message;
	const usage = message?.usage;
	return {
		input: usage?.input ?? 0,
		output: usage?.output ?? 0,
		cacheRead: usage?.cacheRead ?? 0,
		cacheWrite: usage?.cacheWrite ?? 0,
		cost: usage?.cost?.total ?? 0,
	};
}

function fmtTokens(n: number): string {
	if (n === 0) return "0";
	if (n < 1000) return `${n}`;
	if (n < 10_000) return `${(n / 1000).toFixed(1)}k`;
	if (n < 1_000_000) return `${Math.round(n / 1000)}k`;
	if (n < 10_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	return `${Math.round(n / 1_000_000)}M`;
}

function fmtDuration(ms: number): string {
	const totalSec = Math.floor(ms / 1000);
	const d = Math.floor(totalSec / 86400);
	const h = Math.floor((totalSec % 86400) / 3600);
	const m = Math.floor((totalSec % 3600) / 60);
	if (d > 0) return `${d}d${h.toString().padStart(2, "0")}h${m.toString().padStart(2, "0")}m`;
	if (h > 0) return `${h}h${m.toString().padStart(2, "0")}m`;
	return `${m}m`;
}

function fmtDateTime(): string {
	const now = new Date();
	const y = now.getFullYear();
	const mo = (now.getMonth() + 1).toString().padStart(2, "0");
	const d = now.getDate().toString().padStart(2, "0");
	const h = now.getHours().toString().padStart(2, "0");
	const mi = now.getMinutes().toString().padStart(2, "0");
	return `${y}-${mo}-${d} ${h}:${mi}`;
}

function gitBranchFromCwd(cwd: string): string | null {
	try {
		const branch = execFileSync("git", ["-C", cwd, "branch", "--show-current"], {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
			timeout: 300,
		}).trim();
		if (branch) return branch;

		const head = execFileSync("git", ["-C", cwd, "rev-parse", "--short", "HEAD"], {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
			timeout: 300,
		}).trim();
		return head ? `detached:${head}` : null;
	} catch {
		return null;
	}
}

function fmtContextUsage(ctx: any): string | undefined {
	const contextUsage = ctx.getContextUsage?.();
	const contextWindow = contextUsage?.contextWindow ?? ctx.model?.contextWindow ?? 0;
	if (!contextWindow) return undefined;

	const percent = contextUsage?.percent;
	const percentValue = typeof percent === "number" ? percent : 0;
	const percentText = percent === null || percent === undefined ? "?" : `${percentValue.toFixed(1)}%`;
	const text = `${percentText}/${fmtTokens(contextWindow)}`;

	if (percentValue > 90) return `${C_RED}${BOLD}◔ ${text}${RST}`;
	if (percentValue > 70) return `${C_GOLD}◔ ${text}${RST}`;
	return `${C_LIME}◔ ${text}${RST}`;
}

function composeLine(left: string, right: string, width: number): string[] {
	const leftW = visibleWidth(left);
	const rightW = visibleWidth(right);
	const gap = width - leftW - rightW;
	if (gap >= 1) {
		return [truncateToWidth(left + " ".repeat(gap) + right, width)];
	}
	const lines: string[] = [];
	if (left) lines.push(truncateToWidth(left, width));
	if (right) {
		const pad = Math.max(0, width - rightW);
		lines.push(" ".repeat(pad) + truncateToWidth(right, width));
	}
	return lines;
}

// ── Extension ──────────────────────────────────────────────────────────────
export default function (pi: ExtensionAPI) {
	// ── State ─────────────────────────────────────────────────
	let lastExitCode: number | null = null;
	let turnCount = 0;
	let agentActive = false;
	let thinkingLevel = "off";
	let footerEnabled = false;
	let sessionStartTime = 0;
	let compactionCount = 0;
	let previousTheme: string | undefined;
	let headerInstalled = false;

	pi.on("tool_result", async (event) => {
		if (isBashToolResult(event)) {
			lastExitCode = event.details?.exitCode ?? 0;
		}
	});

	pi.on("turn_start", async () => {
		agentActive = true;
		turnCount++;
	});
	pi.on("turn_end", async () => {
		agentActive = false;
	});
	pi.on("agent_end", async () => {
		agentActive = false;
	});

	pi.on("session_compact", async () => {
		compactionCount++;
	});

	pi.on("model_select", async () => {
		thinkingLevel = pi.getThinkingLevel();
	});

	pi.on("session_start", async (_event, ctx) => {
		thinkingLevel = pi.getThinkingLevel();
		sessionStartTime = 0;
		compactionCount = 0;

		// Auto-enable if poison-snake theme is active
		const themeOn = ctx.ui.theme?.name === "poison-snake";
		if (themeOn) {
			if (!footerEnabled) {
				footerEnabled = true;
				installFooter(ctx);
			}
			if (!headerInstalled) {
				headerInstalled = true;
				installHeader(ctx);
			}
		}
	});

	// ── Footer install ──────────────────────────────────────────────

	function installFooter(ctx: any) {
		ctx.ui.setFooter((tui: any, _theme: any, footerData: any) => {
			const unsub = footerData.onBranchChange(() => tui.requestRender());

			return {
				dispose: unsub,
				invalidate() {},

				render(width: number): string[] {
					try {
						return renderFooter(width, footerData);
					} catch (error) {
						const message = error instanceof Error ? error.message : String(error);
						const fallback = `${C_RED}${BOLD}poison-snake-footer error:${RST} ${C_SMOKE}${message}${RST}`;
						return [truncateToWidth(fallback, Math.max(0, width))];
					}
				},
			};
		});

		function renderFooter(width: number, footerData: any): string[] {
			const safeWidth = Math.max(0, width);
			if (safeWidth === 0) return [""];

			const cwd = ctx.cwd ?? process.cwd();
			const branch = footerData.getGitBranch() ?? gitBranchFromCwd(cwd);
			const model = ctx.model?.id ?? "no model";
			thinkingLevel = pi.getThinkingLevel();

			let tokIn = 0, tokOut = 0, cacheRead = 0, cacheWrite = 0, cost = 0;
			for (const e of ctx.sessionManager.getEntries()) {
				if (e.type === "message" && e.message.role === "assistant") {
					const usage = assistantUsage(e);
					tokIn      += usage.input;
					tokOut     += usage.output;
					cacheRead  += usage.cacheRead;
					cacheWrite += usage.cacheWrite;
					cost       += usage.cost;
				}
			}

			// LINE 1: session location (left) + session activity (right)
			const leftParts: string[] = [];
			leftParts.push(`${C_AMBER}${BOLD}󰉋 ${shortPath(cwd)}${RST}`);
			if (branch) {
				leftParts.push(`${C_ORANGE}⎇ ${branch}${RST}`);
			}
			const line1Left = leftParts.join(SEP);

			const rParts: string[] = [];
			if (agentActive) {
				rParts.push(`${C_PEACH}⟳ ${turnCount}${RST}`);
			} else {
				rParts.push(`${C_SMOKE}⟳ ${turnCount}${RST}`);
			}

			if (sessionStartTime === 0) {
				const header = ctx.sessionManager.getHeader();
				if (header?.timestamp) {
					sessionStartTime = new Date(header.timestamp).getTime();
				}
			}
			const elapsed = sessionStartTime > 0 ? Date.now() - sessionStartTime : 0;
			if (elapsed >= 60_000) {
				rParts.push(`${C_SMOKE}⏱  ${fmtDuration(elapsed)}${RST}`);
			}

			const tokenParts: string[] = [];
			if (tokIn > 0) tokenParts.push(`${C_TEAL}↑ ${BOLD}${fmtTokens(tokIn)}${RST}`);
			if (tokOut > 0) tokenParts.push(`${C_MINT}↓ ${BOLD}${fmtTokens(tokOut)}${RST}`);
			if (cacheRead > 0) tokenParts.push(`${C_SKY}⚡ ${BOLD}${fmtTokens(cacheRead)}${RST}`);
			if (cacheWrite > 0) tokenParts.push(`${C_VIOLET}✎ ${BOLD}${fmtTokens(cacheWrite)}${RST}`);
			if (tokenParts.length > 0) {
				rParts.push(tokenParts.join(" "));
			}

			if (lastExitCode !== null && lastExitCode !== 0) {
				rParts.push(`${C_RED}${BOLD}✗ ${lastExitCode}${RST}`);
			}

			rParts.push(`${C_RUST}♻  ${compactionCount}${RST}`);

			const contextPart = fmtContextUsage(ctx);
			if (contextPart) {
				rParts.push(contextPart);
			}

			const usingSubscription = ctx.model ? ctx.modelRegistry.isUsingOAuth(ctx.model) : false;
			if (cost > 0 || usingSubscription) {
				const subTag = usingSubscription ? " (sub)" : "";
				rParts.push(`${C_CREAM}💰 $${cost.toFixed(3)}${subTag}${RST}`);
			}

			const line1Right = rParts.join(SEP);

			// LINE 2: session identity (left) + model config (right)
			const line2LeftParts: string[] = [];
			const sessionName = ctx.sessionManager.getSessionName();
			if (sessionName) {
				line2LeftParts.push(`${C_COPPER}${DIM}📌 ${sessionName}${RST}`);
			}
			line2LeftParts.push(`${C_SMOKE}🐍 ${fmtDateTime()}${RST}`);
			const line2Left = line2LeftParts.join(SEP);

			const line2RightParts: string[] = [];
			if (thinkingLevel && thinkingLevel !== "off") {
				const thinkColors: Record<string, string> = {
					minimal: C_SMOKE,
					low:     C_SAND,
					medium:  C_GOLD,
					high:    C_ORANGE,
					xhigh:   C_RED,
				};
				const tc = thinkColors[thinkingLevel] ?? C_GOLD;
				line2RightParts.push(`${tc}🧠 ${thinkingLevel}${RST}`);
			}

			const provider = ctx.model?.provider;
			if (provider) line2RightParts.push(`${C_COPPER}☁  ${provider}${RST}`);
			line2RightParts.push(`${C_SAND}${DIM}⬡ ${model}${RST}`);
			const line2Right = line2RightParts.join(SEP);

			const lines: string[] = [];
			lines.push(...composeLine(line1Left, line1Right, safeWidth));
			lines.push(...composeLine(line2Left, line2Right, safeWidth));

			const extensionStatuses = footerData.getExtensionStatuses();
			if (extensionStatuses.size > 0) {
				const sorted = Array.from(extensionStatuses.entries())
					.sort(([a], [b]) => a.localeCompare(b))
					.map(([, text]) => text.replace(/[\r\n\t]/g, " ").replace(/ +/g, " ").trim());
				const statusLine = sorted.join(SEP);
				lines.push(truncateToWidth(statusLine, safeWidth, `${C_COPPER}…${RST}`));
			}

			return lines;
		}
	}

	// ── Header install ──────────────────────────────────────────────

	function installHeader(ctx: any) {
		ctx.ui.setHeader((_tui: any, theme: Theme) => {
			return {
				render(_width: number): string[] {
					const snake = [
						"",
						"       ______",
						"      /      \\",
						"      o  🐍  o    " + theme.fg("accent", "POISON SNAKE"),
						"      \\______/",
						"",
					];
					const status: string[] = [];
					const themeOn = ctx.ui.theme?.name === "poison-snake";
					if (themeOn) {
						status.push(theme.fg("success", "  🐍 theme: active"));
					} else {
						status.push(theme.fg("dim", "  🦴 theme: inactive"));
					}
					if (footerEnabled) {
						status.push(theme.fg("success", "  🐍 footer: active"));
					} else {
						status.push(theme.fg("dim", "  🦴 footer: inactive"));
					}
					if (!themeOn && !footerEnabled) {
						status.push(theme.fg("dim", "  (use /poison-snake to activate)"));
					}
					return [...snake, ...status, ""];
				},
				invalidate() {},
			};
		});
	}

	// ── Unified command ─────────────────────────────────────────────

	pi.registerCommand("poison-snake", {
		description: "Toggle poison-snake theme and/or footer (args: theme, footer, both)",
		getArgumentCompletions: (prefix: string) => {
			const options = ["theme", "footer", "all"];
			return options
				.filter(o => o.startsWith(prefix.toLowerCase()))
				.map(o => ({ value: o, label: o }));
		},
		handler: async (args, ctx) => {
			const arg = args.trim().toLowerCase();
			const target = ["theme", "footer"].includes(arg) ? arg : "all";

			// ── All mode: sync theme + footer ─────────────────
			if (target === "all") {
				const themeOn = ctx.ui.theme?.name === "poison-snake";

				if (themeOn || footerEnabled) {
					// Turn everything OFF
					const restoreTheme = (previousTheme && previousTheme !== "poison-snake") ? previousTheme : "dark";
					ctx.ui.setTheme(restoreTheme);
					ctx.ui.setFooter(undefined);
					ctx.ui.setHeader(undefined);
					footerEnabled = false;
					headerInstalled = false;
					ctx.ui.notify(`Poison-snake disabled — theme: ${restoreTheme}, footer: default`, "info");
				} else {
					// Turn everything ON
					previousTheme = ctx.ui.theme?.name ?? "dark";
					ctx.ui.setTheme("poison-snake");
					installFooter(ctx);
					installHeader(ctx);
					footerEnabled = true;
					headerInstalled = true;
					ctx.ui.notify("Poison-snake enabled — theme + footer + header 🐍", "info");
				}
				return;
			}

			// ── Theme only ─────────────────────────────────────
			if (target === "theme") {
				previousTheme = ctx.ui.theme?.name ?? "dark";
				const current = ctx.ui.theme?.name;
				const isActive = current === "poison-snake" || current === "poison-snake";

				if (isActive) {
					const restore = (previousTheme && previousTheme !== "poison-snake") ? previousTheme : "dark";
					ctx.ui.setTheme(restore);
					ctx.ui.setHeader(undefined);
					headerInstalled = false;
					ctx.ui.notify(`Theme restored to ${restore}`, "info");
				} else {
					ctx.ui.setTheme("poison-snake");
					installHeader(ctx);
					headerInstalled = true;
					ctx.ui.notify("Poison-snake theme enabled 🐍", "info");
				}
			}

			// ── Footer only ────────────────────────────────────
			if (target === "footer") {
				footerEnabled = !footerEnabled;
				if (footerEnabled) {
					installFooter(ctx);
					ctx.ui.notify("Poison-snake footer enabled 🐍", "info");
				} else {
					ctx.ui.setFooter(undefined);
					ctx.ui.notify("Default footer restored", "info");
				}
			}
		},
	});
}
