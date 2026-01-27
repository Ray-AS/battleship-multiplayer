import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type Theme = 'classic' | 'ocean';
export type GridStyle = 'lines' | 'none';

interface PreferenceState {
  theme: Theme;
  gridStyle: GridStyle;
  showCoordinates: boolean;
}

const initialState: PreferenceState = {
  theme: 'classic',
  gridStyle: 'none',
  showCoordinates: true,
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    },
    setGridStyle: (state, action: PayloadAction<GridStyle>) => {
      state.gridStyle = action.payload;
    },
    toggleCoordinates: ((state) => {
      state.showCoordinates = !state.showCoordinates;
    })
  }
})

export const {
  setTheme,
  setGridStyle,
  toggleCoordinates
} = preferencesSlice.actions;

export default preferencesSlice.reducer;
