# Dotfiles — Claude Code Context

## Purpose
Personal Linux dotfiles for Rolf Vreijdenberger. Sets up bash, vim, tmux, git, ssh and gnupg via symlinks from this repo to `$HOME`. Linux-only (mac support was removed).

## Install
```bash
git clone https://github.com/rolfvreijdenberger/dotfiles.git ~/dotfiles
cd ~/dotfiles
./setup.sh
source ~/.bashrc
```

## File map
| File | Installs to |
|---|---|
| `bash/bash_custom` | `~/.bash_custom` (sourced by `~/.bashrc`) |
| `git/gitconfig` | `~/.gitconfig` |
| `vim/vimrc` | `~/.vimrc` |
| `tmux/tmux.conf` | `~/.tmux.conf` |
| `ssh/config` | `~/.ssh/config` |
| `ssh/authorized_keys` | appended to `~/.ssh/authorized_keys` |
| `gnupg/*` | `~/.gnupg/` |
| `bin/*` | `~/bin/` |

## Key conventions
- **Leader key in vim**: `\` (backslash), with space as alias
- **Tmux prefix**: `Ctrl+a` (primary) and `Ctrl+b` (default, still works)
- **Functions are prefixed with `v`**: `vhelp`, `vinstall`, `vstatus`, `vsetupmotd`, `vman`
- **Plugin managers**: vim-plug (vim), TPM (tmux) — both auto-install on first run
- **setup.sh is idempotent**: safe to re-run after `git pull`

## bash_custom functions
| Function | Purpose |
|---|---|
| `vhelp` | print tmux/vim/bash/copy-paste reference |
| `vinstall` | install preferred packages (apt/dnf/yum) |
| `vstatus` | system overview: load, disk, memory, logins, fail2ban |
| `vsetupmotd` | update `/etc/motd` with host purpose and notes |
| `vman <cmd>` | open man page in vim |
| `cd` | overrides built-in to use `pushd` internally |

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

## Preferences
- Do not add features beyond what is asked
- Do not add comments that restate what the code does
- Keep vhelp entries short — no long parenthetical explanations
- Commit messages should be high-level, not line-by-line changelogs
- Always commit with `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
