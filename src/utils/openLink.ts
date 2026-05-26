import { Linking, Platform } from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';

// Flybook brand colors for the in-app browser toolbar
const TOOLBAR_COLOR = '#0D9488';      // Flybook teal
const DARK_TOOLBAR_COLOR = '#0f172a'; // Dark mode

/**
 * Opens a URL in the Flybook in-app browser (Facebook-style).
 * - For http/https URLs → in-app browser with Flybook branding
 * - For tel:, mailto:, pdf links → falls back to Linking.openURL
 */
export const openLink = async (url: string, isDark = false): Promise<void> => {
  if (!url) return;

  const trimmedUrl = url.trim();

  // For non-web links (tel, mailto, etc) always use system Linking
  if (
    trimmedUrl.startsWith('tel:') ||
    trimmedUrl.startsWith('mailto:') ||
    trimmedUrl.startsWith('sms:')
  ) {
    await Linking.openURL(trimmedUrl).catch(console.error);
    return;
  }

  // Ensure it's a valid http/https URL
  const isWebUrl =
    trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://');

  if (!isWebUrl) {
    // Try adding https:// prefix as last resort
    await Linking.openURL(`https://${trimmedUrl}`).catch(console.error);
    return;
  }

  try {
    const isAvailable = await InAppBrowser.isAvailable();

    if (isAvailable) {
      await InAppBrowser.open(trimmedUrl, {
        // ─── iOS options ───────────────────────────────────────
        dismissButtonStyle: 'close',
        preferredBarTintColor: isDark ? DARK_TOOLBAR_COLOR : TOOLBAR_COLOR,
        preferredControlTintColor: '#FFFFFF',
        readerMode: false,
        animated: true,
        modalPresentationStyle: 'fullScreen',
        modalTransitionStyle: 'coverVertical',
        modalEnabled: true,
        enableBarCollapsing: false,

        // ─── Android options ────────────────────────────────────
        showTitle: true,
        toolbarColor: isDark ? DARK_TOOLBAR_COLOR : TOOLBAR_COLOR,
        secondaryToolbarColor: 'black',
        navigationBarColor: 'black',
        navigationBarDividerColor: 'white',
        enableUrlBarHiding: true,
        enableDefaultShare: true,
        forceCloseOnRedirection: false,
        animations: {
          startEnter: 'slide_in_right',
          startExit: 'slide_out_left',
          endEnter: 'slide_in_left',
          endExit: 'slide_out_right',
        },
      });
    } else {
      // In-app browser not available, fall back to system browser
      await Linking.openURL(trimmedUrl);
    }
  } catch (error) {
    console.error('InAppBrowser error:', error);
    // Final fallback
    await Linking.openURL(trimmedUrl).catch(console.error);
  }
};

/**
 * Opens a PDF URL. Uses in-app browser for web PDFs.
 */
export const openPdfLink = async (pdfUrl: string, isDark = false): Promise<void> => {
  if (!pdfUrl) return;
  // For Google Drive or web-hosted PDFs, in-app browser works great
  await openLink(pdfUrl, isDark);
};
