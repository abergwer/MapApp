import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemText from '@mui/material/ListItemText'
import Tooltip from '@mui/material/Tooltip'
import TranslateOutlinedIcon from '@mui/icons-material/TranslateOutlined'
import { useLanguage } from './useLanguage'

/**
 * Drop-in language selector. Renders a globe/translate icon that opens a
 * menu of the supported languages. Fully self-contained — mount it anywhere
 * (e.g. in the app header or a toolbar).
 */
function LanguageSwitcher() {
  const { t } = useTranslation()
  const { language, languages, setLanguage } = useLanguage()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleSelect = (code: string) => {
    setLanguage(code)
    setAnchorEl(null)
  }

  return (
    <>
      <Tooltip title={t('language.label')}>
        <IconButton
          size="small"
          color="inherit"
          aria-label={t('language.label')}
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          <TranslateOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        {languages.map((lang) => (
          <MenuItem
            key={lang.code}
            selected={lang.code === language}
            onClick={() => handleSelect(lang.code)}
          >
            <ListItemText>{lang.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default LanguageSwitcher
