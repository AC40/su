# Desktop apps for Macs. Format: "brew-cask|Name in /Applications".

MAC_APPS=(
  "onedrive|OneDrive"
  "microsoft-word|Microsoft Word"
  "microsoft-excel|Microsoft Excel"
  "microsoft-teams|Microsoft Teams"
  "shottr|Shottr"
  "tailscale-app|Tailscale"
  "cmux|cmux"
  "craft|Craft"
  "zed|Zed"
  "t3-code|T3 Code (Beta)"
  "zen|Zen"
  "raycast|Raycast"
  "vorssaint|Vorssaint"
  "hiddenbar|Hidden Bar"
)

install_mac_apps() {
  has brew || die "Homebrew missing; run the cli step first."
  local entry
  for entry in "${MAC_APPS[@]}"; do
    install_cask "${entry%%|*}" "${entry#*|}"
  done
}
