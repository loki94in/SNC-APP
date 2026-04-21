; ============================================================
;  SNC Patient Register — Inno Setup Script
;  Siyaram Neurotherapy Center, Agra
; ============================================================
;  PREREQUISITES:
;    1. Electron build already done (dist/win-unpacked/ exists)
;    2. Inno Setup 6+ installed on Windows
;    3. All files placed in the same folder as this .iss file
;
;  WHAT THIS CREATES:
;    - A professional Windows installer (.exe)
;    - Desktop shortcut
;    - Start Menu shortcut
;    - Uninstaller
;
;  TO COMPILE:
;    Double-click this file OR run:
;    iscc "setup.iss"
; ============================================================

#define MyAppName        "SNC Patient Register"
#define MyAppVersion     "1.0.0"
#define MyAppPublisher   "Siyaram Neurotherapy Center"
#define MyAppExeName     "SNC Patient Register.exe"
#define MyAppURL          "https://github.com/loki94in/SNC-APP"

[Setup]
AppId={{8A3D4E1F-2B5C-4D6A-9E7F-1C2B3D4E5F6A}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputBaseFilename=SNC-Patient-Register-Setup-{#MyAppVersion}
SetupIconFile=build\icon.ico
WizardStyle=modern
PrivilegesRequiredOverridesAllowed=dialog
DisableProgramGroupPage=yes
Compression=lzma2/optimal64bit
SolidCompression=yes
; Windows 10 or later (64-bit only)
MinVersion=10.0
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "hindi"; MessagesFile: "compiler:Languages\Hindi.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional shortcuts:"
Name: "quicklaunch"; Description: "Create a &Quick Launch shortcut"; GroupDescription: "Additional shortcuts:"; Flags: unchecked

[Files]
; ── Electron App Files ──────────────────────────────────────
Source: "dist\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "*.pdb"
; ── Frontend Built Files ────────────────────────────────────
; (already included above in win-unpacked/*)

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon
; Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: quicklaunch

[Run]
; Launch app after install
Filename: "{app}\{#MyAppExeName}"; Description: "Launch {#MyAppName} now"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

[Code]
function IsWindows10OrLater: Boolean;
var
  Version: TWindowsVersion;
begin
  GetWindowsVersionEx(Version);
  Result := (Version.Major >= 10);
end;

function InitializeSetup: Boolean;
begin
  Result := True;
  if not IsWindows10OrLater then
  begin
    MsgBox('SNC Patient Register requires Windows 10 or later.', mbError, MB_OK);
    Result := False;
  end;
end;