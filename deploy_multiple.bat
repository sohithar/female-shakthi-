@echo off
setlocal enabledelayedexpansion

set PROJECT_PATH=c:\Users\DELL\Documents\sos 2
set DOMAINS=onestop-sos-v1.surge.sh onestop-sos-v2.surge.sh onestop-sos-v3.surge.sh onestop-sos-v4.surge.sh onestop-sos-v5.surge.sh onestop-sos-v6.surge.sh onestop-sos-v7.surge.sh onestop-sos-v8.surge.sh onestop-sos-v9.surge.sh onestop-sos-v10.surge.sh

for %%D in (%DOMAINS%) do (
    echo Deploying to %%D...
    call npx surge "%PROJECT_PATH%" %%D
)

echo All deployments completed.
pause
