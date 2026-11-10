# Token Aura Rings 5e Development

## Debugging releases

For every debugging fix, prepare a GitHub update and a new Forge-visible module version:

- Record the fix in `CHANGELOG.md`.
- Bump `version` and the release ZIP URL in `module.json`.
- Build the release ZIP from the module files, excluding Git metadata and private/user data.
- Use the owner's configured Windows GitHub Desktop app for source commits and pushes. Do not use GitHub or remote Git operations at the command prompt.
- Publish the tagged release and upload its assets through the GitHub web interface.
- Give the owner clear click-by-click instructions for GitHub Desktop and GitHub web actions that require their interaction.

The Forge manifest URL uses the latest GitHub release, so publish a versioned release asset whose filename matches the `download` URL in `module.json`.
