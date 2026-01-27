import { useSelector, useDispatch } from 'react-redux';
import { setTheme, setGridStyle, toggleCoordinates, type Theme, type GridStyle } from '../state/slices/preferencesSlice';
import type { RootState } from '../state/store';
import "../styles/settings.css";

export default function Settings() {
  const preferences = useSelector((state: RootState) => state.preferences);
  const dispatch = useDispatch();

  return (
    <div className="settings-bar">
      <div className="settings-group">
        <label>Theme:</label>
        <div className="button-group">
          <button
            className={preferences.theme === 'classic' ? 'active' : ''}
            onClick={() => dispatch(setTheme('classic' as Theme))}
          >
            Classic
          </button>
          <button
            className={preferences.theme === 'ocean' ? 'active' : ''}
            onClick={() => dispatch(setTheme('ocean' as Theme))}
          >
            Ocean
          </button>
        </div>
      </div>

      <div className="settings-group">
        <label>Grid:</label>
        <div className="button-group">
          <button
            className={preferences.gridStyle === 'lines' ? 'active' : ''}
            onClick={() => dispatch(setGridStyle('lines' as GridStyle))}
          >
            Lines
          </button>
          <button
            className={preferences.gridStyle === 'dots' ? 'active' : ''}
            onClick={() => dispatch(setGridStyle('dots' as GridStyle))}
          >
            Dots
          </button>
        </div>
      </div>

      <div className="settings-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={preferences.showCoordinates}
            onChange={() => dispatch(toggleCoordinates())}
          />
          <span>Show Coordinates</span>
        </label>
      </div>
    </div>
  );
}