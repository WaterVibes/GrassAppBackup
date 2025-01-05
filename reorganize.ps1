$ErrorActionPreference = 'Continue'

# Function to safely move directories
function Move-SafeDirectory {
    param (
        [string]$source,
        [string]$destination
    )
    
    if (Test-Path $source) {
        if (!(Test-Path $destination)) {
            New-Item -ItemType Directory -Force -Path $destination | Out-Null
        }
        Write-Host "Moving $source to $destination..."
        try {
            Get-ChildItem -Path $source -Recurse | Move-Item -Destination $destination -Force
            Remove-Item $source -Recurse -Force
            Write-Host "Successfully moved $source"
        }
        catch {
            $errorMessage = $_.Exception.Message
            Write-Host "Error moving $source - $errorMessage"
        }
    }
    else {
        Write-Host "Directory $source not found"
    }
}

# Create required directories
Write-Host "Creating required directories..."
$directories = @(
    "public/img",
    "public/models",
    "public/draco-decoder",
    "public/css",
    "src/js",
    "src/css"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "Created $dir"
    }
}

# Move directories to their new locations
Write-Host "Moving directories to their new locations..."
Move-SafeDirectory -source "img" -destination "public/img"
Move-SafeDirectory -source "models" -destination "public/models"
Move-SafeDirectory -source "draco-decoder" -destination "public/draco-decoder"
Move-SafeDirectory -source "css" -destination "public/css"
Move-SafeDirectory -source "js" -destination "src/js"

# Clean up unnecessary directories
Write-Host "Cleaning up unnecessary directories..."
$cleanupDirs = @(
    "assets",
    "grassapp",
    "logs"
)

foreach ($dir in $cleanupDirs) {
    if (Test-Path $dir) {
        try {
            Remove-Item $dir -Recurse -Force
            Write-Host "Removed $dir"
        }
        catch {
            $errorMessage = $_.Exception.Message
            Write-Host "Error removing $dir - $errorMessage"
        }
    }
}

Write-Host "Reorganization complete!"
Write-Host "Please verify the changes are correct." 