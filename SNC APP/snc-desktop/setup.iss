; ============================================================
;  SNC Desktop — Inno Setup Script
;  Siyaram Neurotherapy Center
; ============================================================
;  HOW TO USE:
;    1. Run `npm run build` in snc/   → produces snc/dist/
;    2. Run `npm run build` in backend/ → produces backend/dist/
;    3. Copy snc/dist/ into snc-desktop/src/frontend/
;    4. Run `npm run build` in snc-desktop/ → produces portable .exe
;    5. Place the portable .exe and backend/ folder next to this .iss file
;    6. Compile this script with Inno Setup 6+
; ============================================================

#define MyAppName        "SNC Patient Register"
#define MyAppVersion     "1.0.0"
#define MyAppPublisher   "Siyaram Neurotherapy Center"
#define MyAppExeName     "SNC Patient Register.exe"
#define MyAppURL         "https://github.com/loki94in/SNC-APP"

[Setup]
; NOTE: AppId must be unique across all installs
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
; Output .exe filename
OutputBaseFilename=SNC-Patient-Register-Setup-{#MyAppVersion}
; Portable exe produced by electron-builder (place next to this script)
Source: "SNC-Patient-Register-Portable-{#MyAppVersion}.exe"; DestDir: "{app}"; Flags: ignoreversion
; Backend (place entire backend/ folder next to this script)
Source: "backend\*"; DestDir: "{app}\backend"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "node_modules,.git,dist"
; Default installer icon
SetupIconFile=
WizardStyle=modern
; PrivilegesRequired=lowest for non-admin install
PrivilegesRequiredOverridesAllowed=dialog
DisableProgramGroupPage=yes
Compression=lzma2
SolidCompression=yes
; Require Windows 10 or later
MinVersion=10.0

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 6.1; Check: not IsAdminInstallMode

[Files]
; Main Electron portable exe
Source: "SNC-Patient-Register-Portable-{#MyAppVersion}.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: quicklaunchicon

[Run]
; Launch app after install (optional — uncomment if desired)
; Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

[Code]
// Check if Node.js is available on PATH
function IsNodeInstalled: Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec('node', '--version', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) and (ResultCode = 0);
end;

// Show Node.js warning on unsupported systems
function InitializeSetup: Boolean;
begin
  Result := True;
  if not IsNodeInstalled then
  begin
    MsgBox('Node.js is required but not found. Please install Node.js 18+ from https://nodejs.org before running this application.', mbError, MB_OK);
    Result := False;
  end;
end;
