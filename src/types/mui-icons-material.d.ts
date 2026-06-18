// `@mui/icons-material` v9 ships per-icon subpath imports (e.g.
// `@mui/icons-material/WbSunny`) but does not bundle `.d.ts` files for each
// subpath. Under `moduleResolution: bundler`, TypeScript can't infer types for
// these imports, so we add an ambient declaration that types the default
// export as a SvgIcon component.
declare module '@mui/icons-material/*' {
  import type { OverridableComponent } from '@mui/material/OverridableComponent';
  import type { SvgIconTypeMap } from '@mui/material/SvgIcon';

  const Icon: OverridableComponent<SvgIconTypeMap<{}, 'svg'>> & {
    muiName: string;
  };
  export default Icon;
}
