; SNC App — Inno Setup Script
; Siyaram Neurotherapy Center — Patient Management System
; Version 1.0.0

#define MyAppName "SNC App"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Siyaram Neurotherapy Center"
#define MyAppURL "https://sncapp.example.com"
#define MyAppExeName "start.bat"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DisableProgramGroupPage=yes
LicenseFile=
OutputDir=installer
OutputBaseFilename=SNC-Setup-{#MyAppVersion}
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=low
PrivilegesRequiredOverridesAllowed=dialog
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Backend
Source: "backend\*"; DestDir: "{app}\backend"; Flags: ignoreversion recursesubdirs createallsubdirs
; Frontend (React app)
Source: "snc\*"; DestDir: "{app}\snc"; Flags: ignoreversion recursesubdirs createallsubdirs excludes: "node_modules\|.git\|dist\|.vite"
; Static site files
Source: "site\*"; DestDir: "{app}\site"; Flags: ignoreversion recursesubdirs createallsubdirs
; Standalone variant
Source: "snc-standalone\*"; DestDir: "{app}\snc-standalone"; Flags: ignoreversion recursesubdirs createallsubdirs
; Electron wrapper
Source: "electron\*"; DestDir: "{app}\electron"; Flags: ignoreversion recursesubdirs createallsubdirs excludes: "node_modules\|.git"

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\start.bat"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\start.bat"; Tasks: desktopicon

[Run]
Filename: "{app}\start.bat"; Description: "Launch SNC App"; Flags: nowait postinstall skipifsilent
Filename: "{cmd}"; Parameters: "/C start http://localhost:3000"; Description: "Open SNC in browser"; Flags: nowait

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

[Code]
function InitializeSetup(): Boolean;
begin
  Result := True;
end;
