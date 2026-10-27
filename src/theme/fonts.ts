import {
  useFonts as useSairaFonts,
  Saira_500Medium,
  Saira_600SemiBold,
  Saira_700Bold,
  Saira_800ExtraBold,
} from '@expo-google-fonts/saira';
import {
  useFonts as useBarlowFonts,
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
  Barlow_700Bold,
} from '@expo-google-fonts/barlow';

/**
 * Loads every font weight referenced by src/theme/typography.ts.
 * Returns `{ fontsLoaded, fontError }` — the root component should keep
 * rendering a splash/placeholder until `fontsLoaded` is true.
 */
export function useAppFonts(): { fontsLoaded: boolean; fontError: Error | null } {
  const [sairaLoaded, sairaError] = useSairaFonts({
    Saira_500Medium,
    Saira_600SemiBold,
    Saira_700Bold,
    Saira_800ExtraBold,
  });
  const [barlowLoaded, barlowError] = useBarlowFonts({
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    Barlow_700Bold,
  });

  return {
    fontsLoaded: sairaLoaded && barlowLoaded,
    fontError: sairaError ?? barlowError ?? null,
  };
}
