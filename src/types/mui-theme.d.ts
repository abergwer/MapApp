import type { CSSProperties } from 'react';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    panelTitle: CSSProperties;
    panelSubtitle: CSSProperties;
    sectionTitle: CSSProperties;
    toolTileLabel: CSSProperties;
    mutedCaption: CSSProperties;
    entityCategoryName: CSSProperties;
    entityItem: CSSProperties;
  }

  interface TypographyVariantsOptions {
    panelTitle?: CSSProperties;
    panelSubtitle?: CSSProperties;
    sectionTitle?: CSSProperties;
    toolTileLabel?: CSSProperties;
    mutedCaption?: CSSProperties;
    entityCategoryName?: CSSProperties;
    entityItem?: CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    panelTitle: true;
    panelSubtitle: true;
    sectionTitle: true;
    toolTileLabel: true;
    mutedCaption: true;
    entityCategoryName: true;
    entityItem: true;
  }
}

/** Card inherits Paper — custom surface variants live on Paper. */
declare module '@mui/material/Paper' {
  interface PaperPropsVariantOverrides {
    panelSection: true;
    entityCategory: true;
    mediaFrame: true;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    toolTile: true;
    toolDanger: true;
    sectionHeader: true;
    entityCategory: true;
    mapType: true;
  }
}

declare module '@mui/material/Chip' {
  interface ChipPropsVariantOverrides {
    live: true;
    countBadge: true;
  }
}

declare module '@mui/material/ListItemButton' {
  interface ListItemButtonOwnProps {
    /** Theme variant: Intel Feed target row. */
    intelTarget?: boolean;
  }
}

declare module '@mui/material/Avatar' {
  interface AvatarPropsVariantOverrides {
    intelAircraft: true;
    intelDrone: true;
  }
}
