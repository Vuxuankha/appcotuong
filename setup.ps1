$ErrorActionPreference = 'Stop'
$base = Split-Path -Parent $MyInvocation.MyCommand.Path
$dir = Join-Path $base 'engine'
New-Item -Path $dir -ItemType Directory -Force | Out-Null
$files = @(
  @('worker.js','https://raw.githubusercontent.com/brianhliou/pikafish-wasm/main/worker.js',0),
  @('pikafish.js','https://github.com/brianhliou/pikafish-wasm/releases/download/v0.1.0/pikafish.js',80121),
  @('pikafish.wasm','https://github.com/brianhliou/pikafish-wasm/releases/download/v0.1.0/pikafish.wasm',662419),
  @('pikafish.nnue','https://github.com/brianhliou/pikafish-wasm/releases/download/v0.1.0/pikafish.nnue',50706378)
)
$hashes = @{
 'pikafish.js'='17bc398028450c4c56df27812324cca8e5af9e2c86662f4a0d7f5b328270df3a'
 'pikafish.wasm'='b437f89ca16a1ff9181878813d1991f60b22067dca6b3feb79a26033224a83b1'
 'pikafish.nnue'='7d13d73569a9b571ba0eb20cf1596247bc2a42738967e61afef6482b231e900e'
}
foreach($file in $files) {
  $name=$file[0];$url=$file[1];$expected=$file[2];$path=Join-Path $dir $name
  $valid=$false
  if(Test-Path $path) {
    if($expected -eq 0){$valid=$true} else {
      $valid=((Get-Item $path).Length -eq $expected) -and ((Get-FileHash $path -Algorithm SHA256).Hash.ToLowerInvariant() -eq $hashes[$name])
    }
  }
  if(-not $valid) {
    Write-Host "Dang tai $name..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $url -OutFile $path -MaximumRedirection 10
  }
  if($expected -gt 0){
    if((Get-Item $path).Length -ne $expected) { throw "Sai kich thuoc $name" }
    if((Get-FileHash $path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $hashes[$name]) { throw "Sai SHA256 $name" }
  }
  Write-Host "OK: $name" -ForegroundColor Green
}
Write-Host "Engine da duoc tai va kiem tra. Hay mo CHAY_APP.bat" -ForegroundColor Green
