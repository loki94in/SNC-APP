@echo off
set "APP_PATH=file:///%~dp0snc_portable.html"
start msedge --app="%APP_PATH%" --window-size=1280,800
exit
