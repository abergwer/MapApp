import { useState, type ReactNode } from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import layout from '../../../styles/layouts/panelLayout.module.css';
import controls from '../../../styles/mui/controls.module.css';

export interface CollapsiblePanelSectionProps {
    title: string;
    /** Uncontrolled initial open state. Ignored when `expanded` is set. */
    defaultExpanded?: boolean;
    /** Controlled open state (e.g. window dock store). */
    expanded?: boolean;
    onExpandedChange?: (expanded: boolean) => void;
    children: ReactNode;
    headerEnd?: ReactNode;
    headerStartExtra?: ReactNode;
}

/** Collapsible section — Card + theme variants, no local sx. */
export default function CollapsiblePanelSection({
    title,
    defaultExpanded = true,
    expanded: expandedProp,
    onExpandedChange,
    children,
    headerEnd,
    headerStartExtra,
}: CollapsiblePanelSectionProps) {
    const [uncontrolled, setUncontrolled] = useState(defaultExpanded);
    const isControlled = expandedProp !== undefined;
    const expanded = isControlled ? expandedProp : uncontrolled;

    const toggle = () => {
        const next = !expanded;
        if (!isControlled) setUncontrolled(next);
        onExpandedChange?.(next);
    };

    const iconClass = expanded ? layout.collapseIconExpanded : layout.collapseIconCollapsed;

    return (
        <Card variant="panelSection">
            <Stack className={layout.sectionHeaderRow}>
                <Button variant="sectionHeader" onClick={toggle} disableRipple>
                    <span className={layout.sectionHeaderStart}>
                        {headerStartExtra}
                        <Typography variant="sectionTitle" component="span">
                            {title}
                        </Typography>
                    </span>
                </Button>
                <div className={layout.sectionActions}>
                    {headerEnd}
                    <IconButton
                        className={controls.panelCollapse}
                        size="small"
                        onClick={toggle}
                        aria-expanded={expanded}
                        aria-label={expanded ? 'Collapse section' : 'Expand section'}
                    >
                        <ExpandMoreIcon fontSize="small" className={`${layout.collapseIcon} ${iconClass}`} />
                    </IconButton>
                </div>
            </Stack>
            <Collapse in={expanded} unmountOnExit>
                <CardContent>{children}</CardContent>
            </Collapse>
        </Card>
    );
}