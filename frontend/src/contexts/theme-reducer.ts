import { ThemeContextState, ThemeAction } from '@/types/theme'

export function themeReducer(
   state: ThemeContextState,
   action: ThemeAction
): ThemeContextState {
   switch (action.type) {
      case 'SET_LOADING':
         return { ...state, isLoading: action.payload, error: null }

      case 'SET_ERROR':
         return { ...state, error: action.payload, isLoading: false }

      case 'LOAD_THEMES':
         return {
            ...state,
            themes: action.payload,
            isLoading: false,
            error: null,
            lastSync: new Date(),
         }

      case 'SET_ACTIVE_THEME':
         return {
            ...state,
            activeTheme: action.payload,
            currentTheme: action.payload,
            isLoading: false,
         }

      case 'SET_MODE':
         return {
            ...state,
            mode: action.payload,
         }

      case 'CREATE_THEME':
         return {
            ...state,
            themes: [...state.themes, action.payload],
            isDirty: false,
         }

      case 'UPDATE_THEME':
         return {
            ...state,
            themes: state.themes.map((theme) =>
               theme._id === action.payload._id ? action.payload : theme
            ),
            currentTheme:
               state.currentTheme?._id === action.payload._id
                  ? action.payload
                  : state.currentTheme,
            isDirty: false,
         }

      case 'DELETE_THEME':
         return {
            ...state,
            themes: state.themes.filter(
               (theme) => theme._id !== action.payload
            ),
         }

      case 'PREVIEW_THEME':
         return {
            ...state,
            previewTheme: action.payload,
            isPreviewMode: true,
         }

      case 'RESET_THEME':
         return {
            ...state,
            previewTheme: null,
            isPreviewMode: false,
            isDirty: false,
            selectedColor: null,
            colorHarmony: null,
         }

      default:
         return state
   }
}

export const themeInitialState: ThemeContextState = {
   currentTheme: null,
   mode: 'system',
   resolvedMode: 'light',
   themes: [],
   activeTheme: null,
   defaultTheme: null,
   isLoading: false,
   error: null,
   previewTheme: null,
   isPreviewMode: false,
   isAdminMode: false,
   isDirty: false,
   selectedColor: null,
   colorHarmony: null,
   lastSync: null,
   isOnline: true,
}
