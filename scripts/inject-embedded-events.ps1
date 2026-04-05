# One-off / CI: embed data/events.json into immba-pure.html for file:// admin fallback
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$j = [IO.File]::ReadAllText((Join-Path $Root "data\events.json"), [Text.UTF8Encoding]::new($false)).Trim()
$hPath = Join-Path $Root "immba-pure.html"
$h = [IO.File]::ReadAllText($hPath, [Text.UTF8Encoding]::new($false))
$nl = [Environment]::NewLine
$ins = "    <script type=`"application/json`" id=`"pea-embedded-events`">$nl$j${nl}    </script>$nl"
$needle = "    </main>$nl    <script src=`"./assets/pure-localstorage-sync.js`" defer></script>"
if (-not $h.Contains("pea-embedded-events")) {
  if (-not $h.Contains($needle)) { throw "Expected script block after </main> not found" }
  $h2 = $h.Replace($needle, "    </main>$nl$ins    <script src=`"./assets/pure-localstorage-sync.js`" defer></script>")
  [IO.File]::WriteAllText($hPath, $h2, [Text.UTF8Encoding]::new($false))
  Write-Host "Embedded events.json into immba-pure.html"
} else {
  Write-Host "immba-pure.html already has pea-embedded-events, skip"
}
