/// <reference types="vite/client" />

// Allow side-effect CSS imports: import './styles.css'
// (vite/client already covers *.css for CSS Modules, but this ensures
//  plain global-stylesheet imports are also accepted without a binding)
declare module "*.css" {
  const styles: Record<string, string>;
  export default styles;
  export {};
}
