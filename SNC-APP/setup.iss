; ═══════════════════════════════════════════════════════════════
;  SNC Patient Register — Inno Setup Installer
;  Siyaram Neurotherapy Center, Agra — Version 1.0.0
; ═══════════════════════════════════════════════════════════════
;
;  PREREQUISITES:
;    1. Install Node.js from https://nodejs.org
;    2. Run: npm install
;    3. Compile this .iss file with Inno Setup 6+
;    4. Output: a single .exe installer
;
;  The installer will:
;    - Install to Program Files
;    - Create Desktop shortcut (optional)
;    - Launch the app after install
;    - Store SQLite DB in app folder
; ═══════════════════════════════════════════════════════════════

#define MyAppName         "SNC Patient Register"
#define MyAppVersion      "1.0.0"
#define MyAppPublisher    "Siyaram Neurotherapy Center"
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
WizardStyle=modern
PrivilegesRequiredOverridesAllowed=dialog
DisableProgramGroupPage=yes
Compression=lzma2/ultra64
SolidCompression=yes
MinVersion=10.0
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional shortcuts:"

[Files]
Source: "app.js";       DestDir: "{app}"; Flags: ignoreversion
Source: "database.js";  DestDir: "{app}"; Flags: ignoreversion
Source: "package.json";  DestDir: "{app}"; Flags: ignoreversion
Source: "launch.bat";    DestDir: "{app}"; Flags: ignoreversion
Source: "routes\*";     DestDir: "{app}\routes"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "public\*";    DestDir: "{app}\public"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}";             Filename: "{app}\launch.bat"; WorkingDir: "{app}"
Name: "{group}\Uninstall {#MyAppName}";  Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}";       Filename: "{app}\launch.bat"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "{app}\launch.bat"; Description: "Launch {#MyAppName} now"; Flags: nowait postinstall skipifsilent; WorkingDir: "{app}"

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

[Code]
function IsWindows10OrLater: Boolean;
var Version: TWindowsVersion;
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
