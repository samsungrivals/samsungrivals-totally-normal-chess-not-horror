$css = @"

body.doki-theme { background: #fff !important; color: #f00 !important; font-family: 'Courier New', Courier, monospace, sans-serif !important; image-rendering: pixelated !important; }
body.doki-theme * { background: #fff !important; color: #f00 !important; border-color: #f00 !important; font-family: 'Courier New', Courier, monospace, sans-serif !important; text-shadow: none !important; box-shadow: none !important; }
body.doki-theme .hs-logo, body.doki-theme .logo, body.doki-theme .mtitle { -webkit-text-fill-color: #f00 !important; background: none !important; }
body.doki-theme button { background: #fff !important; color: #f00 !important; border: 2px solid #f00 !important; }
.doki-btn { background: #fff !important; color: #f00 !important; border: 2px solid #f00 !important; font-family: monospace !important; font-weight: bold; text-shadow: none !important; text-transform: none !important; }
"@
Add-Content -Path "style.css" -Value $css
