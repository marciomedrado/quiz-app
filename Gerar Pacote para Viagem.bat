@echo off
title Gerador de Pacote para Viagem
echo ======================================================
echo    Gerando Pacote ZIP do Projeto (Excluindo lixo)
echo ======================================================
echo.

set "ZIP_NAME=Quiz_Generator_Portatil.zip"

if exist "%ZIP_NAME%" del "%ZIP_NAME%"

echo [+] Compactando arquivos... Por favor, aguarde.
echo.

powershell -Command "$exclude = @('node_modules', '.git', '%ZIP_NAME%'); $files = Get-ChildItem -Path . -Exclude $exclude; Compress-Archive -Path $files -DestinationPath '%ZIP_NAME%' -Force"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================================
    echo    SUCESSO! O arquivo '%ZIP_NAME%' foi criado.
    echo.
    echo    Basta levar este arquivo para o outro PC,
    echo    extrair e rodar o 'Iniciar Quiz Generator.bat'.
    echo ======================================================
) else (
    echo.
    echo [!] Ocorreu um erro ao gerar o arquivo ZIP.
)

echo.
pause
