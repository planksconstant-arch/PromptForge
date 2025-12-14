# 🔧 Troubleshooting: Manifest Error Fix

## Error: "Manifest file is missing or unreadable"

If you're seeing this error, here are the solutions:

## ✅ Solution 1: Verify You Selected the Correct Folder

**IMPORTANT:** You must select the `dist` folder, NOT the project root folder!

### Correct Path:
```
c:\Users\NAMISH\Downloads\yaprompt---ai-prompt-engineering-studio (1)\dist
```

### Steps:
1. Go to `chrome://extensions/`
2. Click "Load unpacked"
3. Navigate to: `c:\Users\NAMISH\Downloads\yaprompt---ai-prompt-engineering-studio (1)\`
4. **Double-click to ENTER the `dist` folder**
5. Click "Select Folder" (the folder name should show as "dist")

## ✅ Solution 2: Check File Permissions

Sometimes Windows blocks files downloaded from the internet.

```powershell
# Run this in PowerShell from the project directory:
Get-ChildItem -Path "dist" -Recurse | Unblock-File
```

## ✅ Solution 3: Rebuild the Extension

The build might have had issues. Rebuild:

```powershell
# Run from project directory:
powershell -ExecutionPolicy Bypass -Command "npm run build:extension"
```

## ✅ Solution 4: Verify Dist Contents

Check that dist folder has all required files:

```
dist/
├── manifest.json          ✓ Must exist
├── index.html             ✓ Must exist
├── background.js          ✓ Must exist
├── content.js             ✓ Must exist
├── options.html           ✓ Must exist
├── options.js             ✓ Must exist
├── icons/
│   ├── icon16.png         ✓ Must exist
│   ├── icon48.png         ✓ Must exist
│   └── icon128.png        ✓ Must exist
└── assets/
    ├── index.css          ✓ Must exist
    └── index.js           ✓ Must exist
```

Run this to check:
```powershell
Get-ChildItem -Path "dist" -File -Recurse | Select-Object FullName
```

## ✅ Solution 5: Try Absolute Path Method

1. Open File Explorer
2. Navigate to the `dist` folder
3. Click in the address bar
4. Copy the full path (e.g., `C:\Users\NAMISH\Downloads\yaprompt---ai-prompt-engineering-studio (1)\dist`)
5. In Chrome extensions page, click "Load unpacked"
6. Paste the path in the folder selection dialog

## ✅ Solution 6: Check Chrome Version

Manifest V3 requires Chrome 88+. Update Chrome if needed:
- Go to `chrome://settings/help`
- Check version
- Update if below version 88

## ✅ Solution 7: Disable Other Extensions

Sometimes other extensions interfere. Try:
1. Disable all other extensions temporarily
2. Try loading Yaprompt again
3. Re-enable other extensions after successful load

## ✅ Solution 8: Check for Hidden Characters

The manifest.json might have encoding issues:

```powershell
# Re-save manifest with UTF-8 encoding:
$manifest = Get-Content "public\manifest.json" -Raw
[System.IO.File]::WriteAllText("$PWD\dist\manifest.json", $manifest, [System.Text.UTF8Encoding]::new($false))
```

## ✅ Solution 9: Manual Verification

Manually check manifest.json exists and is readable:

```powershell
# Should show manifest content:
Get-Content "dist\manifest.json"

# Should show "True":
Test-Path "dist\manifest.json"
```

## Still Having Issues?

### Debug Steps:

1. **Check Chrome Console:**
   - Open Chrome DevTools (F12)
   - Look for specific error messages
   - Share the exact error for more help

2. **Try a Fresh Build:**
   ```powershell
   Remove-Item -Path "dist" -Recurse -Force
   powershell -ExecutionPolicy Bypass -Command "npm run build:extension"
   ```

3. **Verify Node Modules:**
   ```powershell
   npm install
   powershell -ExecutionPolicy Bypass -Command "npm run build:extension"
   ```

## Common Mistakes

❌ **WRONG:** Selecting the project root folder
```
c:\Users\NAMISH\Downloads\yaprompt---ai-prompt-engineering-studio (1)\
```

✅ **CORRECT:** Selecting the dist folder
```
c:\Users\NAMISH\Downloads\yaprompt---ai-prompt-engineering-studio (1)\dist
```

❌ **WRONG:** Clicking "Select Folder" too early (wrong directory)
✅ **CORRECT:** Navigate INTO the dist folder first, then click "Select Folder"

## Need More Help?

If none of these solutions work, please share:
1. The exact error message from Chrome
2. Contents of your dist folder: `Get-ChildItem -Path "dist" -Recurse`
3. Chrome version: Check at `chrome://version`
4. Contents of manifest.json: `Get-Content "dist\manifest.json"`

---

**Quick Check:** Run this command to verify everything:
```powershell
Write-Host "Manifest exists: $(Test-Path 'dist\manifest.json')"
Write-Host "Icons exist: $(Test-Path 'dist\icons\icon16.png')"
Write-Host "Files in dist:"; Get-ChildItem -Path "dist" | Select-Object Name
```
