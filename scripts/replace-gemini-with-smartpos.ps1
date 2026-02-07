# Script pour remplacer "Gemini" par "Smart POS" dans tout le projet
# Exclut node_modules et .git

Write-Host "🔄 Remplacement de 'Gemini' par 'Smart POS'..." -ForegroundColor Cyan

$replacements = @(
    @{ Old = "Gemini POS"; New = "Smart POS" },
    @{ Old = "gemini-pos"; New = "smart-pos" },
    @{ Old = "gemini_pos"; New = "smart_pos" },
    @{ Old = "geminipos"; New = "smartpos" },
    @{ Old = "GEMINI-POS"; New = "SMART-POS" },
    @{ Old = "Gemini"; New = "Smart POS" }
)

$extensions = @("*.ts", "*.tsx", "*.js", "*.jsx", "*.json", "*.md")
$excludeDirs = @("node_modules", ".git", "dist", "build")

$files = Get-ChildItem -Path . -Include $extensions -Recurse | Where-Object {
    $path = $_.FullName
    $exclude = $false
    foreach ($dir in $excludeDirs) {
        if ($path -like "*\$dir\*") {
            $exclude = $true
            break
        }
    }
    -not $exclude
}

$count = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content) {
        $modified = $false
        foreach ($replacement in $replacements) {
            if ($content -match [regex]::Escape($replacement.Old)) {
                $content = $content -replace [regex]::Escape($replacement.Old), $replacement.New
                $modified = $true
            }
        }
        
        if ($modified) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            Write-Host "✅ $($file.Name)" -ForegroundColor Green
            $count++
        }
    }
}

Write-Host "`n🎉 $count fichiers modifiés !" -ForegroundColor Green
