# Stable Story

Stable Story is an original smartphone-first horse-racing and racehorse-training game.

## Current status

Task 05.5 - GitHub Backup and GitHub Pages Deployment

## Files included

- `PROJECT_IDENTITY.md`
- `README.md`
- `DEVELOPMENT_LOG.md`
- `OPEN_ME_FIRST.html`
- `index.html`
- `styles.css`
- `app.js`
- `CURRENT_STATE.md`
- `NEXT_TASK.md`
- `VERSION_HISTORY.md`
- `BACKUP_GUIDE.md`

## How to open

Open `index.html` in a browser. No server or installation is required for this task.

## Current limitations

New Game, training, saving, and one beginner race are implemented. The Greenfield Beginner Cup uses a simple calculation, race presentation, finishing order, prize money, record updates, and autosave. The LocalStorage key is `stableStorySaveV1` with save version `1`.

## GitHub backup and play URL

- Repository: https://github.com/yuwakobo-ux/stable-story
- GitHub Pages: https://yuwakobo-ux.github.io/stable-story/
- Cache-busted play URL: added after the release commit.

On a smartphone, open the GitHub Pages URL in a browser and play in portrait orientation. Save data stays in the browser on the current device. LocalStorage is origin-specific, so local-file saves may not appear on GitHub Pages.

## Checkpoint A

Checkpoint A records the current working state, backup guidance, version history, and the next planned task. This checkpoint adds documentation only; gameplay and save behavior are unchanged.

## Next features

Future features are not implemented yet. The next planned task is the First Race Calculation and Results.

## Development policy

Development is smartphone-first: portrait layout, readable text, and large touch targets are priorities. Under the Luna Low development policy, work stays literal, small, simple, and playable after each task.
