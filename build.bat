@echo off
REM Clean out only the generated files, not your source
rmdir /s /q public

REM Build the site
hugo

REM Echo success
echo Build completed successfully!