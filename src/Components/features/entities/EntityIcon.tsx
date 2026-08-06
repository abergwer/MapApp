import Box from '@mui/material/Box';
import type { EntityDefinition } from './entityDefinitions';

/**
 * An entity definition's icon at UI size. MUI icon components render
 * directly, tinted with the definition's color. Monochrome image URLs are
 * tinted via a CSS mask; full-color icons (`iconMask === false`) render
 * untinted.
 */
export default function EntityIcon({ def, size = 18 }: { def: EntityDefinition; size?: number }) {
  if (typeof def.icon !== 'string') {
    const Icon = def.icon;
    return <Icon aria-hidden htmlColor={def.color} sx={{ fontSize: size, flex: 'none' }} />;
  }
  if (def.iconMask === false) {
    return (
      <Box
        component="img"
        src={def.icon}
        alt=""
        sx={{ width: size, height: size, flex: 'none', objectFit: 'contain' }}
      />
    );
  }
  const mask = `url("${def.icon}") center / contain no-repeat`;
  return (
    <Box
      aria-hidden
      sx={{ width: size, height: size, flex: 'none', bgcolor: def.color, WebkitMask: mask, mask }}
    />
  );
}
