[Setup]
AppName=SNC Clinical Portal
AppVersion=1.0.0
DefaultDirName={autopf}\SNC_Clinical_Portal
DefaultGroupName=SNC Clinical Portal
OutputDir=Output
OutputBaseFilename=SNC_System_Installer
Compression=lzma
SolidCompression=yes
; SetupIconFile=snc_icon.ico

[Files]
Source: "e:\snc v2\snc_portable.html"; DestDir: "{app}"; Flags: ignoreversion
Source: "e:\snc v2\launch_snc.bat"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\SNC Clinical Portal"; Filename: "{app}\launch_snc.bat"
Name: "{autodesktop}\SNC Clinical Portal"; Filename: "{app}\launch_snc.bat"

[Run]
Description: "Launch SNC Clinical Portal"; Flags: nowait postinstall skipifsilent; Filename: "{app}\launch_snc.bat"