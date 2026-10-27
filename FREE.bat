@echo off

pushd \\wsl$\Ubuntu\home\pozytron\www\ministry.loc

set ANTHROPIC_BASE_URL=http://localhost:20128
set ANTHROPIC_AUTH_TOKEN=sk-3f3c8bc349fc0f02-25d071-fe4b3d01

set ANTHROPIC_MODEL=free-stack

claude

popd

pause