{
  description = "Marp presentations development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      forAllSystems = nixpkgs.lib.genAttrs [ "x86_64-linux" "aarch64-darwin" "x86_64-darwin" ];
    in {
      devShells = forAllSystems (system:
        let pkgs = nixpkgs.legacyPackages.${system};
        in {
          default = pkgs.mkShell {
            buildInputs = with pkgs; [
              marp-cli
              chromium
              nodejs
              python3
            ];
            shellHook = ''
              echo "Marp development environment ready"
              echo "Available commands:"
              echo "  - marp-cli: Build Marp slides"
              echo "  - npm: Node.js package manager"
              echo "  - python3: HTTP server for local testing"
            '';
          };
        });
    };
}
