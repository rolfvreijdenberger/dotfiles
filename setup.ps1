$ErrorActionPreference = "Stop"

# Windows setup for selected dotfiles.
# - Installs Vim/Pi when missing, when supported tools are available.
# - Links files/directories when possible.
# - Does not silently delete existing real files/directories: backs them up first.

$Repo = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackupRoot = Join-Path $env:USERPROFILE ".dotfiles-backup\$(Get-Date -Format 'yyyyMMdd-HHmmss')"

function Test-CommandExists {
    param([Parameter(Mandatory = $true)][string]$Command)
    return $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Ensure-VimInstalled {
    if (Test-CommandExists "vim") {
        Write-Host "vim found"
        return
    }

    Write-Host "vim not found"
    if (Test-CommandExists "winget") {
        Write-Host "installing Vim using winget"
        winget install --id vim.vim --exact --source winget
    }
    else {
        Write-Host "winget not found; install Vim manually, then rerun setup.ps1"
    }
}

function Ensure-PiInstalled {
    if (Test-CommandExists "pi") {
        Write-Host "pi found"
        return
    }

    Write-Host "pi not found"
    if (Test-CommandExists "npm") {
        Write-Host "installing pi using npm"
        npm install -g @mariozechner/pi-coding-agent
    }
    else {
        Write-Host "npm not found; install Node.js/npm and Pi manually, then rerun setup.ps1"
    }
}

function Backup-ExistingItem {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (-not (Test-Path $Path)) {
        return
    }

    $Item = Get-Item $Path -Force
    if (($Item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
        Remove-Item $Path -Recurse -Force
        return
    }

    $Relative = $Path.Replace($env:USERPROFILE, "").TrimStart("\", "/")
    if ([string]::IsNullOrWhiteSpace($Relative)) {
        $Relative = Split-Path -Leaf $Path
    }

    $BackupPath = Join-Path $BackupRoot $Relative
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $BackupPath) | Out-Null
    Move-Item -Path $Path -Destination $BackupPath -Force
    Write-Host "backed up existing $Path -> $BackupPath"
}

function Install-ItemFromRepo {
    param(
        [Parameter(Mandatory = $true)][string]$SourceRelative,
        [Parameter(Mandatory = $true)][string]$Destination
    )

    $Source = Join-Path $Repo $SourceRelative
    if (-not (Test-Path $Source)) {
        return
    }

    $Parent = Split-Path -Parent $Destination
    New-Item -ItemType Directory -Force -Path $Parent | Out-Null
    Backup-ExistingItem $Destination

    $SourceItem = Get-Item $Source
    $ItemType = if ($SourceItem.PSIsContainer) { "Directory" } else { "File" }

    try {
        New-Item -ItemType SymbolicLink -Path $Destination -Target $Source | Out-Null
        Write-Host "linked $SourceRelative -> $Destination"
    }
    catch {
        if ($ItemType -eq "Directory") {
            Copy-Item -Path $Source -Destination $Destination -Recurse -Force
        }
        else {
            Copy-Item -Path $Source -Destination $Destination -Force
        }
        Write-Host "copied $SourceRelative -> $Destination"
    }
}

Ensure-VimInstalled
Ensure-PiInstalled

# Vim
Install-ItemFromRepo "vim\vimrc" (Join-Path $env:USERPROFILE ".vimrc")
New-Item -ItemType Directory -Force -Path (Join-Path $env:USERPROFILE ".vim\undodir") | Out-Null

# Pi global config. Pi is installed before these files are linked/copied so its own
# first-run defaults do not replace this managed configuration later.
$PiAgent = Join-Path $env:USERPROFILE ".pi\agent"
New-Item -ItemType Directory -Force -Path $PiAgent | Out-Null

$PiFiles = @(
    "settings.json",
    "AGENTS.md",
    "SYSTEM.md",
    "APPEND_SYSTEM.md",
    "keybindings.json"
)

foreach ($File in $PiFiles) {
    Install-ItemFromRepo (Join-Path "pi" $File) (Join-Path $PiAgent $File)
}

$PiDirectories = @(
    "prompts",
    "skills",
    "themes",
    "extensions"
)

foreach ($Directory in $PiDirectories) {
    Install-ItemFromRepo (Join-Path "pi" $Directory) (Join-Path $PiAgent $Directory)
}

Write-Host ""
Write-Host "done installing Windows dotfiles"
if (Test-Path $BackupRoot) {
    Write-Host "backups written to $BackupRoot"
}
