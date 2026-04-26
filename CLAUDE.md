# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose
Personal dotfiles for Rolf Vreijdenberger. `setup.sh` sets up bash, vim, tmux, git, ssh and gnupg via symlinks from this repo to `$HOME` on Linux. `setup.ps1` sets up selected Windows dotfiles for Vim and Pi.

## Install
```bash
git clone https://github.com/rolfvreijdenberger/dotfiles.git ~/dotfiles
cd ~/dotfiles
./setup.sh
source ~/.bashrc
```

Windows selected setup:
```powershell
.\setup.ps1
```

## File map
| File | Installs to |
|---|---|
| `bash/bash_custom` | `~/.bash_custom` (sourced by `~/.bashrc`) |
| `git/gitconfig` | `~/.gitconfig` |
| `vim/vimrc` | `~/.vimrc` / `%USERPROFILE%\.vimrc` |
| `tmux/tmux.conf` | `~/.tmux.conf` |
| `ssh/config` | `~/.ssh/config` |
| `ssh/authorized_keys` | appended to `~/.ssh/authorized_keys` |
| `gnupg/*` | `~/.gnupg/` |
| `bin/*` | `~/bin/` |
| `pi/settings.json` | `~/.pi/agent/settings.json` / `%USERPROFILE%\.pi\agent\settings.json` |
| `pi/AGENTS.md` | `~/.pi/agent/AGENTS.md` / `%USERPROFILE%\.pi\agent\AGENTS.md` |
| `pi/prompts/` | `~/.pi/agent/prompts/` / `%USERPROFILE%\.pi\agent\prompts\` |

## Key conventions
- **Leader key in vim**: `\` (backslash), with space as alias
- **Tmux prefix**: `Ctrl+a` (primary) and `Ctrl+b` (default, still works)
- **Functions are prefixed with `v`**: `vhelp`, `vinstall`, `vstatus`, `vsetupmotd`, `vman`, `vtheme`, `vbs`
- **Plugin managers**: vim-plug (vim), TPM (tmux) — both auto-install on first run
- **setup.sh is idempotent**: safe to re-run after `git pull`
- **Pi global config**: managed from `pi/`; sessions, auth, package installs and caches are intentionally not tracked
- **Windows setup**: `setup.ps1` installs Vim/Pi when missing if `winget`/`npm` are available, links Vim and Pi files/directories, falls back to copying if symlinks are unavailable, and backs up existing real files before replacing them

## bash_custom functions
| Function | Purpose |
|---|---|
| `vhelp` | print tmux/vim/bash/copy-paste reference |
| `vinstall` | install preferred packages (apt/dnf/yum) |
| `vstatus` | system overview: load, disk, memory, logins, fail2ban |
| `vsetupmotd` | update `/etc/motd` with host purpose and notes |
| `vman <cmd>` | open man page in vim |
| `vtheme [light\|dark]` | switch light/dark theme for prompt, vim, tmux, ls, less |
| `vbs` | re-source `~/.bashrc` |
| `cd` | overrides built-in to use `pushd` internally |

## Theme switching (`vtheme`)
State is stored in `~/.theme-bash-tmux-vim` (contains `light` or `dark`). Defaults to dark when absent.

On switch, `vtheme` updates:
- **Bash prompt**: reads theme file on every `PROMPT_COMMAND` render — auto-updates in all sessions
- **Vim**: `ApplyTheme()` runs on `VimEnter`/`FocusGained`; manual `\th`; dark=murphy, light=zellner
- **Tmux status bar**: `if-shell` reads the file on `PREFIX r` or `tmux source-file ~/.tmux.conf`; requires tmux ≥ 3.0
- **LS_COLORS**: set for light (dark filenames), unset for dark (system defaults)
- **LESS_TERMCAP**: dark bold colors in light mode, bright defaults in dark mode
- **COLORFGBG**: `0;15` (light) / `15;0` (dark) — signals background to tools that respect it
- **OSC sequences**: attempts to set terminal background via `\e]11`/`\e]10`; PuTTY requires `Window → Colours → Allow terminal to use xterm 256-colour mode`; plain text grey (ls metadata, git log body) requires setting PuTTY `Default Foreground` to black

## vinstall package manager handling
- Detects `apt` (Debian/Ubuntu) or `dnf`/`yum` (RHEL/Fedora/CentOS)
- Installs `vim-nox` on Debian/Ubuntu, `vim-enhanced` on RHEL/Fedora — both have Python support required by UltiSnips
- `dnf` takes precedence over `yum` when both are present

## vstatus sudo behaviour
`fail2ban-client` and `lastb` use `sudo -n` (non-interactive). When run as regular user without NOPASSWD, shows `needs root` inline instead of prompting. Works without sudo when run as root.

## Vim plugins (vim-plug)
- `preservim/nerdtree` — file explorer (`\nt`)
- `preservim/tagbar` — code outline (`\tt`, `F8`)
- `dense-analysis/ale` — async linting (replaces syntastic)
- `itchyny/lightline.vim` — statusline
- `tpope/vim-fugitive` — git integration
- `SirVer/ultisnips` + `honza/vim-snippets` — snippets (`Tab` to expand)
- `ervandew/supertab` — tab completion (`Ctrl+n`)
- `preservim/nerdcommenter` — commenting
- `ctrlpvim/ctrlp.vim` — fuzzy file finding
- `pangloss/vim-javascript`, `leafgarland/typescript-vim` — JS/TS syntax
- `stephpy/vim-yaml`, `preservim/vim-markdown`, `elzr/vim-json` — markup syntax
- `pearofducks/ansible-vim`, `Glench/Vim-Jinja2-Syntax` — ansible/jinja2
- `stanangeloff/php.vim` — PHP syntax
- `lervag/vimtex` — LaTeX
- `mattn/emmet-vim` — HTML expansion
- `Raimondi/delimitMate` — auto-close brackets/quotes
- `tpope/vim-surround` — surround text
- `kshenoy/vim-signature` — mark display
- `ap/vim-css-color` — CSS color preview
- `junegunn/goyo.vim` — distraction-free writing

## Tmux plugins (TPM)
- `tmux-plugins/tmux-resurrect` — save/restore sessions (`Prefix Ctrl+s` / `Ctrl+r`)

## ALE linters configured
PHP (php/phpcs/phpmd), Python (flake8), JS/TS (eslint/tsserver), YAML (yamllint), JSON (jsonlint), Markdown (markdownlint)

## Git color config
`gitconfig` explicitly sets bold dark colors (blue/red/green/magenta) for decorate, log, branch, status, and diff — readable on both dark and light terminal backgrounds.

## Preferences
- Do not add features beyond what is asked
- Do not add comments that restate what the code does
- Keep vhelp entries short — no long parenthetical explanations
- Commit messages should be high-level, not line-by-line changelogs
- Always commit with `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
