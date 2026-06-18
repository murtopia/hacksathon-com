# Hacksathon.com icon assets

The mark is the serif Prompt caret (`>`). Two finishes:

- **Black caret on white** for everything: Google OAuth, app / home-screen icons, PWA manifest.
- **White caret on black** for the **favicon only**, so it stays visible in a browser tab.

## File inventory

| File | Finish | Use |
|---|---|---|
| `prompt-icon.svg` | black on white | master vector, primary mark |
| `prompt-favicon.svg` | white on black | master vector, favicon (SVG favicon) |
| `icon-1024.png` | black on white | Google OAuth consent screen logo |
| `icon-512.png` | black on white | PWA manifest, large app icon |
| `icon-192.png` | black on white | PWA manifest |
| `icon-180.png` | black on white | Apple touch icon (iOS home screen) |
| `favicon-32.png` | white on black | favicon |
| `favicon-16.png` | white on black | favicon |
| `favicon.ico` | white on black | classic multi-size favicon (48/32/16) |
| `site.webmanifest` | - | PWA manifest |

## Next.js setup (public folder approach)

Copy into `/public`: `favicon.ico`, `favicon-16.png`, `favicon-32.png`, `prompt-favicon.svg`, `icon-180.png`, `icon-192.png`, `icon-512.png`, `site.webmanifest`.

Add to the `<head>` of your root layout:

```html
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/svg+xml" href="/prompt-favicon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/icon-180.png" />
<link rel="manifest" href="/site.webmanifest" />
<meta name="theme-color" content="#ffffff" />
```

Modern browsers prefer the SVG favicon, which is the white-on-black version, so tabs get the reversed mark automatically. The `.ico` and PNGs are fallbacks for older browsers.

(If you'd rather use the App Router metadata convention instead of manual tags, the equivalent is dropping `app/favicon.ico`, `app/icon.svg` (= prompt-favicon.svg), and `app/apple-icon.png` (= icon-180.png) into the `app` directory and letting Next generate the tags.)

## Google OAuth consent screen

In Google Cloud Console, OAuth consent screen, Branding: upload `icon-512.png` (or `icon-1024.png`) as the app logo. Google renders it inside a circle, so the white tile shows as a rounded badge with the black caret. Square PNG, under 1MB, which both files satisfy.
